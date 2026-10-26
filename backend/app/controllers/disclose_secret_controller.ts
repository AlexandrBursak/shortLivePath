import type {HttpContext} from '@adonisjs/core/http'
import {operationTimer} from '../services/operation_metrics_service.js'
import {secretContext} from '#start/secret_context'
import {DiscloseSecretService} from '../services/disclose_secret_service.js'
import LinkLifecycleService from '../services/link_lifecycle_service.js'
import {connected,readJson,safeFailure} from '../services/secret_http_service.js'
export default class DiscloseSecretController {
 async handle(ctx:HttpContext){
  const completed=operationTimer('disclose')
  try{
   const {run,label}=secretContext(ctx)
   const input=await readJson(ctx)
   await new DiscloseSecretService(run,new LinkLifecycleService()).disclose(ctx.params.token,input,label,()=>connected(ctx),body=>{
    ctx.response.header('Content-Type','application/json; charset=utf-8').status(200).send(body,false);ctx.response.finish()
   })
   completed()
  }catch(error){completed(error);safeFailure(error,ctx)}
 }
}
