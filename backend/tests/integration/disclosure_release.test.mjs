import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {existsSync,writeFileSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
async function until(check){const start=performance.now();while(!check()){assert.ok(performance.now()-start<3000,'controlled native completion must reach checkpoint');await delay(5)}}
function preload(dir){return `
 import {ReadingCodeService} from ${JSON.stringify(pathToFileURL(process.cwd()+'/build/app/services/reading_code_service.js').href)};
 import {existsSync,writeFileSync} from 'node:fs';import {ServerResponse} from 'node:http';
 const started=${JSON.stringify(join(dir,'started'))},release=${JSON.stringify(join(dir,'release'))},sent=${JSON.stringify(join(dir,'sent'))};
 const original=ReadingCodeService.prototype.verify;
 ReadingCodeService.prototype.verify=async function(...args){const result=await original.apply(this,args);writeFileSync(started,'1');while(!existsSync(release))await new Promise(r=>setTimeout(r,5));return result};
 const end=ServerResponse.prototype.end;ServerResponse.prototype.end=function(...args){if(String(args[0]).includes('release-private-canary'))writeFileSync(sent,'1');return end.apply(this,args)};
 `}
for(const mode of ['expiry','disconnect'])test(`AC-07 AC-10: actual HTTP ${mode} during held real native verification never releases content`,{timeout:15000},async()=>{
 const f=await secretRuntime({preload})
 try{
  const made=await f.request('/api/v1/secrets',{method:'POST',body:{credential:'release-private-canary',reading_code:'correct code',lifetime_minutes:1}})
  assert.equal(made.status,201)
  const token=new URL(made.json.data.share_url).pathname.split('/').at(-1)
  if(mode==='expiry'){
   const digest=createHash('sha256').update(Buffer.from(token,'base64url')).digest(),deadline=Date.now()+1000
   // Explicit synthetic recovered-state fixture; not mutation/recovery of real user metadata.
   const record=(await f.db.query("UPDATE link_lifecycles SET created_at=to_timestamp($2::double precision/1000)-interval '1 minute',expires_at=to_timestamp($2::double precision/1000) WHERE token_digest=$1 RETURNING id",[digest,deadline])).rows[0]
   const key=f.prefix+'secret:'+record.id+':payload',fields=await f.redis.hGetAll(key)
   fields.created_at_ms=String(deadline-60000);fields.expires_at_ms=String(deadline)
   fields.integrity_digest=createHash('sha256').update(JSON.stringify(['schema_version','lifecycle_id','address','login','credential','created_at_ms','expires_at_ms','code_verifier'].map(k=>fields[k]??null))).digest('hex')
   await f.redis.multi().hSet(key,fields).pExpireAt(key,deadline).zAdd(f.prefix+'payload:expiry',{score:deadline,value:record.id}).exec()
  }
  const controller=new AbortController()
  const pending=fetch('http://127.0.0.1:3340/api/v1/secrets/'+token+'/disclosures',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify({reading_code:'correct code'}),signal:controller.signal}).then(async r=>({status:r.status,json:await r.json()})).catch(e=>({aborted:e.name}))
  await until(()=>existsSync(join(f.dir,'started')))
  if(mode==='expiry')await delay(1100)
  else{controller.abort();await delay(50)}
  writeFileSync(join(f.dir,'release'),'1')
  const result=await pending
  if(mode==='expiry'){assert.equal(result.status,410);assert.equal(result.json.error.code,'short_live_path.link_expired')}
  else assert.equal(result.aborted,'AbortError')
  await delay(100)
  assert.equal(existsSync(join(f.dir,'sent')),false,'actual ServerResponse.end must receive no canary')
  assert.doesNotMatch(f.output(),/release-private-canary|correct code/)
 }finally{writeFileSync(join(f.dir,'release'),'1');await f.close();for(const name of ['started','release','sent'])rmSync(join(f.dir,name),{force:true})}
})
