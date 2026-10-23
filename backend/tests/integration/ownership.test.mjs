import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import pg from 'pg'
test('AC-10 AC-11: dedicated PostgreSQL advisory ownership excludes another owner and closes synchronously on connection loss',async()=>{
 assert.ok(existsSync('build/app/services/process_ownership_service.js'),'real PostgreSQL ownership must be implemented')
 const {ProcessOwnershipService}=await import('../../build/app/services/process_ownership_service.js')
 const a=new pg.Client(),b=new pg.Client(),admin=new pg.Client()
 await Promise.all([a.connect(),b.connect(),admin.connect()])
 let lost=0
 const one=new ProcessOwnershipService(a,()=>lost++),two=new ProcessOwnershipService(b,()=>{})
 try {
  assert.equal(await one.acquire(),true)
  assert.equal(await two.acquire(),false)
  assert.equal(one.current,true)
  const pid=(await a.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
  await admin.query('SELECT pg_terminate_backend($1)',[pid])
  await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(new Error('ownership loss not observed')),2000);const timer=setInterval(()=>{if(!one.current){clearTimeout(deadline);clearInterval(timer);resolve()}},10)})
  assert.equal(lost,1)
  await assert.rejects(one.time(),{code:'service_unavailable'})
  assert.equal(await two.acquire(),true)
  const now=await two.time();assert.ok(Math.abs(now-Date.now())<1000)
  await two.release();assert.equal(two.current,false)
 }finally{await Promise.allSettled([one.release(),two.release(),a.end(),b.end(),admin.end()])}
})
