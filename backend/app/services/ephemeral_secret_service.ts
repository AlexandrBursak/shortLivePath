import {createHash} from 'node:crypto'
import {OperationFault} from './operation_fault.js'
import {validateCreate,type SecretText} from './secret_validation_service.js'
import {validVerifier} from './reading_code_service.js'
import {namespacePrefix,validateRecord,evaluate,type RedisEval,type LifecycleRecord} from './redis_support.js'
import {publishPayloadLua,readPayloadLua} from './redis_scripts/payload.js'
export interface StoredSecret extends SecretText {codeVerifier?:string}
function integrity(fields:Record<string,string>):string {
 // Accidental-corruption detection, not protection against a malicious live operator.
 const values=['schema_version','lifecycle_id','address','login','credential','created_at_ms','expires_at_ms','code_verifier'].map(key=>fields[key] ?? null)
 return createHash('sha256').update(JSON.stringify(values),'utf8').digest('hex')
}
export class EphemeralSecretService {
 readonly prefix:string
 constructor(private redis:RedisEval,namespace:string){this.prefix=namespacePrefix(namespace)}
 key(id:string){return `${this.prefix}secret:${id}:payload`}
 async publish(record:LifecycleRecord,text:SecretText,codeVerifier:string|undefined,now:number):Promise<void>{
  validateRecord(record)
  validateCreate({...text,lifetime_minutes:(record.expiresAtMs-record.createdAtMs)/60000})
  if(!Number.isSafeInteger(now) || now<record.createdAtMs || (codeVerifier!==undefined && !validVerifier(codeVerifier)))throw new OperationFault('service_unavailable')
  const fields={schema_version:'1',lifecycle_id:record.id,address:text.address,login:text.login,credential:text.credential,created_at_ms:String(record.createdAtMs),expires_at_ms:String(record.expiresAtMs),...(codeVerifier===undefined?{}:{code_verifier:codeVerifier})}
  const args=[record.id,String(record.expiresAtMs),String(now),...Object.entries({...fields,integrity_digest:integrity(fields)}).flat()]
  const result=await evaluate(this.redis,publishPayloadLua,[this.prefix+'payload:expiry',this.key(record.id)],args)
  if(result!==1)throw new OperationFault(result===-1?'capacity_unavailable':'service_unavailable')
 }
 async read(record:LifecycleRecord):Promise<StoredSecret|null>{
  validateRecord(record)
  const result=await evaluate(this.redis,readPayloadLua,[this.key(record.id),this.prefix+'payload:expiry'],[record.id,String(record.expiresAtMs)])
  if(!Array.isArray(result))throw new OperationFault('service_unavailable')
  if(result.length===0)return null
  try{
   if(result[0]!==record.expiresAtMs || result.length%2!==1)throw new Error()
   const pairs=result.slice(1)
   if(pairs.some(x=>typeof x!=='string'))throw new Error()
   const fields:Record<string,string>={}
   for(let i=0;i<pairs.length;i+=2)fields[pairs[i]]=pairs[i+1]
   const allowed=['schema_version','lifecycle_id','address','login','credential','created_at_ms','expires_at_ms','code_verifier','integrity_digest']
   if(Object.keys(fields).some(key=>!allowed.includes(key)) || fields.schema_version!=='1' || fields.lifecycle_id!==record.id || fields.created_at_ms!==String(record.createdAtMs) || fields.expires_at_ms!==String(record.expiresAtMs))throw new Error()
   if(fields.integrity_digest!==integrity(fields))throw new Error()
   const text=validateCreate({address:fields.address,login:fields.login,credential:fields.credential})
   if('code_verifier' in fields && !validVerifier(fields.code_verifier))throw new Error()
   return {address:text.address,login:text.login,credential:text.credential,codeVerifier:fields.code_verifier}
  }catch{throw new OperationFault('service_unavailable')}
 }
}
