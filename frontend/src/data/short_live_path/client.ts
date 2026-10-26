'use client';
import type {CreateInput,ShareLink,Disclosure,NeutralGate} from '@/entities/short_live_path/types';
import {EligibleDeadline,browserClock,stamp,type Clock} from '@/shared/lib/eligible_deadline';
import {ClientFault,object,instant,share,gate,disclosure,failure} from './dto';
export {ClientFault} from './dto';
export interface EligibleResult<T>{value:T;deadline:EligibleDeadline}
export interface GateResult{value:NeutralGate;deadline?:EligibleDeadline}
async function boundedJson(response:Response):Promise<unknown>{
 if(!response.body)throw new ClientFault();const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>524288){await reader.cancel();throw new ClientFault();}parts.push(next.value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export class SecretClient {
 constructor(private transport:typeof fetch=fetch,private clock:Clock=browserClock,private origin:()=>string=()=>{if(typeof window==='undefined')throw new ClientFault();return window.location.origin;}){}
 private async request<T>(path:string,method:'GET'|'POST',body:unknown,parse:(value:unknown,origin:string)=>T,signal?:AbortSignal){
  const origin=this.origin(),sent=stamp(this.clock);
  try{
   if(signal?.aborted)throw new ClientFault();
   const transport=this.transport;
   const response=await transport(origin+path,{method,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal,headers:{'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
   const raw=await boundedJson(response);
   if(signal?.aborted)throw new ClientFault();
   if(!response.ok)throw failure(raw,response.status,method==='GET'?'status':path==='/api/v1/secrets'?'create':'disclose');
   if((method==='POST' && path==='/api/v1/secrets' && response.status!==201) || ((method==='GET' || path.endsWith('/disclosures')) && response.status!==200))throw new ClientFault();
   const root=object(raw,['data','meta']),meta=object(root.meta,['service_time']),service=instant(meta.service_time);
   return {value:parse(root.data,origin),service,sent};
  }catch(error){throw error instanceof ClientFault?error:new ClientFault();}
 }
 async create(input:CreateInput,signal?:AbortSignal):Promise<EligibleResult<ShareLink>>{
  const r=await this.request('/api/v1/secrets','POST',input,share,signal),deadline=new EligibleDeadline(instant(r.value.expires_at),r.service,r.sent,this.clock);
  if(!deadline.eligible())throw new ClientFault();return {value:r.value,deadline};
 }
 async status(token:string,signal?:AbortSignal):Promise<GateResult>{
  const r=await this.request('/api/v1/secrets/'+encodeURIComponent(token)+'/status','GET',undefined,gate,signal);
  if(r.value.state!=='available')return {value:r.value};
  const deadline=new EligibleDeadline(instant(r.value.expires_at),r.service,r.sent,this.clock);
  if(!deadline.eligible())throw new ClientFault();return {value:r.value,deadline};
 }
 async disclose(token:string,input:{reading_code?:string},signal?:AbortSignal):Promise<EligibleResult<Disclosure>>{
  const r=await this.request('/api/v1/secrets/'+encodeURIComponent(token)+'/disclosures','POST',input,disclosure,signal),deadline=new EligibleDeadline(instant(r.value.expires_at),r.service,r.sent,this.clock);
  if(!deadline.eligible())throw new ClientFault();return {value:r.value,deadline};
 }
}
export const secretClient=new SecretClient();
