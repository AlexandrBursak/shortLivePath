const operations=['create','disclose'] as const
const outcomes=['success','capacity','quota','rejected','unavailable'] as const
const gauges=['ready','hash_active','cleanup_age_seconds','cleanup_exhaustions','recovery_failures','recovery_seconds','sample_age_seconds','sample_ok','payload_registry','limiter_registry','registry_debt','expired_present_sample','expired_oldest_seconds','healthy_expired_breach','redis_used_bytes','redis_max_bytes','redis_noeviction','metadata_rows_estimate','metadata_bytes'] as const
type Operation=typeof operations[number]
type Outcome=typeof outcomes[number]
type Gauge=typeof gauges[number]
const bounds=[0.05,0.1,0.25,0.5,1,2,5,10,Infinity]
export class AggregateMetrics {
 #counts=new Map<string,number>()
 #hist=new Map<Operation,{buckets:number[];sum:number;count:number}>()
 #gauges=new Map<Gauge,number>()
 observe(operation:Operation,outcome:Outcome,seconds:number){
  if(!operations.includes(operation) || !outcomes.includes(outcome) || !Number.isFinite(seconds) || seconds<0)throw new Error('Invalid aggregate')
  const key=`operation="${operation}",outcome="${outcome}"`
  this.#counts.set(key,(this.#counts.get(key)??0)+1)
  if(outcome!=='success')return
  const h=this.#hist.get(operation)??{buckets:bounds.map(()=>0),sum:0,count:0}
  h.sum+=seconds;h.count++;bounds.forEach((b,i)=>{if(seconds<=b)h.buckets[i]++});this.#hist.set(operation,h)
 }
 set(name:Gauge,value:number){
  if(!gauges.includes(name) || !Number.isFinite(value) || value<0)throw new Error('Invalid aggregate')
  this.#gauges.set(name,value)
 }
 render(){
  const lines=['# TYPE slp_operations_total counter','# TYPE slp_success_seconds histogram']
  for(const [key,value] of this.#counts)lines.push(`slp_operations_total{${key}} ${value}`)
  for(const [op,h] of this.#hist){
   bounds.forEach((b,i)=>lines.push(`slp_success_seconds_bucket{operation="${op}",le="${b===Infinity?'+Inf':b}"} ${h.buckets[i]}`))
   lines.push(`slp_success_seconds_sum{operation="${op}"} ${h.sum}`,`slp_success_seconds_count{operation="${op}"} ${h.count}`)
  }
  for(const [key,value] of this.#gauges)lines.push(`# TYPE slp_${key} gauge`,`slp_${key} ${value}`)
  return lines.join('\n')+'\n'
 }
}
export const aggregateMetrics=new AggregateMetrics()
