import {test} from 'node:test'
import assert from 'node:assert/strict'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
test('AC-03 AC-06 AC-07 AC-08 AC-10: explicit repeat disclosure preserves exact text and observed failure history',{timeout:30000},async()=>{
 const f=await secretRuntime()
 try{
  const text={address:'\r https://synthetic.invalid/\n',login:'𝄞 user\r\n',credential:' disclosure-private-canary\r\n\tkey\n '},code=' コード é '
  const made=await f.request('/api/v1/secrets',{method:'POST',body:{...text,reading_code:code}})
  assert.equal(made.status,201)
  const token=new URL(made.json.data.share_url).pathname.split('/').at(-1),path='/api/v1/secrets/'+token+'/disclosures'
  const missing=await f.request(path,{method:'POST',body:{}})
  assert.equal(missing.status,403,'explicit disclosure route must distinguish missing code')
  assert.equal(missing.json.error.code,'short_live_path.code_required')
  const invalid=await f.request(path,{method:'POST',body:{reading_code:'x'.repeat(1025)}});assert.equal(invalid.status,422)
  const wrong=await f.request(path,{method:'POST',body:{reading_code:''}});assert.equal(wrong.status,403);assert.equal(wrong.json.error.code,'short_live_path.code_incorrect')
  const history=await f.redis.keys(f.prefix+'verification:*');assert.equal(history.length,1)
  const before=await f.redis.get(history[0])
  for(let i=0;i<2;i++){
   const shown=await f.request(path,{method:'POST',body:{reading_code:code}})
   assert.equal(shown.status,200);assert.deepEqual(shown.json.data.secret,text);assert.equal(shown.json.data.expires_at,made.json.data.expires_at)
  }
  assert.deepEqual(JSON.parse(await f.redis.get(history[0])).events,JSON.parse(before).events,'successful reads never clear or extend failure timestamps')
  for(let i=1;i<5;i++)assert.equal((await f.request(path,{method:'POST',body:{reading_code:'no'}})).json.error.code,'short_live_path.code_incorrect')
  const blocked=await f.request(path,{method:'POST',body:{reading_code:code}});assert.equal(blocked.status,429)
  assert.equal((await f.request(path,{method:'POST',body:{reading_code:code},headers:{'x-forwarded-for':'192.0.2.2'}})).status,200)
  const unprotected=await f.request('/api/v1/secrets',{method:'POST',body:{credential:'unprotected'}})
  const plainPath='/api/v1/secrets/'+new URL(unprotected.json.data.share_url).pathname.split('/').at(-1)+'/disclosures'
  const reads=await Promise.all([f.request(plainPath,{method:'POST',body:{}}),f.request(plainPath,{method:'POST',body:{}})])
  for(const shown of reads){assert.equal(shown.status,200);assert.equal(shown.json.data.secret.credential,'unprotected')}
  assert.doesNotMatch(f.output(),/disclosure-private-canary|コード|\/s\//)
 }finally{await f.close()}
})
