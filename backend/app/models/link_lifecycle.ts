import { BaseModel, column } from '@adonisjs/lucid/orm'
import type {DateTime} from 'luxon'
export default class LinkLifecycle extends BaseModel {
 static table = 'link_lifecycles'
 @column({isPrimary:true}) declare id:string
 @column({columnName:'token_digest',serializeAs:null}) declare tokenDigest:Buffer
 @column.dateTime({columnName:'created_at',serializeAs:null}) declare createdAt:DateTime
 @column.dateTime({columnName:'expires_at',serializeAs:null}) declare expiresAt:DateTime
}
