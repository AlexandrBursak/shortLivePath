'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {observeLifecycle} from '@/shared/lib/observe_lifecycle';
import {secretClient,type EligibleResult} from './client';
import type {ShareLink} from '@/entities/short_live_path/types';
export function useConfirmation(result:EligibleResult<ShareLink>){
 const deadline=useRef(result.deadline),current=useRef(true),epoch=useRef(0),visible=useRef(true),pending=useRef(false),terminal=useRef(false);
 const [state,setState]=useState<'visible'|'concealed'|'expired'|'early_unavailable'|'unknown'>('visible'),[remaining,setRemaining]=useState(()=>result.deadline.remaining()),[checking,setChecking]=useState(false);
 const abort=useRef<AbortController|null>(null);
 const cancel=()=>{epoch.current++;abort.current?.abort();};
 const conceal=()=>{if(terminal.current)return;visible.current=false;epoch.current++;abort.current?.abort();flushSync(()=>{setState('concealed');setChecking(false);});};
 const recheck=async()=>{
  if(terminal.current || pending.current || !current.current || document.visibilityState!=='visible')return;
  pending.current=true;const request=++epoch.current,controller=new AbortController();abort.current=controller;setChecking(true);
  try{
   const token=new URL(result.value.share_url).pathname.split('/').at(-1)!;
   const status=await secretClient.status(token,controller.signal);
   if(!current.current || epoch.current!==request || document.visibilityState!=='visible')return;
   if(status.value.state==='available' && status.value.expires_at===result.value.expires_at && status.deadline?.eligible()){
    deadline.current=status.deadline;visible.current=true;setRemaining(status.deadline.remaining());setState('visible');
   }else if(status.value.state!=='available'){terminal.current=true;visible.current=false;setState(status.value.state);}
  }catch{/* Uncertain status never proves expiration or early loss. */}
  finally{pending.current=false;if(current.current && epoch.current===request)setChecking(false);}
 };
 useEffect(()=>{
  current.current=true;
  const stop=observeLifecycle(document,window,conceal,()=>{void recheck();});
  const timer=setInterval(()=>{
   const left=deadline.current.remaining();setRemaining(left);
   if(!left && !terminal.current && (visible.current || deadline.current.disposition==='expired')){
    terminal.current=deadline.current.disposition==='expired';visible.current=false;cancel();
    flushSync(()=>{setState(terminal.current?'expired':'concealed');setChecking(false);});
   }
  },250);
  return ()=>{current.current=false;cancel();stop();clearInterval(timer);};
 // The immutable confirmed result owns this mounted instance; callbacks read refs.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 return {state,remaining,checking,recheck,eligible:()=>current.current && visible.current && document.visibilityState==='visible' && deadline.current.eligible()};
}
