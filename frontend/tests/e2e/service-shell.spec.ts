import {test,expect} from '@playwright/test';
test('header and content share one column of at most 1200px',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto('/');
 const nav=(await page.getByRole('navigation',{name:'RexSoft services'}).boundingBox())!;
 const theme=(await page.getByRole('group',{name:'Theme'}).boundingBox())!;
 const main=(await page.getByRole('main').boundingBox())!;
 expect(main.width).toBeLessThanOrEqual(1200);expect(main.width).toBeGreaterThan(1100);
 expect(Math.abs(nav.x-main.x)).toBeLessThan(2);
 expect(Math.abs(theme.x+theme.width-(main.x+main.width))).toBeLessThan(2);
});
test('theme switch applies before paint under the nonce CSP and is remembered',async({page})=>{
 const violations:string[]=[];
 page.on('console',message=>{if(/Content Security Policy/i.test(message.text())) violations.push(message.text());});
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/');
 const html=page.locator('html');
 await expect(html).toHaveAttribute('data-theme','dark');
 const dark=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
 await page.getByRole('radio',{name:'Light'}).check();
 await expect(html).toHaveAttribute('data-theme','light');
 expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(dark);
 await page.reload();
 await expect(html).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('radio',{name:'Light'})).toBeChecked();
 expect(violations).toEqual([]);
});
test('footer is pinned to the bottom of a short page',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto('/s/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
 const footer=page.getByRole('contentinfo');await expect(footer).toContainText('RexSoft');
 const bottom=await footer.evaluate(el=>el.getBoundingClientRect().bottom+window.scrollY);
 const pageHeight=await page.evaluate(()=>Math.max(window.innerHeight,document.documentElement.scrollHeight));
 expect(Math.abs(bottom-pageHeight)).toBeLessThan(2);
});
