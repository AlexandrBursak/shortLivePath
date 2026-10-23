import { defineConfig } from '@adonisjs/core/http'
export const http = defineConfig({
  generateRequestId: false,
  allowMethodSpoofing: false,
  useAsyncLocalStorage: false,
})
export const appKey = process.env.APP_KEY
