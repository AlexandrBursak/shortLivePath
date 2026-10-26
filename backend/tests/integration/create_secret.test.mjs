import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
test('AC-01 AC-02 AC-04 AC-05 AC-06: actual creation confirms only committed fixed-lifetime exact payload and safe wire outcomes',{timeout:30000},async()=>{
 const f=await secretRuntime()
 try{
  const text={address:' https://synthetic.invalid/\r\n',login:' user\rname ',credential:' synthetic-http-canary\r\n key\n '}
  const result=await f.request('/api/v1/secrets',{method:'POST',body:{...text,lifetime_minutes:17,reading_code:' code  '}})
  assert.equal(result.status,201,'creation route must confirm a real publication')
  assert.deepEqual(Object.keys(result.json).sort(),['data','meta'])
  const url=new URL(result.json.data.share_url);assert.equal(url.origin,'https://synthetic.example');assert.match(url.pathname,/^\/s\/[A-Za-z0-9_-]{43}$/)
  const token=url.pathname.split('/').at(-1),digest=createHash('sha256').update(Buffer.from(token,'base64url')).digest()
  const record=(await f.db.query('SELECT * FROM link_lifecycles WHERE token_digest=$1',[digest])).rows[0]
  assert.ok(record);assert.equal(record.expires_at-record.created_at,17*60000)
  assert.equal(record.expires_at.toISOString(),result.json.data.expires_at)
  assert.ok(Date.parse(result.json.meta.service_time)>=record.created_at.getTime())
  const stored=await f.redis.hGetAll(f.prefix+'secret:'+record.id+':payload')
  for(const [name,value] of Object.entries(text))assert.equal(stored[name],value)
  assert.equal(stored.expires_at_ms,String(record.expires_at.getTime()));assert.match(stored.code_verifier,/^\$argon2id\$v=19\$m=65536,(?:t=3,p=4|p=4,t=3)\$/)
  assert.doesNotMatch(JSON.stringify(result.json),/canary|code_verifier| code /)
  for(const body of [{credential:'  '},{credential:'x',lifetime_minutes:1.5},{credential:'x',reading_code:'short'},{credential:'x'.repeat(65537)},{credential:'x',unknown:true},'{']){
   const invalid=await f.request('/api/v1/secrets',{method:'POST',body});assert.equal(invalid.status,422);assert.equal(invalid.json.error.code,'short_live_path.invalid_request')
  }
  const unsupported=await f.request('/api/v1/secrets',{method:'POST',body:'{}',headers:{'content-type':'text/plain'}})
  assert.equal(unsupported.status,415)
  const oversized=await f.request('/api/v1/secrets',{method:'POST',body:'x'.repeat(524289)});assert.equal(oversized.status,413)
  assert.doesNotMatch(f.output(),/synthetic-http-canary| code  |\/s\//)
  // Sequential observed-counter threshold: exact simultaneous reservations are deferred.
  for(let i=1;i<25;i++)assert.equal((await f.request('/api/v1/secrets',{method:'POST',body:{credential:'synthetic'}})).status,201)
  const refused=await f.request('/api/v1/secrets',{method:'POST',body:{credential:'synthetic'}})
  assert.equal(refused.status,429);assert.equal(refused.json.error.code,'short_live_path.creation_limited')
  assert.equal(await f.redis.zCard(f.prefix+'payload:expiry'),25)
 }finally{await f.close()}
})
