import {test} from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
function wire(body,headers={}){
 return new Promise((resolve,reject)=>{
  const req=http.request('http://127.0.0.1:3340/api/v1/secrets',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1',...headers}},res=>{
   const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,json:JSON.parse(Buffer.concat(chunks).toString())}))
  });req.on('error',reject)
  for(let i=0;i<body.length;i+=8192)req.write(body.subarray(i,i+8192));req.end()
 })
}
test('AC-02 AC-03 AC-06: actual fatal UTF-8, scalar JSON, exact wire budget and chunked overflow are safely bounded',{timeout:20000},async()=>{
 const f=await secretRuntime()
 try{
  const invalidBytes=Buffer.concat([Buffer.from('{"credential":"'),Buffer.from([0xc3,0x28]),Buffer.from('"}')])
  for(const bytes of [invalidBytes,Buffer.from('{"credential":"\\ud800"}')]){
   const bad=await wire(bytes);assert.equal(bad.status,422);assert.equal(bad.json.error.code,'short_live_path.invalid_request')
  }
  assert.equal(await f.redis.zCard(f.prefix+'payload:expiry'),0);assert.equal(await f.redis.zCard(f.prefix+'limiter:expiry'),0)
  const base=Buffer.from('{"credential":"x"}'),exact=Buffer.concat([base,Buffer.alloc(524288-base.length,32)])
  assert.equal((await wire(exact)).status,201)
  const tooLarge=await wire(Buffer.concat([exact,Buffer.from(' ')]))
  assert.equal(tooLarge.status,413,'chunked overflow must send a safe 413, not destroy the response socket')
  assert.equal(tooLarge.json.error.code,'short_live_path.request_too_large');assert.equal(tooLarge.headers['cache-control'],'no-store')
  assert.equal((await wire(Buffer.from('{}'),{'content-encoding':'gzip'})).status,415)
 }finally{await f.close()}
})
