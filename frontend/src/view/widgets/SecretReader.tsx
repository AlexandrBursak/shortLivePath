'use client';
import {useEffect} from 'react';
import {ScreenFrame,ActionButton,Notice} from '@/shared/ui';
import {SourceTextArea} from '@/shared/ui/SourceTextArea';
import {useSecretReader} from '@/data/short_live_path/useSecretReader';
import {RemainingLifetime} from '@/view/components/RemainingLifetime';
import {ExactCopyField} from '@/view/components/ExactCopyField';
import {UnavailableSecret} from '@/view/components/UnavailableSecret';
export function SecretReader(){
 const {view,code,setCode,show,recheck,eligible}=useSecretReader();
 useEffect(()=>{const heading=document.querySelector<HTMLElement>('main h1');if(heading){heading.tabIndex=-1;heading.focus();}},[view.state]);
 if(view.state==='expired' || view.state==='early_unavailable' || view.state==='unknown')return <UnavailableSecret state={view.state} expiresAt={view.expiresAt}/>;
 if(view.state==='reading' && view.secret && view.expiresAt)return <ScreenFrame title="Secret"><RemainingLifetime remaining={view.remaining} expiresAt={view.expiresAt}/>{view.secret.address!=='' && <ExactCopyField label="Address" value={view.secret.address} eligible={eligible}/>} {view.secret.login!=='' && <ExactCopyField label="Login" value={view.secret.login} eligible={eligible}/>}<ExactCopyField label="Password or key" value={view.secret.credential} eligible={eligible}/><p>Expiration stops access through this service. It does not change external passwords, revoke server keys, or erase copies already acquired.</p></ScreenFrame>;
 const gate=view.state==='gate' || view.state==='opening';
 return <ScreenFrame title="A Secret was shared with you">{gate && view.expiresAt && <RemainingLifetime remaining={view.remaining} expiresAt={view.expiresAt}/>} {view.message && <Notice tone="error">{view.message}</Notice>}{gate?<form autoComplete="off" noValidate onSubmit={e=>{e.preventDefault();void show();}}>{view.gate?.reading_code_required && <SourceTextArea id="recipient-code" label="Reading code" value={code} onValue={setCode} disabled={view.state==='opening'} rows={2} help="Exact case, spaces and line breaks matter. Up to 1024 UTF-8 bytes; short guesses are allowed."/>}<ActionButton type="submit" busy={view.state==='opening'}>{view.state==='opening'?'Opening...':'Show Secret'}</ActionButton></form>:<><Notice>{view.state==='checking'?'Checking availability...':'Content remains hidden.'}</Notice>{view.state!=='checking' && <ActionButton onClick={()=>{void recheck();}}>Check availability again</ActionButton>}<ActionButton disabled>Show Secret</ActionButton></>}<p>Opening this page does not reveal the content. Repeated reading is allowed while available before expiry. No account is required.</p><p>Expiration does not change external passwords, revoke server keys, or erase saved copies.</p></ScreenFrame>;
}
