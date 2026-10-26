import {test,expect} from '@playwright/test';

test('AC-04 AC-10: a creation response from before pagehide cannot confirm after return',async({page})=>{
 let release!:()=>void;
 const waiting=new Promise<void>(resolve=>{release=resolve;});
 let started=false;
 await page.route('**/api/v1/secrets',async route=>{
  started=true;await waiting;
  await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({data:{share_url:new URL('/s/'+'A'.repeat(43),route.request().url()).href,expires_at:new Date(Date.now()+60000).toISOString()},meta:{service_time:new Date().toISOString()}})}).catch(()=>{});
 });
 await page.goto('/');await page.getByLabel('Password or key',{exact:true}).fill('synthetic lifecycle');
 await page.getByRole('button',{name:'Create Secret',exact:true}).click();await expect.poll(()=>started).toBe(true);
 await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));});
 release();
 await expect(page.getByRole('alert').filter({hasText:'Creation is not confirmed.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Secret created',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Password or key',{exact:true})).toHaveValue('synthetic lifecycle');
});

test('AC-10: offline return revalidates neutrally and requires a fresh explicit Show',async({page,context})=>{
 let gets=0,posts=0;
 const expires=new Date(Date.now()+60000).toISOString();
 await page.route('**/api/v1/secrets/*/status',route=>{gets++;return route.fulfill({json:{data:{state:'available',reading_code_required:false,expires_at:expires},meta:{service_time:new Date().toISOString()}}});});
 await page.route('**/api/v1/secrets/*/disclosures',route=>{posts++;return route.fulfill({json:{data:{secret:{address:'',login:'',credential:'synthetic offline canary'},expires_at:expires},meta:{service_time:new Date().toISOString()}}});});
 await page.goto('/s/'+'A'.repeat(43));await page.getByRole('button',{name:'Show Secret',exact:true}).click();
 await expect(page.getByText('synthetic offline canary',{exact:true})).toBeVisible();
 // Chromium emits real connectivity events for setOffline; do not dispatch duplicates.
 await context.setOffline(true);await expect(page.getByText('synthetic offline canary',{exact:true})).toHaveCount(0);
 await context.setOffline(false);await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();
 expect(gets).toBe(2);expect(posts).toBe(1);await expect(page.getByText('synthetic offline canary',{exact:true})).toHaveCount(0);
});

test('AC-10: a superseded disclosure cannot restore content after freeze and neutral resume',async({page})=>{
 let release!:()=>void,started=false,posts=0;
 const waiting=new Promise<void>(resolve=>{release=resolve;});
 const expires=new Date(Date.now()+60000).toISOString();
 await page.route('**/api/v1/secrets/*/status',route=>route.fulfill({json:{data:{state:'available',reading_code_required:false,expires_at:expires},meta:{service_time:new Date().toISOString()}}}));
 await page.route('**/api/v1/secrets/*/disclosures',async route=>{posts++;started=true;await waiting;await route.fulfill({json:{data:{secret:{address:'',login:'',credential:'stale disclosure canary'},expires_at:expires},meta:{service_time:new Date().toISOString()}}}).catch(()=>{});});
 await page.goto('/s/'+'A'.repeat(43));await page.getByRole('button',{name:'Show Secret',exact:true}).click();await expect.poll(()=>started).toBe(true);
 await page.evaluate(()=>document.dispatchEvent(new Event('freeze')));
 await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeDisabled();
 await expect(page.getByText('Content remains hidden.',{exact:true})).toBeVisible();
 await page.evaluate(()=>document.dispatchEvent(new Event('resume')));await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();
 release();await expect(page.getByText('stale disclosure canary',{exact:true})).toHaveCount(0);expect(posts).toBe(1);
});

test('AC-10: pending clipboard feedback cannot restore content after pagehide',async({page})=>{
 const expires=new Date(Date.now()+60000).toISOString();
 await page.route('**/api/v1/secrets/*/status',route=>route.fulfill({json:{data:{state:'available',reading_code_required:false,expires_at:expires},meta:{service_time:new Date().toISOString()}}}));
 await page.route('**/api/v1/secrets/*/disclosures',route=>route.fulfill({json:{data:{secret:{address:'',login:'',credential:'clipboard lifecycle canary'},expires_at:expires},meta:{service_time:new Date().toISOString()}}}));
 await page.goto('/s/'+'A'.repeat(43));await page.getByRole('button',{name:'Show Secret',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>new Promise<void>(resolve=>{Object.assign(window,{finishSyntheticCopy:resolve});})}));
 await page.getByRole('button',{name:'Copy password or key',exact:true}).click();await expect(page.getByRole('button',{name:'Copying password or key...',exact:true})).toBeVisible();
 await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));(window as unknown as Window & {finishSyntheticCopy:()=>void}).finishSyntheticCopy();});
 await expect(page.getByText('clipboard lifecycle canary',{exact:true})).toHaveCount(0);await expect(page.getByText('Password or key copied.',{exact:true})).toHaveCount(0);
});
