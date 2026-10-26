import {randomBytes} from 'node:crypto'
import {hash,verify,argon2id} from 'argon2'
import {OperationFault} from './operation_fault.js'
import {codeText} from './secret_validation_service.js'
class HashWork {
 #active=0
 get active(){return this.#active}
 async run<T>(operation:()=>Promise<T>):Promise<T> {
  if(this.#active>=2)throw new OperationFault('capacity_unavailable')
  this.#active++
  try{return await operation()}finally{this.#active--}
 }
}
// The one API process owns all hash work; never construct a per-request gate.
export const hashWork=new HashWork()
export function validVerifier(value:unknown):value is string {
 if(typeof value!=='string')return false
 const parts=/^\$argon2id\$v=19\$(?:m=65536,t=3,p=4|m=65536,p=4,t=3)\$([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/.exec(value)
 if(!parts)return false
 return [parts[1],parts[2]].every((part,index)=>{
  const bytes=Buffer.from(part,'base64')
  return bytes.length===[16,32][index] && bytes.toString('base64').replace(/=+$/,'')===part
 })
}
export class ReadingCodeService {
 async create(value:unknown):Promise<string> {
  const code=codeText(value,true)
  return hashWork.run(async()=>{
   try{return await hash(code,{type:argon2id,version:0x13,memoryCost:65536,timeCost:3,parallelism:4,hashLength:32,salt:randomBytes(16)})}
   catch{throw new OperationFault('service_unavailable')}
  })
 }
 async verify(encoded:unknown,value:unknown):Promise<boolean> {
  const code=codeText(value)
  if(!validVerifier(encoded))throw new OperationFault('service_unavailable')
  return hashWork.run(async()=>{
   try{return await verify(encoded,code)}catch{throw new OperationFault('service_unavailable')}
  })
 }
}
