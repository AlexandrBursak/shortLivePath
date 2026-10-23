import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
export default class Handler extends ExceptionHandler {
  async handle(_error: unknown, { response }: HttpContext) {
    return response.status(503).send({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', details: [] },
    })
  }
  async report() { /* No sensitive exception/request serialization. */ }
}
