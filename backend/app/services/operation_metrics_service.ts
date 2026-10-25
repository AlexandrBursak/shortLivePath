import {performance} from 'node:perf_hooks'
import {aggregateMetrics} from './aggregate_metrics_service.js'
import {HttpFault} from './secret_http_service.js'
import {OperationFault} from './operation_fault.js'
export function operationTimer(operation:'create'|'disclose'){
 const start=performance.now()
 return (error?:unknown)=>{
  const code=error instanceof HttpFault || error instanceof OperationFault?error.code:undefined
  const outcome=error===undefined?'success':code==='capacity_unavailable'?'capacity':code==='creation_limited'||code==='verification_limited'?'quota':!code||code==='service_unavailable'?'unavailable':'rejected'
  aggregateMetrics.observe(operation,outcome,(performance.now()-start)/1000)
 }
}
