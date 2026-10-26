import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createClient} from 'redis'
import {AdmissionService} from '../../build/app/services/admission_service.js'
import {EphemeralSecretService} from '../../build/app/services/ephemeral_secret_service.js'
import {ReadingCodeService} from '../../build/app/services/reading_code_service.js'
test('AC-07 AC-11: removed verifier and malformed history cannot silently disable protection',async()=>{
 const r=createClient({url:process.env.REDIS_URL});r.on('error',()=>{});await r.connect()
 const ns='integrity_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',now=Date.now(),id=randomUUID(),label='v1:'+Buffer.alloc(32,1).toString('base64url')
 try {
  const store=new EphemeralSecretService(r,ns),metadata={id,createdAtMs:now,expiresAtMs:now+60000}
  await store.publish(metadata,{address:'',login:'',credential:'synthetic'},await new ReadingCodeService().create('synthetic-code'),now)
  await r.hDel(store.key(id),'code_verifier')
  await assert.rejects(store.read(metadata),{code:'service_unavailable'})
  const a=new AdmissionService(r,ns)
  for(let i=0;i<5;i++)await a.verificationFailed(id,label,now+60000,now)
  assert.equal(await a.verificationAllowed(id,label,now+60000,now),false)
  const key=p+'verification:'+id+':'+label+':state',state=JSON.parse(await r.get(key))
  state.events={lost:state.events};await r.set(key,JSON.stringify(state),{PXAT:state.expires})
  await assert.rejects(a.verificationAllowed(id,label,now+60000,now+1),{code:'service_unavailable'})
 }finally{const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
test('AC-07: out-of-order already-admitted completions retain all threshold-relevant failed events',async()=>{
 const r=createClient({url:process.env.REDIS_URL});r.on('error',()=>{});await r.connect()
 const ns='reorder_'+randomUUID().replaceAll('-',''),p='slp:'+ns+':',now=Date.now(),id=randomUUID(),label='v1:'+Buffer.alloc(32,1).toString('base64url'),a=new AdmissionService(r,ns)
 try {
  await a.verificationFailed(id,label,now+60000,now+10)
  await a.verificationFailed(id,label,now+60000,now+5)
  const state=JSON.parse(await r.get(p+'verification:'+id+':'+label+':state'))
  assert.equal(state.events.length,2)
  assert.equal(state.last,now+10)
 }finally{const keys=await r.keys(p+'*');if(keys.length)await r.del(keys);await r.close()}
})
