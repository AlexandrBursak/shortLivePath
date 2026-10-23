import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { ESLint } from 'eslint'

test('AC-11: real resolver rejects deliberately invalid controller-to-model imports', async () => {
  const model = 'app/models/__layer_probe.ts'
  await mkdir('app/models', { recursive: true })
  await writeFile(model, 'export default class Probe {}\n', { flag: 'wx' })
  try {
    const eslint = new ESLint()
    for (const path of ['../models/__layer_probe.js', '#models/__layer_probe']) {
      const [result] = await eslint.lintText(`import Probe from '${path}'; export default Probe`, {
        filePath: 'app/controllers/__invalid_probe.ts',
      })
      assert.ok(result.messages.some((m) => m.ruleId === 'import/no-restricted-paths'), path)
    }
    const [valid] = await eslint.lintText('export default class Controller {}', {
      filePath: 'app/controllers/__valid_probe.ts',
    })
    assert.equal(valid.errorCount, 0)
  } finally { await rm(model) }
})
