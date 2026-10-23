import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {createHmac} from 'node:crypto'
test('AC-07: trusted single-address binary canonicalization and domain-separated stable pseudonyms',async()=>{
 assert.ok(existsSync('build/app/services/trusted_address_service.js'),'trusted address service must exist')
 const {TrustedAddressService}=await import('../../build/app/services/trusted_address_service.js')
 const key=Buffer.alloc(32,7),s=new TrustedAddressService('synthetic',key,['192.0.2.10'])
 const label=x=>s.label('192.0.2.10',x)
 assert.equal(label('192.0.2.1'),label('::ffff:192.0.2.1'))
 assert.equal(label('192.0.2.1'),label('::FFFF:c000:201'))
 assert.equal(label('2001:db8::1'),label('2001:0DB8:0000:0000:0000:0000:0000:0001'))
 assert.notEqual(label('2001:db8::1'),label('2001:db8::2'))
 assert.equal(label('192.0.2.1'),'v1:'+createHmac('sha256',key).update(Buffer.concat([Buffer.from('slp/address/v1\0synthetic\0'),Buffer.from([4,192,0,2,1])])).digest('base64url'))
 assert.equal(label('192.0.2.1'),new TrustedAddressService('synthetic',key,['192.0.2.10']).label('192.0.2.10','192.0.2.1'))
 assert.notEqual(label('192.0.2.1'),new TrustedAddressService('other',key,['192.0.2.10']).label('192.0.2.10','192.0.2.1'))
 for(const x of [undefined,'192.0.2.1, 192.0.2.2','192.0.2.1:80','[2001:db8::1]','fe80::1%en0','localhost','0177.0.0.1','2130706433',' 192.0.2.1'])assert.throws(()=>label(x),{code:'service_unavailable'})
 assert.throws(()=>s.label('192.0.2.11','192.0.2.1'),{code:'service_unavailable'})
 assert.throws(()=>new TrustedAddressService('bad:namespace',key,[]))
 assert.throws(()=>new TrustedAddressService('synthetic',Buffer.alloc(31),[]))
})
