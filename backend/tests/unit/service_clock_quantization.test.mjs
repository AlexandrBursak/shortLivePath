import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ServiceClock} from '../../build/app/services/service_clock.js'
for(const cadence of [0.5,500.25,99.4]){
 test(`AC-10 AC-11: stable zero-RTT clock has bounded quantization at ${cadence}ms cadence`,async()=>{
  let mono=0
  const epoch=1000000,local={mono:()=>mono,wall:()=>epoch+Math.floor(mono)}
  const clock=new ServiceClock(local)
  await clock.sample(async()=>local.wall(),true)
  for(let i=0;i<2000;i++){
   mono+=cadence;await clock.sample(async()=>local.wall())
   const upper=clock.upperNow(),source=local.wall()
   assert.ok(upper>=source,'must remain conservative')
   assert.ok(upper-source<=2,'matched zero-RTT clocks must not accumulate sample-count rounding drift')
  }
 })
}
