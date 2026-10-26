import {test,expect} from '@playwright/test';
test('AC-01 AC-04 AC-06 AC-10: confirmed handover is separate, clipboard guarded and concealed on return',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.route('**/api/v1/secrets',async route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({data:{share_url:new URL('/s/'+'A'.repeat(43),route.request().url()).href,expires_at:new Date(Date.now()+60000).toISOString()},meta:{service_time:new Date().toISOString()}})}));
 let statusCalls=0;
 await page.route('**/api/v1/secrets/*/status',async route=>{statusCalls++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{state:'available',reading_code_required:true,expires_at:new Date(Date.now()+60000).toISOString()},meta:{service_time:new Date().toISOString()}})});});
 await page.goto('/');await page.getByLabel('Password or key',{exact:true}).fill('synthetic-secret-not-in-confirmation');
 await page.getByLabel('Require a separate Reading code').check();await page.getByLabel('Reading code',{exact:true}).fill('code 123');
 await page.getByRole('button',{name:'Create Secret',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Secret created',exact:true})).toBeVisible();
 await expect(page.getByText('synthetic-secret-not-in-confirmation',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Copy link',exact:true}).click();await expect(page.getByText('Share link copied.',{exact:true})).toBeVisible();
 const copied=await page.evaluate(()=>navigator.clipboard.readText());expect(copied).toMatch(/\/s\/A{43}$/);expect(copied).not.toContain('code 123');
 await page.getByRole('button',{name:'Copy code',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('code 123');
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 await expect(page.getByRole('button',{name:'Copy code',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Create a new Secret',exact:true}).click();await expect(page.getByLabel('Password or key',{exact:true})).toHaveValue('');
 expect(statusCalls).toBe(0);
});
