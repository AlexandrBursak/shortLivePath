import 'reflect-metadata'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {randomBytes,randomUUID} from 'node:crypto'
import pg from 'pg'
const migration='database/migrations/1792627200000_create_link_lifecycles.ts'
const ace=(...args)=>execFileSync(process.execPath,['ace.js',...args],{encoding:'utf8',stdio:'pipe'})
test('AC-09 AC-11b: Lucid promotion preserves SQL, applies/reverts/reapplies with all minute bounds and binary lookup',async()=>{
 assert.ok(existsSync(migration),'promoted Lucid migration must exist')
 const db=new pg.Client();await db.connect()
 try {
  // All destructive commands below target this suite-owned disposable PostgreSQL only.
  assert.equal(process.env.PGHOST,'postgres');assert.equal(process.env.PGDATABASE,'synthetic')
  ace('migration:run','--force')
  const cols=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='link_lifecycles' ORDER BY ordinal_position")).rows.map(r=>r.column_name)
  assert.deepEqual(cols,['id','token_digest','created_at','expires_at'])
  const names=(await db.query("SELECT conname FROM pg_constraint WHERE conrelid='link_lifecycles'::regclass")).rows.map(r=>r.conname)
  for(const name of ['pkey','token_digest_unique','token_digest_length','lifetime_valid']) assert.ok(names.includes('link_lifecycles_'+name))
  const staged=readFileSync('database/migrations/1792627200000_create_link_lifecycles.ts','utf8')
  assert.match(staged,/CREATE TABLE IF NOT EXISTS link_lifecycles/)
  for(let minute=1;minute<=1440;minute++){
   await db.query("INSERT INTO link_lifecycles VALUES ($1,$2,'2026-01-01T00:00:00Z'::timestamptz,'2026-01-01T00:00:00Z'::timestamptz + $3 * interval '1 minute')",[randomUUID(),randomBytes(32),minute])
  }
  for(const [bytes,duration] of [[31,60],[33,60],[32,59],[32,61],[32,86401],[32,0],[32,-60]]) await assert.rejects(db.query("INSERT INTO link_lifecycles VALUES ($1,$2,now(),now()+$3*interval '1 second')",[randomUUID(),randomBytes(bytes),duration]))
  await assert.rejects(db.query("INSERT INTO link_lifecycles VALUES ($1,$2,'infinity','infinity')",[randomUUID(),randomBytes(32)]))
  const id=randomUUID(),digest=randomBytes(32)
  await db.query("INSERT INTO link_lifecycles VALUES ($1,$2,'2026-01-01','2026-01-01 01:00:00Z')",[id,digest])
  await assert.rejects(db.query("INSERT INTO link_lifecycles VALUES ($1,$2,'2026-01-01','2026-01-01 01:00:00Z')",[randomUUID(),digest]))
  const {Ignitor}=await import('@adonisjs/core/ignitor')
  const root=new URL('../../build/',import.meta.url)
  const app=new Ignitor(root,{importer:p=>import(p.startsWith('.')?new URL(p,root).href:p)}).createApp('console')
  await app.init();await app.boot()
  try {
   const {default:Service}=await import('../../build/app/services/link_lifecycle_service.js')
   const found=await new Service().findByDigest(digest)
   assert.equal(found.id,id);assert.ok(Buffer.isBuffer(found.tokenDigest));assert.deepEqual(found.tokenDigest,digest)
   assert.deepEqual(found.serialize(),{id})
   assert.equal(await new Service().findByDigest(randomBytes(32)),null)
  }finally{await app.terminate()}
  ace('migration:rollback','--force')
  assert.equal((await db.query("SELECT to_regclass('link_lifecycles') AS name")).rows[0].name,null)
  // IF NOT EXISTS cannot silently bless an incompatible table.
  await db.query('CREATE TABLE link_lifecycles (unexpected text)')
  assert.throws(()=>ace('migration:run','--force'))
  await db.query('DROP TABLE link_lifecycles')
  ace('migration:run','--force')
  assert.equal((await db.query('SELECT count(*) FROM link_lifecycles')).rows[0].count,'0')
 }finally{await db.end()}
})
