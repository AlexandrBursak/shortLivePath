import {randomBytes,createHash} from 'node:crypto'
import {OperationFault} from './operation_fault.js'
export function newLinkToken():string{return randomBytes(32).toString('base64url')}
export function decodeToken(token:unknown):Buffer|null {
 if(typeof token!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(token))return null
 const bytes=Buffer.from(token,'base64url')
 return bytes.length===32 && bytes.toString('base64url')===token?bytes:null
}
export function tokenDigest(token:unknown):Buffer {
 const bytes=decodeToken(token)
 if(!bytes)throw new OperationFault('invalid_request')
 return createHash('sha256').update(bytes).digest()
}
