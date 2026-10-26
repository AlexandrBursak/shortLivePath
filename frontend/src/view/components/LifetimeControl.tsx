'use client';
import {useRef} from 'react';
import {TextField} from '@/shared/ui';
import {validMinutes,snapHour} from '@/entities/short_live_path/create_rules';
export function LifetimeControl({value,onValue,disabled,error}:{value:string;onValue:(value:string)=>void;disabled?:boolean;error?:string}){
 const pointer=useRef(false),minutes=validMinutes(value);
 return <fieldset disabled={disabled}><legend>Lifetime</legend><label htmlFor="lifetime-range">Lifetime slider (minutes)</label><input id="lifetime-range" type="range" min={1} max={1440} step={1} disabled={minutes===undefined} value={minutes??60} aria-valuetext={minutes===undefined?'Enter valid exact minutes':`${minutes} minutes`} onPointerDown={()=>{pointer.current=true;}} onPointerUp={()=>{pointer.current=false;}} onKeyDown={()=>{pointer.current=false;}} onChange={e=>onValue(String(pointer.current?snapHour(Number(e.target.value)):Number(e.target.value)))}/><TextField id="minutes" label="Exact minutes" inputMode="decimal" value={value} onChange={e=>onValue(e.target.value)} error={error} help="Every whole minute from 1 to 1440 is available. Pointer dragging assists hour selection; keyboard arrows change one minute."/><p>Selected: {minutes===undefined?'Invalid duration':`${Math.floor(minutes/60)} h ${minutes%60} min`}. The lifetime starts when the service records creation.</p></fieldset>;
}
