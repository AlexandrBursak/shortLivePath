// Isolated seam contract: real backend results are never synthesized for refusals.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {seam} from './t19-http-concurrency.mjs';
function realm(native,origin='https://localhost:3449'){
 const window={fetch:native};const c=vm.createContext({window,location:{origin,href:origin+'/'},URL,Response});vm.runInContext('('+seam.toString()+')()',c);return window;
}
test('AC-01/07: scoped POST rewrite delegates once and preserves actual refusal Response identity',async()=>{
 const response=new Response('{}',{status:413}),calls=[];
 const w=realm(async(...args)=>{calls.push(args);return response;});w.httpSlice.mutation='{"unknown":true}';
 const init={method:'POST',body:'original',headers:{'content-type':'application/json'}};
 assert.equal(await w.fetch('https://localhost:3449/api/v1/secrets',init),response);
 assert.equal(calls.length,1);assert.equal(calls[0][1].body,'{"unknown":true}');assert.equal(calls[0][1].headers,init.headers);assert.equal(init.body,'original');assert.equal(w.httpSlice.http[0].status,413);assert.equal(w.httpSlice.mutation,null);
});
test('AC-01/07: foreign origin and owned non-API routes pass unchanged; no mutation consumed',async()=>{
 const calls=[],w=realm(async(...args)=>{calls.push(args);return new Response('{}');});w.httpSlice.mutation='pending';
 const init={method:'POST',body:'original'};await w.fetch('https://example.invalid/api/v1/secrets',init);await w.fetch('https://localhost:3449/not-api',init);
 assert.equal(calls.length,2);assert.equal(calls[0][1],init);assert.equal(calls[1][1],init);assert.equal(w.httpSlice.posts,0);assert.equal(w.httpSlice.mutation,'pending');
});
test('AC-08: controlled corruption holds actual native200 before whole-envelope type mutation',async()=>{
 const response=new Response(JSON.stringify({data:{secret:{login:'valid',credential:'owned'}}}),{status:200});const w=realm(async()=>response);w.httpSlice.corrupt=true;
 const pending=w.fetch('https://localhost:3449/api/v1/secrets/'+'A'.repeat(43)+'/disclosures',{method:'POST',body:'{}'});
 await new Promise(r=>setImmediate(r));assert.equal(w.httpSlice.held,true);assert.equal(w.httpSlice.http[0].status,200);w.httpSlice.release();const altered=await pending;assert.equal(altered.status,200);assert.equal((await altered.json()).data.secret.login,42);
});
