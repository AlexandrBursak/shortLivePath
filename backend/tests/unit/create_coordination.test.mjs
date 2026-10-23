import {test} from 'node:test'
import assert from 'node:assert/strict'
import {CreateSecretService} from '../../build/app/services/create_secret_service.js'
const label='v1:'+'A'.repeat(43)
function fixture(fault){
 const calls=[],record={id:'11111111-1111-4111-8111-111111111111',createdAtMs:1000000,expiresAtMs:1060000}
 const call=async name=>{calls.push(name);if(name===fault)throw new Error('unknown store outcome')}
 const run={
  fresh:async()=>{await call('time');return record.createdAtMs+500},
  admission:{creationAllowed:async()=>{await call('admit');return true},creationSucceeded:()=>call('count')},
  payloads:{publish:()=>call('publish'),read:async()=>{await call('read');return {credential:'x'}}},
  release:(data,now,expires,live,send)=>{calls.push('release');return send(JSON.stringify({data,now,expires}))},
 }
 const lifecycle={create:async()=>{await call('commit');return record}}
 return {calls,record,service:new CreateSecretService(run,lifecycle)}
}
for(const fault of ['commit','publish','count','read'])test(`AC-01 AC-04: uncertain ${fault} never confirms, retries, deletes metadata or extends expiry`,async()=>{
 const f=fixture(fault);let writes=0
 await assert.rejects(f.service.create({credential:'x',lifetime_minutes:1},label,'https://synthetic.example',()=>true,()=>writes++))
 assert.equal(writes,0);assert.equal(f.calls.filter(c=>c===fault).length,1);assert.ok(!f.calls.includes('release'))
 if(fault==='commit')assert.ok(!f.calls.includes('publish'))
 assert.equal(f.record.expiresAtMs,1060000)
})
test('AC-01: disconnect after preparation does not publish or confirm',async()=>{
 const f=fixture();let checks=0,writes=0
 await assert.rejects(f.service.create({credential:'x'},label,'https://synthetic.example',()=>++checks===1,()=>writes++),{code:'service_unavailable'})
 assert.equal(writes,0);assert.ok(!f.calls.includes('commit'));assert.ok(!f.calls.includes('publish'))
})
