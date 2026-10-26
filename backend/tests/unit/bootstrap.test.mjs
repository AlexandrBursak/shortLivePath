import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

test('AC-11: scaffold has an executable Adonis server and fail-closed HTTP kernel', () => {
  assert.equal(existsSync('bin/server.ts'), true, 'Adonis HTTP entrypoint must exist')
  assert.equal(existsSync('start/kernel.ts'), true, 'HTTP safety kernel must exist')
  const routes = readFileSync('start/routes.ts', 'utf8')
  assert.match(routes, /health\/live/)
  assert.match(routes, /health\/ready/)
  assert.deepEqual([...routes.matchAll(/router\.(post|put|patch|delete)\('([^']+)'/g)].map(m=>[m[1],m[2]]),[['post','/api/v1/secrets'],['post','/api/v1/secrets/:token/disclosures']])
  assert.match(readFileSync('start/secret_context.ts','utf8'),/new SecretRun/)
  assert.match(readFileSync('app/services/secret_run.ts','utf8'),/readiness\.ready/)
})
