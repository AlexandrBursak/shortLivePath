import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core/ignitor'
const root = new URL('../', import.meta.url)
new Ignitor(root, { importer: (path) => import(path.startsWith('.') ? new URL(path, root).href : path) })
  .tap((app) => {
    app.listen('SIGTERM', () => app.terminate())
    app.listen('SIGINT', () => app.terminate())
  })
  .httpServer().start().catch(() => {
    // Allowlisted aggregate only: never serialize the error/request/config.
    console.error('backend_start_failed')
    process.exitCode = 1
  })
