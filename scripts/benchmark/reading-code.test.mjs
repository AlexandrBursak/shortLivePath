import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

const moduleUrl = new URL('./reading-code.mjs', import.meta.url)
async function harness() {
  assert.equal(existsSync(moduleUrl), true, 'the executable benchmark harness must exist')
  return import(moduleUrl)
}

const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

test('AC-07: two shared work slots refuse a third call without queueing', async () => {
  const { WorkGate } = await harness()
  const gate = new WorkGate()
  const pending = deferred()
  let calls = 0
  const operation = () => { calls++; return pending.promise }
  const first = gate.run(operation)
  const second = gate.run(operation)
  await assert.rejects(gate.run(operation), { message: 'capacity_unavailable' })
  assert.equal(calls, 2)
  assert.equal(gate.active, 2)
  assert.equal(gate.maximum, 2)
  pending.resolve(true)
  await Promise.all([first, second])
  assert.equal(gate.active, 0)
})

test('AC-07: caller timeout does not release native work slots before completion', async () => {
  const { WorkGate } = await harness()
  const gate = new WorkGate()
  const pending = deferred()
  const job = gate.run(() => pending.promise)
  const other = gate.run(() => pending.promise)
  assert.equal(await Promise.race([job, Promise.resolve('caller_timed_out')]), 'caller_timed_out')
  await assert.rejects(gate.run(() => Promise.resolve()), { message: 'capacity_unavailable' })
  assert.equal(gate.active, 2)
  pending.resolve()
  await Promise.all([job, other])
  assert.equal(gate.active, 0)
  await gate.run(() => { throw new Error('synthetic native failure') }).catch(() => {})
  assert.equal(gate.active, 0)
})

test('AC-07: real native calls retain permits after a caller stops waiting', async () => {
  const { Verifier } = await harness()
  const verifier = new Verifier()
  const first = verifier.hash('abcdef')
  const second = verifier.hash('abcdef')
  assert.equal(await Promise.race([first, Promise.resolve('caller_gone')]), 'caller_gone')
  await assert.rejects(verifier.hash('abcdef'), { message: 'capacity_unavailable' })
  assert.equal(verifier.started, 2)
  assert.equal(verifier.gate.active, 2)
  const encoded = await Promise.all([first, second])
  assert.ok(encoded[0] !== encoded[1], 'independent salts must produce distinct verifiers')
  assert.equal(verifier.gate.active, 0)
})

test('AC-06: native verifier keeps the reviewed costs and exact scalar strings', async () => {
  const { Verifier, profile } = await harness()
  assert.deepEqual(profile, { version: 19, memoryCost: 65536, timeCost: 3, parallelism: 4, hashLength: 32 })
  const verifier = new Verifier()
  const code = ' e\u0301abcd '
  const encoded = await verifier.hash(code)
  assert.equal(await verifier.verify(encoded, code), true)
  for (const altered of [code.trim(), code.toUpperCase(), code.normalize('NFC'), '']) {
    assert.equal(await verifier.verify(encoded, altered), false)
  }
  const maximum = 'x'.repeat(1024)
  const boundary = await verifier.hash(maximum)
  assert.equal(await verifier.verify(boundary, maximum), true)
  await assert.rejects(verifier.hash('x'.repeat(1025)), { message: 'invalid_code' })
  await assert.rejects(verifier.hash('\ud800abcdef'), { message: 'invalid_code' })
})

test('AC-07: malformed or excessive-cost PHC is refused before native admission', async () => {
  const { Verifier } = await harness()
  const verifier = new Verifier()
  const encoded = await verifier.hash('abcdef')
  const before = verifier.started
  for (const invalid of ['', encoded.replace('65536', '999999999'), encoded.replace('v=19', 'v=16'), encoded + '$', encoded.replace('argon2id', 'argon2i')]) {
    await assert.rejects(verifier.verify(invalid, 'abcdef'), { message: 'invalid_verifier' })
  }
  assert.equal(verifier.started, before)
  assert.equal(verifier.gate.active, 0)
})
