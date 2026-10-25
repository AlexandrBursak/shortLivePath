import type {HttpContext} from '@adonisjs/core/http'
import {operationTimer} from '../services/operation_metrics_service.js'
import {secretContext} from '#start/secret_context'
import {CreateSecretService} from '../services/create_secret_service.js'
import LinkLifecycleService from '../services/link_lifecycle_service.js'
import {connected,readJson,safeFailure} from '../services/secret_http_service.js'
export default class CreateSecretController {
 async handle(ctx:HttpContext){
  const completed=operationTimer('create')
  try{
   const {run,label,origin}=secretContext(ctx)
   const input=await readJson(ctx)
   await new CreateSecretService(run,new LinkLifecycleService()).create(input,label,origin,()=>connected(ctx),body=>{
    ctx.response.header('Content-Type','application/json; charset=utf-8').status(201).send(body,false);ctx.response.finish()
   })
   completed()
  }catch(error){completed(error);safeFailure(error,ctx)}
 }
}
