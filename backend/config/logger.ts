import { defineConfig } from '@adonisjs/core/logger'
// No request/access/error serialization in the bootstrap. Future telemetry must be allowlisted.
export default defineConfig({
  default: 'app',
  loggers: { app: { enabled: false, name: 'short-live-path', level: 'silent' } },
})
