import {OperationFault} from './operation_fault.js'
export interface RedisEval {eval(script:string,options:{keys:string[];arguments:string[]}):Promise<unknown>}
export interface LifecycleRecord {id:string;createdAtMs:number;expiresAtMs:number}
export function namespacePrefix(namespace:string):string {
 if(!/^[A-Za-z0-9_-]{1,64}$/.test(namespace))throw new OperationFault('service_unavailable')
 return `slp:${namespace}:`
}
export function validateRecord(record:LifecycleRecord):void {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(record.id) || !Number.isSafeInteger(record.createdAtMs) || record.createdAtMs<0 || !Number.isSafeInteger(record.expiresAtMs))throw new OperationFault('service_unavailable')
 const lifetime=record.expiresAtMs-record.createdAtMs
 if(lifetime<60000 || lifetime>86400000 || lifetime%60000!==0)throw new OperationFault('service_unavailable')
}
export async function evaluate(redis:RedisEval,script:string,keys:string[],args:string[]):Promise<unknown>{
 try{return await redis.eval(script,{keys,arguments:args})}catch{throw new OperationFault('service_unavailable')}
}
