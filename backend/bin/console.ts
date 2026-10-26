import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core/ignitor'
const root = new URL('../', import.meta.url)
new Ignitor(root, { importer: (path) => import(path.startsWith('.') ? new URL(path, root).href : path) })
  .ace().handle(process.argv.slice(2)).catch(() => { process.exitCode = 1 })
