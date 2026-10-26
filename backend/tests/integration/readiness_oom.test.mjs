import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {clockFields} from '../helpers/safety_marker.mjs'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
test('AC-10 AC-11: coordinator OOM cannot strand cleanup behind an unconfirmed replacement generation',async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='oomready_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,18),now=Date.now(),id=randomUUID(),original=(await r.configGet('maxmemory')).maxmemory
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close())
 try{
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'0',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  ready=new ReadinessService(r,owner,ns,key);await ready.recover();assert.equal(ready.ready,true)
  const handles=Array.from({length:1000},(_,i)=>i===0?id:randomUUID()),multi=r.multi()
  for(const handle of handles){multi.hSet(p+'secret:'+handle+':payload',{credential:'synthetic expired partial'});multi.zAdd(p+'payload:expiry',{score:now-1,value:handle})}
  await multi.exec();await r.hSet(p+'safety:continuity','payloads','1000')
  await r.configSet('maxmemory','1') // Only this serial suite-owned disposable store.
  await ready.tick()
  assert.equal(ready.ready,false)
  assert.equal(await r.exists(handles.map(handle=>p+'secret:'+handle+':payload')),0,'coordinator OOM must not disable executable deletion at cap')
  assert.equal(await r.hGet(p+'safety:continuity','state'),'closed')
 }finally{await r.configSet('maxmemory',original);ready?.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
