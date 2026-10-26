// AC-10: installed headed Chrome, explicit same-window tabs and observed native events.
// No synthetic lifecycle dispatch, cache-policy override, host clipboard, or frame claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium,delay} from './t19-drivers.mjs';
export const sameWindowTarget=browserContextId=>({url:'about:blank',browserContextId,newWindow:false,background:false});
export const lifecycleProved=(kind,events)=>events.some(e=>kind==='bfcache'?e.type==='pageshow'&&e.persisted===true:kind==='hidden'?e.type==='visibilitychange'&&e.visibility==='hidden':e.type==='freeze');
const origin='https://localhost:3449',file='/tmp/slp-t19-evidence/automatic-chrome-lifecycle.json';
async function main(){
 const report={browser:'chrome',cases:[],limits:['No first-compositor-frame evidence.','Genuine freeze event required; successful CDP command alone insufficient.','No no-store/security policy changes.']};
 const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');let browser,bc;
 const api=body=>new Promise((resolve,reject)=>{const r=https.request(origin+'/api/v1/secrets',{ca:fs.readFileSync('/tmp/slp-t19-synthetic/tls/cert.pem'),method:'POST',headers:{'content-type':'application/json'}},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>resolve({status:s.statusCode,json:JSON.parse(b)}));});r.on('error',reject);r.end(JSON.stringify(body));});
 const until=async(p,e)=>{for(let i=0;i<100;i++){if(await p.eval(e))return;await delay(75);}throw Error('bounded state timeout');};
 const gate=p=>until(p,'Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)&&document.querySelectorAll("pre").length===0');
 const show=async p=>{await gate(p);await p.eval('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Show Secret").click()');await until(p,'document.querySelector("h1")?.textContent==="Secret"');};
 const blocked=reason=>{throw Object.assign(Error(),{name:'CapabilityBlocked',reason});};
 const run=async(name,width,fn)=>{const start=performance.now();try{report.cases.push({name,width,result:'PASS',measured:await fn()});}catch(e){report.cases.push({name,width,result:e.name==='CapabilityBlocked'?'BLOCKED':'FAIL',error:e.name,reason:e.reason||'bounded assertion/state failure'});}report.cases.at(-1).ms=Math.round(performance.now()-start);save();console.log(name,width,report.cases.at(-1).result);};
 try{
  browser=await chromium({headless:false});report.version=browser.version;report.pid=browser.pid;
  bc=await browser.context.browser().newBrowserCDPSession();
  const cmd=execFileSync('ps',['-p',String(browser.pid),'-o','command='],{encoding:'utf8'}).trim().split(/\s+/);
  report.launch={headed:!cmd.some(x=>x.startsWith('--headless')),bfcache_disabled:cmd.includes('--disable-back-forward-cache'),flags:cmd.filter(x=>x.startsWith('--')).map(x=>x.split('=')[0]),disabled_features:cmd.find(x=>x.startsWith('--disable-features='))?.split('=')[1]};
  assert.equal(report.launch.headed,true);assert.equal(report.launch.bfcache_disabled,false);
  const processArgs=execFileSync('ps',['-p',String(browser.pid),'-o','command='],{encoding:'utf8'});report.profile=processArgs.match(/--user-data-dir=([^ ]+)/)?.[1];save();
  for(const width of [360,1280]){
   const p=await browser.page();await p.viewport(width,800);await p.raw.bringToFront();
   const cd=await browser.context.newCDPSession(p.raw);const info=await cd.send('Target.getTargetInfo');const ownWindow=await cd.send('Browser.getWindowForTarget');
   const seed=async()=>{const c=await api({credential:'owned lifecycle synthetic ASCII',lifetime_minutes:60});assert.equal(c.status,201);const response=await p.raw.goto(c.json.data.share_url);assert.ok(response.headers()['cache-control'].includes('no-store'));await p.raw.bringToFront();await gate(p);assert.equal(await p.eval('innerWidth'),width);assert.equal(await p.eval('document.documentElement.scrollWidth>innerWidth'),false);await show(p);await p.eval('(()=>{window.nativeEvents=[];for(const type of ["pageshow","pagehide","visibilitychange","freeze","resume"])document.addEventListener(type,e=>nativeEvents.push({type,persisted:e.persisted??null,visibility:document.visibilityState}));for(const type of ["pageshow","pagehide"])window.addEventListener(type,e=>nativeEvents.push({type,persisted:e.persisted,visibility:document.visibilityState}));return true})()');return c;};
   const secondTab=async()=>{
    const pending=browser.context.waitForEvent('page');const target=await bc.send('Target.createTarget',sameWindowTarget(info.targetInfo.browserContextId));const raw=await pending;await raw.waitForLoadState();const c=await browser.context.newCDPSession(raw);const wi=await c.send('Browser.getWindowForTarget');await c.send('Emulation.setFocusEmulationEnabled',{enabled:false});await raw.bringToFront();return {raw,c,window:wi.windowId,target:target.targetId};
   };
   await run('AC-10 genuine same-window hidden return status fresh Show',width,async()=>{
    await seed();let q;try{q=await secondTab();assert.equal(q.window,ownWindow.windowId);await delay(250);const hidden=await p.eval('document.visibilityState');const events=await p.eval('window.nativeEvents');report.lastHiddenProbe={width,sameWindow:true,hidden,events};if(hidden!=='hidden'||!lifecycleProved('hidden',events))blocked('Same-window tab created and activated, but native hidden event/state not observed');assert.equal(await p.eval('document.querySelectorAll("pre").length'),0);const before=await p.eval('window.t19.status');await p.raw.bringToFront();await gate(p);assert.ok(await p.eval('window.t19.status')>before);const posts=await p.eval('window.t19.posts');assert.equal(posts,1);await show(p);return {actualWidth:await p.eval('innerWidth'),sameWindow:true,hidden,events:await p.eval('window.nativeEvents'),statusCount:await p.eval('window.t19.status'),postCountBeforeFreshShow:posts};}finally{await q?.raw.close();await p.raw.bringToFront();}
   });
   await run('AC-10 native BFCache persisted return status fresh Show',width,async()=>{
    await seed();const misses=[];cd.on('Page.backForwardCacheNotUsed',e=>misses.push(e.notRestoredExplanations.map(x=>x.reason)));await cd.send('Page.enable');await p.raw.goto(origin+'/');await p.raw.goBack();await p.raw.bringToFront();await gate(p);const events=await p.eval('window.nativeEvents||[]');report.lastBFCacheProbe={width,events,notRestored:misses};if(!lifecycleProved('bfcache',events))blocked('Actual history return did not emit pageshow.persisted=true; see retained native not-restored reasons');assert.equal(await p.eval('window.t19.posts'),1);assert.ok(await p.eval('window.t19.status')>=2);await show(p);return {actualWidth:await p.eval('innerWidth'),events,statusCount:await p.eval('window.t19.status'),notRestored:misses};
   });
   await run('AC-10 native document freeze resume concealed fresh Show',width,async()=>{
    await seed();let q;try{q=await secondTab();assert.equal(q.window,ownWindow.windowId);await cd.send('Page.setWebLifecycleState',{state:'frozen'});await delay(750);}finally{await cd.send('Page.setWebLifecycleState',{state:'active'});await q?.raw.close();await p.raw.bringToFront();}const events=await p.eval('window.nativeEvents');report.lastFreezeProbe={width,events};if(!lifecycleProved('freeze',events))blocked('Native document freeze event not observed after successful CDP commands');assert.equal(await p.eval('document.querySelectorAll("pre").length'),0);await gate(p);assert.ok(await p.eval('window.t19.status')>=2);await show(p);return {actualWidth:await p.eval('innerWidth'),events,statusCount:await p.eval('window.t19.status')};
   });
   await cd.detach();await p.close();
  }
  report.errors=browser.errors;
 }catch(e){report.fatal={error:e.name,reason:'bounded harness prerequisite failure',at:e.stack?.split('\n').filter(x=>x.includes('t19-chrome-lifecycle.mjs')).map(x=>x.trim())};}
 finally{await bc?.detach();if(browser){await browser.close();try{process.kill(browser.pid,0);report.pidGone=false;}catch{report.pidGone=true;}report.profileGone=report.profile?!fs.existsSync(report.profile):null;}report.counts={};for(const c of report.cases)report.counts[c.result]=(report.counts[c.result]||0)+1;save();console.log(JSON.stringify({counts:report.counts,fatal:report.fatal,pidGone:report.pidGone,profileGone:report.profileGone}));process.exitCode=report.fatal||report.counts.FAIL?1:0;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
