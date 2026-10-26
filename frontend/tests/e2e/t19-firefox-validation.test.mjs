// Harness contract pin: AC-07 explicit empty is not an omitted field (screens.md:180).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {seam} from './t19-http-concurrency.mjs';
const source=fs.readFileSync(new URL('./t19-automatic-tail.mjs',import.meta.url),'utf8');
test('AC-07 tail distinguishes local oversize, explicit empty and genuinely omitted field',()=>{
 assert.ok(source.includes('explicit_empty_posts:1'),'empty explicit Show must transmit once, not be locally blocked');
 assert.ok(source.includes("window.httpSlice.mutation='{}'"),'missing-field branch must actually omit reading_code');
 assert.ok(source.includes('oversize_local_noPOST:true'));
 assert.ok(source.includes('short_live_path.code_required'));
 assert.ok(source.includes('short_live_path.code_incorrect'));
});
test('omitted-field native delegation retains Response identity and only allowlisted refusal metadata',async()=>{
 const response=new Response(JSON.stringify({error:{code:'short_live_path.code_required',message:'never-record-this',details:[]},secret:'never-record-this'}),{status:403});
 const calls=[],window={fetch:async(...args)=>{calls.push(args);return response;}};
 const origin='https://localhost:3449',realm=vm.createContext({window,location:{origin,href:origin+'/'},URL,Response});
 vm.runInContext('('+seam.toString()+')()',realm);
 window.httpSlice.mutation='{}';
 const init={method:'POST',body:JSON.stringify({reading_code:''})};
 assert.equal(await window.fetch(origin+'/api/v1/secrets/'+'A'.repeat(43)+'/disclosures',init),response);
 assert.equal(calls.length,1);assert.equal(calls[0][1].body,'{}');assert.equal(window.httpSlice.posts,1);
 assert.deepEqual(JSON.parse(JSON.stringify(window.httpSlice.http)),[{op:'disclosure',status:403,code:'short_live_path.code_required'}]);
 assert.equal(response.bodyUsed,false);assert.ok(!JSON.stringify(window.httpSlice).includes('never-record-this'));
});
