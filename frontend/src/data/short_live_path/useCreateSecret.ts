'use client';
import {useEffect,useRef,useState} from 'react';
import {observeLifecycle} from '@/shared/lib/observe_lifecycle';
import {emptyDraft,validateDraft,type CreateDraft,type DraftErrors} from '@/entities/short_live_path/create_rules';
import type {ShareLink} from '@/entities/short_live_path/types';
import {secretClient,ClientFault,type EligibleResult} from './client';
export function useCreateSecret(created:(result:EligibleResult<ShareLink>,code?:string)=>void){
 const [draft,setDraft]=useState(emptyDraft),[errors,setErrors]=useState<DraftErrors>({}),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[attempted,setAttempted]=useState(false);
 const pending=useRef(false),epoch=useRef(0),abort=useRef<AbortController|null>(null);
 useEffect(()=>{
  const invalidate=()=>{epoch.current++;abort.current?.abort();};
  const stop=observeLifecycle(document,window,()=>{
   if(!pending.current)return;
   invalidate();setBusy(false);
   setMessage('Creation is not confirmed. It may have occurred. A retry creates a new Secret.');
  },()=>{});
  return ()=>{stop();invalidate();};
 },[]);
 function update<K extends keyof CreateDraft>(key:K,value:CreateDraft[K]){setDraft(old=>({...old,[key]:value}));}
 async function submit(){
  if(pending.current)return;const checked=validateDraft(draft);setErrors(checked.errors);setMessage('');
  if(!checked.input)return;
  pending.current=true;setBusy(true);setAttempted(true);const request=++epoch.current,controller=new AbortController();abort.current=controller;
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const result=await secretClient.create(checked.input,controller.signal);
   if(epoch.current!==request || document.visibilityState!=='visible' || !result.deadline.eligible())throw new ClientFault();
   setDraft(emptyDraft());created(result,draft.protected?draft.code:undefined);
  }catch(error){if(epoch.current===request)setMessage(error instanceof ClientFault && error.code==='invalid_request'?'Check the Secret text, lifetime and Reading code. The service rejected this input.':error instanceof ClientFault && error.code==='request_too_large'?'The request is too large. Reduce the input before trying again.':error instanceof ClientFault && error.code==='unsupported_media_type'?'The service could not accept this request format.':error instanceof ClientFault && error.code==='creation_limited'?'Creation is temporarily limited for your network address. Wait before trying again.':error instanceof ClientFault && error.code==='capacity_unavailable'?'Temporary capacity is unavailable. Creation is not confirmed.':'Creation is not confirmed. It may have occurred. A retry creates a new Secret.');}
  finally{clearTimeout(timeout);pending.current=false;if(epoch.current===request)setBusy(false);}
 }
 return {draft,errors,message,busy,attempted,update,submit};
}
