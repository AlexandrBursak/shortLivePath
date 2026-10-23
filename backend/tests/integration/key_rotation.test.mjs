import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {clockFields} from '../helpers/safety_marker.mjs'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'
test('AC-07 AC-11: planned key rotation waits a full quiet window without deleting or extending surviving payloads',{timeout:150000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='rotate_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',oldKey=Buffer.alloc(32,16),key=Buffer.alloc(32,17),now=Date.now(),record={id:randomUUID(),createdAtMs:now,expiresAtMs:now+180000}
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close())
 try{
  const store=new EphemeralSecretService(r,ns),text={address:'',login:'',credential:'synthetic retained payload'}
  await store.publish(record,text,undefined,now)
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'1',limiters:'0',key_digest:createHash('sha256').update(oldKey).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  ready=new ReadinessService(r,owner,ns,key)
  const started=performance.now();let quietStart=started,failures=0
  await ready.recover();assert.equal(ready.ready,false);ready.start()
  while(!ready.ready){
   if(ready.metrics.recoveryFailures!==failures){failures=ready.metrics.recoveryFailures;quietStart=performance.now()}
   assert.ok(performance.now()-quietStart<70000 && performance.now()-started<145000)
   assert.equal(await r.pExpireTime(store.key(record.id)),record.expiresAtMs)
   await new Promise(resolve=>setTimeout(resolve,50))
  }
  assert.ok(performance.now()-quietStart>=60000)
  assert.deepEqual(await store.read(record),{...text,codeVerifier:undefined})
  assert.equal(await r.pExpireTime(store.key(record.id)),record.expiresAtMs)
 }finally{ready?.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
