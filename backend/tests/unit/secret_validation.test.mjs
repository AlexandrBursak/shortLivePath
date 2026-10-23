import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
test('AC-02 AC-03 AC-05 AC-06 AC-07: exact scalar inputs, byte bounds and independent code policies',async()=>{
 assert.ok(existsSync('build/app/services/secret_validation_service.js'),'exact validation must be implemented')
 const {validateCreate,validateDisclosure}=await import('../../build/app/services/secret_validation_service.js')
 const exact=' \r\n\tTEST e\u0301 😀\r\n '
 assert.deepEqual(validateCreate({credential:exact}),{address:'',login:'',credential:exact,lifetime_minutes:60})
 for(const credential of ['', ' \r\n\t',null,5,'\ud800','x\udc00'])assert.throws(()=>validateCreate({credential}))
 for(const input of [null,[],5,{credential:'x',unexpected:true},{credential:'x',address:null},{credential:'x',reading_code:null}])assert.throws(()=>validateCreate(input))
 assert.equal(validateCreate({address:'é'.repeat(32767),login:'a',credential:'x',reading_code:'😀'.repeat(256)}).credential,'x')
 assert.throws(()=>validateCreate({address:'é'.repeat(32767),login:'ab',credential:'x'}))
 for(let n=1;n<=1440;n++)assert.equal(validateCreate({credential:'x',lifetime_minutes:n}).lifetime_minutes,n)
 for(const n of [0,1441,1.5,'60',null,NaN,Infinity])assert.throws(()=>validateCreate({credential:'x',lifetime_minutes:n}))
 for(const code of ['aaaaaa','      ','éééééé','😀😀😀😀😀😀','a\r\nb c','😀'.repeat(256)])assert.equal(validateCreate({credential:'x',reading_code:code}).reading_code,code)
 for(const code of ['12345','😀😀😀😀😀','a'.repeat(1025),'😀'.repeat(256)+'a','abcde\ud800'])assert.throws(()=>validateCreate({credential:'x',reading_code:code}))
 assert.deepEqual(validateDisclosure({}),{});assert.deepEqual(validateDisclosure({reading_code:''}),{reading_code:''})
 for(const code of ['', 'x',' A\r\n','a'.repeat(1024)])assert.equal(validateDisclosure({reading_code:code}).reading_code,code)
 for(const input of [null,[],{reading_code:null},{reading_code:'\ud800'},{reading_code:'a'.repeat(1025)},{secret:'x'}])assert.throws(()=>validateDisclosure(input))
})
