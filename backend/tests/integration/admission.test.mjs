import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
test('AC-01 AC-07 AC-11: observed rolling histories are bounded, atomic, retained on success/refusal and hard-capped',async()=>{
 assert.ok(existsSync('build/app/services/admission_service.js'),'basic admission must be implemented')
 const {AdmissionService}=await import('../../build/app/services/admission_service.js')
 const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
 const ns='admission_'+randomUUID().replaceAll('-',''),prefix='slp:'+ns+':',s=new AdmissionService(redis,ns)
 const label='v1:'+Buffer.alloc(32,1).toString('base64url'),other='v1:'+Buffer.alloc(32,2).toString('base64url'),id=randomUUID(),now=Date.now(),expires=now+240000
 try {
  for(let n=0;n<25;n++) {assert.equal(await s.creationAllowed(label,now+n),true);await s.creationSucceeded(label,now+n)}
  assert.equal(await s.creationAllowed(label,now+25),false)
  assert.equal(await s.creationAllowed(label,now+60000),true)
  for(let n=0;n<5;n++){assert.equal(await s.verificationAllowed(id,label,expires,now+n),true);await s.verificationFailed(id,label,expires,now+n)}
  assert.equal(await s.verificationAllowed(id,label,expires,now+5),false)
  assert.equal(await s.verificationAllowed(id,other,expires,now+5),true)
  const key=prefix+'verification:'+id+':'+label+':state'
  const before=JSON.parse(await redis.get(key)).events
  assert.equal(await s.verificationAllowed(id,label,expires,now+100),false)
  assert.deepEqual(JSON.parse(await redis.get(key)).events,before)
  assert.equal(await redis.pExpireTime(key),expires)
  assert.equal(await redis.pTTL(prefix+'limiter:expiry'),-1)
  assert.equal(await s.verificationAllowed(id,label,expires,now+60000),true)
  // Already-admitted completions may overshoot, but newest threshold events cannot be lost.
  await Promise.all(Array.from({length:10},(_,n)=>s.verificationFailed(id,label,expires,now+60001+n)))
  const events=JSON.parse(await redis.get(key)).events
  assert.deepEqual(events,[now+60006,now+60007,now+60008,now+60009,now+60010])
  assert.equal(await s.verificationAllowed(id,label,expires,now+60011),false)
  // New instance/restart never resets surviving history.
  assert.equal(await new AdmissionService(redis,ns).verificationAllowed(id,label,expires,now+60012),false)
  await redis.del(key)
  await assert.rejects(s.verificationAllowed(id,label,expires,now+60013),{code:'service_unavailable'})
  await assert.rejects(s.creationAllowed('raw-address',now),{code:'service_unavailable'})
  const current=await redis.zCard(prefix+'limiter:expiry')
  await redis.zAdd(prefix+'limiter:expiry',Array.from({length:10000-current},(_,i)=>({score:now+300000,value:prefix+'synthetic:'+i})))
  const next='v1:'+Buffer.alloc(32,3).toString('base64url')
  await assert.rejects(s.creationAllowed(next,now),{code:'capacity_unavailable'})
  assert.equal(await redis.zCard(prefix+'limiter:expiry'),10000)
 }finally{const keys=await redis.keys(prefix+'*');if(keys.length)await redis.del(keys);await redis.close()}
})
