import {test} from 'node:test'
import assert from 'node:assert/strict'
import {AggregateMetrics} from '../../build/app/services/aggregate_metrics_service.js'
import {storeSampleLua} from '../../build/app/services/store_metrics_service.js'
import {MetricsSampler} from '../../build/app/services/metrics_sampler_service.js'
import {aggregateMetrics} from '../../build/app/services/aggregate_metrics_service.js'
test('NFR-04: runtime allowlist rejects arbitrary labels and nonnumeric samples',()=>{
 const m=new AggregateMetrics()
 assert.throws(()=>m.observe('https://credential.invalid/token','success',1))
 assert.throws(()=>m.observe('create','secret-error',1))
 assert.throws(()=>m.set('address',1))
 assert.throws(()=>m.set('ready',NaN))
 m.observe('create','success',0.2);m.observe('create','capacity',0.01)
 const text=m.render()
 assert.match(text,/slp_operations_total\{operation="create",outcome="capacity"\} 1/)
 assert.match(text,/slp_success_seconds_count\{operation="create"\} 1/)
 assert.doesNotMatch(text,/secret-error|credential.invalid/)
})
test('NFR-04: finite histogram storage and failed latency excluded',()=>{
 const m=new AggregateMetrics()
 for(let i=0;i<10000;i++)m.observe('disclose','quota',0.001)
 assert.ok(m.render().length<3000)
 assert.doesNotMatch(m.render(),/slp_success_seconds_count\{operation="disclose"\}/)
})
test('AC-11: sampler distinguishes observed presence/debt, stale failure, and outage history',async()=>{
 const redis={eval:async()=>[12,30,10,2,70000],info:async()=> 'used_memory:100\r\nmaxmemory:268435456\r\nmaxmemory_policy:noeviction\r\n'}
 const ready={ready:true,generation:'current',fresh:async()=>200000,metrics:{healthySince:100000}}
 const sampler=new MetricsSampler(redis,'synthetic',async()=>({rows:[{rows:123,bytes:4096}]}))
 await sampler.sample(ready)
 assert.match(aggregateMetrics.render(),/slp_registry_debt 10/)
 assert.match(aggregateMetrics.render(),/slp_expired_present_sample 2/)
 assert.match(aggregateMetrics.render(),/slp_healthy_expired_breach 1/)
 ready.metrics.healthySince=150000
 await sampler.sample(ready)
 assert.match(aggregateMetrics.render(),/slp_healthy_expired_breach 0/)
 ready.ready=false
 await sampler.sample(ready)
 assert.match(aggregateMetrics.render(),/slp_sample_ok 0/)
})
test('AC-11: sample is bounded and counts physical presence separately from index debt',()=>{
 assert.match(storeSampleLua,/LIMIT',0,128/)
 assert.match(storeSampleLua,/EXISTS/)
 assert.match(storeSampleLua,/ZCOUNT/)
 assert.doesNotMatch(storeSampleLua,/HGETALL|GET'|SCAN|DEL'/)
})
