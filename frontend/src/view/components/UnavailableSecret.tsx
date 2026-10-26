import {ScreenFrame,Notice} from '@/shared/ui';
import Link from 'next/link';
export function UnavailableSecret({state,expiresAt}:{state:'expired'|'early_unavailable'|'unknown';expiresAt?:string}){
 const title=state==='expired'?'This Share link has expired':state==='early_unavailable'?'The Secret became unavailable before expiry':'The Secret at this link is unavailable';
 return <ScreenFrame title={title}>{state==='expired'?<><Notice>This Share link has expired. No new disclosure is available through this link.</Notice>{expiresAt && <p>Expired <time dateTime={expiresAt}>{new Date(expiresAt).toISOString()} (UTC)</time></p>}</>:state==='early_unavailable'?<Notice>Temporary content may be lost after a crash. The cause is not confirmed here.</Notice>:null}<p>Recovery is not available. Ask the Sender to create and share a new link.</p><p>This does not change external passwords or revoke server keys, or erase copies already acquired.</p><Link href="/" prefetch={false}>Create a new Secret</Link></ScreenFrame>;
}
