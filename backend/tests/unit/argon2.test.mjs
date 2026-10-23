import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { hash, verify, argon2id } from 'argon2'

test('AC-11: pinned asynchronous native Argon2id executes the ADR starting profile', async () => {
  const encoded = await hash('synthetic-code', {
    type: argon2id, version: 0x13, memoryCost: 65536, timeCost: 3,
    parallelism: 4, hashLength: 32, salt: randomBytes(16),
  })
  const [, algorithm, version, costs, salt, digest] = encoded.split('$')
  assert.equal(algorithm, 'argon2id')
  assert.equal(version, 'v=19')
  assert.deepEqual(Object.fromEntries(costs.split(',').map((entry) => entry.split('='))), {
    m: '65536', t: '3', p: '4',
  })
  assert.equal(Buffer.from(salt, 'base64').length, 16)
  assert.equal(Buffer.from(digest, 'base64').length, 32)
  assert.equal(await verify(encoded, 'synthetic-code'), true)
  assert.equal(await verify(encoded, 'synthetic-code '), false)
})
