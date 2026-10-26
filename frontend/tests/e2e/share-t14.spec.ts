import {test,expect,type Page} from '@playwright/test';
import {mountStrictConfirmation} from './t14-mounted';

test('AC-01 AC-06: mounted exact copy remains usable after StrictMode effect replay',async({page})=>{
 await mountStrictConfirmation(page);
 await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async(value:string)=>{Object.assign(window,{syntheticCopied:value});}}));
 await page.getByRole('button',{name:'Copy standalone',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Standalone copied.'})).toBeVisible();
});

test('AC-01 AC-10: mounted confirmation remains eligible after StrictMode effect replay',async({page})=>{
 await mountStrictConfirmation(page);
 await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{}}));
 await page.getByRole('button',{name:'Copy link',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Share link copied.'})).toBeVisible();
});

for(const outcome of ['available','failure','changed-expiration'] as const){
 test(`AC-01 AC-04 AC-10: mounted neutral recheck ${outcome} keeps handover hidden until a safe unchanged expiration`,async({page})=>{
  let started=false,release!:()=>void,disclosures=0;
  const waiting=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/disclosures',route=>{disclosures++;return route.abort();});
  await page.route('**/api/v1/secrets/*/status',async route=>{
   started=true;await waiting;
   if(outcome==='failure'){await route.abort();return;}
   await route.fulfill({json:{data:{state:'available',reading_code_required:true,expires_at:outcome==='available'?longExpires:'2030-01-02T04:05:05.000Z'},meta:{service_time:'2030-01-02T03:04:10.000Z'}}});
  });
  await create(page);await page.clock.runFor(5000);
  await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));});
  await expect.poll(()=>started).toBe(true);
  await expect(page.getByRole('button',{name:'Checking availability...',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Reading code',exact:true})).toHaveCount(0);
  release();
  if(outcome==='available'){
   await expect(page.getByRole('button',{name:'Copy link',exact:true})).toBeEnabled();
   await expect(page.locator('time')).toHaveAttribute('datetime',longExpires);
   await expect(page.getByText('00:59:55',{exact:true})).toBeVisible();
   await expect(page.getByRole('heading',{name:'Reading code',exact:true})).toBeVisible();
  }else{
   await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toBeEnabled();
   await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
   await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toHaveCount(0);
  }
  expect(disclosures).toBe(0);
 });
}

