import { defineConfig } from '@adonisjs/core/app'
export default defineConfig({
  commands: [() => import('@adonisjs/core/commands'), () => import('@adonisjs/lucid/commands')],
  providers: [() => import('@adonisjs/core/providers/app_provider'), () => import('@adonisjs/lucid/database_provider')],
  preloads: [() => import('#start/maintenance'), () => import('#start/routes'), () => import('#start/kernel')],
})
