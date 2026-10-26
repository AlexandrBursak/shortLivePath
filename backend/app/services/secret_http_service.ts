import type {HttpContext} from '@adonisjs/core/http'
import {OperationFault} from './operation_fault.js'
export type HttpFaultCode='request_too_large'|'unsupported_media_type'|'creation_limited'|'verification_limited'|'code_required'|'code_incorrect'|'link_unavailable'|'link_expired'
export class HttpFault extends Error {constructor(readonly code:HttpFaultCode){super(code)}}
const failures={
 invalid_request:[422,'Request shape, exact-text or lifetime/code constraints are invalid.'],
 request_too_large:[413,'Request body exceeds the permitted wire-byte limit. No link is confirmed.'],
 unsupported_media_type:[415,'Use uncompressed application/json. Request media type or encoding is unsupported.'],
 creation_limited:[429,'Creation limit reached. Wait before trying again.'],
 verification_limited:[429,'Basic observed failure threshold for this link and address is reached. Wait before trying again.'],
 capacity_unavailable:[503,'Temporary work or storage capacity is unavailable.'],
 service_unavailable:[503,'Service temporarily unavailable. No result is confirmed.'],
 code_required:[403,'Enter the separate Reading code.'],
 code_incorrect:[403,'Reading code is incorrect. The link has not been consumed.'],
 link_unavailable:[409,'Secret is unavailable. Request a new Share link from the Sender; recovery is not available.'],
 link_expired:[410,'Share link has expired. External credentials and saved copies are not revoked.'],
} as const
export function safeFailure(error:unknown,{response}:HttpContext){
 const code=error instanceof HttpFault || error instanceof OperationFault?error.code:'service_unavailable'
 const [status,message]=failures[code]
 response.status(status).send({error:{code:'short_live_path.'+code,message,details:[]}},false)
 response.finish()
}
export function connected(ctx:HttpContext){return !ctx.request.request.aborted && !ctx.response.response.destroyed && !ctx.response.response.writableEnded}
export async function readJson({request}:HttpContext):Promise<unknown>{
 const raw=request.request,headers=raw.headers
 if(typeof headers['content-type']!=='string' || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(headers['content-type']) || (headers['content-encoding']!==undefined && headers['content-encoding']!=='identity'))throw new HttpFault('unsupported_media_type')
 const length=headers['content-length']
 if(length!==undefined && (!/^\d+$/.test(length) || Number(length)>524288))throw new HttpFault('request_too_large')
 const chunks:Buffer[]=[];let size=0
 try{
  for await(const chunk of raw){size+=chunk.length;if(size>524288)throw new HttpFault('request_too_large');chunks.push(Buffer.from(chunk))}
 }catch(error){if(error instanceof HttpFault)throw error;throw new OperationFault('invalid_request')}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)))}catch{throw new OperationFault('invalid_request')}
}
