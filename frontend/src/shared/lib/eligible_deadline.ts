export interface Clock {mono():number;wall():number}
export interface ClockStamp {mono:number;wall:number}
export const browserClock:Clock={mono:()=>performance.now(),wall:()=>Date.now()};
export function stamp(clock:Clock=browserClock):ClockStamp{return {mono:clock.mono(),wall:clock.wall()};}
export class EligibleDeadline {
 private readonly received:ClockStamp;
 private readonly budget:number;
 private previous:ClockStamp;
 private consumed=0;
 private closed=false;
 private reason:'active'|'unsafe'|'expired'='active';
 get disposition(){return this.reason;}
 constructor(expiresMs:number,serviceMs:number,sent:ClockStamp,private clock:Clock=browserClock){
  this.received=stamp(clock);this.previous=this.received;
  const mono=this.received.mono-sent.mono,wall=this.received.wall-sent.wall;
  this.budget=expiresMs-serviceMs-Math.max(mono,wall)-2;
  if(![expiresMs,serviceMs,sent.mono,sent.wall,mono,wall,this.budget].every(Number.isFinite) || mono<0 || wall<0 || Math.abs(mono-wall)>250 || expiresMs-serviceMs>86400000){this.closed=true;this.reason='unsafe';}
  else if(this.budget<=0){this.closed=true;this.reason='expired';}
 }
 remaining():number{
  if(this.closed)return 0;
  const now=stamp(this.clock),mono=now.mono-this.previous.mono,wall=now.wall-this.previous.wall;
  // Compare against receipt as well as the previous observation:
  // small per-tick discrepancies must not accumulate into an undetected sleep.
  const elapsedMono=now.mono-this.received.mono,elapsedWall=now.wall-this.received.wall;
  if(![now.mono,now.wall,mono,wall,elapsedMono,elapsedWall].every(Number.isFinite) || mono<0 || wall<0 || Math.max(mono,wall)>1500 || Math.abs(mono-wall)>250 || Math.abs(elapsedMono-elapsedWall)>250){this.closed=true;this.reason='unsafe';return 0;}
  this.previous=now;
  this.consumed+=Math.max(mono,wall);
  const left=this.budget-this.consumed;
  if(left<=0){this.closed=true;this.reason='expired';return 0;}return left;
 }
 eligible(){return this.remaining()>0;}
 invalidate(){this.closed=true;this.reason='unsafe';}
}
export class RequestFence {
 private epoch=0;
 capture(){return this.epoch;}
 current(epoch:number){return epoch===this.epoch;}
 invalidate(){this.epoch++;}
}
