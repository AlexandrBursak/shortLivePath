import {clockFields} from './safety_marker.mjs'
import {randomUUID,createHash} from 'node:crypto'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawn,execFileSync} from 'node:child_process'
import {once} from 'node:events'
import assert from 'node:assert/strict'
import pg from 'pg'
import {createClient} from 'redis'
export async function secretRuntime({preload}={}){
 const db=new pg.Client();await db.connect()
 const redis=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});redis.on('error',()=>{});await redis.connect()
 const ns='http_'+randomUUID().replaceAll('-',''),prefix='slp:'+ns+':',key=Buffer.alloc(32,19),dir=mkdtempSync(join(tmpdir(),'slp-http-')),keyFile=join(dir,'key')
 writeFileSync(keyFile,key,{mode:0o600})
 let child,output=''
 async function close(){
  if(child && child.exitCode===null){const exit=once(child,'exit');child.kill('SIGTERM');await Promise.race([exit,new Promise(resolve=>setTimeout(resolve,2000)).then(()=>child.kill('SIGKILL'))])}
  const keys=await redis.keys(prefix+'*');if(keys.length)await redis.del(keys)
  await Promise.allSettled([redis.close(),db.end()]);rmSync(dir,{recursive:true,force:true})
 }
 try{
  execFileSync(process.execPath,['ace.js','migration:run','--force'],{stdio:'pipe'})
  const now=Date.now()
  await redis.hSet(prefix+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'0',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  const preloadFile=join(dir,'preload.mjs')
  if(preload)writeFileSync(preloadFile,preload(dir),{mode:0o600})
  child=spawn('sh',['docker/process-fence.sh',process.execPath,...(preload?['--import',preloadFile]:[]),'build/bin/server.js'],{env:{...process.env,HOST:'127.0.0.1',PORT:'3340',SLP_NAMESPACE:ns,SLP_ADDRESS_KEY_FILE:keyFile,SLP_LOCK_DIRECTORY:dir,SLP_PUBLIC_ORIGIN:'https://synthetic.example',SLP_TRUSTED_PROXY:'127.0.0.1'},stdio:['ignore','pipe','pipe']})
  child.stdout.on('data',b=>{output+=b});child.stderr.on('data',b=>{output+=b})
  const start=performance.now()
  while(true){try{if((await fetch('http://127.0.0.1:3340/health/ready')).status===200)break}catch{}
   assert.ok(performance.now()-start<8000,'owned HTTP fixture must become ready');await new Promise(resolve=>setTimeout(resolve,25))
  }
  const request=async(path,{method='GET',body,headers={}}={})=>{
   const response=await fetch('http://127.0.0.1:3340'+path,{method,headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1',...headers},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})})
   assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer')
   return {status:response.status,json:await response.json()}
  }
  return {db,redis,ns,prefix,key,dir,request,close,output:()=>output}
 }catch(error){await close();throw error}
}
