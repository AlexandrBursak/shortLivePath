import {performance} from 'node:perf_hooks'
import {aggregateMetrics as m} from './aggregate_metrics_service.js'
import {sampleRegistry} from './store_metrics_service.js'
import type {RedisEval} from './redis_support.js'
import type {ReadinessService} from './readiness_service.js'
interface SampleRedis extends RedisEval {info(section:string):Promise<string>}
export class MetricsSampler {
 #busy=false
 #last=0
 constructor(private redis:SampleRedis,private namespace:string,private metadata:()=>Promise<{rows:Record<string,unknown>[]}>){}
 get age(){return this.#last?(performance.now()-this.#last)/1000:1e9}
 async sample(ready:ReadinessService|undefined){
  if(this.#busy)return
  this.#busy=true;m.set('sample_ok',0)
  try{
   if(!ready?.ready)throw new Error()
   const generation=ready.generation,now=await ready.fresh()
   const values=await sampleRegistry(this.redis,this.namespace,now)
   const memory=await this.redis.info('memory')
   const result=await this.metadata()
   if(!ready.ready || generation!==ready.generation)throw new Error()
   const numeric=(name:string)=>{const v=Number(new RegExp('^'+name+':([0-9]+)','m').exec(memory)?.[1]);if(!Number.isFinite(v))throw new Error();return v}
   const [payloads,limiters,debt,present,oldest]=values
   m.set('payload_registry',payloads);m.set('limiter_registry',limiters);m.set('registry_debt',debt)
   m.set('expired_present_sample',present);m.set('expired_oldest_seconds',oldest/1000)
   // Only classify as healthy when the entire observed overdue interval was
   // within this continuous healthy run. Recovery debt is never healthy proof.
   m.set('healthy_expired_breach',oldest>60000 && ready.metrics.healthySince>0 && now-oldest>=ready.metrics.healthySince?1:0)
   m.set('redis_used_bytes',numeric('used_memory'));m.set('redis_max_bytes',numeric('maxmemory'))
   m.set('redis_noeviction',/^maxmemory_policy:noeviction\r?$/m.test(memory)?1:0)
   m.set('metadata_rows_estimate',Math.max(0,Number(result.rows[0]?.rows)))
   m.set('metadata_bytes',Number(result.rows[0]?.bytes))
   this.#last=performance.now();m.set('sample_ok',1)
  }catch{/* Only freshness/availability changes; never serialize a query/error. */}
  finally{this.#busy=false}
 }
}
