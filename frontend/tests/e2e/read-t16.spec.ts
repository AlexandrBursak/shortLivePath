import {test,expect,type Page} from '@playwright/test';

const path='/s/'+'A'.repeat(43),origin='2030-01-02T03:04:05.000Z',expiry='2030-01-02T04:04:05.000Z';
const specimen='  \tCRLF\r\nCR\rLF\n e\u0301 𝄞😀 <img src="https://t16.invalid/probe" onerror="window.t16Executed=true"><script>window.t16Executed=true</script> https://t16.invalid/destination '+ 'LONG'.repeat(800)+' \t  ';
const secret={address:specimen,login:specimen+'login',credential:specimen+'key'};
const items=[['address','Address'],['login','Login'],['credential','Password or key']] as const;
const heading={expired:'This Share link has expired',early_unavailable:'The Secret became unavailable before expiry',unknown:'The Secret at this link is unavailable'};
function envelope(data:unknown){return {data,meta:{service_time:origin}};}
async function setup(page:Page,value:unknown=secret,expires_at=expiry){
 await page.clock.install({time:new Date(origin)});
 await page.route('**/status',r=>r.fulfill({json:envelope({state:'available',reading_code_required:false,expires_at})}));
 await page.route('**/disclosures',r=>r.fulfill({json:envelope({secret:value,expires_at})}));
 await page.goto(path);await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();
}
async function show(page:Page){await page.getByRole('button',{name:'Show Secret',exact:true}).click();await expect(page.getByRole('heading',{name:'Secret',exact:true})).toBeFocused();}
async function clipboard(page:Page,mode:'success'|'denied'|'pending'='success'){
 await page.evaluate(mode=>{
  Object.assign(window,{t16Writes:[]});
  Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:(value:string)=>{
   (window as unknown as {t16Writes:string[]}).t16Writes.push(value);
   if(mode==='denied')return Promise.reject(new Error('synthetic denial'));
   if(mode==='pending')return new Promise<void>((resolve,reject)=>Object.assign(window,{t16Finish:(rejectIt:boolean)=>rejectIt?reject(new Error('synthetic denial')):resolve()}));
   return Promise.resolve();
  }});
 },mode);
}
async function hidden(page:Page){await expect(page.locator('pre')).toHaveCount(0);await expect(page.getByRole('button',{name:/Copy/})).toHaveCount(0);await expect(page.getByText(/CRLF|LONG|t16-private/)).toHaveCount(0);}

for(const [key,label] of items)test(`AC-03 AC-08: ${label} exact display, copy, whole and partial manual fallback`,async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('t16.invalid'))requests.push(r.url());});
 await setup(page);await show(page);
 const field=page.getByLabel(label,{exact:true}),button=page.getByRole('button',{name:`Copy ${label.toLowerCase()}`,exact:true});
 expect(await field.textContent()).toBe(secret[key]);
 await page.context().grantPermissions(['clipboard-read','clipboard-write']);await button.click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(secret[key]);
 await clipboard(page);await button.focus();await page.keyboard.press('Enter');await expect(page.getByRole('status')).toHaveText(`${label} copied.`);
 expect(await page.evaluate(()=>(window as unknown as {t16Writes:string[]}).t16Writes)).toEqual([secret[key]]);
 await clipboard(page,'denied');await button.click();await expect(page.getByRole('status')).toHaveText(`Could not copy. Select the ${label.toLowerCase()} manually while it remains eligible.`);
 await expect(field).toBeFocused();
 for(const partial of [false,true]){
  const copied=await field.evaluate((el,partial)=>{
   const range=document.createRange(),selection=getSelection();
   if(partial){range.setStart(el.firstChild!,2);range.setEnd(el.firstChild!,180);}else range.selectNodeContents(el);
   selection?.removeAllRanges();selection?.addRange(range);
   const data=new DataTransfer();el.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data}));return data.getData('text/plain');
  },partial);
  expect(copied).toBe(partial?secret[key].slice(2,180):secret[key]);
 }
 await expect(page.locator('pre a, pre img, pre script')).toHaveCount(0);expect(await page.evaluate(()=>(window as unknown as {t16Executed?:boolean}).t16Executed)).toBeUndefined();expect(requests).toEqual([]);
});

