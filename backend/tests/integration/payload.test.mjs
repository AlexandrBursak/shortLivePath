import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
test('AC-01 AC-07 AC-11: complete bounded payload publication retains immutable expiry and validates stored records',async()=>{
 assert.ok(existsSync('build/app/services/ephemeral_secret_service.js'),'ephemeral store must be implemented')
 const {EphemeralSecretService}=await import('../../build/app/services/ephemeral_secret_service.js')
 const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
 const ns='payload_'+randomUUID().replaceAll('-',''),prefix='slp:'+ns+':'
 const store=new EphemeralSecretService(redis,ns),now=Date.now(),record={id:randomUUID(),createdAtMs:now,expiresAtMs:now+60000}
 const text={address:'https://synthetic.invalid',login:' e\u0301 ',credential:' \r\n\tTEST 😀\r\n '}
 try {
  await store.publish(record,text,undefined,now)
  assert.deepEqual(await store.read(record),{...text,codeVerifier:undefined})
  const key=prefix+'secret:'+record.id+':payload'
  assert.equal(await redis.pExpireTime(key),record.expiresAtMs)
  assert.equal(Number(await redis.zScore(prefix+'payload:expiry',record.id)),record.expiresAtMs)
  assert.equal(await redis.pTTL(prefix+'payload:expiry'),-1)
  await redis.zRem(prefix+'payload:expiry',record.id)
  await assert.rejects(store.read(record),{code:'service_unavailable'})
  await redis.zAdd(prefix+'payload:expiry',{score:record.expiresAtMs,value:record.id})
  await assert.rejects(store.publish(record,text,undefined,now),{code:'service_unavailable'})
  assert.equal(await redis.pExpireTime(key),record.expiresAtMs)
  await redis.hSet(key,'code_verifier','corrupt')
  await assert.rejects(store.read(record),{code:'service_unavailable'})
  await redis.hDel(key,'code_verifier');await redis.hSet(key,'extra','forbidden')
  await assert.rejects(store.read(record),{code:'service_unavailable'})
  await redis.hDel(key,'extra');await redis.persist(key)
  await assert.rejects(store.read(record),{code:'service_unavailable'})
  await redis.del(key)
  assert.equal(await store.read(record),null)
  // The conservative registry includes uncertain/orphan writes until original expiry.
  const remaining=Array.from({length:999},()=>({score:now+60000,value:randomUUID()}))
  await redis.zAdd(prefix+'payload:expiry',remaining)
  const next={...record,id:randomUUID()}
  await assert.rejects(store.publish(next,text,undefined,now),{code:'capacity_unavailable'})
  assert.equal(await redis.zCard(prefix+'payload:expiry'),1000)
  assert.equal(await redis.exists(prefix+'secret:'+next.id+':payload'),0)
 }finally{
  // No global FLUSH: only this synthetic namespace's bounded test-owned keys.
  const keys=await redis.keys(prefix+'*');if(keys.length)await redis.del(keys);await redis.close()
 }
})
