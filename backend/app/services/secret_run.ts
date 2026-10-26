import {OperationFault} from './operation_fault.js'
import {GenerationGuard} from './generation_guard.js'
import {EphemeralSecretService} from './ephemeral_secret_service.js'
import {AdmissionService} from './admission_service.js'
import type {ReadinessService} from './readiness_service.js'
import type {RedisEval} from './redis_support.js'
export class SecretRun {
 readonly generation:string
 readonly payloads:EphemeralSecretService
 readonly admission:AdmissionService
 constructor(readonly readiness:ReadinessService,redis:RedisEval,namespace:string,private current:()=>boolean){
  this.generation=readiness.generation
  this.assert()
  const guard=new GenerationGuard(redis,namespace,this.generation)
  this.payloads=new EphemeralSecretService(guard,namespace);this.admission=new AdmissionService(guard,namespace)
 }
 assert(){if(!this.current() || !this.readiness.ready || this.generation!==this.readiness.generation)throw new OperationFault('service_unavailable')}
 async fresh(){this.assert();const now=await this.readiness.fresh();this.assert();return now}
 // No await between final clock/current-owner/client check and bounded write.
 release<T>(data:unknown,serviceTime:number,expires:number|undefined,live:()=>boolean,send:(body:string)=>T,expired:()=>never=()=>{throw new OperationFault('service_unavailable')}):T{
  const body=JSON.stringify({data,meta:{service_time:new Date(serviceTime).toISOString()}})
  this.assert()
  if(!live())throw new OperationFault('service_unavailable')
  if(expires!==undefined && this.readiness.clock.upperNow()>=expires)return expired()
  return send(body)
 }
}
