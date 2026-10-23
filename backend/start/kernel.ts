import server from '@adonisjs/core/services/server'
server.errorHandler(() => import('#exceptions/handler'))
server.use([() => import('#middleware/bootstrap_boundary_middleware')])
