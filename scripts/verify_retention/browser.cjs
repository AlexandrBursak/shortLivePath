// T18 AC-07/11: single Chromium persistence audit, NOT T19 browser matrix.
// No screenshots/traces/URL/body diagnostics. Entire browser /tmp is tmpfs.
const net = require('node:net');
const https = require('node:https');
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const server = net.createServer(client => {
 const upstream = net.connect(8443,'proxy');client.pipe(upstream).pipe(client);
 upstream.on('error',()=>client.destroy());client.on('error',()=>upstream.destroy());
});
server.listen(3448,'127.0.0.1',async()=>{
 let browser;
 try {
  const origin='https://localhost:3448',marker='T18_BROWSER_'+crypto.randomBytes(24).toString('hex'),code=marker+'_code';
  const made=await new Promise((resolve,reject)=>{
   const req=https.request(origin+'/api/v1/secrets',{ca:fs.readFileSync('/ca/cert.pem'),method:'POST',headers:{'Content-Type':'application/json'}},res=>{
    let data='';res.on('data',part=>data+=part);res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(data)}));
   });req.on('error',reject);req.end(JSON.stringify({credential:marker,reading_code:code}));
  });
  assert.ok(made.status===201,'synthetic create');
  const {chromium}=require('/home/node/app/node_modules/@playwright/test');
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({ignoreHTTPSErrors:true});
  const page=await context.newPage();let external=0,consoleErrors=0;
  page.on('request',r=>{if(!r.url().startsWith(origin))external++});
  page.on('console',m=>{if(m.text().includes(marker)||m.text().includes(code)||m.text().includes(made.data.data.share_url))consoleErrors++});
  await page.goto(made.data.data.share_url);
  assert.ok(!(await page.content()).includes(marker),'neutral shell has no content');
  await page.getByLabel('Reading code',{exact:true}).fill(code);
  await page.getByRole('button',{name:'Show Secret',exact:true}).click();
  await page.getByText(marker,{exact:true}).waitFor();
  const state=await context.storageState();
  const stored=await page.evaluate(async()=>({local:{...localStorage},session:{...sessionStorage},databases:await indexedDB.databases(),caches:await caches.keys(),workers:(await navigator.serviceWorker.getRegistrations()).length}));
  assert.ok(!JSON.stringify([state,stored]).includes(marker),'no sensitive storage');
  assert.ok(Object.keys(stored.local).length===0&&Object.keys(stored.session).length===0&&stored.databases.length===0&&stored.caches.length===0&&stored.workers===0,'all application persistence stores empty');
  await page.reload();
  await page.getByRole('button',{name:'Show Secret',exact:true}).waitFor();
  assert.ok(!(await page.content()).includes(marker),'reload loses disclosed content');
  assert.ok(external===0&&consoleErrors===0,'no telemetry or canary console output');
  await browser.close();server.close();
  console.log(JSON.stringify({checks:6,localStorage:0,sessionStorage:0,indexedDB:0,cacheStorage:0,serviceWorkers:0,externalRequests:external,canaryConsoleHits:consoleErrors,persistentBrowserProfile:false}));
  process.exit(0);
 }catch(_){if(browser)await browser.close();server.close();console.error('T18 browser persistence assertion failed (sensitive diagnostics suppressed)');process.exit(1)}
});
