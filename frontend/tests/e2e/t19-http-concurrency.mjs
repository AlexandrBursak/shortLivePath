// Bounded AC-01/07/08: owned real HTTPS, installed browsers, no native clipboard.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import https from 'node:https';
import {chromium,firefox,delay} from './t19-drivers.mjs';
const origin='https://localhost:3449',kind=process.argv[2],out='/tmp/slp-t19-evidence';
// Must precede application module capture. Only explicit owned POSTs are transformed.
export function seam(){
 if(location.origin!=='https://localhost:3449'||window.httpSlice)return;
 const native=window.fetch.bind(window),s=window.httpSlice={posts:0,http:[],mutation:null,corrupt:false,held:false,release:null};
 window.fetch=async(input,init)=>{
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  const owned=u.origin===location.origin&&(u.pathname==='/api/v1/secrets'||/^\/api\/v1\/secrets\/[A-Za-z0-9_-]{43}\/(status|disclosures)$/.test(u.pathname));
  if(!owned)return native(input,init);
  let options=init;
  if(init?.method==='POST'){s.posts++;if(s.mutation){options={...init,body:s.mutation};s.mutation=null;}}
  const response=await native(input,options); // No synthetic HTTP result for refusal cases.
  const op=u.pathname.endsWith('/status')?'status':u.pathname.endsWith('/disclosures')?'disclosure':'create';
  const meta={op,status:response.status};
  // Read only an allowlisted refusal code from a clone; never retain body/message/content.
  if(op==='disclosure'&&response.status===403){try{const code=(await response.clone().json())?.error?.code;if(['short_live_path.code_required','short_live_path.code_incorrect'].includes(code))meta.code=code;}catch{}}
  s.http.push(meta);
  if(s.corrupt&&op==='disclosure'){
   s.corrupt=false;s.held=true;await new Promise(r=>s.release=r);
   const body=await response.json();body.data.secret.login=42;
   return new Response(JSON.stringify(body),{status:response.status,headers:response.headers}); // labelled controlled malformed envelope
  }
  return response;
 };
}
const report={browser:kind,cases:[],limits:['Outgoing-body seam delegates native fetch to owned API; not user-form validation.','Malformed envelope alone is controlled mutation of held actual200, not backend invalid data.','DOM click/beforeinput activation, not native clipboard or trusted keyboard coverage.']};
const save=()=>fs.writeFileSync(`${out}/http-concurrency-${kind}.json`,JSON.stringify(report,null,2)+'\n');
async function until(p,e){for(let i=0;i<120;i++){if(await p.eval(e))return;await delay(60);}throw Error('state timeout');}
async function click(p,label){await until(p,`Array.from(document.querySelectorAll('button')).some(b=>b.textContent===${JSON.stringify(label)}&&!b.disabled)`);await p.eval(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);}
async function enter(p,id,value){await p.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.focus();e.select();e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:${JSON.stringify(value)}}));return true})()`);}
async function api(path,body){return new Promise((resolve,reject)=>{const r=https.request(origin+path,{ca:fs.readFileSync('/tmp/slp-t19-synthetic/tls/cert.pem'),method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,json:JSON.parse(b)}));});r.on('error',reject);r.end(body===undefined?undefined:JSON.stringify(body));});}
async function fixture(){const r=await api('/api/v1/secrets',{credential:'[owned http concurrency field]',reading_code:'Exact-ASCII-39',lifetime_minutes:5});assert.equal(r.status,201);return {url:r.json.data.share_url,expires:Date.parse(r.json.data.expires_at)};}
async function page(b,w){const p=await b.page();await p.viewport(w,800);return p;}
// Firefox preload is intentionally avoided. Hold JS network requests on the NEW document,
// install the wrapper post-document/pre-module, then delegate all JS requests unchanged.
export async function load(b,p,url){
 if(p.raw){await p.goto(url);}else{
  const queue=[];b.networkHandlers.set(p.id,async(method,e)=>{if(e.request.url.startsWith(origin+'/_next/')&&/\.js(?:\?|$)/.test(e.request.url))queue.push(e.request.request);else await b.send('network.continueRequest',{request:e.request.request});});
  const i=await b.send('network.addIntercept',{phases:['beforeRequestSent'],contexts:[p.id]});
  try{await b.send('browsingContext.navigate',{context:p.id,url,wait:'none'});await until(p,`location.href===${JSON.stringify(url)}&&!!document.querySelector('h1')`);await p.eval('('+seam.toString()+')()');}
  finally{await b.send('network.removeIntercept',{intercept:i.intercept});b.networkHandlers.delete(p.id);for(const request of queue)await b.send('network.continueRequest',{request});}
 }
 await until(p,'!!window.httpSlice&&!!document.querySelector("button")&&document.readyState==="complete"');
 if(url===origin+'/')await until(p,'(()=>{const f=document.querySelector("form");return !!f&&Object.keys(f).some(k=>k.startsWith("__reactProps$")&&typeof f[k].onSubmit==="function")})()');
}
async function gate(p){await until(p,'!!document.getElementById("recipient-code")&&Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');}
async function noPlain(p){assert.equal(await p.eval('document.querySelectorAll("pre").length'),0);assert.equal(await p.eval('document.body.textContent.includes("[owned http concurrency field]")'),false);}
async function layout(p,w){assert.equal(await p.eval('innerWidth'),w);assert.equal(await p.eval('document.documentElement.scrollWidth<=innerWidth'),true);}
async function test(name,fn){const start=performance.now();try{report.cases.push({name,result:'PASS',measured:await fn(),ms:Math.round(performance.now()-start)});}catch(e){report.cases.push({name,result:'FAIL',error:e.name,at:e.stack?.split('\n').filter(x=>x.includes('t19-http-concurrency')).map(x=>x.trim()),ms:Math.round(performance.now()-start)});}save();console.log(name+': '+report.cases.at(-1).result);}
let b,q;
if(kind&&import.meta.url===new URL(process.argv[1],'file:').href){try{
 b=await(kind==='firefox'?firefox():chromium());q=await(kind==='firefox'?firefox():chromium());
 report.versions=[b.version,q.version];report.pids=[b.pid,q.pid];report.profiles=[b.profile,q.profile].filter(Boolean);save();
 if(kind!=='firefox'){await b.context.addInitScript(seam);await q.context.addInitScript(seam);}
 for(const w of [360,1280]){
  const p=await page(b,w);
  for(const op of ['create','disclosure'])for(const status of [422,413])await test(`AC-${op==='create'?'01':'07'} ${w} ${op} actualHTTP${status} native-fetch outgoing-body seam`,async()=>{
   if(op==='create'){await load(b,p,origin+'/');await enter(p,'credential','[owned input retained]');}
   else{const c=await fixture();await load(b,p,c.url);await gate(p);await enter(p,'recipient-code','Exact-ASCII-39');}
   await p.eval(`window.httpSlice.mutation=${status===422?JSON.stringify('{"unknown":true}'):'JSON.stringify({credential:"x".repeat(524300)})'}`);
   const before=await p.eval('window.httpSlice.posts');await click(p,op==='create'?'Create Secret':'Show Secret');
   await until(p,op==='create'?`document.body.textContent.includes(${JSON.stringify(status===422?'The service rejected this input.':'The request is too large.')})`:'!!document.querySelector("[role=alert]")');
   const h=await p.eval('window.httpSlice.http.at(-1)');assert.equal(h.status,status);assert.equal(h.op,op);await noPlain(p);await layout(p,w);
   assert.equal(await p.eval('window.httpSlice.posts'),before+1);
   assert.equal(await p.eval(`document.getElementById('${op==='create'?'credential':'recipient-code'}').value`),op==='create'?'[owned input retained]':'Exact-ASCII-39');
   assert.equal(await p.eval('Array.from(document.querySelectorAll("a")).some(a=>/\\/s\\/[A-Za-z0-9_-]{43}/.test(a.href))'),false);
   return {actual_http:h.status,no_secret:true,no_issued_capability:true,retained_input:true,native_fetch_delegated:true};
  });
  await test(`AC-08 ${w} protected concurrent independent browser contexts and repeat Show`,async()=>{
   const r=await page(q,w),c=await fixture();try{
    await Promise.all([load(b,p,c.url),load(q,r,c.url)]);await Promise.all([gate(p),gate(r)]);
    for(const x of [p,r]){await noPlain(x);await layout(x,w);assert.equal(await x.eval('window.httpSlice.posts'),0);await enter(x,'recipient-code','Exact-ASCII-39');}
    const status=await api('/api/v1/secrets/'+c.url.split('/').at(-1)+'/status');assert.equal(status.status,200);assert.equal('secret' in status.json.data,false);assert.equal(status.json.data.reading_code_required,true);
    await Promise.all([click(p,'Show Secret'),click(r,'Show Secret')]);
    await Promise.all([until(p,'document.querySelector("h1")?.textContent==="Secret"'),until(r,'document.querySelector("h1")?.textContent==="Secret"')]);
    for(const x of [p,r]){assert.equal(await x.eval('Array.from(document.querySelectorAll("pre")).some(e=>e.textContent==="[owned http concurrency field]")'),true);assert.equal(await x.eval('window.httpSlice.posts'),1);assert.equal(await x.eval('window.httpSlice.http.at(-1).status'),200);}
    assert.ok(Date.now()<c.expires);
    await Promise.all([load(b,p,c.url),load(q,r,c.url)]);await Promise.all([gate(p),gate(r)]);
    for(const x of [p,r]){await noPlain(x);assert.equal(await x.eval('window.httpSlice.posts'),0);await enter(x,'recipient-code','Exact-ASCII-39');}
    await Promise.all([click(p,'Show Secret'),click(r,'Show Secret')]);await Promise.all([until(p,'document.querySelector("h1")?.textContent==="Secret"'),until(r,'document.querySelector("h1")?.textContent==="Secret"')]);
    for(const x of [p,r])assert.equal(await x.eval('window.httpSlice.http.at(-1).status'),200);assert.ok(Date.now()<c.expires);
    return {independent_browser_processes:2,initial_auto_posts:0,concurrent_correct_disclosures:2,repeat_explicit_disclosures:2,before_original_deadline:true,link_consumed:false,activation:'DOM click; ASCII beforeinput; no clipboard'};
   }finally{await r.close();}
  });
  if(kind==='firefox')await test(`AC-08 ${w} whole invalid response held actual200 controlled mutation`,async()=>{
   const c=await fixture();await load(b,p,c.url);await gate(p);await enter(p,'recipient-code','Exact-ASCII-39');
   await p.eval('(()=>{window.everPlain=false;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n instanceof Element&&(n.matches("pre")||n.querySelector("pre")))window.everPlain=true;}).observe(document.body,{childList:true,subtree:true});window.httpSlice.corrupt=true;return true})()');
   await click(p,'Show Secret');await until(p,'window.httpSlice.held');await noPlain(p);assert.equal(await p.eval('window.httpSlice.http.at(-1).status'),200);await p.eval('window.httpSlice.release()');await until(p,'!!document.querySelector("[role=alert]")');await noPlain(p);assert.equal(await p.eval('window.everPlain'),false);await layout(p,w);
   return {actual_http:200,held_before_mutation:true,controlled_invalid_login_type:true,backend_invalid_data:false,ever_plain:false};
  });
  await p.close();
 }
 report.errors=[b.errors,q.errors];assert.equal(b.errors.page+q.errors.page,0);
}catch(e){report.fatal={error:e.name,at:e.stack?.split('\n').filter(x=>x.includes('t19-http-concurrency'))};}finally{
 for(const x of [b,q])if(x)await x.close();report.pidGone=(report.pids||[]).map(pid=>{try{process.kill(pid,0);return false;}catch{return true;}});save();process.exitCode=report.fatal||report.cases.some(c=>c.result==='FAIL')?1:0;console.log(JSON.stringify({browser:kind,pass:report.cases.filter(c=>c.result==='PASS').length,fail:report.cases.filter(c=>c.result==='FAIL').length,fatal:report.fatal}));
}}