test('AC-03 AC-08: empty optional fields alone are omitted; whitespace-only optionals stay exact',async({page})=>{
 await setup(page,{address:'',login:'',credential:'required'});await show(page);await expect(page.locator('pre')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Address',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'Login',exact:true})).toHaveCount(0);
 await page.unroute('**/disclosures');await page.route('**/disclosures',r=>r.fulfill({json:envelope({secret:{address:' \t\r\n ',login:'\r \t',credential:'required'},expires_at:expiry})}));
 await page.reload();await show(page);expect(await page.getByLabel('Address',{exact:true}).textContent()).toBe(' \t\r\n ');expect(await page.getByLabel('Login',{exact:true}).textContent()).toBe('\r \t');await expect(page.locator('pre')).toHaveCount(3);
});

test('AC-03 AC-08: 360px keyboard internal scroll and non-live accessible countdown',async({page})=>{
 await setup(page);await show(page);expect(await page.evaluate(()=>innerWidth)).toBe(360);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('button',{name:/^Copy /})).toHaveCount(3);await expect(page.getByRole('button',{name:/Copy all|download/i})).toHaveCount(0);await expect(page.getByRole('main').locator('input,textarea,pre a,pre img,pre script')).toHaveCount(0);
 if(process.env.T16_EVIDENCE_DIR)await page.screenshot({path:process.env.T16_EVIDENCE_DIR+'/reading-360.png',fullPage:true});
 const field=page.getByLabel('Password or key',{exact:true});await field.focus();await expect(field).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect.poll(()=>field.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 const remaining=page.locator('[aria-label^="Remaining lifetime"]');await remaining.focus();await expect(remaining).toBeFocused();expect(await remaining.evaluate(el=>el.closest('[aria-live],[role="status"],[role="alert"]'))).toBeNull();await page.clock.runFor(1000);await expect(remaining).toHaveAttribute('aria-label','Remaining lifetime 00:59:59');await expect(page.getByRole('status')).toHaveCount(0);await expect(page.locator('time')).toContainText('UTC');
});

test('AC-09 AC-10 AC-12: normal visible reading expires without network, announces and focuses destination',async({page})=>{
 const expires_at='2030-01-02T03:04:09.000Z';await setup(page,secret,expires_at);await show(page);
 // Network requests fail, but the visible running clock is not suspended or advanced unsafely.
 await page.route('**/api/**',r=>r.abort());
 await page.getByRole('button',{name:'Copy login',exact:true}).focus();await page.clock.runFor(4500);
 await expect(page.getByRole('heading',{name:heading.expired,exact:true})).toBeFocused();await hidden(page);
 await expect(page.getByRole('status')).toContainText('This Share link has expired.');await expect(page.locator('time')).toHaveAttribute('datetime',expires_at);
 await expect(page.getByText('This does not change external passwords or revoke server keys, or erase copies already acquired.',{exact:true})).toBeVisible();
});

for(const corruption of ['credential-type','credential-empty','scalar','oversized','expiry-mismatch','bad-service-time'] as const)test(`AC-03 AC-09 AC-10: whole ${corruption} response is discarded without any partial frame`,async({page})=>{
 await setup(page);let posts=0;
 await page.evaluate(()=>{
  Object.assign(window,{t16Partial:false});
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node instanceof Element && (node.matches('pre') || node.querySelector('pre')))Object.assign(window,{t16Partial:true});}}).observe(document.body,{subtree:true,childList:true});
 });
 await page.unroute('**/disclosures');await page.route('**/disclosures',r=>{
  posts++;const value:Record<string,unknown>={address:'t16-private-address',login:'t16-private-login',credential:'t16-private-key'};
  if(corruption==='credential-type')value.credential=42;
  if(corruption==='credential-empty')value.credential=' \t\r\n';
  if(corruption==='scalar')value.credential='bad\ud800';
  if(corruption==='oversized')value.credential='é'.repeat(32769);
  return r.fulfill({json:{data:{secret:value,expires_at:corruption==='expiry-mismatch'?'2030-01-02T04:04:06.000Z':expiry},meta:{service_time:corruption==='bad-service-time'?'not-an-instant':origin}}});
 });
 await page.getByRole('button',{name:'Show Secret',exact:true}).click();await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toBeVisible();await hidden(page);expect(await page.evaluate(()=>(window as unknown as {t16Partial:boolean}).t16Partial)).toBe(false);expect(posts).toBe(1);await expect(page).toHaveURL(new RegExp(path+'$'));
});

