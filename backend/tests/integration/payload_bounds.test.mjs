import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'

for (const corruption of ['__proto__','credential','unknown_name','code_verifier','lifecycle_id','created_at_ms','integrity_digest']) {
 test(`AC-07 AC-11: recovered ${corruption} is rejected before oversized values cross Redis adapter`,async()=>{
  const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
  const ns='bounds_'+randomUUID().replaceAll('-',''),prefix='slp:'+ns+':'
  let received
  const adapter={async eval(script,options){const result=await redis.eval(script,options);received=result;return result}}
  const store=new EphemeralSecretService(adapter,ns),now=Date.now(),record={id:randomUUID(),createdAtMs:now,expiresAtMs:now+60000}
  try {
   const text={address:'',login:'',credential:'synthetic'}
   await store.publish(record,text,undefined,now)
   assert.deepEqual(await store.read(record),{...text,codeVerifier:undefined})
   const field=corruption==='unknown_name'?'x'.repeat(1048576):corruption
   await redis.hSet(store.key(record.id),field,corruption==='__proto__'?'forbidden':'x'.repeat(1048576))
   await assert.rejects(store.read(record),{code:'service_unavailable'})
   assert.ok(Buffer.byteLength(JSON.stringify(received))<256,'Lua must reject before copying recovered oversized data')
   assert.equal(await redis.pExpireTime(store.key(record.id)),record.expiresAtMs)
   assert.equal(Number(await redis.zScore(prefix+'payload:expiry',record.id)),record.expiresAtMs)
  }finally{const keys=await redis.keys(prefix+'*');if(keys.length)await redis.del(keys);await redis.close()}
 })
}
