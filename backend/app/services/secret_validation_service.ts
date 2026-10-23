import {OperationFault} from './operation_fault.js'
export interface SecretText {address:string;login:string;credential:string}
export interface CreateInput extends SecretText {lifetime_minutes:number;reading_code?:string}
export interface DisclosureInput {reading_code?:string}
function invalid():never {throw new OperationFault('invalid_request')}
export function scalarText(value:unknown):string {
 if(typeof value !== 'string' || !value.isWellFormed()) return invalid()
 return value
}
export function codeText(value:unknown,creation=false):string {
 const text=scalarText(value)
 if(Buffer.byteLength(text,'utf8')>1024 || (creation && [...text].length<6))return invalid()
 return text
}
function shape(value:unknown,fields:string[]):Record<string,unknown> {
 if(!value || typeof value!=='object' || Array.isArray(value))return invalid()
 if(Object.keys(value).some(key=>!fields.includes(key)))return invalid()
 return value as Record<string,unknown>
}
export function validateCreate(value:unknown):CreateInput {
 const input=shape(value,['address','login','credential','lifetime_minutes','reading_code'])
 const address='address' in input?scalarText(input.address):''
 const login='login' in input?scalarText(input.login):''
 const credential=scalarText(input.credential)
 if(!credential.trim() || Buffer.byteLength(address)+Buffer.byteLength(login)+Buffer.byteLength(credential)>65536)return invalid()
 const lifetime='lifetime_minutes' in input?input.lifetime_minutes:60
 if(typeof lifetime!=='number' || !Number.isInteger(lifetime) || lifetime<1 || lifetime>1440)return invalid()
 return {address,login,credential,lifetime_minutes:lifetime,...('reading_code' in input?{reading_code:codeText(input.reading_code,true)}:{})}
}
export function validateDisclosure(value:unknown):DisclosureInput {
 const input=shape(value,['reading_code'])
 return 'reading_code' in input?{reading_code:codeText(input.reading_code)}:{}
}
