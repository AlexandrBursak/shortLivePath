import LinkLifecycle from '#models/link_lifecycle'
import db from '@adonisjs/lucid/services/db'
import {randomUUID} from 'node:crypto'
import {validateRecord,type LifecycleRecord} from './redis_support.js'
export default class LinkLifecycleService {
 async create(digest:Buffer,minutes:number):Promise<LifecycleRecord>{
  if(digest.length!==32 || !Number.isInteger(minutes) || minutes<1 || minutes>1440)throw new Error('Invalid lifecycle input')
  // MATERIALIZED evaluates clock_timestamp once, after optional native hashing.
  // Resolve only after transaction COMMIT has been acknowledged. Never retry.
  const record=await db.transaction(async trx=>{
   const result=await trx.rawQuery(`WITH stamp AS MATERIALIZED (SELECT date_trunc('milliseconds',clock_timestamp()) AS now)
    INSERT INTO link_lifecycles(id,token_digest,created_at,expires_at)
    SELECT ?,?,now,now + ? * interval '1 minute' FROM stamp
    RETURNING id,created_at,expires_at`,[randomUUID(),digest,minutes])
   const row=result.rows[0]
   return {id:row.id,createdAtMs:new Date(row.created_at).getTime(),expiresAtMs:new Date(row.expires_at).getTime()}
  })
  validateRecord(record);return record
 }
 async lookup(digest:Buffer):Promise<LifecycleRecord|null>{
  const row=await this.findByDigest(digest)
  if(!row)return null
  const record={id:row.id,createdAtMs:row.createdAt.toMillis(),expiresAtMs:row.expiresAt.toMillis()}
  validateRecord(record);return record
 }
 async findByDigest(digest:Buffer) {
  if(digest.length !== 32) throw new Error('Invalid lifecycle digest')
  return LinkLifecycle.query().where('token_digest',digest).first()
 }
}
