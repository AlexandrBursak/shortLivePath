import {canonicalAddress} from '../app/services/trusted_address_service.js'
const origin=process.env.SLP_PUBLIC_ORIGIN,peer=process.env.SLP_TRUSTED_PROXY
let publicOrigin:string|undefined
if(origin){const url=new URL(origin);if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || url.pathname!=='/' || url.origin!==origin)throw new Error('Invalid public origin configuration');publicOrigin=url.origin}
if(peer)canonicalAddress(peer)
export default {publicOrigin,peer}
