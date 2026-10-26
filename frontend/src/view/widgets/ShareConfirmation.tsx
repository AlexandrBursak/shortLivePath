'use client';
import {useEffect,useRef} from 'react';
import {ScreenFrame,Notice,ActionButton} from '@/shared/ui';
import {useConfirmation} from '@/data/short_live_path/useConfirmation';
import type {EligibleResult} from '@/data/short_live_path/client';
import type {ShareLink} from '@/entities/short_live_path/types';
import {RemainingLifetime} from '@/view/components/RemainingLifetime';
import {ExactCopyField} from '@/view/components/ExactCopyField';
export function ShareConfirmation({result,code,startNew}:{result:EligibleResult<ShareLink>;code?:string;startNew:()=>void}){
 const guard=useConfirmation(result),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(guard.state==='expired')heading.current?.focus();},[guard.state]);
 return <ScreenFrame headingRef={heading} title={guard.state==='expired'?'This Share link has expired':guard.state==='early_unavailable'?'The Secret became unavailable before expiry':guard.state==='unknown'?'The Secret at this link is unavailable':'Secret created'}>{guard.state==='expired' && <p>Expired <time dateTime={result.value.expires_at}>{result.value.expires_at} (UTC)</time></p>}{guard.state==='visible'?<><RemainingLifetime remaining={guard.remaining} expiresAt={result.value.expires_at}/><ExactCopyField label="Share link" value={result.value.share_url} buttonLabel="Copy link" eligible={guard.eligible}/>{code!==undefined && <ExactCopyField label="Reading code" value={code} buttonLabel="Copy code" eligible={guard.eligible}/>}<p>Send the code separately, preferably through another channel. Link and code cannot be recovered. A crash may end availability early.</p></>:guard.state==='concealed'?<><Notice>Handover controls remain hidden until availability is checked safely.</Notice><ActionButton busy={guard.checking} onClick={()=>{void guard.recheck();}}>{guard.checking?'Checking availability...':'Check availability again'}</ActionButton></>:<Notice>{guard.state==='expired'?'This Share link has expired. ':''}No new disclosure is available through this link. Recovery is not available. Ask the Sender for a newly created link.</Notice>}<p>Expiration does not change external passwords, revoke server keys, or erase copies already acquired.</p><ActionButton onClick={startNew}>Create a new Secret</ActionButton></ScreenFrame>;
}
