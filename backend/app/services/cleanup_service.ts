import {OperationFault} from './operation_fault.js'
import {evaluate,namespacePrefix,type RedisEval} from './redis_support.js'
import {cleanupLua} from './redis_scripts/cleanup.js'
export class CleanupService {
 readonly prefix:string
 constructor(private redis:RedisEval,namespace:string,private generation=''){this.prefix=namespacePrefix(namespace)}
 async sweep(now:number):Promise<{payloads:number;limiters:number}>{
  if(!Number.isSafeInteger(now) || now<0)throw new OperationFault('service_unavailable')
  const counts={payloads:0,limiters:0}
  for(const [kind,batches] of [['payload',8],['limiter',79]] as const){
   let pending=true
   for(let batch=0;batch<batches && pending;batch++){
    let result:unknown
    // Three bounded immediate retries; caller/scheduler records aggregate exhaustion.
    for(let attempt=0;attempt<3;attempt++){
     try{result=await evaluate(this.redis,cleanupLua,[this.prefix+kind+':expiry',this.prefix+'safety:continuity'],[String(now),this.prefix,kind,this.generation]);break}
     catch(error){if(attempt===2)throw error}
    }
    if(!Array.isArray(result) || result.length!==2 || !result.every(Number.isSafeInteger))throw new OperationFault('service_unavailable')
    counts[kind==='payload'?'payloads':'limiters']+=result[0]
    pending=result[1]>0
   }
   if(pending)throw new OperationFault('service_unavailable')
  }
  return counts
 }
}
