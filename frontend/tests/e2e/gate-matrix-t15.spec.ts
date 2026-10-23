import {test,expect,type Page} from '@playwright/test';
const path='/s/'+'A'.repeat(43),secret={address:'private-address',login:'private-login',credential:'t15-private-credential'};
const show=(p:Page)=>p.getByRole('button',{name:'Show Secret',exact:true});
const field=(p:Page)=>p.getByLabel('Reading code',{exact:true});
const env=(data:unknown)=>({data,meta:{service_time:new Date().toISOString()}});
const fault=(code:string)=>({error:{code:'short_live_path.'+code,message:'unsafe-remote-canary',details:[]}});
const heading={expired:'This Share link has expired',early_unavailable:'The Secret became unavailable before expiry',unknown:'The Secret at this link is unavailable'};
async function hidden(p:Page){await expect(p.getByText(/t15-private|private-address|private-login|unsafe-remote-canary/)).toHaveCount(0);await expect(p.getByRole('button',{name:/Copy/})).toHaveCount(0);}
for(const target of ['early_unavailable','expired','unknown','available','503','network'] as const)test(`AC-08 AC-09 AC-11b: disclosure 409 neutral classification ${target}`,async({page})=>{
 const expiry=new Date(Date.now()+60000).toISOString();let gets=0,posts=0;
 await page.route('**/status',async r=>{gets++;if(gets>1 && target==='network')return r.abort();if(gets>1 && target==='503')return r.fulfill({status:503,json:fault('service_unavailable')});const state=gets===1?'available':target;return r.fulfill({json:env(state==='available'?{state,reading_code_required:true,expires_at:expiry}:state==='unknown'?{state}:{state,expires_at:expiry})});});
 await page.route('**/disclosures',r=>{posts++;return r.fulfill({status:409,json:fault('link_unavailable')});});await page.goto(path);await expect(show(page)).toBeEnabled();expect(posts).toBe(0);await field(page).fill('x');await show(page).click();
 if(target==='available')await expect(show(page)).toBeEnabled();else if(target==='503' || target==='network')await expect(page.getByRole('button',{name:'Check availability again'})).toBeVisible();else await expect(page.getByRole('heading',{name:heading[target],exact:true})).toBeVisible();
 await hidden(page);expect(gets).toBe(2);expect(posts).toBe(1);await expect(page).toHaveURL(new RegExp(path+'$'));
 if(target==='available'){await show(page).click();await expect.poll(()=>posts).toBe(2);}
});
for(const [status,error,notice,isField] of [
 [403,'code_required','Enter the separate Reading code.',true],
 [403,'code_incorrect','The Reading code is incorrect. The link has not been consumed.',true],
 [429,'verification_limited','People sharing a public network address share this limit',false],
 [422,'invalid_request','The request could not be accepted.',false],
 [413,'request_too_large','The request could not be accepted.',false],
 [415,'unsupported_media_type','The request could not be accepted.',false],
] as const)test(`AC-07: safe ${status} ${error} retains exact guess without retry`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();let posts=0;await page.route('**/status',r=>r.fulfill({json:env({state:'available',reading_code_required:true,expires_at})}));await page.route('**/disclosures',r=>{posts++;return r.fulfill({status,json:fault(error)});});await page.goto(path);await field(page).fill(' exact é ');await show(page).click();await expect(page.getByText(notice,{exact:false})).toBeVisible();await expect(field(page)).toHaveValue(' exact é ');await expect(isField?field(page):page.locator('#reader-error')).toBeFocused();await hidden(page);await expect(show(page)).toBeEnabled();expect(posts).toBe(1);
});
for(const error of ['service_unavailable','capacity_unavailable','network','malformed','mismatched-error'] as const)test(`AC-07 AC-09: ${error} uncertainty requires GET then new Show`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();let gets=0,posts=0;await page.route('**/status',r=>{gets++;return r.fulfill({json:env({state:'available',reading_code_required:true,expires_at})});});await page.route('**/disclosures',r=>{posts++;if(error==='network')return r.abort();if(error==='malformed')return r.fulfill({json:env({secret:{...secret,credential:42},expires_at})});return r.fulfill({status:503,json:fault(error==='mismatched-error'?'link_expired':error)});});await page.goto(path);await field(page).fill('x');await show(page).click();await expect(page.getByRole('button',{name:'Check availability again'})).toBeVisible();await hidden(page);await expect(show(page)).toBeDisabled();expect(posts).toBe(1);await page.getByRole('button',{name:'Check availability again'}).click();await expect(show(page)).toBeEnabled();expect(gets).toBe(2);expect(posts).toBe(1);
});
test('AC-09: proven disclosure 410 uses original expiry without classification GET',async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();let gets=0,posts=0;await page.route('**/status',r=>{gets++;return r.fulfill({json:env({state:'available',reading_code_required:false,expires_at})});});await page.route('**/disclosures',r=>{posts++;return r.fulfill({status:410,json:fault('link_expired')});});await page.goto(path);await show(page).click();await expect(page.getByRole('heading',{name:heading.expired})).toBeVisible();await hidden(page);expect(gets).toBe(1);expect(posts).toBe(1);await expect(page.locator('time')).toHaveAttribute('datetime',expires_at);
});
for(const [name,guess] of [['empty',''],['short','x'],['1024 byte','é'.repeat(512)],['exact Unicode CRLF',' 𝄞é\r\n bare\r end ']] as const)test(`AC-07: protected ${name} guess is transmitted exactly`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();const bodies:unknown[]=[];await page.route('**/status',r=>r.fulfill({json:env({state:'available',reading_code_required:true,expires_at})}));await page.route('**/disclosures',r=>{bodies.push(r.request().postDataJSON());return r.fulfill({status:403,json:fault('code_incorrect')});});await page.goto(path);await expect(show(page)).toBeEnabled();if(guess.includes('\r'))await field(page).evaluate((el,value)=>{const data=new DataTransfer();data.setData('text/plain',value);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},guess);else await field(page).fill(guess);expect(bodies).toEqual([]);await show(page).click();await expect(page.getByText(/The Reading code is incorrect/)).toBeVisible();expect(bodies).toEqual([{reading_code:guess}]);
});
for(const protectedLink of [true,false])test(`AC-08: ${protectedLink?'protected':'unprotected'} pending duplicate and fresh repeat Show`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString(),bodies:unknown[]=[];let gets=0,release:()=>void=()=>{};const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/status',r=>{gets++;return r.fulfill({json:env({state:'available',reading_code_required:protectedLink,expires_at})});});await page.route('**/disclosures',async r=>{bodies.push(r.request().postDataJSON());if(bodies.length===1)await held;await r.fulfill({json:env({secret,expires_at})});});await page.goto(path);await expect(show(page)).toBeEnabled();if(protectedLink)await field(page).fill('first code');else await expect(field(page)).toHaveCount(0);
 await show(page).click();await expect(page.getByRole('button',{name:'Opening...'})).toBeDisabled();await page.locator('form').evaluate(el=>{el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await hidden(page);expect(bodies).toHaveLength(1);release();await expect(page.getByRole('heading',{name:'Secret',exact:true})).toBeVisible();await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await hidden(page);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await expect(show(page)).toBeEnabled();expect(bodies).toHaveLength(1);expect(gets).toBe(2);if(protectedLink){await expect(field(page)).toHaveValue('');await field(page).fill('fresh code');}await show(page).click();await expect(page.getByRole('heading',{name:'Secret',exact:true})).toBeVisible();expect(bodies).toEqual(protectedLink?[{reading_code:'first code'},{reading_code:'fresh code'}]:[{},{}]);
});
test('AC-09 AC-10: late result before interval is classified as proven original expiry',async({page})=>{
  // Freeze the fake clock during TLS/SSR navigation; only the explicit 1000+130ms advance counts.
 const now=new Date(),expires_at=new Date(now.getTime()+1120).toISOString();
 await page.clock.install({time:now});await page.clock.pauseAt(now);
 const response=(data:unknown)=>({data,meta:{service_time:now.toISOString()}});
 let release:()=>void=()=>{};const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/status',r=>r.fulfill({json:response({state:'available',reading_code_required:false,expires_at})}));
 await page.route('**/disclosures',async r=>{await held;await r.fulfill({json:response({secret,expires_at})});});
 await page.goto(path);await expect(show(page)).toBeEnabled();await page.clock.runFor(1000);await show(page).click();await page.clock.runFor(130);release();await expect(page.getByRole('heading',{name:heading.expired})).toBeVisible();await hidden(page);await expect(page.locator('time')).toHaveAttribute('datetime',expires_at);
});

test('AC-04 AC-08: disclosure cannot restart the original neutral deadline',async({page})=>{
 const now=new Date(),expires_at=new Date(now.getTime()+6000).toISOString();await page.clock.install({time:now});const response=(data:unknown)=>({data,meta:{service_time:now.toISOString()}});await page.route('**/status',r=>r.fulfill({json:response({state:'available',reading_code_required:false,expires_at})}));await page.route('**/disclosures',r=>r.fulfill({json:response({secret,expires_at})}));await page.goto(path);await expect(show(page)).toBeEnabled();await page.clock.runFor(2000);await expect(page.getByLabel('Remaining lifetime 00:00:04')).toBeVisible();await show(page).click();await expect(page.getByRole('heading',{name:'Secret',exact:true})).toBeVisible();expect(await page.locator('[aria-label^="Remaining lifetime"]').textContent()).toContain('00:00:04');await page.clock.runFor(4000);await expect(page.getByRole('heading',{name:heading.expired})).toBeVisible();await hidden(page);
});

for(const mode of ['service_unavailable','capacity_unavailable','network','malformed'] as const)test(`AC-08 AC-09: neutral ${mode} failure does not authorize or infer loss`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();let gets=0,posts=0;await page.route('**/status',r=>{gets++;if(gets>1)return r.fulfill({json:env({state:'available',reading_code_required:false,expires_at})});if(mode==='network')return r.abort();if(mode==='malformed')return r.fulfill({contentType:'application/json',body:'{invalid'});return r.fulfill({status:503,json:fault(mode)});});await page.route('**/disclosures',r=>{posts++;return r.abort();});await page.goto(path);await expect(page.getByText('Availability could not be checked right now. This does not establish that the link expired.')).toBeVisible();await hidden(page);await expect(show(page)).toBeDisabled();expect(gets).toBe(1);expect(posts).toBe(0);await page.getByRole('button',{name:'Check availability again'}).click();await expect(show(page)).toBeEnabled();expect(gets).toBe(2);expect(posts).toBe(0);
});
