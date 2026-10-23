import {OperationFault} from './operation_fault.js'
import {evaluate,type RedisEval} from './redis_support.js'
const purgeLua=`
if redis.call('HGET',KEYS[1],'generation') ~= ARGV[1] or redis.call('HGET',KEYS[1],'state') ~= 'closed' or redis.call('HGET',KEYS[1],'clean') ~= '0' then return -2 end
-- No data/field values or recovered key names are returned to Node.
local page=redis.call('SCAN',ARGV[4],'MATCH',ARGV[2] .. '*','COUNT',128)
local removed=0
for _,key in ipairs(page[2]) do
 local suffix=string.sub(key,#ARGV[2]+1)
 local payload=string.sub(suffix,1,7)=='secret:' and string.sub(suffix,-8)==':payload'
 local counter=(string.sub(suffix,1,9)=='creation:' or string.sub(suffix,1,13)=='verification:') and string.sub(suffix,-6)==':state'
 if (ARGV[3]=='payload' and payload) or (ARGV[3]=='limiter' and counter) then removed=removed+redis.call('DEL',key) end
end
if page[1]=='0' then
 redis.call('DEL',KEYS[2])
 local field=ARGV[3]=='payload' and 'payloads' or 'limiters'
 redis.call('HSET',KEYS[1],field,'0')
 if ARGV[3]=='limiter' then redis.call('HSET',KEYS[1],'clean','1') end
end
return {page[1],removed}
`
export async function purgeUncertainState(redis:RedisEval,prefix:string,generation:string,kind:'payload'|'limiter'):Promise<void>{
 let cursor='0'
 // The dedicated store has <=1000 payloads and <=10000 counters. The finite
 // cursor budget fails closed on an unexpected larger store; never KEYS/FLUSH.
 for(let batch=0;batch<1024;batch++){
  const result=await evaluate(redis,purgeLua,[prefix+'safety:continuity',prefix+kind+':expiry'],[generation,prefix,kind,cursor])
  if(!Array.isArray(result) || result.length!==2 || typeof result[0]!=='string' || !/^\d{1,20}$/.test(result[0]) || !Number.isSafeInteger(result[1]))throw new OperationFault('service_unavailable')
  cursor=result[0]
  if(cursor==='0')return
 }
 throw new OperationFault('service_unavailable')
}
