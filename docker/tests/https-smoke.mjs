// T17 AC-08/10/11: actual TLS, direct API and browser nonce/hydration smoke.
import assert from 'node:assert/strict';
import https from 'node:https';
import fs from 'node:fs';
const origin=process.env.ORIGIN??'https://localhost:3447';
const ca=fs.readFileSync(process.env.CA_FILE);
let checks=0;
export async function request(path,body,headers={},method){
 return new Promise((resolve,reject)=>{
  const req=https.request(origin+path,{ca,method:method??(body===undefined?'GET':'POST'),headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...headers}},res=>{
   const parts=[];res.on('data',b=>parts.push(b));res.on('end',()=>{
    assert.match(res.headers['cache-control'],/no-store/);assert.equal(res.headers['referrer-policy'],'no-referrer');checks++;
    const text=Buffer.concat(parts).toString();let json;try{json=JSON.parse(text);}catch{}
    resolve({status:res.statusCode,headers:res.headers,text,json});
   });
  });req.on('error',reject);if(body!==undefined)req.write(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));req.end();
 });
}
const shellPolicy=await request('/');assert.equal(shellPolicy.status,200);assert.match(shellPolicy.headers['content-security-policy'],/script-src[^;]*'nonce-/);
assert.equal((await request('/t17-no-such-page')).status,404);
assert.equal((await request('/api/v1/secrets',undefined,{'X-T17-Rejected':'x'.repeat(17000)})).status,400);
const canary='T17_SYNTHETIC_CREDENTIAL';
const created=await request('/api/v1/secrets',{credential:canary,reading_code:'T17-code'});
assert.equal(created.status,201);assert.ok(created.json.data.share_url.startsWith(origin+'/s/'));
const token=created.json.data.share_url.split('/').at(-1);
const api='/api/v1/secrets/'+token;
assert.equal((await request(api+'/status')).json.data.state,'available');
assert.equal((await request(api+'/disclosures',{})).status,403);
assert.equal((await request(api+'/disclosures',{reading_code:'wrong'})).status,403);
assert.equal((await request(api+'/disclosures',{reading_code:'T17-code'})).json.data.secret.credential,canary);
assert.equal((await request('/api/v1/unknown')).status,503); // backend's safe unknown-route envelope, never Next HTML
for(const path of ['/health/live','/health/ready','/health','/health%2fready'])assert.equal((await request(path)).status,404);
assert.equal((await request('/api/v1/secrets',{})).status,422);
assert.equal((await request('/api/v1/secrets','{}',{'Content-Encoding':'gzip'})).status,415);
for(const body of [Buffer.from('{"credential":"\\ud800"}'),Buffer.concat([Buffer.from('{"credential":"'),Buffer.from([0xc3,0x28]),Buffer.from('"}')])])assert.equal((await request('/api/v1/secrets',body)).status,422);
const base=Buffer.from('{"credential":"exact-wire"}');const exact=Buffer.concat([base,Buffer.alloc(524288-base.length,32)]);
assert.equal((await request('/api/v1/secrets',exact)).status,201);
assert.equal((await request('/api/v1/secrets',Buffer.concat([exact,Buffer.from(' ')]))).status,413);
for(const xff of ['192.0.2.2','192.0.2.2, 192.0.2.3',['192.0.2.2','192.0.2.3']])assert.equal((await request('/api/v1/secrets',{credential:'spoof'},{'X-Forwarded-For':xff,Forwarded:'for=192.0.2.3'})).status,201);
if(process.env.BROWSER){
 const {chromium}=await import('/home/node/app/node_modules/@playwright/test/index.mjs');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({ignoreHTTPSErrors:true}); // isolated test cert only; curl/Node above validate TLS
 const page=await context.newPage(),errors=[],posts=[],external=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());if(!r.url().startsWith(origin))external.push(r.url());});
 await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.violatedDirective));});
 const shell=await page.goto(created.json.data.share_url);assert.ok(!(await shell.text()).includes(canary));
 await page.getByRole('button',{name:'Show Secret',exact:true}).waitFor();
 assert.equal(posts.length,0);assert.ok(!(await page.content()).includes(canary));
 await page.getByLabel('Reading code',{exact:true}).fill('T17-code');
 await page.getByRole('button',{name:'Show Secret',exact:true}).click();
 await page.getByText(canary,{exact:true}).waitFor();
 assert.equal(posts.length,1);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
 await page.screenshot({path:'/evidence/https-reading.png'});
 await browser.close();console.log('Browser TLS neutral shell → explicit Show: hydrated, 0 console/page/CSP errors, 0 external requests.');
}
console.log(JSON.stringify({checks,token,canary}));
