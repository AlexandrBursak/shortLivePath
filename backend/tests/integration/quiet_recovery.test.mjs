import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
test('AC-07 AC-10 AC-11: repeated continuity loss restarts the real fenced sixty-second quiet interval', {timeout:150000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const db=new pg.Client();await db.connect().catch(async error=>{await r.close();throw error})
 const ns='quiet_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':'
 let ready;const owner=new ProcessOwnershipService(db,()=>ready?.close())
 ready=new ReadinessService(r,owner,ns,Buffer.alloc(32,8))
 const started=performance.now()
 try{
  await ready.recover()
  assert.equal(ready.ready,false)
  ready.start()
  await new Promise(resolve=>setTimeout(resolve,1000))
  await r.del(p+'safety:continuity')
  ready.close()
  const repeated=performance.now()
  let quietStart=repeated,failures=ready.metrics.recoveryFailures
  while(!ready.ready){
   if(ready.metrics.recoveryFailures!==failures){failures=ready.metrics.recoveryFailures;quietStart=performance.now()}
   if(performance.now()-repeated<60000)assert.equal(ready.ready,false)
   assert.ok(performance.now()-quietStart<70000 && performance.now()-started<145000,'quiet recovery never became ready')
   await new Promise(resolve=>setTimeout(resolve,50))
  }
  assert.ok(performance.now()-quietStart>=60000)
  assert.equal(await r.hGet(p+'safety:continuity','state'),'open')
 }finally{ready.stop();await owner.release();await db.end();const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
