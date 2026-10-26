import { defineConfig, drivers } from '@adonisjs/core/encryption'
// Required mounted/environment key in deployments; no committed fallback key.
const key = process.env.APP_KEY
if (!key) throw new Error('APP_KEY required')
export default defineConfig({
  default: 'gcm',
  list: { gcm: drivers.aes256gcm({ keys: [key], id: 'gcm' }) },
})
