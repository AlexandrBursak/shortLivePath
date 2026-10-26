import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'
import {publishPayloadLua} from '../../build/app/services/redis_scripts/payload.js'
test('AC-01 AC-11: real Redis OOM, partial script errors and lost replies never confirm or extend publication',async()=>{
 const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
 const ns='fault_'+randomUUID().replaceAll('-',''),prefix='slp:'+ns+':',store=new EphemeralSecretService(redis,ns)
 const now=Date.now(),text={address:'',login:'',credential:'synthetic'},record=()=>({id:randomUUID(),createdAtMs:now,expiresAtMs:now+60000})
 const original=(await redis.configGet('maxmemory')).maxmemory
 try {
  const existing=record();await store.publish(existing,text,undefined,now)
  const underPressure=record()
  await redis.configSet('maxmemory','1') // This dedicated suite-owned Redis only.
  await assert.rejects(store.publish(underPressure,text,undefined,now),{code:'service_unavailable'})
  await redis.configSet('maxmemory',original)
  assert.deepEqual(await store.read(existing),{...text,codeVerifier:undefined})
  assert.equal(await redis.exists(store.key(underPressure.id)),0)
  for(const after of ['index','hash']){
   const r=record()
   const injected={eval:(script,options)=>redis.eval(script.replace(after==='index'?"local write =":"local expiry =", "error('synthetic partial-write fault'); "+(after==='index'?"local write =":"local expiry =")),options)}
   await assert.rejects(new EphemeralSecretService(injected,ns).publish(r,text,undefined,now),{code:'service_unavailable'})
   assert.equal(Number(await redis.zScore(prefix+'payload:expiry',r.id)),r.expiresAtMs)
   if(after==='hash'){
    assert.equal(await redis.exists(store.key(r.id)),1)
    assert.equal(await redis.pExpireTime(store.key(r.id)),-1)
    await assert.rejects(store.read(r),{code:'service_unavailable'})
   }else assert.equal(await redis.exists(store.key(r.id)),0)
  }
  const uncertain=record()
  const loseReply={eval:async(script,options)=>{await redis.eval(script,options);throw new Error('synthetic lost reply')}}
  await assert.rejects(new EphemeralSecretService(loseReply,ns).publish(uncertain,text,undefined,now),{code:'service_unavailable'})
  assert.equal(await redis.pExpireTime(store.key(uncertain.id)),uncertain.expiresAtMs)
  assert.deepEqual(await store.read(uncertain),{...text,codeVerifier:undefined})
  await assert.rejects(store.publish(uncertain,text,undefined,now+1000),{code:'service_unavailable'})
  assert.equal(await redis.pExpireTime(store.key(uncertain.id)),uncertain.expiresAtMs)
  assert.ok(publishPayloadLua.indexOf("'ZADD'") < publishPayloadLua.indexOf("'HSET'"))
 }finally{
  await redis.configSet('maxmemory',original)
  const keys=await redis.keys(prefix+'*');if(keys.length)await redis.del(keys);await redis.close()
 }
})
