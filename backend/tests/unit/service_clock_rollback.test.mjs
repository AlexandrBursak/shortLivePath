import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ServiceClock} from '../../build/app/services/service_clock.js'
test('AC-10: small same-host PostgreSQL/wall rollback closes time until recovery without retreating the prior trajectory',async()=>{
 let mono=0,wall=100000
 const clock=new ServiceClock({mono:()=>mono,wall:()=>wall})
 await clock.sample(async()=>wall,true)
 mono=500;wall=100500
 const before=clock.upperNow();assert.equal(before,100500)
 wall=100300
 await assert.rejects(clock.sample(async()=>wall),{code:'service_unavailable'})
 assert.throws(()=>clock.upperNow(),{code:'service_unavailable'})
 await clock.sample(async()=>wall,true)
 assert.ok(clock.upperNow()>=before,'recovery upper time must never retreat')
 mono=600;wall=100400
 assert.ok(clock.upperNow()>=100600,'previous conservative trajectory must continue advancing')
})
