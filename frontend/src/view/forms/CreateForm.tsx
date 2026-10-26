'use client';
import {useEffect,useRef} from 'react';
import {ScreenFrame,ActionButton,Notice} from '@/shared/ui';
import {SourceTextArea} from '@/shared/ui/SourceTextArea';
import {useCreateSecret} from '@/data/short_live_path/useCreateSecret';
import type {EligibleResult} from '@/data/short_live_path/client';
import type {ShareLink} from '@/entities/short_live_path/types';
import {byteCount} from '@/entities/short_live_path/create_rules';
import {LifetimeControl} from '@/view/components/LifetimeControl';
import {ReadingCodeControl} from '@/view/components/ReadingCodeControl';
export function CreateForm({created}:{created:(result:EligibleResult<ShareLink>,code?:string)=>void}){
 const form=useCreateSecret(created),summary=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(form.message || Object.keys(form.errors).length)summary.current?.focus();},[form.message,form.errors]);
 return <ScreenFrame title="Create a Secret"><form noValidate autoComplete="off" onSubmit={e=>{e.preventDefault();void form.submit();}}><div ref={summary} tabIndex={-1}>{form.message && <Notice tone="error">{form.message}</Notice>}{Object.keys(form.errors).length>0 && <Notice tone="error">Check the highlighted fields.</Notice>}</div><SourceTextArea id="address" label="Address (optional)" value={form.draft.address} onValue={value=>form.update('address',value)} rows={2} disabled={form.busy}/><SourceTextArea id="login" label="Login (optional)" value={form.draft.login} onValue={value=>form.update('login',value)} rows={2} disabled={form.busy}/><SourceTextArea id="credential" label="Password or key" value={form.draft.credential} onValue={value=>form.update('credential',value)} disabled={form.busy} error={form.errors.credential} help="Exact multiline text, including spaces and line breaks, is preserved."/><p>Secret text: {byteCount([form.draft.address,form.draft.login,form.draft.credential])} / 65536 UTF-8 bytes</p>{form.errors.text && <Notice tone="error">{form.errors.text}</Notice>}<LifetimeControl value={form.draft.minutes} onValue={value=>form.update('minutes',value)} disabled={form.busy} error={form.errors.minutes}/><ReadingCodeControl enabled={form.draft.protected} code={form.draft.code} onEnabled={value=>form.update('protected',value)} onCode={value=>form.update('code',value)} disabled={form.busy} error={form.errors.code}/><ActionButton type="submit" busy={form.busy}>{form.busy?'Creating...':form.attempted?'Create a new attempt':'Create Secret'}</ActionButton></form><p>The service can read the temporary content. No recovery. Expiration does not change external passwords, revoke server keys, or erase saved copies.</p></ScreenFrame>;
}