test('AC-10: superseded mounted status cannot reveal handover after another concealment',async({page})=>{
 let started=false,finished=false,release!:()=>void;
 const waiting=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/v1/secrets/*/status',async route=>{started=true;await waiting;await route.fulfill({json:{data:{state:'available',reading_code_required:true,expires_at:longExpires},meta:{service_time:originTime}}}).catch(()=>{});finished=true;});
 await create(page);
 await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));});
 await expect.poll(()=>started).toBe(true);
 await page.evaluate(()=>window.dispatchEvent(new Event('offline')));release();await expect.poll(()=>finished).toBe(true);
 await page.clock.runFor(250);
 await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Reading code',exact:true})).toHaveCount(0);
});

test('AC-04 AC-06: delayed confirmation consumes lifetime, explicit UTC countdown is not live and disabled code is absent',async({page})=>{
 await create(page,{code:'',delay:2000});
 await expect(page.getByText('00:59:58',{exact:true})).toBeVisible();
 await expect(page.locator('time')).toHaveAttribute('datetime',longExpires);
 await expect(page.locator('time')).toContainText('UTC');
 expect(await page.getByText('00:59:58',{exact:true}).evaluate(el=>el.closest('[aria-live], [role="status"], [role="alert"]'))).toBeNull();
 await page.clock.runFor(1000);await expect(page.getByText('00:59:57',{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Reading code',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Copy code',exact:true})).toHaveCount(0);
 await expect(page.getByText('T14 synthetic credential',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const item of ['link','code'] as const){
 test(`AC-01 AC-06: separate exact ${item} copying and denied eligible manual fallback`,async({page})=>{
  const code='  é😀 exact\r\ncode\rfinal  ';
  await create(page,{code});
  await page.evaluate(()=>Object.assign(window,{syntheticWrites:[]}));
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async(value:string)=>{const host=window as unknown as {syntheticWrites:string[]};host.syntheticWrites.push(value);}}));
  const button=page.getByRole('button',{name:`Copy ${item}`,exact:true}),label=item==='link'?'Share link':'Reading code';
  await button.click();await expect(page.getByRole('status').filter({hasText:`${label} copied.`})).toBeVisible();
  const expected=item==='link'?new URL('/s/'+'A'.repeat(43),page.url()).href:code;
  expect(await page.evaluate(()=>(window as unknown as {syntheticWrites:string[]}).syntheticWrites)).toEqual([expected]);
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('synthetic denial');}}));
  await button.click();await expect(page.getByRole('status').filter({hasText:`Could not copy. Select the ${label.toLowerCase()} manually while it remains eligible.`})).toBeVisible();
  await expect(page.getByText(`${label} copied.`,{exact:true})).toHaveCount(0);
  const field=page.getByLabel(label,{exact:true});await field.focus();await expect(field).toBeFocused();
  expect(await field.evaluate(el=>{const selection=getSelection(),range=document.createRange();range.selectNodeContents(el);selection?.removeAllRanges();selection?.addRange(range);const data=new DataTransfer();el.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data}));return data.getData('text/plain');})).toBe(expected);
 });
 for(const boundary of ['expiry','conceal','new-creation'] as const){
  for(const completion of ['resolve','reject'] as const){
   test(`AC-04 AC-10: late ${item} clipboard ${completion} after ${boundary} never revives feedback or handover`,async({page})=>{
    await create(page,{short:boundary==='expiry'});
    await page.evaluate(completion=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>new Promise<void>((resolve,reject)=>{Object.assign(window,{finishT14Copy:()=>{if(completion==='resolve')resolve();else reject(new Error('synthetic denial'));}});})}),completion);
    await page.getByRole('button',{name:`Copy ${item}`,exact:true}).click();
    await expect(page.getByRole('button',{name:item==='link'?'Copying share link...':'Copying reading code...',exact:true})).toBeDisabled();
    if(boundary==='expiry')await page.clock.runFor(4500);
    else if(boundary==='conceal')await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    else await page.getByRole('button',{name:'Create a new Secret',exact:true}).click();
    await page.evaluate(async()=>{(window as unknown as {finishT14Copy:()=>void}).finishT14Copy();await Promise.resolve();await Promise.resolve();});
    await expect(page.getByText(/copied\.|Could not copy\./)).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Copy code',exact:true})).toHaveCount(0);
    if(boundary==='new-creation'){
     await expect(page.getByLabel('Password or key',{exact:true})).toHaveValue('');
     await expect(page.getByLabel('Require a separate Reading code')).not.toBeChecked();
    }else if(boundary==='expiry')await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toBeVisible();
    else await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toBeVisible();
   });
  }
 }
}

test('AC-04 AC-10: an unsafe clock conceals confirmation without claiming proven expiration',async({page})=>{
 await create(page);
 await page.clock.setSystemTime(new Date('2029-01-02T03:04:05.000Z'));
 await page.clock.runFor(250);
 await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toHaveCount(0);
});

test('AC-04 AC-10: visible expiry announces and focuses its terminal destination and cannot resume handover',async({page})=>{
 let statusCalls=0;
 await page.route('**/api/v1/secrets/*/status',route=>{statusCalls++;return route.abort();});
 await create(page,{short:true});await page.getByRole('button',{name:'Copy link',exact:true}).focus();
 await page.clock.runFor(4500);
 await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toBeFocused();
 await expect(page.locator('time')).toHaveAttribute('datetime',expires);
 await expect(page.locator('time')).toContainText('UTC');
 await expect(page.getByRole('status').filter({hasText:'This Share link has expired.'})).toBeVisible();
 await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('online'));});
 await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
 expect(statusCalls).toBe(0);
});

const longExpires='2030-01-02T04:04:05.000Z';
const originTime='2030-01-02T03:04:05.000Z';
const expires='2030-01-02T03:04:09.000Z';
async function create(page:Page,{code=' exact é😀 code ',short=false,delay=0}:{code?:string;short?:boolean;delay?:number}={}){
 await page.clock.install({time:new Date(originTime)});
 await page.route('**/api/v1/secrets',async route=>{if(delay)await page.clock.runFor(delay);await route.fulfill({status:201,json:{data:{share_url:new URL('/s/'+'A'.repeat(43),route.request().url()).href,expires_at:short?expires:longExpires},meta:{service_time:originTime}}});});
 await page.goto('/');await page.getByLabel('Password or key',{exact:true}).fill('T14 synthetic credential');
 if(code){
  await page.getByLabel('Require a separate Reading code').check();
  await page.getByLabel('Reading code',{exact:true}).evaluate((el,code)=>{const data=new DataTransfer();data.setData('text/plain',code);el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));},code);
 }
 await page.getByRole('button',{name:'Create Secret',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Secret created',exact:true})).toBeVisible();
}

test('AC-04 AC-10 AC-12: concealed confirmed handover reaches proven local expiry without a network response',async({page})=>{
 await create(page,{short:true});
 await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
 await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
 await page.clock.runFor(4500);
 await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Check availability again',exact:true})).toHaveCount(0);
 await expect(page.getByRole('status').filter({hasText:'This Share link has expired.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'This Share link has expired',exact:true})).toBeFocused();
 await expect(page.getByRole('button',{name:'Copy code',exact:true})).toHaveCount(0);
 await expect(page.getByText(/Expiration does not change external passwords/)).toBeVisible();
});
