import type {SecretRun} from './secret_run.js'
import {validateCreate} from './secret_validation_service.js'
import {ReadingCodeService} from './reading_code_service.js'
import {newLinkToken,tokenDigest} from './link_token_service.js'
import {HttpFault} from './secret_http_service.js'
import {OperationFault} from './operation_fault.js'
import type {LifecycleRecord} from './redis_support.js'
interface LifecycleWriter {create(digest:Buffer,minutes:number):Promise<LifecycleRecord>}
export class CreateSecretService {
 constructor(private run:SecretRun,private lifecycles:LifecycleWriter,private codes=new ReadingCodeService()){}
 async create<T>(value:unknown,label:string,origin:string,live:()=>boolean,send:(body:string)=>T):Promise<T>{
  const input=validateCreate(value)
  if(!await this.run.admission.creationAllowed(label,await this.run.fresh()))throw new HttpFault('creation_limited')
  if(!live())throw new OperationFault('service_unavailable')
  const verifier=input.reading_code===undefined?undefined:await this.codes.create(input.reading_code)
  await this.run.fresh()
  if(!live())throw new OperationFault('service_unavailable')
  const token=newLinkToken()
  const record=await this.lifecycles.create(tokenDigest(token),input.lifetime_minutes)
  await this.run.payloads.publish(record,input,verifier,await this.run.fresh())
  const now=await this.run.fresh()
  if(now>=record.expiresAtMs)throw new OperationFault('service_unavailable')
  await this.run.admission.creationSucceeded(label,now)
  if(!await this.run.payloads.read(record))throw new OperationFault('service_unavailable')
  const releaseTime=await this.run.fresh()
  return this.run.release({share_url:origin+'/s/'+token,expires_at:new Date(record.expiresAtMs).toISOString()},releaseTime,record.expiresAtMs,live,send)
 }
}