for(const [key,label] of items)for(const boundary of ['expiry','conceal-fresh-show'] as const)for(const rejectIt of [false,true])test(`AC-03 AC-08 AC-10: late ${label} ${rejectIt?'rejection':'resolution'} after ${boundary} cannot affect current feedback or manual copy`,async({page})=>{
 await setup(page,secret,boundary==='expiry'?'2030-01-02T03:04:09.000Z':expiry);await show(page);await clipboard(page,'pending');
 const button=()=>page.getByRole('button',{name:`Copy ${label.toLowerCase()}`,exact:true});
 await page.getByLabel(label,{exact:true}).evaluate(el=>Object.assign(window,{t16OldField:el}));
 await button().click();await expect(page.getByRole('button',{name:`Copying ${label.toLowerCase()}...`,exact:true})).toBeDisabled();
 await page.evaluate(()=>Object.assign(window,{t16OldFinish:(window as unknown as {t16Finish:unknown}).t16Finish}));
 if(boundary==='expiry')await page.clock.runFor(4500);
 else{
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await hidden(page);await expect(page.getByRole('heading',{name:'A Secret was shared with you',exact:true})).toBeFocused();
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();await hidden(page);await show(page);
  await clipboard(page,'pending');await button().click();
 }
 await page.evaluate(async rejectIt=>{(window as unknown as {t16OldFinish:(rejectIt:boolean)=>void}).t16OldFinish(rejectIt);await Promise.resolve();await Promise.resolve();},rejectIt);
 await expect(page.getByText(/copied\.|Could not copy\./)).toHaveCount(0);
 expect(await page.evaluate(()=>{const data=new DataTransfer();(window as unknown as {t16OldField:HTMLElement}).t16OldField.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data}));return data.getData('text/plain');})).toBe('');
 if(boundary==='expiry'){await hidden(page);await expect(page.getByRole('heading',{name:heading.expired,exact:true})).toBeFocused();}
 else{
  await expect(page.getByRole('button',{name:`Copying ${label.toLowerCase()}...`,exact:true})).toBeDisabled();
  expect(await page.getByLabel(label,{exact:true}).textContent()).toBe(secret[key]);
  await page.evaluate(()=>(window as unknown as {t16Finish:(rejectIt:boolean)=>void}).t16Finish(false));await expect(page.getByRole('status')).toHaveText(`${label} copied.`);
 }
});

for(const [,label] of items)test(`AC-03 AC-10: ${label} rejects new clipboard and manual copy at deadline before the presentation tick`,async({page})=>{
 await setup(page,secret,'2030-01-02T03:04:06.120Z');await show(page);await clipboard(page);await page.clock.runFor(1130);
 const result=await page.evaluate(label=>{
  const field=document.querySelector<HTMLElement>(`pre[aria-label="${label}"]`);
  if(!field)return {connected:false,copied:'missing'};
  const data=new DataTransfer();field.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data}));
  (field.parentElement?.querySelector('button') as HTMLButtonElement).click();return {connected:field.isConnected,copied:data.getData('text/plain')};
 },label);
 expect(result).toEqual({connected:true,copied:''});expect(await page.evaluate(()=>(window as unknown as {t16Writes:string[]}).t16Writes)).toEqual([]);
 await page.clock.runFor(250);await hidden(page);await expect(page.getByRole('heading',{name:heading.expired,exact:true})).toBeFocused();
});

for(const state of ['unknown','expired','early_unavailable'] as const)test(`AC-09 AC-11b AC-12: ${state} is distinct, focused, safe and restarts blank creation`,async({page})=>{
 await page.clock.install({time:new Date(origin)});let posts=0,creates=0;
 const expires_at=state==='expired'?'2030-01-02T03:04:04.000Z':expiry;
 await page.route('**/status',r=>r.fulfill({json:envelope(state==='unknown'?{state}:{state,expires_at})}));
 await page.route('**/disclosures',r=>{posts++;return r.abort();});await page.route('**/api/v1/secrets',r=>{creates++;return r.abort();});
 await page.goto(path);await expect(page.getByRole('heading',{name:heading[state],exact:true})).toBeFocused();await expect(page).toHaveURL(new RegExp(path+'$'));await hidden(page);
 if(process.env.T16_EVIDENCE_DIR)await page.screenshot({path:process.env.T16_EVIDENCE_DIR+'/'+state+'-360.png',fullPage:true});
 for(const other of Object.values(heading).filter(h=>h!==heading[state]))await expect(page.getByRole('heading',{name:other,exact:true})).toHaveCount(0);
 if(state==='expired'){await expect(page.locator('time')).toHaveAttribute('datetime',expires_at);await expect(page.locator('time')).toContainText('UTC');}
 if(state==='early_unavailable'){expect(Date.parse(expires_at)).toBeGreaterThan(Date.parse(origin));await expect(page.getByText('Temporary content may be lost after a crash. The cause is not confirmed here.',{exact:true})).toBeVisible();}
 await expect(page.getByText('Recovery is not available. Ask the Sender to create and share a new link.',{exact:true})).toBeVisible();await expect(page.getByText('This does not change external passwords or revoke server keys, or erase copies already acquired.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/recover|retry|Show/i})).toHaveCount(0);
 const restart=page.getByRole('link',{name:'Create a new Secret',exact:true});await restart.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/$/);
 for(const label of ['Address (optional)','Login (optional)','Password or key'])await expect(page.getByLabel(label,{exact:true})).toHaveValue('');
 await expect(page.getByLabel('Require a separate Reading code')).not.toBeChecked();await expect(page.getByLabel('Reading code',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Exact minutes',{exact:true})).toHaveValue('60');expect(posts).toBe(0);expect(creates).toBe(0);
});
