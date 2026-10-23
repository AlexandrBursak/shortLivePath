import {OperationFault} from './operation_fault.js'
export interface OwnershipConnection {
 query(sql:string,values?:number[]):Promise<{rows:Record<string,unknown>[]}>
 on(event:'error'|'end',listener:()=>void):unknown
}
// Dedicated session, never a pooled connection. The runtime kernel fence also
// excludes old processes/native work; PG disconnection is not termination proof.
export class ProcessOwnershipService {
 #current=false
 #physical=false
 #ended=false
 #retired=false
 #epoch=0
 #pending?:Promise<boolean>
 #releasing?:Promise<void>
 constructor(private connection:OwnershipConnection,private lost:()=>void){
  const invalidate=()=>{this.#ended=true;this.#physical=false;this.#epoch++;if(this.#current){this.#current=false;this.lost()}}
  connection.on('error',invalidate);connection.on('end',invalidate)
 }
 get current(){return this.#current && !this.#ended && !this.#retired}
 async acquire():Promise<boolean>{
  if(this.#releasing)await this.#releasing
  if(this.#ended || this.#retired)throw new OperationFault('service_unavailable')
  if(this.current)return true
  if(this.#pending)return this.#pending
  const epoch=this.#epoch
  const pending=(async()=>{
   // At most one SQL acquisition: advisory locks are session-reentrant.
   this.#physical=true
   try{
    const result=await this.connection.query('SELECT pg_try_advisory_lock(1936486447, 1) AS owned')
    this.#physical=result.rows[0]?.owned===true
    if(this.#ended || epoch!==this.#epoch)throw new OperationFault('service_unavailable')
    this.#current=this.#physical
    return this.current
   }catch{
    // Unknown SQL outcome retires this connection; do not acquire again on it.
    this.#retired=true
    throw new OperationFault('service_unavailable')
   }
  })()
  this.#pending=pending
  try{return await pending}finally{if(this.#pending===pending)this.#pending=undefined}
 }
 async time():Promise<number>{
  if(!this.current)throw new OperationFault('service_unavailable')
  const epoch=this.#epoch
  try{
   const result=await this.connection.query('SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS now')
   const now=Number(result.rows[0]?.now)
   if(!this.current || epoch!==this.#epoch || !Number.isSafeInteger(now) || now<0)throw new Error()
   return now
  }catch{
   this.#retired=true
   if(this.#current){this.#current=false;this.#epoch++;this.lost()}
   throw new OperationFault('service_unavailable')
  }
 }
 async release():Promise<void>{
  if(this.#releasing)return this.#releasing
  this.#current=false;this.#epoch++
  const pending=this.#pending
  const releasing=(async()=>{
   // An in-flight acquisition may still acquire physically after local cancel.
   // Wait for that exact call, then balance its single server-side lock count.
   await pending?.catch(()=>{})
   if(this.#physical && !this.#ended){
    this.#physical=false
    try{await this.connection.query('SELECT pg_advisory_unlock(1936486447, 1)')}
    catch{this.#retired=true;throw new OperationFault('service_unavailable')}
   }
  })()
  this.#releasing=releasing
  try{await releasing}finally{if(this.#releasing===releasing)this.#releasing=undefined}
 }
}
