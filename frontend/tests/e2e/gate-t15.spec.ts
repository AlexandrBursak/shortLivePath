import {test,expect,type Page} from '@playwright/test';
import {mountGate} from './t15-mounted';
const path='/s/'+'A'.repeat(43);
const events=(page:Page)=>page.evaluate(()=>Reflect.get(window,'events'));
const show=(page:Page)=>page.getByRole('button',{name:'Show Secret',exact:true});
const code=(page:Page)=>page.getByLabel('Reading code',{exact:true});
function envelope(data:unknown){return {data,meta:{service_time:new Date().toISOString()}};}
async function available(page:Page,required=true){const expires_at=new Date(Date.now()+60000).toISOString();await page.route('**/status',r=>r.fulfill({json:envelope({state:'available',reading_code_required:required,expires_at})}));return expires_at;}
test('AC-07: incorrect code focuses its associated field error',async({page})=>{
 await available(page);await page.route('**/disclosures',r=>r.fulfill({status:403,json:{error:{code:'short_live_path.code_incorrect',message:'unsafe remote text',details:[]}}}));await page.goto(path);await code(page).fill('x');await show(page).click();await expect(code(page)).toBeFocused();expect(await code(page).evaluate(el=>el.tabIndex)).toBe(0);await expect(code(page)).toHaveAttribute('aria-invalid','true');const id=await code(page).getAttribute('aria-describedby');expect(id).toContain('recipient-code-error');await expect(page.locator('#recipient-code-error')).toContainText('incorrect');await expect(page.getByText('unsafe remote text')).toHaveCount(0);
});
test('AC-07: overflow code stays exact, refuses locally and focuses validation',async({page})=>{
 await available(page);let posts=0;await page.route('**/disclosures',r=>{posts++;return r.abort();});await page.goto(path);const value='é'.repeat(513);await code(page).fill(value);await show(page).click();await expect(code(page)).toBeFocused();expect(await code(page).evaluate(el=>el.tabIndex)).toBe(0);await expect(code(page)).toHaveAttribute('aria-invalid','true');await expect(code(page)).toHaveValue(value);expect(posts).toBe(0);
});

test('AC-08: boundary delivers once but without renderer remains neutral',async({page})=>{
 const expires_at=await available(page);await page.route('**/disclosures',r=>r.fulfill({json:envelope({secret:{address:'',login:'',credential:'boundary-canary'},expires_at})}));await mountGate(page);await expect(show(page)).toBeEnabled();expect(await events(page)).toEqual([]);await show(page).click();await expect.poll(()=>events(page)).toEqual([{kind:'disclosure',credential:'boundary-canary'}]);await expect(page.getByText('boundary-canary')).toHaveCount(0);await expect(page.getByRole('button',{name:/Copy/})).toHaveCount(0);await expect(page.getByRole('heading',{name:'A Secret was shared with you'})).toBeVisible();
});
for(const state of ['expired','early_unavailable','unknown'] as const)test(`AC-09 AC-11b: boundary terminal callback ${state}`,async({page})=>{
 const expires_at=new Date(Date.now()+60000).toISOString();await page.route('**/status',r=>r.fulfill({json:envelope(state==='unknown'?{state}:{state,expires_at})}));await mountGate(page);await expect.poll(()=>events(page)).toEqual([{kind:'terminal',state,...(state==='unknown'?{}:{expiresAt:expires_at})}]);await expect(page.getByRole('heading',{name:'A Secret was shared with you'})).toBeVisible();await expect(page.getByRole('button',{name:/Copy/})).toHaveCount(0);
});

test('AC-07: code refusal after unprotected status has a focused safe summary',async({page})=>{
 await available(page,false);await page.route('**/disclosures',r=>r.fulfill({status:403,json:{error:{code:'short_live_path.code_required',message:'unsafe remote text',details:[]}}}));await page.goto(path);await show(page).click();await expect(page.locator('#reader-error')).toBeFocused();await expect(page.locator('#reader-error')).toContainText('Enter the separate Reading code.');await expect(code(page)).toHaveCount(0);await expect(page.getByText('unsafe remote text')).toHaveCount(0);
});
