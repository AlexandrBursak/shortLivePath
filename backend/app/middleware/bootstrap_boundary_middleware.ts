import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
export default class BootstrapBoundaryMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('Cache-Control', 'no-store')
    response.header('Referrer-Policy', 'no-referrer')
    await next()
  }
}
