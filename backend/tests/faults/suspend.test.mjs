import {test} from 'node:test'
import {clockFields} from '../helpers/safety_marker.mjs'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawn} from 'node:child_process'
import {once} from 'node:events'
import {createClient} from 'redis'
test('AC-10 AC-11: actual 90-second owned API suspension retains kernel exclusion and cleans before serving',{timeout:110000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const ns='suspend_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,13),now=Date.now(),id=randomUUID()
 const dir=mkdtempSync(join(tmpdir(),'slp-suspend-')),path=join(dir,'synthetic-key');writeFileSync(path,key,{mode:0o600})
 const env={...process.env,PORT:'3339',SLP_NAMESPACE:ns,SLP_ADDRESS_KEY_FILE:path,SLP_LOCK_DIRECTORY:dir}
 let child
 try{
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'0',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  child=spawn('sh',['docker/process-fence.sh',process.execPath,'build/bin/server.js'],{env,stdio:'ignore'})
  const startup=performance.now()
  while(true){
   try{if((await fetch('http://127.0.0.1:3339/health/ready')).status===200)break}catch{}
   assert.ok(performance.now()-startup<5000,'test runtime must become ready')
   await new Promise(resolve=>setTimeout(resolve,25))
  }
  child.kill('SIGSTOP')
  // Test-owned recovered partial without native TTL: only active cleanup removes it.
  const ids=Array.from({length:1000},(_,i)=>i===0?id:randomUUID()),tx=r.multi()
  for(const [i,handle] of ids.entries()){
   tx.hSet(p+'secret:'+handle+':payload',{credential:'synthetic partial',code_verifier:'synthetic verifier'})
   // Mixed-age/multi-batch debt; no recent-window lower bound may skip it.
   tx.zAdd(p+'payload:expiry',{score:i%2?Date.now()+1000:Date.now()-31*86400000,value:handle})
  }
  await tx.exec();await r.hSet(p+'safety:continuity','payloads','1000')
  const other=spawn('sh',['docker/process-fence.sh',process.execPath,'-e','process.exit(0)'],{env,stdio:'ignore'})
  assert.equal((await once(other,'exit'))[0],75,'suspended old process must exclude replacements')
  await new Promise(resolve=>setTimeout(resolve,90000))
  assert.equal(await r.exists(ids.map(handle=>p+'secret:'+handle+':payload')),1000,'fixture must really remain while cleanup process is suspended')
  const resumed=performance.now();child.kill('SIGCONT')
  while(true){
   const status=(await fetch('http://127.0.0.1:3339/health/ready')).status
   if(status===200){
    assert.equal(await r.exists(ids.map(handle=>p+'secret:'+handle+':payload')),0,'all mixed-age payload/verifier cleanup must precede readiness')
    assert.equal(await r.zCard(p+'payload:expiry'),0,'all original-deadline debt cleared')
    break
   }
   assert.ok(performance.now()-resumed<5000,'recovery must complete bounded cleanup')
   await new Promise(resolve=>setTimeout(resolve,25))
  }
  console.log(JSON.stringify({suspensionMs:90000,recoveryMs:Math.ceil(performance.now()-resumed)}))
 }finally{
  if(child && child.exitCode===null && child.signalCode===null){child.kill('SIGCONT');child.kill('SIGKILL');await once(child,'exit')}
  const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close();rmSync(dir,{recursive:true,force:true})
 }
})
