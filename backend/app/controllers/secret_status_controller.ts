import type {HttpContext} from '@adonisjs/core/http'
import {secretContext} from '#start/secret_context'
import {SecretStatusService} from '../services/secret_status_service.js'
import LinkLifecycleService from '../services/link_lifecycle_service.js'
import {connected,safeFailure} from '../services/secret_http_service.js'
export default class SecretStatusController {
 async handle(ctx:HttpContext){
  try{
   const {run}=secretContext(ctx)
   await new SecretStatusService(run,new LinkLifecycleService()).status(ctx.params.token,()=>connected(ctx),body=>{
    ctx.response.header('Content-Type','application/json; charset=utf-8').status(200).send(body,false);ctx.response.finish()
   })
  }catch(error){safeFailure(error,ctx)}
 }
}
