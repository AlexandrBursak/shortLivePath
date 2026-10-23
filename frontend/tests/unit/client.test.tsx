import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
test('AC-01 AC-08 AC-10: browser client validates responses, never retries POST and bounds late content',async()=>{
 assert.ok(existsSync('src/data/short_live_path/client.ts'),'typed browser client must be implemented');
 const {SecretClient}=await import('../../src/data/short_live_path/client');
 let calls=0,mono=0,wall=100000;
 const clock={mono:()=>mono,wall:()=>wall};
 const create=new SecretClient(async()=>{calls++;throw new Error('network');},clock,()=> 'https://synthetic.example');
 await assert.rejects(create.create({credential:'x'}));assert.equal(calls,1);
 const bad=new SecretClient(async()=>new Response(JSON.stringify({data:{secret:{address:'',login:'',credential:'canary'},expires_at:'1970-01-01T00:01:41.000Z'},meta:{service_time:'1970-01-01T00:01:40.000Z'}})),clock,()=> 'https://synthetic.example');
 const result=await bad.disclose('A'.repeat(43),{});assert.equal(result.value.secret.credential,'canary');
 mono=2000;wall+=2000;assert.equal(result.deadline.eligible(),false);
 const invalid=new SecretClient(async()=>new Response(JSON.stringify({data:{state:'available',reading_code_required:false,expires_at:'bogus',credential:'leak'},meta:{service_time:'bogus'}})),clock,()=> 'https://synthetic.example');
 await assert.rejects(invalid.status('A'.repeat(43)));
});
