// T19 AC-03/06/08/10 NFR-06: supplemental native clipboard, isolated Linux clipboard only.
// Actual HTTPS/API/PG/Redis. Bundled Chromium is NOT an installed-desktop-browser substitute.
import assert from 'node:assert/strict';import net from 'node:net';import https from 'node:https';import fs from 'node:fs';
import {chromium} from '/home/node/app/node_modules/@playwright/test/index.mjs';
const text=' \tCRLF\r\nCR\rLF\n e\u0301 😀 𝄞 <script>inert</script> https://t19.invalid/ '+ 'LONG'.repeat(300)+' \t ';
const values={address:text+'address',login:text+'login',credential:text+'credential'},code=' é😀 raw-code\r\n ';
const origin='https://localhost:3449',evidence='/evidence';let checks=0;const errors={console:0,page:0,csp:0},report={};
const tunnel=net.createServer(client=>{const up=net.connect(8443,'proxy');client.pipe(up).pipe(client);up.on('error',()=>client.destroy());client.on('error',()=>up.destroy());});
const verifier=https.createServer({key:fs.readFileSync('/ca/key.pem'),cert:fs.readFileSync('/ca/cert.pem')},(_,r)=>{r.setHeader('Cache-Control','no-store');r.end('<!doctype html><title>Isolated clipboard verifier</title><p>[symbolic clipboard verifier]</p>');});
let browser;
function check(a,b){assert.deepEqual(a,b);checks++;}
(async()=>{
 await new Promise(r=>tunnel.listen(3449,'127.0.0.1',r));await new Promise(r=>verifier.listen(3452,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});report.version=browser.version();
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:360,height:800}});await context.grantPermissions(['clipboard-read','clipboard-write']);
 const page=await context.newPage(),verify=await context.newPage();
 page.on('console',m=>{if(m.type()==='error')errors.console++;});page.on('pageerror',()=>errors.page++);
 await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',()=>window.t19Csp=(window.t19Csp||0)+1));
 await verify.goto('https://localhost:3452');
 async function paste(label,value){await verify.evaluate(v=>navigator.clipboard.writeText(v),value);await page.getByLabel(label,{exact:true}).focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('ControlOrMeta+V');}
 async function readClipboard(){return verify.evaluate(()=>navigator.clipboard.readText());}
 await page.goto(origin);await page.getByRole('button',{name:'Create Secret',exact:true}).click();await page.getByRole('alert').first().waitFor();
 for(const [field,label]of [['address','Address (optional)'],['login','Login (optional)'],['credential','Password or key']])await paste(label,values[field]);
 await page.getByLabel('Exact minutes',{exact:true}).fill('61');await page.getByLabel('Require a separate Reading code').check();await paste('Reading code',code);
 await page.getByRole('button',{name:'Create Secret',exact:true}).click();await page.getByRole('heading',{name:'Secret created',exact:true}).waitFor();
 const link=await page.getByLabel('Share link',{exact:true}).textContent();check(await page.locator('pre').count(),2);
 await page.getByRole('button',{name:'Copy code',exact:true}).click();await page.getByText('Reading code copied.',{exact:true}).waitFor();check(await readClipboard(),code);
 await page.getByRole('button',{name:'Copy link',exact:true}).click();await page.getByText('Share link copied.',{exact:true}).waitFor();check(await readClipboard(),link);
 await page.goto(link);await page.getByRole('button',{name:'Show Secret',exact:true}).waitFor();check(await page.locator('pre').count(),0);await paste('Reading code',code);await page.getByRole('button',{name:'Show Secret',exact:true}).click();await page.getByRole('heading',{name:'Secret',exact:true}).waitFor();
 for(const [field,label]of [['address','Address'],['login','Login'],['credential','Password or key']]){
  const node=page.getByLabel(label,{exact:true});check(await node.textContent(),values[field]);await page.getByRole('button',{name:'Copy '+label.toLowerCase(),exact:true}).click();await page.getByText(label+' copied.',{exact:true}).waitFor();check(await readClipboard(),values[field]);
 }
 await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(Error('controlled denial'))}));
 for(const [field,label]of [['address','Address'],['login','Login'],['credential','Password or key']]){
  await page.getByRole('button',{name:'Copy '+label.toLowerCase(),exact:true}).click();await page.getByText('Could not copy. Select the '+label.toLowerCase()+' manually while it remains eligible.',{exact:true}).waitFor();
  const node=page.getByLabel(label,{exact:true});check(await node.evaluate(el=>el===document.activeElement),true);
  for(const partial of [false,true]){await node.evaluate((el,partial)=>{const r=document.createRange();if(partial){r.setStart(el.firstChild,2);r.setEnd(el.firstChild,60);}else r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);},partial);await page.keyboard.press('ControlOrMeta+C');check(await readClipboard(),partial?values[field].slice(2,60):values[field]);}
 }
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);check(await page.locator('pre a, pre script').count(),0);errors.csp=await page.evaluate(()=>window.t19Csp||0);check(errors,{console:0,page:0,csp:0});
 Object.assign(report,{checks,fields:3,native_manual_whole:3,native_manual_partial:3,native_automatic_fields:3,errors,clipboard_scope:'isolated Docker Linux headless clipboard; no host clipboard access',result:'PASS'});
})().catch(e=>{Object.assign(report,{result:'FAIL',error:e.name,checks});process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();tunnel.close();verifier.close();fs.writeFileSync(evidence+'/container-native-copy.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));});
