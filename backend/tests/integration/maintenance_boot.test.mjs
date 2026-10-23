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
import pg from 'pg'
test('AC-10 AC-11: actual Adonis startup wires owned cleanup before opening configured readiness',{timeout:10000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const ns='boot_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,11),now=Date.now(),id=randomUUID()
 const dir=mkdtempSync(join(tmpdir(),'slp-start-')),path=join(dir,'synthetic-key');writeFileSync(path,key,{mode:0o600})
 let child
 try{
  await r.hSet(p+'secret:'+id+':payload',{credential:'synthetic partial'})
  await r.zAdd(p+'payload:expiry',{score:now-1,value:id})
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'1',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  child=spawn('sh',['docker/process-fence.sh',process.execPath,'build/bin/server.js'],{env:{...process.env,PORT:'3338',SLP_NAMESPACE:ns,SLP_ADDRESS_KEY_FILE:path,SLP_LOCK_DIRECTORY:dir},stdio:'ignore'})
  let status=0
  const started=performance.now()
  while(performance.now()-started<5000){
   try{status=(await fetch('http://127.0.0.1:3338/health/ready')).status;if(status===200)break}catch{}
   await new Promise(resolve=>setTimeout(resolve,50))
  }
  assert.equal(status,200,'configured actual runtime must finish current-owner startup')
  assert.equal(await r.exists(p+'secret:'+id+':payload'),0,'expired partial removed before opening readiness')
  const admin=new pg.Client();await admin.connect()
  try{
   const pid=(await admin.query("SELECT pid FROM pg_locks WHERE locktype='advisory' AND classid=1936486447 AND objid=1")).rows[0].pid
   await admin.query('SELECT pg_terminate_backend($1)',[pid])
   let closed=false,reopened=false
   const recovery=performance.now()
   while(performance.now()-recovery<5000){
    const s=(await fetch('http://127.0.0.1:3338/health/ready')).status
    if(s===503)closed=true
    if(closed && s===200){reopened=true;break}
    await new Promise(resolve=>setTimeout(resolve,25))
   }
   assert.equal(closed,true,'connection loss must close actual readiness')
   assert.equal(reopened,true,'current-run supervisor must establish a new owned PostgreSQL connection')
  }finally{await admin.end()}
 }finally{
  if(child && child.exitCode===null && child.signalCode===null){child.kill('SIGKILL');await once(child,'exit')}
  const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close();rmSync(dir,{recursive:true,force:true})
 }
})
