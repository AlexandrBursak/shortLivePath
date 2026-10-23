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

test('AC-02 AC-04 AC-05 AC-06: exhaustive minutes, aggregate UTF-8 and exact scalar/code boundaries',async()=>{
 const {emptyDraft,validateDraft}=await import('../../src/entities/short_live_path/create_rules');
 const draft={...emptyDraft(),credential:'key'};
 for(let minutes=1;minutes<=1440;minutes++)assert.equal(validateDraft({...draft,minutes:String(minutes)}).input?.lifetime_minutes,minutes);
 for(const credential of ['', ' \t\r\n'])assert.ok(validateDraft({...draft,credential}).errors.credential);
 const exact={...draft,address:' \t😀',login:'é\r\n',credential:'x'.repeat(65536-11)};
 assert.equal(new TextEncoder().encode(exact.address+exact.login+exact.credential).length,65536);
 assert.deepEqual(validateDraft(exact).input,{address:exact.address,login:exact.login,credential:exact.credential,lifetime_minutes:60});
 assert.ok(validateDraft({...exact,credential:exact.credential+'a'}).errors.text);
 for(const field of ['address','login','credential'] as const)assert.ok(validateDraft({...draft,[field]:'\ud800'}).errors.text);
 for(const code of ['😀'.repeat(5),'é'.repeat(512)+'a','aaaaa\ud800'])assert.ok(validateDraft({...draft,protected:true,code}).errors.code);
 for(const code of ['😀'.repeat(6),'      ','aaaaaa','é'.repeat(512)])assert.equal(validateDraft({...draft,protected:true,code}).input?.reading_code,code);
 assert.ok(validateDraft({...exact,protected:true,code:'é'.repeat(512)}).input,'code bytes are excluded from aggregate');
 assert.ok(!('reading_code' in validateDraft({...draft,code:'\ud800'}).input!));
});

test('AC-06: generator rejects 248 and 255 rather than modulo-mapping biased bytes',async()=>{
 const {generateCode}=await import('../../src/entities/short_live_path/create_rules');let calls=0;
 const code=generateCode(bytes=>{calls++;for(let i=0;i<bytes.length;i++)bytes[i]=[247,248,255,0][i%4];return bytes;});
 assert.equal(code,'9A'.repeat(10));assert.equal(calls,2);
});
