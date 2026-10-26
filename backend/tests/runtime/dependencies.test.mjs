import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, access, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const tooling = [
  '@adonisjs+assembler', '@adonisjs+tsconfig', '@poppinss+ts-exec',
  '@swc+core', 'typescript', 'eslint', 'fast-glob', 'micromatch', 'braces',
]

test('AC-11: runtime filesystem contains no build tooling or vulnerable glob chain', async () => {
  const installed = await readdir('node_modules/.pnpm')
  for (const name of tooling) {
    assert.equal(installed.some((entry) => entry.startsWith(`${name}@`)), false,
      `${name} must not be installed in runtime`)
  }
  for (const path of ['app', 'start', 'tests', 'tsconfig.json', 'eslint.config.mjs']) {
    await assert.rejects(access(path), { code: 'ENOENT' }, `${path} must stay in build/test stages`)
  }
  assert.equal(spawnSync('pnpm', ['--version']).error?.code, 'ENOENT',
    'runtime must not inherit the toolchain package manager')
  assert.equal(process.getuid(), 1000, 'runtime must run as the non-root node user')
})

test('AC-11: complete installed runtime inventory has no known npm advisories', async () => {
  const inventory = {}
  for (const entry of await readdir('node_modules/.pnpm', { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules') continue
    const directory = `node_modules/.pnpm/${entry.name}/node_modules`
    for (const name of await readdir(directory)) {
      if (name === '.bin') continue
      const packages = name.startsWith('@')
        ? (await readdir(`${directory}/${name}`)).map((child) => `${name}/${child}`)
        : [name]
      for (const packageName of packages) {
        const manifest = JSON.parse(await readFile(`${directory}/${packageName}/package.json`, 'utf8'))
        inventory[manifest.name] ??= []
        if (!inventory[manifest.name].includes(manifest.version)) inventory[manifest.name].push(manifest.version)
      }
    }
  }
  for (const required of ['@adonisjs/core', 'argon2', 'pg', 'redis', 'reflect-metadata']) {
    assert.ok(inventory[required]?.length, `${required} must be represented in inventory`)
  }
  const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inventory), signal: AbortSignal.timeout(30000),
  })
  assert.equal(response.status, 200, 'registry audit failure must not count as clean')
  const advisories = await response.json()
  assert.ok(advisories && typeof advisories === 'object' && !Array.isArray(advisories))
  assert.deepEqual(Object.keys(advisories), [], 'installed runtime dependency advisory: ' + JSON.stringify(advisories))
  console.log(`Audited ${Object.keys(inventory).length} installed runtime package names; no exclusions`)
})
