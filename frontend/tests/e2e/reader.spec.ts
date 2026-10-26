import {test,expect} from '@playwright/test';
const token='A'.repeat(43),path='/s/'+token;
test('AC-03 AC-07 AC-08 AC-10: mounted reader is explicit, exact, repeatable and concealed until neutral recheck',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);let gets=0,posts=0;
 const expiry=new Date(Date.now()+60000).toISOString(),text={address:'https://inert.example/\r\n',login:' 𝄞é ',credential:' reader-private-canary\r\nkey\n '};
 await page.route('**/api/v1/secrets/*/status',async route=>{gets++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{state:'available',reading_code_required:true,expires_at:expiry},meta:{service_time:new Date().toISOString()}})});});
 await page.route('**/api/v1/secrets/*/disclosures',async route=>{posts++;const body=route.request().postDataJSON();await route.fulfill({status:body.reading_code==='correct code'?200:403,contentType:'application/json',body:JSON.stringify(body.reading_code==='correct code'?{data:{secret:text,expires_at:expiry},meta:{service_time:new Date().toISOString()}}:{error:{code:'short_live_path.code_incorrect',message:'Incorrect',details:[]}})});});
 await page.goto(path);await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();expect(posts).toBe(0);expect(gets).toBe(1);
 await page.getByLabel('Reading code',{exact:true}).fill('wrong');await page.getByRole('button',{name:'Show Secret',exact:true}).click();await expect(page.getByText('The Reading code is incorrect. The link has not been consumed.',{exact:true})).toBeVisible();
 await page.getByLabel('Reading code',{exact:true}).fill('correct code');await page.getByRole('button',{name:'Show Secret',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Secret',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/inert/})).toHaveCount(0);
 await page.getByRole('button',{name:'Copy password or key',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(text.credential);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect(page.getByRole('button',{name:'Copy password or key',exact:true})).toHaveCount(0);await expect(page.getByText(/reader-private-canary/)).toHaveCount(0);
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await expect(page.getByRole('button',{name:'Show Secret',exact:true})).toBeEnabled();expect(posts).toBe(2);expect(gets).toBe(2);await expect(page.getByLabel('Reading code',{exact:true})).toHaveValue('');
});
for(const state of ['unknown','expired','early_unavailable'] as const)test(`AC-09 AC-11b AC-12: mounted ${state} state is distinct and offers no recovery/copy`,async({page})=>{
 await page.route('**/api/v1/secrets/*/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:state==='unknown'?{state}:{state,expires_at:new Date(Date.now()-1000).toISOString()},meta:{service_time:new Date().toISOString()}})}));
 await page.goto(path);await expect(page.getByRole('heading',{name:state==='expired'?'This Share link has expired':state==='early_unavailable'?'The Secret became unavailable before expiry':'The Secret at this link is unavailable',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Copy/})).toHaveCount(0);await expect(page.getByRole('link',{name:'Create a new Secret',exact:true})).toBeVisible();
});
