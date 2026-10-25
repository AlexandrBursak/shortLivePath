import {createRequire} from 'node:module'
import dbPool from '@adonisjs/lucid/services/db'
import {MetricsSampler} from '../app/services/metrics_sampler_service.js'
import {createClient} from 'redis'
import app from '@adonisjs/core/services/app'
import config from '../config/maintenance.js'
import {ProcessOwnershipService,type OwnershipConnection} from '../app/services/process_ownership_service.js'
import {ReadinessService} from '../app/services/readiness_service.js'
import {ServiceClock} from '../app/services/service_clock.js'
import type {RedisEval} from '../app/services/redis_support.js'
interface DedicatedConnection extends OwnershipConnection {connect():Promise<void>;end():Promise<void>}
const {Client}=createRequire(import.meta.url)('pg') as {Client:new(options:typeof config.postgres)=>DedicatedConnection}
export let metricsSampler:MetricsSampler|undefined
export let readiness:ReadinessService|undefined
export let secretRedis:RedisEval|undefined
// All web starts use the kernel process fence as well as this dedicated PG
// session. Unconfigured bootstrap remains closed; no deployment key is generated.
if(app.getEnvironment()==='web' && config.key && config.namespace && config.redisUrl){
 const key=config.key,namespace=config.namespace,clock=new ServiceClock()
 const redis=createClient({url:config.redisUrl,disableOfflineQueue:true,socket:{connectTimeout:1000}})
 secretRedis=redis
 const sampler=new MetricsSampler(redis,namespace,()=>dbPool.rawQuery("SELECT greatest(reltuples,0) AS rows,pg_total_relation_size(oid) AS bytes FROM pg_class WHERE oid='link_lifecycles'::regclass").timeout(1000));metricsSampler=sampler
 const sampleTimer=setInterval(()=>{void sampler.sample(readiness)},10000);sampleTimer.unref()
 let db:DedicatedConnection|undefined,owner:ProcessOwnershipService|undefined,busy=false,stopped=false
 const reconnect=async()=>{
  if(busy || stopped || !redis.isReady || owner?.current)return
  busy=true
  const next=new Client(config.postgres)
  let local:ReadinessService|undefined
  const nextOwner=new ProcessOwnershipService(next,()=>local?.close())
  try{
   await next.connect()
   if(stopped){await next.end();return}
   readiness?.stop()
   await db?.end().catch(()=>{})
   db=next;owner=nextOwner
   local=new ReadinessService(redis,nextOwner,namespace,key,clock);readiness=local
   await local.recover()
  }catch{
   if(db!==next)await next.end().catch(()=>{})
   // No error/config/request serialization. Retry remains current-run bounded.
  }finally{local?.start();busy=false}
 }
 redis.on('error',()=>readiness?.close())
 redis.on('reconnecting',()=>readiness?.close())
 redis.on('ready',()=>{void reconnect()})
 const timer=setInterval(()=>{void reconnect()},500);timer.unref()
 void redis.connect().catch(()=>{})
 app.terminating(async()=>{
  stopped=true;clearInterval(timer);clearInterval(sampleTimer);readiness?.stop()
  await owner?.release().catch(()=>{})
  await db?.end().catch(()=>{})
  if(redis.isOpen)await redis.close().catch(()=>{})
 })
}
