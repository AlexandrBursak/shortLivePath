import type {SecretText,ShareLink,Disclosure,NeutralGate,FailureCode} from '@/entities/short_live_path/types';
export class ClientFault extends Error {constructor(readonly code:FailureCode='service_unavailable'){super(code);}}
export function object(value:unknown,keys:string[]):Record<string,unknown>{
 if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).sort().join(',')!==[...keys].sort().join(','))throw new ClientFault();return value as Record<string,unknown>;
}
export function text(value:unknown):string{if(typeof value!=='string' || !value.isWellFormed())throw new ClientFault();return value;}
export function instant(value:unknown):number{const s=text(value),n=Date.parse(s);if(!Number.isSafeInteger(n) || new Date(n).toISOString()!==s)throw new ClientFault();return n;}
export function secret(value:unknown):SecretText{
 const v=object(value,['address','login','credential']),result={address:text(v.address),login:text(v.login),credential:text(v.credential)};
 if(!result.credential.trim() || Object.values(result).reduce((sum,x)=>sum+new TextEncoder().encode(x).length,0)>65536)throw new ClientFault();return result;
}
export function share(value:unknown,origin:string):ShareLink{
 const v=object(value,['share_url','expires_at']);instant(v.expires_at);const url=new URL(text(v.share_url));
 if(url.origin!==origin || url.username || url.password || url.search || url.hash || !/^\/s\/[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(url.pathname))throw new ClientFault();return {share_url:url.href,expires_at:text(v.expires_at)};
}
export function disclosure(value:unknown):Disclosure{const v=object(value,['secret','expires_at']);instant(v.expires_at);return {secret:secret(v.secret),expires_at:text(v.expires_at)};}
export function gate(value:unknown):NeutralGate{
 if(!value || typeof value!=='object')throw new ClientFault();const state=(value as Record<string,unknown>).state;
 if(state==='unknown'){object(value,['state']);return {state};}
 if(state==='expired' || state==='early_unavailable'){const v=object(value,['state','expires_at']);instant(v.expires_at);return {state,expires_at:text(v.expires_at)};}
 const v=object(value,['state','reading_code_required','expires_at']);if(state!=='available' || typeof v.reading_code_required!=='boolean')throw new ClientFault();instant(v.expires_at);return {state,reading_code_required:v.reading_code_required,expires_at:text(v.expires_at)};
}
export function failure(value:unknown):ClientFault{
 const root=object(value,['error']),e=object(root.error,['code','message','details']);
 const allowed:FailureCode[]=['invalid_request','request_too_large','unsupported_media_type','creation_limited','verification_limited','capacity_unavailable','service_unavailable','code_required','code_incorrect','link_unavailable','link_expired'];
 if(typeof e.code!=='string' || !e.code.startsWith('short_live_path.') || !allowed.includes(e.code.slice(16) as FailureCode) || typeof e.message!=='string' || !Array.isArray(e.details) || e.details.length)throw new ClientFault();
 return new ClientFault(e.code.slice(16) as FailureCode);
}
