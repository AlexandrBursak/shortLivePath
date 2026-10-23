import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
import {CleanupService} from '../../build/app/services/cleanup_service.js'
import {GenerationGuard} from '../../build/app/services/generation_guard.js'
import {AdmissionService} from '../../build/app/services/admission_service.js'
test('AC-10 AC-11: scheduled-owner cleanup preserves current registry accounting for surviving traffic',async()=>{
 const r=createClient({url:process.env.REDIS_URL});r.on('error',()=>{});await r.connect()
 const ns='account_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',generation=randomUUID(),now=Date.now(),id=randomUUID()
 try{
  await r.zAdd(p+'payload:expiry',{score:now-1,value:id})
  await r.hSet(p+'secret:'+id+':payload',{credential:'synthetic partial'})
  await r.hSet(p+'safety:continuity',{generation,state:'open',clean:'1',payloads:'1',limiters:'0'})
  await new CleanupService(r,ns,generation).sweep(now)
  assert.equal(await r.hGet(p+'safety:continuity','payloads'),'0')
  assert.equal(await new AdmissionService(new GenerationGuard(r,ns,generation),ns).creationAllowed('v1:'+Buffer.alloc(32,1).toString('base64url'),now),true)
 }finally{const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
