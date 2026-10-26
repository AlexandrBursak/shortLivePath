import {test} from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import {ProcessOwnershipService} from '../../build/app/services/process_ownership_service.js'
for(const pending of [false,true])test(`AC-10 AC-11: concurrent acquisition and ${pending?'pending':'completed'} release never leak a reentrant session lock`,async()=>{
 const a=new pg.Client(),b=new pg.Client();await Promise.all([a.connect(),b.connect()])
 let release,entered
 const blocked=new Promise(resolve=>{release=resolve}),waiting=new Promise(resolve=>{entered=resolve})
 let hold=pending
 const adapter={on:(event,listener)=>a.on(event,listener),async query(...args){if(hold && args[0].includes('pg_try_advisory_lock')){hold=false;entered();await blocked}return a.query(...args)}}
 const one=new ProcessOwnershipService(adapter,()=>{}),two=new ProcessOwnershipService(b,()=>{})
 try{
  if(pending){
   const acquisition=one.acquire(),rejected=assert.rejects(acquisition,{code:'service_unavailable'})
   await waiting
   const retiring=one.release()
   release();await retiring;await rejected
  }else{
   assert.deepEqual(await Promise.all([one.acquire(),one.acquire()]),[true,true])
   await one.release()
  }
  assert.equal(await two.acquire(),true,'completed release must leave no residual PostgreSQL advisory lock count')
 }finally{release();await Promise.allSettled([one.release(),two.release(),a.end(),b.end()])}
})
