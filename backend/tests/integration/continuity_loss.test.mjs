import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {clockFields} from '../helpers/safety_marker.mjs'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
import {AdmissionService} from '../../build/app/services/admission_service.js'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'
for(const lost of ['safety:continuity','payload:expiry','limiter:expiry'])test(`AC-07 AC-11: lost ${lost} has bounded fail-closed recovery without premature failure-history reset`,{timeout:150000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='loss_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,15),now=Date.now(),record={id:randomUUID(),createdAtMs:now,expiresAtMs:now+120000},label='v1:'+Buffer.alloc(32,1).toString('base64url')
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close())
 const observations={clockFailures:0,redisRefusals:0}
 const adapter={async eval(...args){const result=await r.eval(...args);if(result===-2 || (Array.isArray(result) && result[0]===-2))observations.redisRefusals++;return result}}
 try{
  const admission=new AdmissionService(r,ns),store=new EphemeralSecretService(r,ns)
  for(let i=0;i<5;i++)await admission.verificationFailed(record.id,label,record.expiresAtMs,now)
  await store.publish(record,{address:'',login:'',credential:'synthetic lost-registry payload'},undefined,now)
  assert.equal((await store.read(record)).credential,'synthetic lost-registry payload')
  const counter=p+'verification:'+record.id+':'+label+':state',before=JSON.parse(await r.get(counter)).events
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'1',limiters:'1',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  await r.del(p+lost)
  ready=new ReadinessService(adapter,owner,ns,key)
  const sample=ready.clock.sample.bind(ready.clock)
  ready.clock.sample=async(...args)=>{try{return await sample(...args)}catch(error){observations.clockFailures++;throw error}}
  const started=performance.now()
  await ready.recover()
  assert.equal(ready.ready,false)
  assert.equal(await r.exists(store.key(record.id)),0,'uncertain payloads are removed, never reconstructed or extended')
  assert.deepEqual(JSON.parse(await r.get(counter)).events,before,'quiet start must preserve surviving failure history')
  ready.start()
  let quietStart=started,failures=0
  while(!ready.ready){
   if(ready.metrics.recoveryFailures!==failures){
    // ADR-0009 requires a NEW full window after an unsafe observation. An
    // initial-start deadline must not force unsafe reopening after that fault.
    assert.equal(ready.metrics.recoveryFailures,observations.clockFailures)
    assert.equal(observations.redisRefusals,0)
    failures=ready.metrics.recoveryFailures;quietStart=performance.now()
   }
   if(performance.now()-started<60000)assert.equal(await r.exists(counter),1)
   assert.ok(performance.now()-quietStart<70000 && performance.now()-started<145000,'defined recovery must not block forever; aggregate='+JSON.stringify({...ready.metrics,...observations}))
   await new Promise(resolve=>setTimeout(resolve,50))
  }
  assert.ok(performance.now()-started>=60000)
  assert.ok(performance.now()-quietStart>=60000,'every observed interruption requires a fresh full quiet interval')
  assert.equal(await r.exists(counter),0)
  assert.equal(await r.hGet(p+'safety:continuity','clean'),'1')
 }finally{ready?.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
