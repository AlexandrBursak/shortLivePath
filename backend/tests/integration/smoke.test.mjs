import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import pg from 'pg'
import { createClient } from 'redis'

test('AC-11: real disposable PostgreSQL and ephemeral Redis are required by smoke', async () => {
  const db = new pg.Client({ connectionTimeoutMillis: 2000, query_timeout: 2000 })
  const redis = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 2000, reconnectStrategy: false } })
  redis.on('error', () => {})
  try {
    await db.connect()
    assert.equal((await db.query('SELECT 1 AS value')).rows[0].value, 1)
    await redis.connect()
    assert.equal(await redis.ping(), 'PONG')
    assert.deepEqual(await redis.configGet('appendonly'), { appendonly: 'no' })
    assert.deepEqual(await redis.configGet('save'), { save: '' })
    assert.deepEqual(await redis.configGet('maxmemory-policy'), { 'maxmemory-policy': 'noeviction' })
  } finally {
    await db.end()
    if (redis.isOpen) await redis.close()
  }
})

test('AC-11: compiled Adonis smoke never exposes Secret traffic or opens readiness', { timeout: 15000 }, async () => {
  const child = spawn(process.execPath, ['build/bin/server.js'], {
    env: { ...process.env, PORT: '3334', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  try {
    let live
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) assert.fail('Adonis exited before listening: ' + output)
      try { live = await fetch('http://127.0.0.1:3334/health/live'); break } catch { await delay(50) }
    }
    assert.ok(live, 'compiled Adonis must listen')
    assert.equal(live.status, 200)
    assert.deepEqual(await live.json(), { data: { live: true }, meta: {} })
    for (const [path, method] of [['/health/ready', 'GET'], ['/api/v1/secrets', 'POST'], ['/api/v1/secrets/synthetic/disclosures', 'POST'], ['/api/v1/secrets/synthetic/status', 'GET']]) {
      const response = await fetch('http://127.0.0.1:3334' + path, {
        method, headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: '{"secret":"synthetic-sensitive-marker"}' } : {}),
      })
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
      assert.deepEqual(await response.json(), path.startsWith('/api/')?{error:{code:'short_live_path.service_unavailable',message:'Service temporarily unavailable. No result is confirmed.',details:[]}}:{error:{code:'SERVICE_UNAVAILABLE',message:'Service unavailable',details:[]}})
    }
    assert.doesNotMatch(output, /synthetic-sensitive-marker|disclose|synthetic\/|APP_KEY/)
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      await Promise.race([exited, delay(2000).then(() => child.kill('SIGKILL'))])
    }
  }
})
