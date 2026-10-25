import {evaluate,namespacePrefix,type RedisEval} from './redis_support.js'
// At most 128 oldest due handles. Presence is a LOWER BOUND, not a full scan
// or physical RAM-zeroization measurement; never return identifiers or payloads.
export const storeSampleLua=`#!lua flags=no-writes
local members=redis.call('ZRANGEBYSCORE',KEYS[1],'-inf',ARGV[1],'WITHSCORES','LIMIT',0,128)
local present,oldest=0,0
for i=1,#members,2 do
 if redis.call('EXISTS',ARGV[2]..'secret:'..members[i]..':payload')==1 then
  present=present+1
  oldest=math.max(oldest,tonumber(ARGV[1])-tonumber(members[i+1]))
 end
end
return {redis.call('ZCARD',KEYS[1]),redis.call('ZCARD',KEYS[2]),redis.call('ZCOUNT',KEYS[1],'-inf',ARGV[1]),present,oldest}
`
export async function sampleRegistry(redis:RedisEval,namespace:string,now:number){
 if(!Number.isSafeInteger(now) || now<0)throw new Error('Invalid sample')
 const p=namespacePrefix(namespace)
 const result=await evaluate(redis,storeSampleLua,[p+'payload:expiry',p+'limiter:expiry'],[String(now),p])
 if(!Array.isArray(result) || result.length!==5 || !result.every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error('Invalid sample')
 return result as number[]
}
