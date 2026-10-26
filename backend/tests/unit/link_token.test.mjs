import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
test('AC-07 AC-08: token capability is canonical 32-byte base64url and digest hashes decoded bytes',async()=>{
 assert.ok(existsSync('build/app/services/link_token_service.js'),'token handling must be implemented')
 const {newLinkToken,decodeToken,tokenDigest}=await import('../../build/app/services/link_token_service.js')
 const token=newLinkToken();assert.match(token,/^[A-Za-z0-9_-]{43}$/);assert.equal(decodeToken(token).length,32)
 assert.deepEqual(tokenDigest(token),createHash('sha256').update(Buffer.from(token,'base64url')).digest())
 const canonical=Buffer.alloc(32).toString('base64url')
 assert.deepEqual(decodeToken(canonical),Buffer.alloc(32))
 // Same decoded bytes with nonzero unused low padding bits is not canonical.
 for(const bad of [canonical.slice(0,-1)+'B',canonical+'=',canonical.slice(1),canonical+'A','/'.repeat(43),'x',null,3])assert.equal(decodeToken(bad),null)
 assert.throws(()=>tokenDigest(canonical.slice(0,-1)+'B'))
 assert.notEqual(newLinkToken(),newLinkToken())
})
