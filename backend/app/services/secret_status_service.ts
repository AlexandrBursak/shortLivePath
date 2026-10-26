import type {SecretRun} from './secret_run.js'
import type {LifecycleRecord} from './redis_support.js'
import {decodeToken,tokenDigest} from './link_token_service.js'
export interface LifecycleReader {lookup(digest:Buffer):Promise<LifecycleRecord|null>}
export class SecretStatusService {
 constructor(private run:SecretRun,private lifecycles:LifecycleReader){}
 async status<T>(token:unknown,live:()=>boolean,send:(body:string)=>T):Promise<T>{
  await this.run.fresh()
  const record=decodeToken(token)?await this.lifecycles.lookup(tokenDigest(token)):null
  let now=await this.run.fresh()
  let data:Record<string,unknown>={state:'unknown'}
  if(record){
   const expires_at=new Date(record.expiresAtMs).toISOString()
   if(now>=record.expiresAtMs)data={state:'expired',expires_at}
   else{
    const stored=await this.run.payloads.read(record)
    now=await this.run.fresh()
    // Classification occurs after the missing/present read, never from an old sample.
    data=now>=record.expiresAtMs?{state:'expired',expires_at}:stored?{state:'available',reading_code_required:stored.codeVerifier!==undefined,expires_at}:{state:'early_unavailable',expires_at}
   }
  }
  // Reclassify synchronously if serialization/release preparation crosses expiry.
  if(record && this.run.readiness.clock.upperNow()>=record.expiresAtMs)data={state:'expired',expires_at:new Date(record.expiresAtMs).toISOString()}
  return this.run.release(data,now,undefined,live,send)
 }
}
