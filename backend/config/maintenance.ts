import {readFileSync,statSync} from 'node:fs'
let key:Buffer|undefined
const keyFile=process.env.SLP_ADDRESS_KEY_FILE
if(keyFile){
 const stat=statSync(keyFile)
 if(!stat.isFile() || stat.size!==32 || (stat.mode & 0o077)!==0)throw new Error('Invalid maintenance configuration')
 key=readFileSync(keyFile)
}
export default {
 namespace:process.env.SLP_NAMESPACE,
 key,
 redisUrl:process.env.REDIS_URL,
 postgres:{host:process.env.PGHOST,port:Number(process.env.PGPORT??5432),user:process.env.PGUSER,password:process.env.PGPASSWORD,database:process.env.PGDATABASE,connectionTimeoutMillis:1000,query_timeout:200,statement_timeout:200},
}
