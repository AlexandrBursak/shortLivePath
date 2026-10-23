import {createHash,randomUUID} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {readFileSync} from 'node:fs'
import {OperationFault} from './operation_fault.js'
import {namespacePrefix,evaluate,type RedisEval} from './redis_support.js'
import {ProcessOwnershipService} from './process_ownership_service.js'
import {ServiceClock} from './service_clock.js'
import {CleanupService} from './cleanup_service.js'
import {purgeUncertainState} from './continuity_recovery_service.js'
const captureLua=`
local kind = redis.call('TYPE', KEYS[1]).ok
if kind == 'none' then return 'absent' end
if kind ~= 'hash' or redis.call('HSTRLEN',KEYS[1],'generation') > 36 then return -2 end
return redis.call('HGET',KEYS[1],'generation') or -2
`
const beginLua=`
local kind = redis.call('TYPE', KEYS[1]).ok
-- Capture precedes a fresh PG ownership proof. A delayed old BEGIN cannot
-- overwrite a generation established by an owner who acquired the lock later.
if ARGV[3] == 'absent' then
 if kind ~= 'none' then return {-2} end
elseif kind ~= 'hash' or redis.call('HGET',KEYS[1],'generation') ~= ARGV[3] then return {-2} end
local counts = {}
for i=2,3 do
 local t = redis.call('TYPE', KEYS[i]).ok
 if t ~= 'none' and t ~= 'zset' then return {-2} end
 if t ~= 'none' and redis.call('PTTL', KEYS[i]) ~= -1 then return {-2} end
 counts[i-1] = redis.call('ZCARD', KEYS[i])
end
if counts[1] > 1000 or counts[2] > 10000 then return {-2} end
local continuous, floor, stamp, source, boot = 0, 0, tonumber(ARGV[5]), 0, ARGV[4]
local repair = 0
if kind ~= 'none' then
 if kind ~= 'hash' or redis.call('PTTL', KEYS[1]) ~= -1 or redis.call('HLEN', KEYS[1]) ~= 11 then return {-2} end
 local names={'generation','state','clean','payloads','limiters','key_digest','high_water','continuity','clock_boot','clock_mono','clock_db'}
 local bounds={36,6,1,4,5,64,16,1,64,16,16}
 for i,name in ipairs(names) do
  if redis.call('HEXISTS', KEYS[1], name) ~= 1 or redis.call('HSTRLEN', KEYS[1], name) > bounds[i] then return {-2} end
 end
 local v=redis.call('HMGET',KEYS[1],unpack(names))
 if v[3] ~= '1' or v[4] ~= tostring(counts[1]) or v[5] ~= tostring(counts[2]) then repair=1 end
 if v[2] ~= 'open' and v[2] ~= 'closed' then return {-2} end
 if not string.match(v[7], '^%d+$') then return {-2} end
 floor=tonumber(v[7])
 if not floor or floor > 9007199254740991 then return {-2} end
 if v[8] ~= '0' and v[8] ~= '1' then return {-2} end
 if v[6] == ARGV[2] and v[8] == '1' then continuous=1 end
 if not string.match(v[10], '^%d+$') or not string.match(v[11], '^%d+$') then return {-2} end
 stamp, source, boot = tonumber(v[10]), tonumber(v[11]), v[9]
 if not stamp or not source or stamp > 9007199254740991 or source > floor then return {-2} end
 if boot ~= ARGV[4] then repair=1;floor=0;source=0;stamp=tonumber(ARGV[5]);boot=ARGV[4] end
elseif counts[1] ~= 0 or counts[2] ~= 0 then
 repair=1
end
if repair==1 then continuous=0 end
redis.call('HSET',KEYS[1],'generation',ARGV[1],'state','closed','clean',repair==1 and '0' or '1','payloads',tostring(counts[1]),'limiters',tostring(counts[2]),'key_digest',ARGV[2],'high_water',tostring(floor),'continuity',tostring(continuous),'clock_boot',boot,'clock_mono',tostring(stamp),'clock_db',tostring(source))
return {repair==1 and 2 or continuous,floor,stamp,source,boot}
`
const openLua=`
if redis.call('HGET',KEYS[1],'generation') ~= ARGV[1] or redis.call('HGET',KEYS[1],'clean') ~= '1' then return -2 end
if redis.call('HGET',KEYS[1],'payloads') ~= tostring(redis.call('ZCARD',KEYS[2])) or redis.call('HGET',KEYS[1],'limiters') ~= tostring(redis.call('ZCARD',KEYS[3])) then return -2 end
redis.call('HSET',KEYS[1],'state','open','high_water',ARGV[2],'continuity','1','clock_boot',ARGV[3],'clock_mono',ARGV[4],'clock_db',ARGV[5])
return 1
`
const closeLua=`#!lua flags=allow-oom
-- Fixed-size owner/state fencing must still execute under actual Redis OOM.
if redis.call('TYPE',KEYS[1]).ok ~= 'hash' or redis.call('HSTRLEN',KEYS[1],'generation') ~= 36 then return 0 end
if redis.call('HGET',KEYS[1],'generation') ~= ARGV[1] then return 0 end
redis.call('HSET',KEYS[1],'generation',ARGV[2],'state','closed')
return 1
`
interface HostClock {bootId:string;mono():number}
function hostClock():HostClock{return {bootId:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),mono:()=>Number(process.hrtime.bigint()/1000000n)}}
export class ReadinessService {
 readonly prefix:string
 readonly keyDigest:string
 readonly clock:ServiceClock
 #generation=randomUUID()
 #confirmedGeneration?:string
 #fence:Promise<void>=Promise.resolve()
 #open=false
 #epoch=0
 #prepared=false
 #quietStart=0
 #needsQuiet=false
 #repair=false
 #purged=false
 #timer?:ReturnType<typeof setInterval>
 #running=false
 readonly metrics={cleanupExhaustions:0,recoveryFailures:0}
 constructor(private redis:RedisEval,private owner:ProcessOwnershipService,namespace:string,key:Buffer,clock=new ServiceClock(),private host:HostClock=hostClock()){
  if(key.length!==32)throw new OperationFault('service_unavailable')
  this.prefix=namespacePrefix(namespace);this.keyDigest=createHash('sha256').update(key).digest('hex');this.clock=clock
 }
 get generation(){return this.#generation}
 get ready(){
  if(!this.#open || !this.owner.current)return false
  try{this.clock.upperNow();return true}catch{this.close();return false}
 }
 private keys(){return [this.prefix+'safety:continuity',this.prefix+'payload:expiry',this.prefix+'limiter:expiry']}
 private checkpointArgs(generation:string):string[]{
  // Stamp before sampling: any scheduling delay then makes the restored
  // trajectory earlier/more conservative, never an uncounted extension.
  const stamp=this.host.mono()
  const saved=this.clock.checkpoint()
  return [generation,String(saved.upperMs),this.host.bootId,String(stamp),String(saved.sourceMs)]
 }
 close():void{
  this.#generation=randomUUID();this.#open=false;this.#epoch++;this.#prepared=false;this.clock.invalidate()
  const next=this.#generation
  this.#fence=this.#fence.catch(()=>{}).then(async()=>{
   const confirmed=this.#confirmedGeneration
   if(!confirmed)return
   // Never adopt a foreign current marker. Only a token this run established
   // and confirmed can authorize its deletion/fencing, including a lost close.
   if(await evaluate(this.redis,closeLua,[this.keys()[0]],[confirmed,next])===1)this.#confirmedGeneration=next
  }).catch(()=>{})
 }
 start():void{
  if(this.#timer)return
  this.#timer=setInterval(()=>{void this.tick()},500)
  this.#timer.unref()
 }
 stop(){if(this.#timer)clearInterval(this.#timer);this.#timer=undefined;this.close()}
 async tick():Promise<void>{
  if(this.#running)return
  this.#running=true
  try{
   if(this.#open){
    const now=await this.fresh()
    await new CleanupService(this.redis,this.prefix.slice(4,-1),this.#generation).sweep(now)
   }else await this.recover()
  }catch{
   this.metrics.recoveryFailures++
   // This runs even after PostgreSQL loss. Only the current Redis generation
   // may clean; an obsolete scheduler cannot touch a replacement owner's data.
   try{await this.#fence;await new CleanupService(this.redis,this.prefix.slice(4,-1),this.#confirmedGeneration??this.#generation).sweep(this.clock.deletionUpperBound())}
   catch{this.metrics.cleanupExhaustions++}
   this.close()
  }finally{this.#running=false}
 }
 async recover():Promise<void>{
  this.#open=false
  const epoch=++this.#epoch,generation=this.#generation
  try{
   await this.#fence
   if(!await this.owner.acquire())throw new Error()
   if(!this.#prepared){
    const expected=await evaluate(this.redis,captureLua,[this.keys()[0]],[])
    if(typeof expected!=='string' || expected.length>36 || epoch!==this.#epoch)throw new Error()
    await this.owner.time()
    if(epoch!==this.#epoch || !this.owner.current)throw new Error()
    const state=await evaluate(this.redis,beginLua,this.keys(),[generation,this.keyDigest,expected,this.host.bootId,String(this.host.mono())])
    if(epoch!==this.#epoch || !this.owner.current || !Array.isArray(state) || state.length!==5 || !state.slice(0,4).every(Number.isSafeInteger) || typeof state[4]!=='string' || ![0,1,2].includes(state[0]))throw new Error()
    this.#confirmedGeneration=generation
    if(state[3]>0){
     if(state[4]!==this.host.bootId)throw new Error()
     this.clock.restore({sourceMs:state[3],upperMs:state[1]},this.host.mono()-state[2]+1)
    }
    this.#needsQuiet=state[0]!==1;this.#repair=state[0]===2;this.#purged=false
    this.#quietStart=performance.now()
    await this.clock.sample(()=>this.owner.time(),true)
    this.#prepared=true
   }
   const now=await this.clock.sample(()=>this.owner.time())
   if(epoch!==this.#epoch || !this.owner.current)throw new Error()
   if(this.#repair){
    if(!this.#purged){await purgeUncertainState(this.redis,this.prefix,generation,'payload');this.#purged=true}
   }else await new CleanupService(this.redis,this.prefix.slice(4,-1),generation).sweep(now)
   if(epoch!==this.#epoch || !this.owner.current)throw new Error()
   if(this.#needsQuiet && performance.now()-this.#quietStart<60000)return
   if(this.#repair){await purgeUncertainState(this.redis,this.prefix,generation,'limiter');this.#repair=false}
   if(await evaluate(this.redis,openLua,this.keys(),this.checkpointArgs(generation))!==1)throw new Error()
   if(epoch!==this.#epoch || !this.owner.current)throw new Error()
   this.#open=true
  }catch{this.close();throw new OperationFault('service_unavailable')}
 }
 async fresh():Promise<number>{
  if(!this.ready)throw new OperationFault('service_unavailable')
  const epoch=this.#epoch,generation=this.#generation
  try{
   await this.clock.sample(()=>this.owner.time())
   if(epoch!==this.#epoch || !this.owner.current)throw new Error()
   if(await evaluate(this.redis,openLua,this.keys(),this.checkpointArgs(generation))!==1)throw new Error()
   if(epoch!==this.#epoch || !this.owner.current)throw new Error()
   return this.clock.upperNow()
  }catch{this.close();throw new OperationFault('service_unavailable')}
 }
}
