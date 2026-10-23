import tseslint from 'typescript-eslint'
import layers from './eslint.layers.mjs'
export default [
  { ignores: ['build/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  ...layers,
]
