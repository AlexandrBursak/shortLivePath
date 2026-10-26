import type {HttpContext} from '@adonisjs/core/http'
import {readiness,secretRedis} from '#start/maintenance'
import maintenance from '../config/maintenance.js'
import config from '../config/secrets.js'
import {SecretRun} from '../app/services/secret_run.js'
import {TrustedAddressService} from '../app/services/trusted_address_service.js'
import {OperationFault} from '../app/services/operation_fault.js'
export function secretContext(ctx:HttpContext){
 const ready=readiness
 if(!ready || !secretRedis || !maintenance.namespace || !maintenance.key || !config.publicOrigin || !config.peer)throw new OperationFault('service_unavailable')
 const run=new SecretRun(ready,secretRedis,maintenance.namespace,()=>ready===readiness)
 const label=new TrustedAddressService(maintenance.namespace,maintenance.key,[config.peer]).label(ctx.request.request.socket.remoteAddress,ctx.request.request.headers['x-forwarded-for'])
 return {run,label,origin:config.publicOrigin}
}
