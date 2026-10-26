export type CopyResult='copied'|'manual'|'stale';
export async function exactCopy(value:string,eligible:()=>boolean,write:(value:string)=>Promise<void>=value=>navigator.clipboard.writeText(value)):Promise<CopyResult>{
 if(!eligible())return 'stale';
 try{await write(value);return eligible()?'copied':'stale';}
 catch{return eligible()?'manual':'stale';}
}
