import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ServiceClock} from '../../build/app/services/service_clock.js'
test('AC-10: a new process clock restores an advancing same-host trajectory rather than only a UTC floor',async()=>{
 let mono=0,wall=100000
 const old=new ServiceClock({mono:()=>mono,wall:()=>wall})
 await old.sample(async()=>wall,true)
 mono=500;wall=100500
 await old.sample(async()=>wall)
 assert.equal(typeof old.checkpoint,'function','clock checkpoint must be implemented')
 const saved=old.checkpoint()
 // Five hundred ms downtime; wall/PG steps back100ms but remains above old floor.
 let nextMono=0,nextWall=100900
 const next=new ServiceClock({mono:()=>nextMono,wall:()=>nextWall})
 next.restore(saved,500)
 await next.sample(async()=>nextWall,true)
 assert.ok(next.upperNow()>=101000,'new clock must retain the old advancing upper trajectory')
 nextMono=50;nextWall+=50
 await next.sample(async()=>nextWall)
 assert.ok(next.upperNow()>=101050)
})
