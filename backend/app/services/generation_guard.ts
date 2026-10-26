import {OperationFault} from './operation_fault.js'
import {namespacePrefix,type RedisEval} from './redis_support.js'
import {readPayloadLua} from './redis_scripts/payload.js'
export class GenerationGuard implements RedisEval {
 readonly prefix:string
 constructor(private redis:RedisEval,namespace:string,private generation:string){
  this.prefix=namespacePrefix(namespace)
  if(!/^[0-9a-f-]{36}$/.test(generation))throw new OperationFault('service_unavailable')
 }
 async eval(script:string,options:{keys:string[];arguments:string[]}):Promise<unknown>{
  const readOnly=script===readPayloadLua
  const preflight=`
local safety, payloadIndex, limiterIndex = KEYS[#KEYS-2], KEYS[#KEYS-1], KEYS[#KEYS]
if redis.call('TYPE', safety).ok ~= 'hash' or redis.call('PTTL', safety) ~= -1 then return -2 end
if redis.call('HGET', safety, 'generation') ~= ${JSON.stringify(this.generation)} or redis.call('HGET', safety, 'state') ~= 'open' or redis.call('HGET', safety, 'clean') ~= '1' then return -2 end
if redis.call('HGET', safety, 'payloads') ~= tostring(redis.call('ZCARD', payloadIndex)) or redis.call('HGET', safety, 'limiters') ~= tostring(redis.call('ZCARD', limiterIndex)) then return -2 end
if redis.call('ZCARD', payloadIndex) > 1000 or redis.call('ZCARD', limiterIndex) > 10000 then return -2 end
`
  const wrapped=readOnly?preflight+script:preflight+`
redis.call('HSET', safety, 'clean', '0')
local result = (function()\n${script}\nend)()
redis.call('HSET', safety, 'payloads', tostring(redis.call('ZCARD', payloadIndex)), 'limiters', tostring(redis.call('ZCARD', limiterIndex)), 'clean', '1')
return result
`
  try{return await this.redis.eval(wrapped,{keys:[...options.keys,this.prefix+'safety:continuity',this.prefix+'payload:expiry',this.prefix+'limiter:expiry'],arguments:options.arguments})}
  catch{throw new OperationFault('service_unavailable')}
 }
}
