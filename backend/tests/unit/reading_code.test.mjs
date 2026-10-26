import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {setTimeout as delay} from 'node:timers/promises'
test('AC-06 AC-07: exact native verifier, strict PHC profile, shared two-call/no-queue work including abandoned calls',async()=>{
 assert.ok(existsSync('build/app/services/reading_code_service.js'),'bounded code service must be implemented')
 const {ReadingCodeService,hashWork,validVerifier}=await import('../../build/app/services/reading_code_service.js')
 const service=new ReadingCodeService(),other=new ReadingCodeService()
 const code=' Aé e\u0301😀\r\n '
 const encoded=await service.create(code),different=await other.create(code)
 assert.notEqual(encoded,different);assert.equal(validVerifier(encoded),true);assert.ok(!encoded.includes(code))
 assert.equal(await service.verify(encoded,code),true)
 for(const altered of [code.trim(),code.normalize('NFC'),code.toLowerCase(),'', 'x'])assert.equal(await service.verify(encoded,altered),false)
 const malformed=[null,'',{},encoded.replace('argon2id','argon2i'),encoded.replace('v=19','v=16'),encoded.replace('m=65536','m=1048576'),encoded+'x',encoded.replace('p=4','p=1'),encoded.replace('t=3','t=1')]
 for(const bad of malformed){assert.equal(validVerifier(bad),false);await assert.rejects(service.verify(bad,'x'),{code:'service_unavailable'})}
 const [head,salt,digest]=[encoded.slice(0,encoded.lastIndexOf('$',encoded.lastIndexOf('$')-1)+1),encoded.split('$')[4],encoded.split('$')[5]]
 // canonical unpadded base64 salt/output with exact decoded lengths.
 await assert.rejects(service.verify(head+salt+'=$'+digest,'x'),{code:'service_unavailable'})
 await assert.rejects(service.create('short'),{code:'invalid_request'})
 await assert.rejects(service.verify(encoded,'a'.repeat(1025)),{code:'invalid_request'})
 const finishes=[];let starts=0
 const held=()=>hashWork.run(()=>{starts++;return new Promise(resolve=>finishes.push(resolve))})
 const a=held(),b=held();assert.equal(hashWork.active,2)
 await assert.rejects(other.create('123456'),{code:'capacity_unavailable'})
 await assert.rejects(service.verify(encoded,code),{code:'capacity_unavailable'})
 assert.equal(starts,2)
 // Caller timeout/abandonment must not release native work's permit.
 assert.equal(await Promise.race([a,delay(1,'caller-timeout')]),'caller-timeout');assert.equal(hashWork.active,2)
 finishes[0]('finished');await a;assert.equal(hashWork.active,1)
 assert.equal(await service.verify(encoded,code),true);assert.equal(hashWork.active,1)
 finishes[1]('finished');await b;assert.equal(hashWork.active,0)
 await assert.rejects(hashWork.run(async()=>{throw new Error('synthetic')}));assert.equal(hashWork.active,0)
})
