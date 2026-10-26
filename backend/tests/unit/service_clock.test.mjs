import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
test('AC-10 AC-11: conservative PostgreSQL timing rejects backward time, drift, stale samples and suspend gaps',async()=>{
 assert.ok(existsSync('build/app/services/service_clock.js'),'service clock must be implemented')
 const {ServiceClock}=await import('../../build/app/services/service_clock.js')
 let mono=0,wall=100000,db=200000
 const clock=new ServiceClock({mono:()=>mono,wall:()=>wall})
 const source=async()=>db
 await clock.sample(source,true)
 assert.equal(clock.upperNow(),db)
 mono+=5;wall+=5;db+=5
 assert.equal(clock.upperNow(),db)
 await clock.sample(source)
 wall-=1000;assert.throws(()=>clock.upperNow(),{code:'service_unavailable'})
 wall=100005;await clock.sample(source,true)
 db-=1;await assert.rejects(clock.sample(source),{code:'service_unavailable'})
 db=200005;await clock.sample(source,true)
 mono+=90000;wall+=90000;db+=90000
 assert.throws(()=>clock.upperNow(),{code:'service_unavailable'})
 await clock.sample(source,true);assert.equal(clock.upperNow(),db)
 mono+=1001;wall+=1001;db+=1001
 assert.throws(()=>clock.upperNow(),{code:'service_unavailable'})
 await clock.sample(source,true)
 await assert.rejects(clock.sample(async()=>{mono+=300;wall+=300;return db}),{code:'service_unavailable'})
 assert.ok(clock.deletionUpperBound()>=db)
})
