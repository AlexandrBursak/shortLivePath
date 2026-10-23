import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {createClient} from 'redis'
test('AC-10 AC-11 AC-11b: indexed bounded cleanup deletes expired partial hashes and orphan handles at full caps without metadata dependency',async()=>{
 assert.ok(existsSync('build/app/services/cleanup_service.js'),'bounded cleanup must be implemented')
 const {CleanupService}=await import('../../build/app/services/cleanup_service.js')
 const redis=createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect()
 const ns='cleanup_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',now=Date.now(),ids=Array.from({length:1000},()=>randomUUID())
 try {
  const tx=redis.multi()
  for(const id of ids){tx.hSet(p+'secret:'+id+':payload',{credential:'synthetic-expired',code_verifier:'synthetic-expired'});tx.zAdd(p+'payload:expiry',{score:now-1,value:id})}
  const all=await tx.exec();assert.equal(all.length,2000)
  const labels=Array.from({length:10000},(_,i)=>{const bytes=Buffer.alloc(32);bytes.writeUInt32BE(i);return p+'creation:v1:'+bytes.toString('base64url')+':state'})
  await redis.zAdd(p+'limiter:expiry',labels.map(value=>({score:now-1,value})))
  const live=randomUUID();await redis.hSet(p+'secret:'+live+':payload',{credential:'synthetic-live'})
  // Capacity fixture already has1000 due entries; sweep first, then demonstrate live retention.
  const start=performance.now(),result=await new CleanupService(redis,ns).sweep(now)
  const elapsed=performance.now()-start
  assert.equal(result.payloads,1000);assert.equal(result.limiters,10000);assert.ok(elapsed<60000)
  assert.equal(await redis.zCard(p+'payload:expiry'),0);assert.equal(await redis.zCard(p+'limiter:expiry'),0)
  for(const id of ids)assert.equal(await redis.exists(p+'secret:'+id+':payload'),0)
  assert.equal(await redis.exists(p+'secret:'+live+':payload'),1)
  console.log('cleanup aggregate',JSON.stringify({payloads:result.payloads,limiters:result.limiters,elapsedMs:Math.ceil(elapsed)}))
 }finally{const keys=await redis.keys(p+'*');if(keys.length)await redis.del(keys);await redis.close()}
})
