import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
import {ServiceClock} from '../../build/app/services/service_clock.js'
test('AC-10 AC-11: restarted readiness restores persisted host-monotonic trajectory before expired cleanup',async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='restart_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,14),id=randomUUID(),boot='synthetic-boot'
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close()),realTime=owner.time.bind(owner)
 owner.time=async()=>{await realTime();return 100900}
 try{
  await r.hSet(p+'secret:'+id+':payload',{credential:'synthetic partial'})
  await r.zAdd(p+'payload:expiry',{score:101000,value:id})
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'1',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:'100500',continuity:'1',clock_boot:boot,clock_mono:'0',clock_db:'100500'})
  ready=new ReadinessService(r,owner,ns,key,new ServiceClock({mono:()=>0,wall:()=>100900}),{bootId:boot,mono:()=>500})
  await ready.recover()
  assert.ok(ready.clock.upperNow()>=101000,'new readiness may not retreat to the still-above-floor current UTC')
  assert.equal(await r.exists(p+'secret:'+id+':payload'),0)
 }finally{ready?.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
