import {test} from 'node:test'
import {clockFields} from '../helpers/safety_marker.mjs'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
import {createClient} from 'redis'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
import {ReadinessService} from '../../build/app/services/readiness_service.js'
import {GenerationGuard} from '../../build/app/services/generation_guard.js'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'
test('AC-10 AC-11: delayed old BEGIN cannot overwrite a newer real PostgreSQL owner',{timeout:10000},async()=>{
 const r=createClient({url:process.env.REDIS_URL,disableOfflineQueue:true});r.on('error',()=>{});await r.connect()
 const a=new pg.Client(),b=new pg.Client(),admin=new pg.Client();await Promise.all([a.connect(),b.connect(),admin.connect()]).catch(async error=>{await r.close();throw error})
 const ns='begin_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',key=Buffer.alloc(32,12),now=Date.now()
 let one,two,release,entered
 const blocked=new Promise(resolve=>{release=resolve}),waiting=new Promise(resolve=>{entered=resolve})
 let hold=true
 const adapter={async eval(script,options){if(hold && script.includes('local continuous, floor')){hold=false;entered();await blocked}return r.eval(script,options)}}
 const oa=new ProcessOwnershipService(a,()=>one?.close()),ob=new ProcessOwnershipService(b,()=>two?.close())
 try{
  await r.hSet(p+'safety:continuity',{generation:randomUUID(),state:'closed',clean:'1',payloads:'0',limiters:'0',key_digest:createHash('sha256').update(key).digest('hex'),high_water:String(now-10),continuity:'1',...clockFields(now-10)})
  one=new ReadinessService(adapter,oa,ns,key);two=new ReadinessService(r,ob,ns,key)
  const old=one.recover();const rejected=assert.rejects(old,{code:'service_unavailable'})
  await waiting
  const pid=(await a.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
  await admin.query('SELECT pg_terminate_backend($1)',[pid])
  await new Promise(resolve=>setTimeout(resolve,25))
  await two.recover();assert.equal(two.ready,true)
  const generation=two.generation
  const store=new EphemeralSecretService(new GenerationGuard(r,ns,generation),ns)
  const record={id:randomUUID(),createdAtMs:now,expiresAtMs:now+60000}
  await store.publish(record,{address:'',login:'',credential:'synthetic survivor'},undefined,await two.fresh())
  release();await rejected
  assert.equal(await r.hGet(p+'safety:continuity','generation'),generation,'delayed BEGIN must not clobber replacement generation')
  assert.equal(await r.hGet(p+'safety:continuity','state'),'open')
  assert.equal((await store.read(record)).credential,'synthetic survivor','old recovery catch must not delete replacement payloads')
 }finally{release();one?.stop();two?.stop();await Promise.allSettled([oa.release(),ob.release(),a.end(),b.end(),admin.end()]);const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
