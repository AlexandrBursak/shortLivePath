'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import type {SecretText} from '@/entities/short_live_path/types';
import {ScreenFrame,ActionButton,Notice} from '@/shared/ui';
import {SourceTextArea} from '@/shared/ui/SourceTextArea';
import {useSecretReader} from '@/data/short_live_path/useSecretReader';
import {RemainingLifetime} from '@/view/components/RemainingLifetime';
import {ExactCopyField} from '@/view/components/ExactCopyField';
import {UnavailableSecret} from '@/view/components/UnavailableSecret';
export interface ReadingDisclosure {secret:SecretText;expiresAt:string;remaining:number;eligible:()=>boolean}
export interface ReadingTerminal {state:'expired'|'early_unavailable'|'unknown';expiresAt?:string}
interface ReadingGateProps {
 onDisclosure?:(value:ReadingDisclosure)=>void;
 onTerminal?:(value:ReadingTerminal)=>void;
 renderDisclosure?:(value:ReadingDisclosure)=>ReactNode;
 renderTerminal?:(value:ReadingTerminal)=>ReactNode;
}
export function ReadingGate({onDisclosure,onTerminal,renderDisclosure,renderTerminal}:ReadingGateProps){
 const {view,code,setCode,show,recheck,eligible}=useSecretReader();
 useEffect(()=>{const target=document.querySelector<HTMLElement>(view.message?(view.codeError?'#recipient-code':'#reader-error'):'main h1');if(target){if(target.tagName==='H1')target.tabIndex=-1;target.focus();}},[view.state,view.message,view.errorAttempt,view.codeError]);
 const delivered=useRef<SecretText|undefined>(undefined),terminal=useRef('');
 useEffect(()=>{
  if(view.state==='reading' && view.secret && view.expiresAt && eligible()){
   if(delivered.current!==view.secret){delivered.current=view.secret;onDisclosure?.({secret:view.secret,expiresAt:view.expiresAt,remaining:view.remaining,eligible});}
  }else delivered.current=undefined;
  if(view.state==='expired' || view.state==='early_unavailable' || view.state==='unknown'){
   const key=view.state+(view.expiresAt??'');if(terminal.current!==key){terminal.current=key;onTerminal?.({state:view.state,...(view.expiresAt?{expiresAt:view.expiresAt}:{})});}
  }else terminal.current='';
 });
 if(view.state==='expired' || view.state==='early_unavailable' || view.state==='unknown')return renderTerminal?.({state:view.state,expiresAt:view.expiresAt})??<ScreenFrame title="A Secret was shared with you"><Notice>Content remains hidden.</Notice></ScreenFrame>;
 if(view.state==='reading' && view.secret && view.expiresAt)return renderDisclosure?.({secret:view.secret,expiresAt:view.expiresAt,remaining:view.remaining,eligible})??<ScreenFrame title="A Secret was shared with you"><Notice>Content remains hidden.</Notice></ScreenFrame>;
 const gate=view.state==='gate' || view.state==='opening';
 return <ScreenFrame title="A Secret was shared with you">{gate && view.expiresAt && <RemainingLifetime remaining={view.remaining} expiresAt={view.expiresAt}/>} {view.message && !view.codeError && <div id="reader-error" tabIndex={-1}><Notice tone="error">{view.message}</Notice></div>}{gate?<form autoComplete="off" noValidate onSubmit={e=>{e.preventDefault();void show();}}>{view.gate?.reading_code_required && <SourceTextArea id="recipient-code" error={view.codeError?view.message:undefined} label="Reading code" value={code} onValue={setCode} disabled={view.state==='opening'} rows={2} help="Exact case, spaces and line breaks matter. Up to 1024 UTF-8 bytes; short guesses are allowed."/>}<ActionButton type="submit" busy={view.state==='opening'}>{view.state==='opening'?'Opening...':'Show Secret'}</ActionButton></form>:<><Notice>{view.state==='checking'?'Checking availability...':'Content remains hidden.'}</Notice>{view.state!=='checking' && <ActionButton onClick={()=>{void recheck();}}>Check availability again</ActionButton>}<ActionButton disabled>Show Secret</ActionButton></>}<p>Opening this page does not reveal the content. Repeated reading is allowed while available before expiry. No account is required.</p><p>Expiration does not change external passwords, revoke server keys, or erase saved copies.</p></ScreenFrame>;
}


// Preserve the existing reader composition; T16 acceptance remains separate.
export function SecretReader(){
 return <ReadingGate renderTerminal={value=><UnavailableSecret state={value.state} expiresAt={value.expiresAt}/>} renderDisclosure={({secret,expiresAt,remaining,eligible})=><ScreenFrame title="Secret"><RemainingLifetime remaining={remaining} expiresAt={expiresAt}/>{secret.address!=='' && <ExactCopyField label="Address" value={secret.address} eligible={eligible}/>} {secret.login!=='' && <ExactCopyField label="Login" value={secret.login} eligible={eligible}/>}<ExactCopyField label="Password or key" value={secret.credential} eligible={eligible}/><p>Expiration stops access through this service. It does not change external passwords, revoke server keys, or erase copies already acquired.</p></ScreenFrame>}/>;
}
