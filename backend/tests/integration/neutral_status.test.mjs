import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes,createHash,randomUUID} from 'node:crypto'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
const digest=token=>createHash('sha256').update(Buffer.from(token,'base64url')).digest()
test('AC-08 AC-09 AC-10 AC-11b: neutral status distinguishes four lifecycle states without content, consumption or code work',{timeout:20000},async()=>{
 const f=await secretRuntime()
 try{
  const made=await f.request('/api/v1/secrets',{method:'POST',body:{credential:'status-private-canary',reading_code:'secret code'}})
  assert.equal(made.status,201)
  const token=new URL(made.json.data.share_url).pathname.split('/').at(-1)
  const record=(await f.db.query('SELECT * FROM link_lifecycles WHERE token_digest=$1',[digest(token)])).rows[0]
  const key=f.prefix+'secret:'+record.id+':payload',before=await f.redis.hGetAll(key),expiry=await f.redis.pExpireTime(key)
  for(let i=0;i<2;i++){
   const status=await f.request('/api/v1/secrets/'+token+'/status')
   assert.equal(status.status,200,'neutral status route must exist')
   assert.deepEqual(status.json.data,{state:'available',reading_code_required:true,expires_at:made.json.data.expires_at})
   assert.doesNotMatch(JSON.stringify(status.json),/private-canary|code_verifier|secret code|token_digest/)
  }
  assert.deepEqual(await f.redis.hGetAll(key),before);assert.equal(await f.redis.pExpireTime(key),expiry)
  await f.redis.del(key)
  assert.equal((await f.request('/api/v1/secrets/'+token+'/status')).json.data.state,'early_unavailable')
  // A retained past lifecycle is classified without consulting any payload.
  const expired=randomBytes(32).toString('base64url')
  await f.db.query("WITH stamp AS MATERIALIZED (SELECT date_trunc('milliseconds',clock_timestamp()) AS now) INSERT INTO link_lifecycles SELECT $1,$2,now-interval '2 minute',now-interval '1 minute' FROM stamp",[randomUUID(),digest(expired)])
  assert.equal((await f.request('/api/v1/secrets/'+expired+'/status')).json.data.state,'expired')
  for(const unknown of ['bad',randomBytes(32).toString('base64url')])assert.equal((await f.request('/api/v1/secrets/'+unknown+'/status')).json.data.state,'unknown')
  await f.redis.hSet(key,{...before,credential:'corrupt'})
  const corrupt=await f.request('/api/v1/secrets/'+token+'/status');assert.equal(corrupt.status,503)
 }finally{await f.close()}
})
