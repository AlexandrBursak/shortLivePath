import {test,expect} from '@playwright/test';
for (const path of ['/', '/s/synthetic-neutral-token']) {
 test(`AC-08 AC-12: neutral ${path === '/' ? 'creation' : 'reading'} shell makes no disclosure and fits 360px`,async({page})=>{
  const api:string[]=[];const errors:string[]=[];
  page.on('request',r=>{if(r.url().includes('/api/')) api.push(r.method());});
  page.on('pageerror',e=>errors.push(e.name));
  page.on('console',m=>{if(m.type()==='error')errors.push('console-error');});
  await page.goto(path); await expect(page).toHaveTitle('Short-lived sharing');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  const icon=await page.request.get('/favicon.ico');expect(icon.status()).toBe(200);
  await expect(page.getByText(/does not change external passwords/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  if(path!=='/') {await expect(page.getByRole('button',{name:'Show Secret'})).toBeDisabled();}
  expect(api).toEqual([]);expect(errors).toEqual([]);
 });
}
