import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
test('AC-02 AC-04 AC-05 AC-06: exact creation rules retain minute precision and unbiased code alphabet',async()=>{
 assert.ok(existsSync('src/entities/short_live_path/create_rules.ts'),'creation rules must be implemented');
 const {validateDraft,snapHour,generateCode}=await import('../../src/entities/short_live_path/create_rules');
 const draft={address:'',login:'',credential:' \r\nkey ',minutes:'61',protected:false,code:''};
 assert.equal(validateDraft(draft).input?.lifetime_minutes,61);assert.equal(validateDraft(draft).input?.credential,' \r\nkey ');
 for(const minutes of ['','1.5','0','1441'])assert.ok(validateDraft({...draft,minutes}).errors.minutes);
 assert.equal(snapHour(30),1);assert.equal(snapHour(90),120);assert.equal(snapHour(61),60);
 let n=247;const code=generateCode(bytes=>{for(let i=0;i<bytes.length;i++)bytes[i]=(n++)%256;return bytes;});assert.match(code,/^[A-Za-z0-9]{20}$/);
 assert.ok(validateDraft({...draft,protected:true,code:'short'}).errors.code);assert.equal(validateDraft({...draft,protected:true,code:'😀😀😀😀😀😀'}).input?.reading_code,'😀😀😀😀😀😀');
});
