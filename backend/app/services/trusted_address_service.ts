import {isIP} from 'node:net'
import {createHmac,timingSafeEqual} from 'node:crypto'
import {OperationFault} from './operation_fault.js'
function unavailable():never{throw new OperationFault('service_unavailable')}
export function canonicalAddress(value:unknown):Buffer {
 if(typeof value!=='string')return unavailable()
 const family=isIP(value)
 if(family===4)return Buffer.from([4,...value.split('.').map(Number)])
 if(family!==6 || value.includes('%'))return unavailable()
 const host=new URL(`http://[${value}]/`).hostname.slice(1,-1)
 const [left,right]=host.split('::'),a=left?left.split(':'):[],b=right?right.split(':'):[]
 const words=right===undefined?a:[...a,...Array(8-a.length-b.length).fill('0'),...b]
 if(words.length!==8)return unavailable()
 const bytes=Buffer.alloc(16);words.forEach((word,index)=>bytes.writeUInt16BE(Number.parseInt(word,16),index*2))
 if(bytes.subarray(0,10).equals(Buffer.alloc(10)) && bytes[10]===255 && bytes[11]===255)return Buffer.concat([Buffer.from([4]),bytes.subarray(12)])
 return Buffer.concat([Buffer.from([6]),bytes])
}
export class TrustedAddressService {
 #key:Buffer
 #peers:Buffer[]
 constructor(private namespace:string,key:Buffer,peers:string[]){
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(namespace) || key.length!==32 || !peers.length)throw new OperationFault('service_unavailable')
  this.#key=Buffer.from(key);this.#peers=peers.map(canonicalAddress)
 }
 label(peer:unknown,forwarded:unknown):string {
  const immediate=canonicalAddress(peer)
  if(!this.#peers.some(p=>p.length===immediate.length && timingSafeEqual(p,immediate)))return unavailable()
  const address=canonicalAddress(forwarded)
  return 'v1:'+createHmac('sha256',this.#key).update(Buffer.concat([Buffer.from(`slp/address/v1\0${this.namespace}\0`),address])).digest('base64url')
 }
}
