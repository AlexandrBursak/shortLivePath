import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SecretClient,ClientFault} from '../../src/data/short_live_path/client';

const origin='https://synthetic.example',token='A'.repeat(43);
const service='2026-01-01T00:00:00.000Z',expires='2026-01-01T00:01:00.000Z';
const clock={mono:()=>0,wall:()=>1000};
const secret={address:'  https://inert.example/\r\n',login:'𝄞é ',credential:' synthetic\r\n\tkey\n '};
const revealed={data:{secret,expires_at:expires},meta:{service_time:service}};
const envelope=(data:unknown)=>({data,meta:{service_time:service}});
const fault=(code:string,status:number)=>Response.json({error:{code:'short_live_path.'+code,message:'synthetic',details:[]}},{status});

test('AC-10: an aborted request cannot yield content even if transport ignores cancellation',async()=>{
 const controller=new AbortController();
 const client=new SecretClient(async()=>{controller.abort();return Response.json(revealed);},clock,()=>origin);
 await assert.rejects(client.disclose(token,{},controller.signal),ClientFault);
});
test('AC-10: pre-aborted requests send nothing and body-read cancellation cannot yield content',async()=>{
 const aborted=new AbortController();aborted.abort();let calls=0;
 const client=new SecretClient(async()=>{calls++;return Response.json(revealed);},clock,()=>origin);
 await assert.rejects(client.disclose(token,{},aborted.signal),ClientFault);assert.equal(calls,0);
 const controller=new AbortController();
 const streamed=new SecretClient(async()=>new Response(new ReadableStream({start(stream){stream.enqueue(new TextEncoder().encode(JSON.stringify(revealed)));controller.abort();stream.close();}})),clock,()=>origin);
 await assert.rejects(streamed.disclose(token,{},controller.signal),ClientFault);
});
test('AC-10: malformed HTTP failure evidence never establishes a terminal or incorrect-code outcome',async()=>{
 for(const [method,status,code] of [['status',503,'link_expired'],['status',410,'link_expired'],['create',403,'code_incorrect'],['disclose',503,'code_incorrect'],['disclose',409,'link_expired']] as const){
  const client=new SecretClient(async()=>fault(code,status),clock,()=>origin);
  const request=method==='status'?client.status(token):method==='create'?client.create({credential:'synthetic'}):client.disclose(token,{});
  await assert.rejects(request,(error:unknown)=>error instanceof ClientFault && error.code==='service_unavailable',`${method} ${status} ${code}`);
 }
});
test('AC-04 AC-10: all three typed operations preserve exact strings and browser-only request policies',async()=>{
 const calls:{url:string;init:RequestInit}[]=[];
 const responses=[Response.json(envelope({share_url:origin+'/s/'+token,expires_at:expires}),{status:201}),Response.json(envelope({state:'available',reading_code_required:true,expires_at:expires})),Response.json(revealed)];
 const client=new SecretClient(async(url,init)=>{calls.push({url:String(url),init:init!});return responses.shift()!;},clock,()=>origin);
 const input={...secret,reading_code:' code\r\n𝄞 ',lifetime_minutes:61};
 assert.equal((await client.create(input)).value.share_url,origin+'/s/'+token);
 assert.equal((await client.status(token)).value.state,'available');
 assert.deepEqual((await client.disclose(token,{reading_code:input.reading_code})).value.secret,secret);
 assert.deepEqual(calls.map(c=>c.url),[origin+'/api/v1/secrets',origin+'/api/v1/secrets/'+token+'/status',origin+'/api/v1/secrets/'+token+'/disclosures']);
 assert.deepEqual(JSON.parse(calls[0].init.body as string),input);
 assert.equal(calls[1].init.body,undefined);assert.deepEqual(JSON.parse(calls[2].init.body as string),{reading_code:input.reading_code});
 for(const {init} of calls){assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.referrerPolicy,'no-referrer');}
});
test('AC-10: both POST operations have one attempt on network and temporary failures',async()=>{
 for(const operation of ['create','disclose'] as const)for(const network of [true,false]){
  let calls=0;const client=new SecretClient(async()=>{calls++;if(network)throw new Error('synthetic');return fault('capacity_unavailable',503);},clock,()=>origin);
  await assert.rejects(operation==='create'?client.create({credential:'synthetic'}):client.disclose(token,{}),ClientFault);assert.equal(calls,1);
 }
});
test('AC-04 AC-10: transit and body-delivery delays consume the original service-established deadline',async()=>{
 for(const delayedBody of [false,true]){
  let mono=0,wall=0;const advance=()=>{mono=60000;wall=60000;};
  const client=new SecretClient(async()=>{if(!delayedBody){advance();return Response.json(revealed);}return new Response(new ReadableStream({start(stream){stream.enqueue(new TextEncoder().encode(JSON.stringify(revealed)));advance();stream.close();}}));},{mono:()=>mono,wall:()=>wall},()=>origin);
  await assert.rejects(client.disclose(token,{}),ClientFault);
 }
});
test('AC-10: neutral status parses every terminal variant without creating display permission',async()=>{
 for(const data of [{state:'unknown'},{state:'expired',expires_at:service},{state:'early_unavailable',expires_at:expires}]){
  const client=new SecretClient(async()=>Response.json(envelope(data)),clock,()=>origin);
  assert.deepEqual(await client.status(token),{value:data});
 }
});
test('AC-10: invalid, oversized and partial responses never produce usable Secret data',async()=>{
 const invalid:unknown[]=[{...revealed,extra:'unexpected'},envelope({...revealed.data,secret:{...secret,extra:'unexpected'}}),envelope({...revealed.data,secret:{...secret,credential:'\ud800'}}),envelope({...revealed.data,secret:{...secret,credential:' '.repeat(2)}}),envelope({...revealed.data,secret:{...secret,credential:'x'.repeat(65537)}}),{...revealed,meta:{service_time:'invalid'}},envelope({...revealed.data,expires_at:'2026-02-30T00:00:00.000Z'})];
 for(const value of invalid){const client=new SecretClient(async()=>Response.json(value),clock,()=>origin);await assert.rejects(client.disclose(token,{}),ClientFault);}
 for(const response of [new Response('{'),new Response(new Uint8Array([0xff])),new Response('x'.repeat(524289)),new Response(null),Response.json(revealed,{status:201}),fault('unrecognized',503)]){
  const client=new SecretClient(async()=>response,clock,()=>origin);await assert.rejects(client.disclose(token,{}),ClientFault);
 }
});
test('AC-04 AC-10: creation accepts only canonical same-origin capability links',async()=>{
 for(const share_url of ['https://external.example/s/'+token,origin+'/s/'+('B'.repeat(43)),origin+'/s/'+token+'?x=1',origin+'/s/'+token+'#secret','https://user:password@synthetic.example/s/'+token]){
  const client=new SecretClient(async()=>Response.json(envelope({share_url,expires_at:expires}),{status:201}),clock,()=>origin);
  await assert.rejects(client.create({credential:'synthetic'}),ClientFault);
 }
});
test('AC-10: contract-approved failures retain only safe typed codes, never server messages',async()=>{
 for(const [status,code] of [[403,'code_required'],[403,'code_incorrect'],[409,'link_unavailable'],[410,'link_expired'],[422,'invalid_request'],[413,'request_too_large'],[415,'unsupported_media_type'],[429,'verification_limited'],[503,'capacity_unavailable'],[503,'service_unavailable']] as const){
  const client=new SecretClient(async()=>fault(code,status),clock,()=>origin);
  await assert.rejects(client.disclose(token,{}),(error:unknown)=>error instanceof ClientFault && error.code===code && error.message===code);
 }
});
