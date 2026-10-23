'use client';
import {useEffect,useRef,useState} from 'react';
import {ExactTextArea} from '@/shared/ui';
import {SourceText,displayText} from '@/shared/lib/source_text';
import {bindSourceText} from '@/shared/lib/bind_source_text';
export function SourceTextArea({id,label,value,onValue,disabled,error,help,rows=3}:{id:string;label:string;value:string;onValue:(value:string)=>void;disabled?:boolean;error?:string;help?:string;rows?:number}){
 const node=useRef<HTMLTextAreaElement>(null),model=useRef(new SourceText(value)),latest=useRef(onValue);
 const [editError,setEditError]=useState(false);
 useEffect(()=>{latest.current=onValue;},[onValue]);
 useEffect(()=>{const el=node.current;if(!el)return;return bindSourceText(el,model.current,raw=>{setEditError(false);latest.current(raw);},()=>setEditError(true));},[]);
 useEffect(()=>{if(model.current.value!==value){model.current.reset(value);if(node.current)node.current.value=model.current.display;}},[value]);
 return <ExactTextArea ref={node} id={id} label={label} rows={rows} disabled={disabled} defaultValue={displayText(value)} help={help} error={error??(editError?'That edit could not preserve the original text. Use typing or paste and try again.':undefined)}/>;
}
