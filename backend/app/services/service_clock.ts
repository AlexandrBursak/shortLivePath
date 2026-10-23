import {performance} from 'node:perf_hooks'
import {OperationFault} from './operation_fault.js'
interface LocalTime {mono():number;wall():number}
interface Sample {db:number;upper:number;mono:number;wall:number;rtt:number}
export class ServiceClock {
 #previous?:Sample
 #safe=false
 #floor=0
 // Independent stable envelopes. Never rebase a rounded/max-of-clocks
 // projection at each sample: quantization would then compound indefinitely.
 #monoOffset=Number.NEGATIVE_INFINITY
 #wallOffset=Number.NEGATIVE_INFINITY
 private anchor(upper:number,mono:number,wall:number){
  this.#monoOffset=Math.max(this.#monoOffset,upper-mono)
  this.#wallOffset=Math.max(this.#wallOffset,upper-wall)
 }
 private projected(mono:number,wall:number){return Math.max(mono+this.#monoOffset,wall+this.#wallOffset)}
 constructor(private local:LocalTime={mono:()=>performance.now(),wall:()=>Date.now()}){}
 get highWater(){return this.#floor}
 checkpoint():{sourceMs:number;upperMs:number}{
  const upperMs=this.upperNow()
  if(!this.#previous)throw new OperationFault('service_unavailable')
  return {sourceMs:this.#previous.db+Math.floor(Math.max(0,this.local.mono()-this.#previous.mono)),upperMs}
 }
 restore(saved:{sourceMs:number;upperMs:number},elapsedMs:number):void{
  if(![saved.sourceMs,saved.upperMs,elapsedMs].every(Number.isSafeInteger) || saved.sourceMs<0 || saved.upperMs<saved.sourceMs || elapsedMs<0 || !Number.isSafeInteger(saved.upperMs+elapsedMs))throw new OperationFault('service_unavailable')
  this.requireFloor(saved.sourceMs)
  // An existing in-process trajectory is stronger than reloading a checkpoint.
  if(this.#previous)return
  this.#previous={db:saved.sourceMs,upper:saved.upperMs+elapsedMs,mono:this.local.mono(),wall:this.local.wall(),rtt:0}
  this.anchor(this.#previous.upper,this.#previous.mono,this.#previous.wall)
  this.#safe=false
 }
 invalidate(){this.#safe=false}
 requireFloor(value:number){if(!Number.isSafeInteger(value) || value<0)throw new OperationFault('service_unavailable');this.#floor=Math.max(this.#floor,value)}
 continuous(maxGap=7500):boolean {
  if(!this.#safe || !this.#previous)return false
  const mono=this.local.mono()-this.#previous.mono,wall=this.local.wall()-this.#previous.wall
  return mono>=0 && wall>=0 && mono<=maxGap && wall<=maxGap && Math.abs(mono-wall)<=250
 }
 async sample(source:()=>Promise<number>,recovery=false):Promise<number>{
  try{
   const start=this.local.mono(),wallStart=this.local.wall()
   if(!recovery && this.#previous && !this.continuous())throw new Error()
   const db=await source(),end=this.local.mono(),wall=this.local.wall(),rtt=end-start
   if(!Number.isSafeInteger(db) || db<this.#floor || rtt<0 || rtt>250 || Math.abs((wall-wallStart)-rtt)>250)throw new Error()
   if(!recovery && this.#previous && (Math.abs((db-this.#previous.db)-(end-this.#previous.mono))>250 || db<this.#previous.db+Math.floor(start-this.#previous.mono)-1))throw new Error()
   // A new source sample must not reset an already established conservative trajectory.
   this.anchor(db+Math.ceil(rtt),end,wall)
   const upper=Math.ceil(this.projected(end,wall))
   this.#previous={db,upper,mono:end,wall,rtt};this.#floor=Math.max(this.#floor,db);this.#safe=true
   return upper
  }catch{this.#safe=false;throw new OperationFault('service_unavailable')}
 }
 upperNow():number {
  if(!this.continuous(1000) || !this.#previous){this.#safe=false;throw new OperationFault('service_unavailable')}
  return Math.ceil(this.projected(this.local.mono(),this.local.wall()))
 }
 deletionUpperBound():number {
  // Without any trustworthy anchor, delete indexed payloads conservatively rather than retain uncertain data.
  if(!this.#previous)return Number.MAX_SAFE_INTEGER
  return Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(Math.max(this.#previous.upper,this.projected(this.local.mono(),this.local.wall()))))
 }
}
