import type {SecretRun} from './secret_run.js'
import type {LifecycleReader} from './secret_status_service.js'
import {decodeToken,tokenDigest} from './link_token_service.js'
import {validateDisclosure} from './secret_validation_service.js'
import {ReadingCodeService} from './reading_code_service.js'
import {OperationFault} from './operation_fault.js'
import {HttpFault} from './secret_http_service.js'
function expired():never{throw new HttpFault('link_expired')}
export class DiscloseSecretService {
 constructor(private run:SecretRun,private lifecycles:LifecycleReader,private codes=new ReadingCodeService()){}
 async disclose<T>(token:unknown,value:unknown,label:string,live:()=>boolean,send:(body:string)=>T):Promise<T>{
  const input=validateDisclosure(value)
  await this.run.fresh()
  if(!decodeToken(token))throw new HttpFault('link_unavailable')
  const record=await this.lifecycles.lookup(tokenDigest(token))
  if(!record)throw new HttpFault('link_unavailable')
  let now=await this.run.fresh()
  if(now>=record.expiresAtMs)expired()
  const stored=await this.run.payloads.read(record)
  now=await this.run.fresh()
  if(now>=record.expiresAtMs)expired()
  if(!stored)throw new HttpFault('link_unavailable')
  if(stored.codeVerifier!==undefined){
   if(input.reading_code===undefined)throw new HttpFault('code_required')
   if(!await this.run.admission.verificationAllowed(record.id,label,record.expiresAtMs,now))throw new HttpFault('verification_limited')
   if(!live())throw new OperationFault('service_unavailable')
   const correct=await this.codes.verify(stored.codeVerifier,input.reading_code)
   now=await this.run.fresh()
   if(now>=record.expiresAtMs)expired()
   if(!live())throw new OperationFault('service_unavailable')
   if(!correct){
    await this.run.admission.verificationFailed(record.id,label,record.expiresAtMs,now)
    now=await this.run.fresh()
    if(now>=record.expiresAtMs)expired()
    throw new HttpFault('code_incorrect')
   }
  }
  const current=await this.run.payloads.read(record)
  now=await this.run.fresh()
  if(now>=record.expiresAtMs)expired()
  if(!current)throw new HttpFault('link_unavailable')
  if(JSON.stringify(current)!==JSON.stringify(stored))throw new OperationFault('service_unavailable')
  const secret={address:current.address,login:current.login,credential:current.credential}
  return this.run.release({secret,expires_at:new Date(record.expiresAtMs).toISOString()},now,record.expiresAtMs,live,send,expired)
 }
}
