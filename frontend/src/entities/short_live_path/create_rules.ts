import type {CreateInput} from './types';
export interface CreateDraft {address:string;login:string;credential:string;minutes:string;protected:boolean;code:string}
export type DraftErrors=Partial<Record<'credential'|'text'|'minutes'|'code',string>>;
export function emptyDraft():CreateDraft{return {address:'',login:'',credential:'',minutes:'60',protected:false,code:''};}
export function byteCount(values:string[]){return values.reduce((sum,x)=>sum+new TextEncoder().encode(x).length,0);}
export function validMinutes(value:string):number|undefined{const n=Number(value);return value.trim()!=='' && Number.isInteger(n) && n>=1 && n<=1440?n:undefined;}
export function validateDraft(draft:CreateDraft):{errors:DraftErrors;input?:CreateInput}{
 const errors:DraftErrors={},minutes=validMinutes(draft.minutes);
 if(!draft.credential.trim())errors.credential='Enter a password or key, not only spaces.';
 if(![draft.address,draft.login,draft.credential].every(x=>x.isWellFormed()))errors.text='Text must contain valid Unicode characters.';
 if(byteCount([draft.address,draft.login,draft.credential])>65536)errors.text='Secret text must not exceed 65536 UTF-8 bytes.';
 if(minutes===undefined)errors.minutes='Enter a whole number from 1 to 1440.';
 if(draft.protected && (!draft.code.isWellFormed() || [...draft.code].length<6 || byteCount([draft.code])>1024))errors.code='Use at least 6 Unicode code points, up to 1024 UTF-8 bytes.';
 if(Object.keys(errors).length || minutes===undefined)return {errors};
 return {errors,input:{address:draft.address,login:draft.login,credential:draft.credential,lifetime_minutes:minutes,...(draft.protected?{reading_code:draft.code}:{})}};
}
export function snapHour(value:number):number{
 return [1,...Array.from({length:24},(_,i)=>(i+1)*60)].reduce((best,next)=>Math.abs(next-value)<=Math.abs(best-value)?next:best,1);
}
export function generateCode(random:(bytes:Uint8Array)=>Uint8Array=bytes=>crypto.getRandomValues(bytes)):string{
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';let result='';
 while(result.length<20){for(const value of random(new Uint8Array(32))){if(value<248)result+=alphabet[value%62];if(result.length===20)break;}}
 return result;
}
