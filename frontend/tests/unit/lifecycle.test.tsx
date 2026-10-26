import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {EligibleDeadline} from '../../src/shared/lib/eligible_deadline';
test('AC-04 AC-10: accumulated clock drift and invalid samples permanently close eligibility',()=>{
 let mono=0,wall=0;const clock={mono:()=>mono,wall:()=>wall};
 const drift=new EligibleDeadline(60000,0,{mono,wall},clock);
 mono=100;wall=300;assert.ok(drift.eligible());
 mono=200;wall=600;assert.equal(drift.eligible(),false,'cumulative discontinuity must conceal');
 mono=wall=700;assert.equal(drift.eligible(),false);
 const invalid=new EligibleDeadline(60000,0,{mono,wall},clock);
 mono=Number.NaN;assert.equal(invalid.eligible(),false);
 mono=wall=800;assert.equal(invalid.eligible(),false,'invalid clock cannot revive');
});
test('AC-04 AC-10: tolerated wall corrections never increase the remaining budget',()=>{
 let mono=0,wall=0;const clock={mono:()=>mono,wall:()=>wall};
 const deadline=new EligibleDeadline(60000,0,{mono,wall},clock);
 wall=200;const before=deadline.remaining();
 mono=100;assert.ok(deadline.remaining()<=before-100,'elapsed monotonic time still consumes lifetime');
});
test('AC-04 AC-10: transit-aware eligibility cannot extend with wall changes, suspension or stale generations',async()=>{
 assert.ok(existsSync('src/shared/lib/eligible_deadline.ts'),'safe browser deadline must be implemented');
 const {EligibleDeadline,RequestFence}=await import('../../src/shared/lib/eligible_deadline');
 let mono=100,wall=100000;const clock={mono:()=>mono,wall:()=>wall};
 const deadline=new EligibleDeadline(102000,100000,{mono:0,wall:99900},clock);
 assert.ok(deadline.remaining()<=1900);mono+=200;wall+=200;assert.ok(deadline.remaining()<=1700);
 wall-=100;assert.equal(deadline.eligible(),false);assert.equal(deadline.disposition,'unsafe');wall+=100;assert.equal(deadline.eligible(),false);
 const suspended=new EligibleDeadline(110000,100000,{mono,wall},clock);mono+=2000;wall+=2000;assert.equal(suspended.eligible(),false);
 const fence=new RequestFence(),first=fence.capture();fence.invalidate();assert.equal(fence.current(first),false);
 assert.ok(existsSync('src/shared/lib/observe_lifecycle.ts'),'browser concealment events must be wired');
 const {observeLifecycle}=await import('../../src/shared/lib/observe_lifecycle');
 const page=Object.assign(new EventTarget(),{visibilityState:'visible'}),host=new EventTarget();let hidden=0,returned=0;
 const stop=observeLifecycle(page,host,()=>hidden++,()=>returned++);
 page.visibilityState='hidden';page.dispatchEvent(new Event('visibilitychange'));assert.equal(hidden,1);assert.equal(returned,0);
 page.visibilityState='visible';page.dispatchEvent(new Event('visibilitychange'));assert.equal(hidden,2);assert.equal(returned,1);
 host.dispatchEvent(new Event('pagehide'));page.dispatchEvent(new Event('freeze'));assert.equal(hidden,4);
 stop();host.dispatchEvent(new Event('pageshow'));assert.equal(returned,1);
});
test('AC-10: offline and resume events conceal before neutral revalidation and unsubscribe cleanly',async()=>{
 const {observeLifecycle}=await import('../../src/shared/lib/observe_lifecycle');
 const page=Object.assign(new EventTarget(),{visibilityState:'visible'}),host=new EventTarget(),events:string[]=[];
 const stop=observeLifecycle(page,host,()=>events.push('conceal'),()=>events.push('status'));
 host.dispatchEvent(new Event('offline'));assert.deepEqual(events,['conceal']);
 events.length=0;host.dispatchEvent(new Event('online'));assert.deepEqual(events,['conceal','status']);
 events.length=0;page.dispatchEvent(new Event('resume'));assert.deepEqual(events,['conceal','status']);
 page.visibilityState='hidden';events.length=0;page.dispatchEvent(new Event('resume'));assert.deepEqual(events,['conceal']);
 stop();events.length=0;host.dispatchEvent(new Event('offline'));page.dispatchEvent(new Event('resume'));assert.deepEqual(events,[]);
});
test('AC-03 AC-10: exact clipboard receives original bytes but stale completion is not success',async()=>{
 assert.ok(existsSync('src/shared/lib/exact_copy.ts'),'guarded exact copy must be implemented');
 const {exactCopy}=await import('../../src/shared/lib/exact_copy');
 let eligible=true,received='';let done!:()=>void;
 const original=' 𝄞 é\r\n\tkey\n ';
 const pending=exactCopy(original,()=>eligible,async value=>{received=value;await new Promise<void>(r=>{done=r});});
 assert.equal(received,original);eligible=false;done();assert.equal(await pending,'stale');
 let calls=0;assert.equal(await exactCopy(original,()=>false,async()=>{calls++;}),'stale');assert.equal(calls,0);
});
