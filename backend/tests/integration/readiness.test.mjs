import {test} from 'node:test'
import {clockFields} from '../helpers/safety_marker.mjs'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
test('AC-10 AC-11: real owned readiness cleans before serving and preserves same-key counters',async()=>{
 assert.ok(existsSync('build/app/services/readiness_service.js'),'current-run readiness must be implemented')
 const {ReadinessService}=await import('../../build/app/services/readiness_service.js')
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='ready_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,7),now=Date.now(),expired=randomUUID()
 let readiness
 const owner=new ProcessOwnershipService(db,()=>readiness?.close())
 try{
  await r.zAdd(p+'payload:expiry',{score:now-1,value:expired})
  await r.hSet(p+'secret:'+expired+':payload',{credential:'synthetic partial'})
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'open',clean:'1',payloads:'1',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  readiness=new ReadinessService(r,owner,ns,key)
  assert.equal(readiness.ready,false)
  await readiness.recover()
  assert.equal(readiness.ready,true)
  assert.equal(await r.exists(p+'secret:'+expired+':payload'),0)
  assert.equal(await r.hGet(p+'safety:continuity','payloads'),'0')
  const time=await readiness.fresh();assert.ok(time>=now)
  readiness.close();assert.equal(readiness.ready,false)
  await assert.rejects(readiness.fresh(),{code:'service_unavailable'})
 }finally{readiness?.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
