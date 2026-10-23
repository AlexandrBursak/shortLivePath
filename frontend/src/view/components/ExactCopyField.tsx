'use client';
import {useState,useRef,useEffect} from 'react';
import {ActionButton,Notice} from '@/shared/ui';
import {exactCopy} from '@/shared/lib/exact_copy';
export function ExactCopyField({label,value,buttonLabel,eligible}:{label:string;value:string;buttonLabel?:string;eligible:()=>boolean}){
 const [busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),active=useRef(true),pending=useRef(false),field=useRef<HTMLPreElement>(null),guard=useRef(eligible);
 useEffect(()=>{guard.current=eligible;},[eligible]);
 useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);
 const allowed=()=>active.current && guard.current();
 async function copy(){if(pending.current || !allowed())return;pending.current=true;setBusy(true);setFeedback('');const result=await exactCopy(value,allowed);pending.current=false;if(!allowed())return;setBusy(false);setFeedback(result==='copied'?`${label} copied.`:result==='manual'?`Could not copy. Select the ${label.toLowerCase()} manually while it remains eligible.`:'');if(result==='manual')field.current?.focus();}
 return <section className="exactField"><h2>{label}</h2><pre ref={field} tabIndex={0} aria-label={label} onCopy={e=>{
  e.preventDefault();if(!allowed())return;
  const selection=window.getSelection(),node=field.current?.firstChild;
  const selected=selection && node && selection.anchorNode===node && selection.focusNode===node?value.slice(Math.min(selection.anchorOffset,selection.focusOffset),Math.max(selection.anchorOffset,selection.focusOffset)):value;
  e.clipboardData.setData('text/plain',selected);
 }}>{value}</pre><ActionButton busy={busy} onClick={()=>{void copy();}}>{busy?`Copying ${label.toLowerCase()}...`:buttonLabel??`Copy ${label.toLowerCase()}`}</ActionButton>{feedback && <Notice>{feedback}</Notice>}</section>;
}
