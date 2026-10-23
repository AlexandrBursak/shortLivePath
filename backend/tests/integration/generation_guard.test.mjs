import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
test('AC-10 AC-11: stale generation, closed/dirty state and lost registry refuse before Redis mutation',async()=>{
 assert.ok(existsSync('build/app/services/generation_guard.js'),'generation guard must be implemented')
 const {GenerationGuard}=await import('../../build/app/services/generation_guard.js')
 const {AdmissionService}=await import('../../build/app/services/admission_service.js')
 const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
 const ns='guard_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',marker=p+'safety:continuity',generation=randomUUID(),now=Date.now(),label='v1:'+Buffer.alloc(32,1).toString('base64url')
 try {
  await redis.hSet(marker,{generation,state:'open',clean:'1',payloads:'0',limiters:'0'})
  const guard=new GenerationGuard(redis,ns,generation),service=new AdmissionService(guard,ns)
  assert.equal(await service.creationAllowed(label,now),true)
  assert.equal(await redis.hGet(marker,'limiters'),'1')
  await redis.hSet(marker,'state','closed')
  await assert.rejects(service.creationSucceeded(label,now+1),{code:'service_unavailable'})
  await redis.hSet(marker,{state:'open',generation:randomUUID()})
  await assert.rejects(service.creationSucceeded(label,now+1),{code:'service_unavailable'})
  await redis.hSet(marker,{generation,clean:'0'})
  await assert.rejects(service.creationSucceeded(label,now+1),{code:'service_unavailable'})
  await redis.hSet(marker,'clean','1');await redis.del(p+'limiter:expiry')
  await assert.rejects(service.creationSucceeded(label,now+1),{code:'service_unavailable'})
  assert.equal(JSON.parse(await redis.get(p+'creation:'+label+':state')).events.length ?? 0,0)
 }finally{const keys=await redis.keys(p+'*');if(keys.length)await redis.del(keys);await redis.close()}
})
