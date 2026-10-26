import {test} from 'node:test'
import {clockFields} from '../helpers/safety_marker.mjs'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
test('AC-10 AC-11: scheduled Redis cleanup continues across actual PostgreSQL ownership-connection failure',{timeout:10000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client(),admin=new pg.Client();await Promise.all([db.connect(),admin.connect()]).catch(async error=>{await r.close();throw error})
 const ns='outage_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,9),now=Date.now(),id=randomUUID()
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close())
 ready=new ReadinessService(r,owner,ns,key)
 try{
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'0',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  await ready.recover();assert.equal(ready.ready,true)
  // Recovered partial payload: deliberately no native TTL; scheduler must delete it.
  const ids=Array.from({length:1000},(_,i)=>i===0?id:randomUUID()),due=Date.now()+1000,multi=r.multi()
  for(const handle of ids){multi.hSet(p+'secret:'+handle+':payload',{credential:'x'.repeat(65536)});multi.zAdd(p+'payload:expiry',{score:due,value:handle})}
  await multi.exec();await r.hSet(p+'safety:continuity','payloads','1000')
  const pid=(await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
  await admin.query('SELECT pg_terminate_backend($1)',[pid])
  ready.start()
  const started=performance.now()
  while(await r.exists(p+'secret:'+id+':payload')){
   assert.equal(ready.ready,false)
   assert.ok(performance.now()-started<5000,'scheduler must continue cleanup during PostgreSQL outage')
   await new Promise(resolve=>setTimeout(resolve,50))
  }
  assert.equal(ready.ready,false)
  assert.equal(await r.zCard(p+'payload:expiry'),0)
  assert.equal(await r.exists(ids.map(handle=>p+'secret:'+handle+':payload')),0)
  console.log(JSON.stringify({expiredPayloads:1000,payloadBytes:65536,cleanupAfterFaultMs:Math.ceil(performance.now()-started)}))
  assert.ok(ready.metrics.recoveryFailures>0)
 }finally{ready.stop();await owner.release();await Promise.allSettled([db.end(),admin.end()]);const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
