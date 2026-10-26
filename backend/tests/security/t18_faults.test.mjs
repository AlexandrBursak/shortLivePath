import {test} from 'node:test'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {join} from 'node:path'
import {writeFileSync,rmSync} from 'node:fs'
import {randomBytes,randomUUID} from 'node:crypto'
import {secretRuntime} from '../helpers/secret_runtime.mjs'
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
for(const kind of ['postgres','redis'])test(`AC-11: T18 actual committed ${kind} operation with withheld acknowledgement confirms no link or retry`,{timeout:15000},async()=>{
 const file=kind==='postgres'?'create_secret_service':'ephemeral_secret_service'
 const f=await secretRuntime({preload:()=>kind==='postgres'?`import {CreateSecretService} from ${JSON.stringify(pathToFileURL(process.cwd()+'/build/app/services/'+file+'.js').href)};
 const original=CreateSecretService.prototype.create;CreateSecretService.prototype.create=function(...args){
 const write=this.lifecycles.create.bind(this.lifecycles);this.lifecycles={create:async(...values)=>{await write(...values);throw new Error('synthetic acknowledgement withheld')}};
 return original.apply(this,args)}`:`import {EphemeralSecretService} from ${JSON.stringify(pathToFileURL(process.cwd()+'/build/app/services/'+file+'.js').href)};
 const original=EphemeralSecretService.prototype.publish;EphemeralSecretService.prototype.publish=async function(...args){await original.apply(this,args);throw new Error('synthetic acknowledgement withheld')}`})
 try{
  const before=new Set((await f.db.query('SELECT id FROM link_lifecycles')).rows.map(r=>r.id))
  const canary=randomBytes(32).toString('hex')
  const response=await f.request('/api/v1/secrets',{method:'POST',body:{credential:canary,lifetime_minutes:1}})
  assert.equal(response.status,503);assert.equal('data' in response.json,false)
  const added=(await f.db.query('SELECT * FROM link_lifecycles')).rows.filter(r=>!before.has(r.id))
  assert.equal(added.length,1,'confirmed server commit must remain metadata, with no retry/rollback deletion')
  const row=added[0],deadline=row.expires_at.getTime()
  assert.equal(deadline-row.created_at.getTime(),60000)
  const payload=f.prefix+'secret:'+row.id+':payload'
  assert.equal(await f.redis.exists(payload),kind==='redis'?1:0)
  if(kind==='redis')assert.equal(await f.redis.pExpireTime(payload),deadline,'uncertain published orphan retains exact original deadline')
  assert.equal(f.output().includes(canary),false,'no canary in runtime output')
 }finally{await f.close()}
})
test('AC-10 AC-11: T18 real scheduled healthy cleanup removes 1000 full-size partial payloads/verifiers within 60 seconds',{timeout:65000},async()=>{
 const f=await secretRuntime()
 try{
  const ids=Array.from({length:1000},()=>randomUUID()),due=Date.now()+1500,tx=f.redis.multi()
  for(const id of ids){tx.hSet(f.prefix+'secret:'+id+':payload',{credential:'x'.repeat(65536),code_verifier:'synthetic-canary-verifier'});tx.zAdd(f.prefix+'payload:expiry',{score:due,value:id})}
  tx.hSet(f.prefix+'safety:continuity','payloads','1000');await tx.exec()
  assert.equal(await f.redis.exists(ids.map(id=>f.prefix+'secret:'+id+':payload')),1000)
  assert.equal(await f.redis.pTTL(f.prefix+'secret:'+ids[0]+':payload'),-1,'no native TTL can fake active cleanup proof')
  while(await f.redis.zCard(f.prefix+'payload:expiry')){assert.ok(Date.now()-due<60000,'healthy deletion bound');await delay(50)}
  assert.equal(await f.redis.exists(ids.map(id=>f.prefix+'secret:'+id+':payload')),0)
  assert.equal(await f.redis.hGet(f.prefix+'safety:continuity','payloads'),'0')
  console.log(JSON.stringify({healthyPayloads:1000,bytesEach:65536,verifiersDeleted:1000,deletionAfterDeadlineMs:Math.max(0,Date.now()-due),nativeTtl:false}))
 }finally{await f.close()}
})
test('AC-10: T18 isolated PostgreSQL-time rollback during actual HTTP traffic denies disclosure until safe recovery',{timeout:15000},async()=>{
 const f=await secretRuntime({preload:dir=>`import {ServiceClock} from ${JSON.stringify(pathToFileURL(process.cwd()+'/build/app/services/service_clock.js').href)};import {existsSync} from 'node:fs';
 const original=ServiceClock.prototype.sample;ServiceClock.prototype.sample=function(time,...rest){return original.call(this,async()=>{const real=await time();return existsSync(${JSON.stringify(join(dir,'rollback'))})?real-5000:real},...rest)}`})
 try{
  const made=await f.request('/api/v1/secrets',{method:'POST',body:{credential:randomBytes(32).toString('hex')}})
  assert.equal(made.status,201)
  const token=new URL(made.json.data.share_url).pathname.split('/').at(-1),path='/api/v1/secrets/'+token+'/disclosures'
  writeFileSync(join(f.dir,'rollback'),'1')
  for(let i=0;i<3;i++){
   const denied=await f.request(path,{method:'POST',body:{}})
   assert.equal(denied.status,503);assert.equal('data' in denied.json,false)
  }
  rmSync(join(f.dir,'rollback'))
  const start=performance.now()
  while(true){const response=await f.request(path,{method:'POST',body:{}});if(response.status===200)break;assert.equal(response.status,503);assert.ok(performance.now()-start<5000);await delay(50)}
 }finally{rmSync(join(f.dir,'rollback'),{force:true});await f.close()}
})
