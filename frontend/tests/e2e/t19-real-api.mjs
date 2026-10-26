// T19 AC-01..10/11b/12 + NFR-06: actual installed desktop browsers, real HTTPS/API/stores.
// Run: node frontend/tests/e2e/t19-real-api.mjs chrome|firefox
// Payloads/capabilities never enter report output. Clipboard/paste seams are explicitly controlled, not OS clipboard proof.
import assert from 'node:assert/strict';import fs from 'node:fs';import https from 'node:https';import {execFileSync} from 'node:child_process';import crypto from 'node:crypto';import hooks from './t19-hooks.mjs';
import {chromium,firefox,delay} from './t19-drivers.mjs';
const origin='https://localhost:3449',out='/tmp/slp-t19-evidence',ca=fs.readFileSync('/tmp/slp-t19-synthetic/tls/cert.pem');
const report={browser:process.argv[2],cases:[],limits:['No host clipboard access; clipboard submission and copy-event data measured at controlled seams.','360px is viewport only, not a phone.','No whole-host clock change or laptop sleep.']};
let browser;
const exact='T19_RAW  \t e\u0301 😀 𝄞 CRLF\r\nCR\rLF\n <script>inert</script> https://t19.invalid/ '+'LONG'.repeat(300)+' \t  ';
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/'+report.browser+'.json',JSON.stringify(report,null,2)+'\n');}
async function test(name,fn){if(process.env.T19_FILTER&&!name.includes(process.env.T19_FILTER)){report.cases.push({name,result:'NOT RUN (filtered)'});save();return;}const start=performance.now();try{const measured=await fn();report.cases.push({name,result:'PASS',ms:Math.round(performance.now()-start),...(measured?{measured}:{})});}catch(e){report.cases.push({name,result:e.name==='CapabilityBlocked'?'BLOCKED':'FAIL',error:e.name,...(e.measured?{measured:e.measured}:{}),location:(e.stack||'').split('\n').filter(s=>s.includes('t19-real-api.mjs')).map(s=>s.trim()),ms:Math.round(performance.now()-start)});}save();console.log(name+': '+report.cases.at(-1).result);}
async function request(path,body){return new Promise((resolve,reject)=>{const req=https.request(origin+path,{ca,method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{try{assert.match(r.headers['cache-control'],/no-store/);assert.equal(r.headers['referrer-policy'],'no-referrer');resolve({status:r.statusCode,json:JSON.parse(b)});}catch{reject(Error('safe API envelope assertion'));}});});req.on('error',()=>reject(Error('HTTPS request failed')));if(body!==undefined)req.end(JSON.stringify(body));else req.end();});}
async function create(body){const r=await request('/api/v1/secrets',body);assert.equal(r.status,201);return r.json.data.share_url;}
const api=url=>'/api/v1/secrets/'+url.split('/').at(-1);
async function until(p,expression){for(let i=0;i<150;i++){if(await p.eval(expression))return;await delay(100);}throw Error('state timeout');}
const count=p=>p.eval('document.querySelectorAll("pre").length');
async function button(p,text){await until(p,`Array.from(document.querySelectorAll('button')).some(b=>b.textContent===${JSON.stringify(text)}&&!b.disabled)`);await p.eval(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(text)}).focus()`);await p.key('Enter');}
async function paste(p,id,value){await p.eval(`(()=>{const el=document.getElementById(${JSON.stringify(id)});el.focus();el.select();${p.metrics?`el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:${JSON.stringify(value)}}));`:`const data=new DataTransfer();data.setData('text/plain',${JSON.stringify(value)});el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));`}return true})()`);}
async function show(p,code){if(p.id){await browser.send('browsingContext.activate',{context:p.id});await p.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}await until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');if(code!==undefined)await paste(p,'recipient-code',code);await button(p,'Show Secret');await until(p,'document.querySelector("h1")?.textContent==="Secret"');}
async function load(p,url){await p.goto(url);await until(p,'document.querySelector("h1") && document.readyState==="complete"');}
async function layout(p){assert.equal(await p.eval('!document.querySelector("time")||document.querySelector("time").textContent.includes("UTC")'),true);assert.equal(await p.eval('document.documentElement.scrollWidth<=innerWidth'),true);assert.equal(await p.eval('Array.from(document.querySelectorAll("input:not([type=checkbox]),textarea")).every(e=>e.labels?.length>0)'),true);assert.equal(await p.eval('Array.from(document.querySelectorAll("[role=status],[role=alert]")).every(e=>!e.textContent.includes("T19_RAW"))'),true);}
async function install(p){if(!await p.eval('Boolean(window.t19)'))await p.eval('('+hooks.toString()+')()');assert.equal(await p.eval('Boolean(window.t19)'),true);}
const posts=p=>p.metrics?Promise.resolve(p.metrics.posts):p.eval('window.t19.posts');
async function shot(p,name){await p.eval(`(()=>{for(const e of document.querySelectorAll('pre'))e.textContent='[symbolic synthetic field]';for(const e of document.querySelectorAll('textarea'))if(e.value!=='')e.value='[symbolic synthetic field]';return true})()`);await p.shot(out+'/'+report.browser+'-'+name+'.png');}
(async()=>{
 browser=await (process.argv[2]==='firefox'?firefox():chromium());report.version=browser.version;save();
 for(const width of [360,1280]){
  const p=await browser.page();await p.viewport(width,800);
  let link;
  await test(`AC-01/02/04/05/06 NFR-06 ${width}: SCR01 keyboard validation minute61 generation creation SCR02`,async()=>{
   await load(p,origin+'/');await install(p);await layout(p);
   await button(p,'Create Secret');await until(p,'document.querySelector("[role=alert]")!==null');assert.equal(await posts(p),0);
   assert.equal(await p.eval('document.activeElement?.textContent.includes("Check the highlighted fields.")'),true);
   for(const id of ['address','login','credential'])await paste(p,id,exact);
   await p.eval(`(()=>{const el=document.getElementById('minutes');el.focus();el.select();return true})()`);
   if(p.raw)await p.raw.keyboard.insertText('61');else{await p.key('6');await p.key('1');}
   await p.key('Tab');assert.equal(await p.eval('document.getElementById("minutes").value'),'61');
   await p.eval('document.querySelector("input[type=checkbox]").focus()');await p.key('Space');await button(p,'Generate 20-character code');
   assert.match(await p.eval('document.getElementById("reading-code").value'),/^[A-Za-z0-9]{20}$/);
   await paste(p,'reading-code','  é😀 code\r\n  ');
   await button(p,'Create Secret');try{await until(p,'document.querySelector("h1")?.textContent==="Secret created"');}catch(e){report.creationDiagnostic=await p.eval('({heading:document.querySelector("h1")?.textContent,visibility:document.visibilityState,alerts:Array.from(document.querySelectorAll("[role=alert]")).map(e=>e.textContent),lengths:Array.from(document.querySelectorAll("textarea")).map(e=>e.value.length),minutes:document.getElementById("minutes")?.value})');throw e;}
   link=await p.eval('Array.from(document.querySelectorAll("pre")).find(e=>e.getAttribute("aria-label")==="Share link").textContent');assert.ok(link.startsWith(origin+'/s/'));const digest=crypto.createHash('sha256').update(Buffer.from(link.split('/').at(-1),'base64url')).digest('hex');const duration=execFileSync('docker',['exec','slp-t19-postgres-1','psql','-U','slp','-d','slp','-Atc',`SELECT extract(epoch FROM expires_at-created_at)::integer FROM link_lifecycles WHERE token_digest=decode('${digest}','hex')`],{encoding:'utf8'}).trim();assert.equal(duration,'3660');assert.equal(await p.eval('document.body.textContent.includes("T19_RAW")'),false);
   assert.equal((await request(api(link)+'/status')).json.data.reading_code_required,true);await layout(p);
   await button(p,'Copy code');await until(p,'document.querySelector("[role=status]")?.textContent==="Reading code copied."');assert.deepEqual(await p.eval('window.t19.writes'),['  é😀 code\r\n  ']);
   await shot(p,'SCR02-'+width);return {explicit_creations:1,minute:61,clipboard:'controlled submission exact'};
  });
  await test(`AC-03/06/08/12 NFR-06 ${width}: SCR03 neutral explicit Show SCR04 exact source and manual fallback`,async()=>{
   assert.ok(link);await load(p,link);await until(p,'document.getElementById("recipient-code")!==null');await install(p);await layout(p);
   assert.equal(await count(p),0);assert.equal(await p.eval('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/disclosures")).length'),0);await shot(p,'SCR03-'+width);
   await show(p,'  é😀 code\r\n  ');assert.equal(await p.eval('document.activeElement===document.querySelector("h1")'),true);
   for(const label of ['Address','Login','Password or key']){
    const selector='pre[aria-label='+JSON.stringify(label)+']',target='document.querySelector('+JSON.stringify(selector)+')';assert.equal(await p.eval(target+'.textContent'),exact);await layout(p);await p.eval('(()=>{window.t19.writes=[];window.t19.mode="success";return true})()');
    await button(p,'Copy '+label.toLowerCase());await until(p,'Array.from(document.querySelectorAll("[role=status]")).some(e=>e.textContent==='+JSON.stringify(label+' copied.')+')');assert.deepEqual(await p.eval('window.t19.writes'),[exact]);
    await p.eval('window.t19.mode="denied"');await button(p,'Copy '+label.toLowerCase());await until(p,'Array.from(document.querySelectorAll("[role=status]")).some(e=>e.textContent==='+JSON.stringify('Could not copy. Select the '+label.toLowerCase()+' manually while it remains eligible.')+')');assert.equal(await p.eval(target+'===document.activeElement'),true);
    for(const partial of [false,true]){const manual=await p.eval(`(()=>{const el=${target},r=document.createRange();if(${partial}){r.setStart(el.firstChild,2);r.setEnd(el.firstChild,60);}else r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);const d=new DataTransfer(),event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:d});Object.defineProperty(event,'clipboardData',{value:d});el.dispatchEvent(event);return d.getData('text/plain')})()`);assert.equal(manual,partial?exact.slice(2,60):exact);}
   }
   await p.eval('getSelection().removeAllRanges()');await p.key('ArrowRight');await p.key('ArrowRight');await until(p,'document.activeElement.tagName==="PRE"&&document.activeElement.scrollLeft>0');
   assert.equal(await p.eval('document.querySelectorAll("pre a,pre img,pre script").length'),0);assert.equal(await p.eval('performance.getEntriesByType("resource").filter(e=>!e.name.startsWith(location.origin+"/")).length'),0);
   assert.equal(await p.eval('Array.from(document.querySelectorAll("[aria-label]")).find(e=>e.getAttribute("aria-label").startsWith("Remaining lifetime")).closest("[aria-live],[role=status],[role=alert]")===null'),true);
   assert.equal(await p.eval('window.t19.csp'),0);await shot(p,'SCR04-'+width);return {clipboard:'controlled exact full/manual source',automatic_disclosures:0};
  });
  await test(`AC-08 ${width}: repeat and simultaneous unprotected readers no consumption`,async()=>{
   const url=await create({credential:'[symbolic synthetic credential]'}),q=await browser.page();await q.viewport(width,800);
   try{await Promise.all([load(p,url),load(q,url)]);const concurrentShow=async target=>{await until(target,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');await target.eval('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Show Secret").click()');await until(target,'document.querySelector("h1")?.textContent==="Secret"');};await Promise.all([concurrentShow(p),concurrentShow(q)]);assert.equal(await count(p),1);assert.equal(await count(q),1);await load(p,url);assert.equal(await count(p),0);await show(p);assert.equal((await request(api(url)+'/status')).json.data.state,'available');}finally{await q.close();}
  });
  await test(`AC-09/11b/12 NFR-06 ${width}: SCR05 unknown early-loss distinct safe focused keyboard restart`,async()=>{
   await load(p,origin+'/s/'+'A'.repeat(43));await until(p,'document.querySelector("h1")?.textContent==="The Secret at this link is unavailable"');await layout(p);await shot(p,'SCR05-unknown-'+width);
   const url=await create({credential:'[symbolic loss fixture]'}),token=url.split('/').at(-1),digest=crypto.createHash('sha256').update(Buffer.from(token,'base64url')).digest('hex');
   const id=execFileSync('docker',['exec','slp-t19-postgres-1','psql','-U','slp','-d','slp','-Atc',`SELECT id FROM link_lifecycles WHERE token_digest=decode('${digest}','hex')`],{encoding:'utf8'}).trim();assert.match(id,/^[a-f0-9-]{36}$/);
   execFileSync('docker',['exec','slp-t19-redis-1','redis-cli','DEL','slp:t19synthetic:secret:'+id+':payload']);
   await load(p,url);await until(p,'document.querySelector("h1")?.textContent==="The Secret became unavailable before expiry"');assert.equal(await count(p),0);assert.equal(await p.eval('document.activeElement===document.querySelector("h1")'),true);await layout(p);await shot(p,'SCR05-early-'+width);
   await p.eval('document.querySelector("a").focus()');await p.key('Enter');await until(p,'document.querySelector("h1")?.textContent==="Create a Secret"');assert.equal(await p.eval('document.getElementById("credential").value'),'');await shot(p,'SCR01-'+width);
  });
  await test(`AC-01/04/06/08 NFR-06 ${width}: native Tab-only primary creation generation Show copy flow`,async()=>{
   await load(p,origin+'/');await install(p);await p.eval('(()=>{document.body.tabIndex=-1;document.body.focus();return true})()');const seen=new Set();let generated=false,steps=0;
   for(;steps<30;steps++){await p.key('Tab');const key=await p.eval('(()=>{const e=document.activeElement;return e.id||(e.type==="checkbox"?"protection":e.tagName==="BUTTON"?e.textContent:"")})()');if(key)seen.add(key);if(key==='credential')await p.key('x');if(key==='lifetime-range')await p.key('ArrowRight');if(key==='protection')await p.key('Space');if(key==='Generate 20-character code'&&!generated){await p.key('Enter');generated=true;}if(key==='Create Secret')break;}
   for(const key of ['address','login','credential','lifetime-range','minutes','protection','reading-code','Generate 20-character code','Create Secret'])assert.ok(seen.has(key));assert.equal(await p.eval('getComputedStyle(document.activeElement).outlineWidth!=="0px"'),true);const code=await p.eval('document.getElementById("reading-code").value');await p.key('Enter');await until(p,'document.querySelector("h1")?.textContent==="Secret created"');const url=await p.eval('document.querySelector("pre").textContent');await load(p,url);await until(p,'document.getElementById("recipient-code")!==null');await install(p);
   // Gate heading is focused by the app; Tabs reach countdown then code and Show.
   for(let i=0;i<10;i++){await p.key('Tab');if(await p.eval('document.activeElement.id==="recipient-code"'))break;}
   assert.equal(await p.eval('document.activeElement.id'),'recipient-code');for(const char of code)await p.key(char);await p.key('Tab');assert.equal(await p.eval('document.activeElement.textContent'),'Show Secret');await p.key('Enter');await until(p,'document.querySelector("h1")?.textContent==="Secret"');for(let i=0;i<10;i++){await p.key('Tab');if(await p.eval('document.activeElement.tagName==="BUTTON"'))break;}assert.equal(await p.eval('document.activeElement.textContent'),'Copy password or key');await p.key('Enter');await until(p,'document.querySelector("[role=status]")?.textContent==="Password or key copied."');assert.deepEqual(await p.eval('window.t19.writes'),['x']);return {native_tab_steps_to_create:steps+1,visible_keyboard_focus:true};
  });
  await p.close();
 }
 const p=await browser.page();await p.viewport(360,800);let url;
 await test('AC-07: actual API five observed failures throttled UI without plaintext',async()=>{
  url=await create({credential:'[symbolic throttle fixture]',reading_code:'exact-code'});await load(p,url);await until(p,'document.getElementById("recipient-code")!==null');await install(p);
  for(let i=0;i<5;i++){await paste(p,'recipient-code','bad');await button(p,'Show Secret');await until(p,'document.querySelector("#recipient-code-error")?.textContent.includes("incorrect")');}
  await paste(p,'recipient-code','exact-code');await button(p,'Show Secret');await until(p,'document.querySelector("#reader-error")?.textContent.includes("temporarily limited")');assert.equal(await count(p),0);return {actual_wrong_codes:5,limited_correct_attempts:1};
 });
 await test('AC-04/10: browser-only wall-clock rollback hides, neutral recheck then fresh Show',async()=>{
  url=await create({credential:'[symbolic wall-clock fixture]'});await load(p,url);await show(p);await install(p);
  await p.eval('(()=>{window.t19.now=Date.now;Date.now=()=>window.t19.now()-3600000;return true})()');await until(p,'document.querySelectorAll("pre").length===0');
  await p.eval('Date.now=window.t19.now');await button(p,'Check availability again');await until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');assert.equal(await posts(p),1);await show(p);return {scope:'page Date.now only, host clock untouched'};
 });
 await test('AC-10: actual navigation/pagehide/history return concealed and fresh explicit Show',async()=>{
  url=await create({credential:'[symbolic history fixture]'});await load(p,url);await show(p);
  await p.eval('(()=>{window.t19Persisted=[];addEventListener("pageshow",e=>window.t19Persisted.push(e.persisted));return true})()');
  await load(p,origin+'/');if(p.raw)await p.raw.goBack();else await browser.send('browsingContext.traverseHistory',{context:p.id,delta:-1});
  await until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');assert.equal(await count(p),0);const persisted=await p.eval('window.t19Persisted??[]');await show(p);return {pageshow_persisted: persisted,real_bfcache: persisted.includes(true)};
 });
 await test('AC-10: actual tab background/return neutral revalidation and fresh Show',async()=>{
  url=await create({credential:'[symbolic background fixture]'});await load(p,url);await show(p);const q=await browser.page(p.id);
  try{await load(q,origin+'/');if(p.raw)await q.raw.bringToFront();else await browser.send('browsingContext.activate',{context:q.id});
   const visibility=await p.eval('document.visibilityState');if(visibility!=='hidden'){const e=Error();e.name='CapabilityBlocked';throw e;}
   assert.equal(await count(p),0);if(p.raw)await p.raw.bringToFront();else await browser.send('browsingContext.activate',{context:p.id});await until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');assert.equal(await count(p),0);await show(p);return {observed_hidden:true};
  }finally{await q.close();}
 });
 await test('AC-10: actual owned browser process suspension/return requires neutral recheck and fresh Show',async()=>{
  url=await create({credential:'[symbolic suspend fixture]'});await load(p,url);await show(p);
  const tree=execFileSync('ps',['-axo','pid=,ppid='],{encoding:'utf8'}).trim().split('\n').map(x=>x.trim().split(/\s+/).map(Number)),owned=new Set([browser.pid]);let changed=true;
  while(changed){changed=false;for(const [pid,ppid] of tree)if(owned.has(ppid)&&!owned.has(pid)){owned.add(pid);changed=true;}}
  assert.ok(!owned.has(process.pid));const pids=[...owned];let stopped=0;
  try{for(const pid of pids){process.kill(pid,'SIGSTOP');stopped++;}await delay(2300);assert.ok(execFileSync('ps',['-o','state=','-p',String(browser.pid)],{encoding:'utf8'}).includes('T'));}finally{for(const pid of pids){try{process.kill(pid,'SIGCONT');}catch{}}}
  await until(p,'document.querySelectorAll("pre").length===0');if(await p.eval('Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Check availability again")'))await button(p,'Check availability again');await show(p);return {mechanism:'SIGSTOP/SIGCONT owned PID tree only',stopped_processes:stopped,held_ms:2300,host_sleep:false};
 });
 await test('AC-04 NFR-06: every minute1..1440 via actual range keyboard stays synchronized',async()=>{
  await load(p,origin+'/');await p.eval('document.getElementById("lifetime-range").focus()');await p.key('Home');assert.equal(await p.eval('document.getElementById("minutes").value'),'1');
  for(let minute=2;minute<=1440;minute++){await p.key('ArrowRight');assert.equal(await p.eval('Number(document.getElementById("minutes").value)'),minute);}
  await p.key('Home');assert.equal(await p.eval('document.getElementById("minutes").value'),'1');return {independently_asserted_minutes:1440};
 });
 if(p.raw)await test('AC-10: actual CDP freeze/resume concealed and fresh Show',async()=>{
  url=await create({credential:'[symbolic freeze fixture]'});await load(p,url);await show(p);
  const cdp=await browser.context.newCDPSession(p.raw);await cdp.send('Page.setWebLifecycleState',{state:'frozen'});await delay(2200);await cdp.send('Page.setWebLifecycleState',{state:'active'});await delay(500);if(await count(p)>0){await cdp.detach();const e=Error();e.name='CapabilityBlocked';e.measured={mechanism:'Page.setWebLifecycleState returned success but emitted no freeze and did not stop visible page; not a real freeze proof'};throw e;}await until(p,'document.querySelectorAll("pre").length===0');if(await p.eval('Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Check availability again")'))await button(p,'Check availability again');await until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');await show(p);await cdp.detach();return {mechanism:'CDP Page.setWebLifecycleState, not OS sleep'};
 });
 await test('AC-10: real one-minute expiry, late real response and clipboard completion cannot restore plaintext',async()=>{
  url=await create({credential:'[symbolic expiry fixture]',lifetime_minutes:1});const late=await browser.page();let intercept;await late.viewport(360,800);
  try{await load(p,url);await show(p);await install(p);await p.eval('window.t19.mode="pending"');await button(p,'Copy password or key');
   await load(late,url);if(late.id){await browser.send('browsingContext.activate',{context:late.id});await late.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}await until(late,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)');await install(late);await late.eval('(()=>{new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element&&(node.matches("pre")||node.querySelector("pre")))window.t19.everPlain=true;}).observe(document.body,{childList:true,subtree:true});return true})()');if(late.id)intercept=await browser.delayResponse(late,20000);else await late.eval('window.t19.delay=20000');await delay(45000);await button(late,'Show Secret');
   // A running offline page: real Chrome network emulation; Firefox has no equivalent adapter here.
   if(p.raw){const cdp=await browser.context.newCDPSession(p.raw);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});await until(p,'document.querySelectorAll("pre").length===0');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await cdp.detach();}
   await delay(22000);await p.eval('window.t19.finish()');assert.equal(await count(p),0);assert.equal(await count(late),0);assert.equal(await posts(late),1);assert.equal(await late.eval('window.t19.everPlain'),false);assert.equal(late.metrics?late.metrics.delayedStatus:await late.eval('window.t19.lastDisclosureStatus'),200);assert.equal((await request(api(url)+'/disclosures',{})).status,410);
   assert.equal(await p.eval('document.body.textContent.includes("copied.")'),false);await load(p,url);await until(p,'document.querySelector("h1")?.textContent==="This Share link has expired"');for(const width of [360,1280]){await p.viewport(width,800);await layout(p);await shot(p,'SCR05-expired-'+width);}if(late.id)assert.equal(late.metrics.delayed,1);return {pre_show_wait_ms:45000,response_delay_ms:20000,post_show_wait_ms:22000,real_API_release_after_expiry:410,inflight_response_status:200,ever_plain:false,delayed_responses:late.metrics?.delayed??1,delay_mechanism:p.raw?'pre-module fetch wrapper, unmodified real HTTPS response':'native BiDi responseStarted interception/continueResponse',offline_network:p.raw?'CDP real network offline':'NOT COVERED'};
  }finally{if(intercept)await browser.send('network.removeIntercept',{intercept:intercept.intercept});await late.close();}
 });
 report.errors=browser.errors;await p.close();
})().catch(e=>{report.fatal=e.name;process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();report.resources_closed=true;try{process.kill(browser?.pid,0);report.browser_pid_gone=false;}catch{report.browser_pid_gone=true;}if(report.cases.some(c=>c.result==='FAIL')||report.fatal)process.exitCode=1;else if(report.cases.some(c=>c.result==='BLOCKED'))process.exitCode=2;save();console.log(JSON.stringify({browser:report.browser,version:report.version,pass:report.cases.filter(c=>c.result==='PASS').length,fail:report.cases.filter(c=>c.result==='FAIL').length,errors:report.errors,fatal:report.fatal}));});
