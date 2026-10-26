'use client';
import {useState} from 'react';
import type {EligibleResult} from '@/data/short_live_path/client';
import type {ShareLink} from '@/entities/short_live_path/types';
import {CreateForm} from '@/view/forms/CreateForm';
import {ShareConfirmation} from './ShareConfirmation';
export function CreateFlow(){
 const [confirmed,setConfirmed]=useState<{result:EligibleResult<ShareLink>;code?:string}|null>(null);
 return confirmed?<ShareConfirmation result={confirmed.result} code={confirmed.code} startNew={()=>setConfirmed(null)}/>:<CreateForm created={(result,code)=>setConfirmed({result,code})}/>;
}
