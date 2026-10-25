// T19 capability probes only: never mistake command success for lifecycle evidence.
// Run while the owned HTTPS stack is healthy; no OS settings or host clipboard access.
import fs from 'node:fs';
import {chromium,firefox,delay} from './t19-drivers.mjs';
const report={};
for(const factory of [chromium,firefox]){
 const b=await factory();
 try{
  const p=await b.page();await p.goto('https://localhost:3449/');await delay(300);
  if(p.raw){
   const url=await p.eval(`fetch('/api/v1/secrets',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({credential:'[symbolic lifecycle probe]'})}).then(r=>r.json()).then(j=>j.data.share_url)`);await p.goto(url);
   for(let n=0;n<100;n++){if(await p.eval('Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Show Secret"&&!b.disabled)'))break;await delay(100);}
   await p.eval('document.querySelector("button").click()');for(let n=0;n<100;n++){if(await p.eval('document.querySelectorAll("pre").length===1'))break;await delay(100);}
   await p.eval('(()=>{window.probeEvents=[];document.addEventListener("freeze",()=>window.probeEvents.push("freeze"));document.addEventListener("resume",()=>window.probeEvents.push("resume"));return true})()');
   const c=await b.context.newCDPSession(p.raw),w=await c.send('Browser.getWindowForTarget');
   const sample=()=>p.eval('({visibility:document.visibilityState,plaintext_blocks:document.querySelectorAll("pre").length,events:window.probeEvents})');
   await c.send('Browser.setWindowBounds',{windowId:w.windowId,bounds:{windowState:'minimized'}});await delay(250);const minimized=await sample();
   await c.send('Page.setWebLifecycleState',{state:'frozen'});await delay(2300);await c.send('Page.setWebLifecycleState',{state:'active'});await delay(300);const returned=await sample();
   await c.send('Browser.setWindowBounds',{windowId:w.windowId,bounds:{windowState:'normal'}});await c.detach();report.Chrome={version:b.version,minimized,returned,real_freeze_observed:returned.events.includes('freeze')};
  }else{
   try{await b.send('emulation.setNetworkConditions',{contexts:[p.id],networkConditions:{type:'offline'}});report.Firefox={version:b.version,offline_command:'accepted',online:await p.eval('navigator.onLine')};await b.send('emulation.setNetworkConditions',{contexts:[p.id],networkConditions:null});}
   catch(e){report.Firefox={version:b.version,offline_command:'BLOCKED',protocol_error:e.message};}
  }
  await p.close();
 }finally{await b.close();}
}
fs.writeFileSync('/tmp/slp-t19-evidence/capabilities.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
