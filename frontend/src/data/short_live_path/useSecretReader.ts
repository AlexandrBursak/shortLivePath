'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import type {NeutralGate,SecretText} from '@/entities/short_live_path/types';
import {observeLifecycle} from '@/shared/lib/observe_lifecycle';
import type {EligibleDeadline} from '@/shared/lib/eligible_deadline';
import {secretClient,ClientFault} from './client';
type Available=Extract<NeutralGate,{state:'available'}>;
type ViewState='checking'|'gate'|'opening'|'reading'|'concealed'|'temporary'|'expired'|'early_unavailable'|'unknown';
interface ReaderState {state:ViewState;gate?:Available;secret?:SecretText;expiresAt?:string;remaining:number;message:string}
const hidden=(state:ViewState,message=''):ReaderState=>({state,remaining:0,message});
const messages={code_required:'Enter the separate Reading code.',code_incorrect:'The Reading code is incorrect. The link has not been consumed.',verification_limited:'Verification is temporarily limited. Wait before trying again. People sharing a public network address share this limit for this link.',invalid_request:'The request could not be accepted. Check the input and try deliberately.',request_too_large:'The request could not be accepted. Check the input and try deliberately.',unsupported_media_type:'The request could not be accepted. Check the input and try deliberately.'};
export function useSecretReader(){
 const [view,setView]=useState<ReaderState>(()=>hidden('checking')),[code,setCode]=useState('');
 const active=useRef(false),epoch=useRef(0),token=useRef(''),current=useRef<ReaderState>(hidden('checking')),deadline=useRef<EligibleDeadline|null>(null),abort=useRef<AbortController|null>(null);
 const publish=(next:ReaderState)=>{current.current=next;setView(next);};
 const cancel=()=>{epoch.current++;abort.current?.abort();};
 const conceal=()=>{cancel();deadline.current?.invalidate();flushSync(()=>{setCode('');publish(hidden('concealed'));});};
 async function recheck(){
  cancel();if(!active.current || document.visibilityState!=='visible')return;
  const request=epoch.current,controller=new AbortController();abort.current=controller;publish(hidden('checking'));
  if(!/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(token.current)){publish(hidden('unknown'));return;}
  try{
   const result=await secretClient.status(token.current,controller.signal);
   if(!active.current || epoch.current!==request || document.visibilityState!=='visible')return;
   if(result.value.state==='available' && result.deadline?.eligible()){
    deadline.current=result.deadline;publish({state:'gate',gate:result.value,expiresAt:result.value.expires_at,remaining:result.deadline.remaining(),message:''});
   }else publish({...hidden(result.value.state==='available'?'temporary':result.value.state),...('expires_at' in result.value?{expiresAt:result.value.expires_at}:{})});
  }catch{if(active.current && epoch.current===request)publish(hidden('temporary','Availability could not be checked right now. This does not establish that the link expired.'));}
 }
 async function show(){
  const before=current.current;
  if(before.state!=='gate' || !before.gate || !deadline.current?.eligible() || document.visibilityState!=='visible')return;
  if(!code.isWellFormed() || new TextEncoder().encode(code).length>1024){publish({...before,message:'Use a valid Reading code up to 1024 UTF-8 bytes. Short guesses are allowed.'});return;}
  const gate=before.gate,request=++epoch.current,controller=new AbortController();abort.current=controller;publish({...before,state:'opening',message:''});
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const result=await secretClient.disclose(token.current,gate.reading_code_required?{reading_code:code}:{},controller.signal);
   if(!active.current || epoch.current!==request || document.visibilityState!=='visible')return;
   if(result.value.expires_at!==gate.expires_at || !deadline.current?.eligible() || !result.deadline.eligible())throw new ClientFault();
   deadline.current=result.deadline;setCode('');publish({state:'reading',secret:result.value.secret,expiresAt:result.value.expires_at,remaining:result.deadline.remaining(),message:''});
  }catch(error){
   if(!active.current || epoch.current!==request)return;
   if(error instanceof ClientFault && error.code==='link_expired'){publish({...hidden('expired'),expiresAt:gate.expires_at});return;}
   if(error instanceof ClientFault && error.code==='link_unavailable'){await recheck();return;}
   if(error instanceof ClientFault && error.code in messages && deadline.current?.eligible())publish({...before,message:messages[error.code as keyof typeof messages]});
   else publish(hidden('temporary','Content remains hidden. Availability could not be checked right now.'));
  }finally{clearTimeout(timeout);}
 }
 useEffect(()=>{
  active.current=true;token.current=window.location.pathname.split('/').at(-1)??'';void recheck();
  const stop=observeLifecycle(document,window,conceal,()=>{void recheck();});
  const timer=setInterval(()=>{
   if(!['gate','opening','reading'].includes(current.current.state) || !deadline.current)return;
   const remaining=deadline.current.remaining();
   if(remaining>0)publish({...current.current,remaining});
   else{cancel();const expired=deadline.current.disposition==='expired';flushSync(()=>{setCode('');publish({...hidden(expired?'expired':'temporary',expired?'':'Content remains hidden. Check availability again.'),expiresAt:current.current.expiresAt});});}
  },250);
  return ()=>{active.current=false;cancel();deadline.current?.invalidate();stop();clearInterval(timer);};
 // One mounted URL owns the immutable token; all mutable guards use refs.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 return {view,code,setCode,show,recheck,eligible:()=>active.current && current.current.state==='reading' && document.visibilityState==='visible' && Boolean(deadline.current?.eligible())};
}
