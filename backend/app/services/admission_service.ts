import {OperationFault} from './operation_fault.js'
import {namespacePrefix,evaluate,type RedisEval} from './redis_support.js'
import {admissionLua} from './redis_scripts/admission.js'
export class AdmissionService {
 readonly prefix:string
 constructor(private redis:RedisEval,namespace:string){this.prefix=namespacePrefix(namespace)}
 private async transition(label:string,id:string|undefined,expires:number|undefined,now:number,event:boolean):Promise<boolean>{
  if(!/^v1:[A-Za-z0-9_-]{43}$/.test(label) || !Number.isSafeInteger(now) || now<0 || (id!==undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)))throw new OperationFault('service_unavailable')
  const deadline=expires===undefined?now+300000:Math.min(now+300000,expires)
  if(!Number.isSafeInteger(deadline))throw new OperationFault('service_unavailable')
  const key=id===undefined?`${this.prefix}creation:${label}:state`:`${this.prefix}verification:${id}:${label}:state`
  const result=await evaluate(this.redis,admissionLua,[this.prefix+'limiter:expiry',key],[String(now),id===undefined?'25':'5',String(deadline),event?'event':'check'])
  if(result===1)return true
  if(result===0)return false
  throw new OperationFault(result===-1?'capacity_unavailable':'service_unavailable')
 }
 creationAllowed(label:string,now:number){return this.transition(label,undefined,undefined,now,false)}
 async creationSucceeded(label:string,now:number):Promise<void>{await this.transition(label,undefined,undefined,now,true)}
 verificationAllowed(id:string,label:string,expires:number,now:number){return this.transition(label,id,expires,now,false)}
 async verificationFailed(id:string,label:string,expires:number,now:number):Promise<void>{await this.transition(label,id,expires,now,true)}
}
