// Synthetic HTTPS fixture only; never production or OS trust-store changes.
const net = require('node:net');
const assert = require('node:assert/strict');
const { chromium } = require('/home/node/app/node_modules/@playwright/test');
const relay = net.createServer(client => {
  const upstream = net.connect(8443, 'npm-fixture');
  client.pipe(upstream).pipe(client);
  upstream.on('error', () => client.destroy());
  client.on('error', () => upstream.destroy());
});
relay.listen(3469, '127.0.0.1', async () => {
  let browser;
  try {
    browser = await chromium.launch({headless:true,args:['--no-sandbox']});
    const context = await browser.newContext({ignoreHTTPSErrors:true});
    const created = await context.request.post('https://localhost:3469/api/v1/secrets', {data:{credential:'NPM_BROWSER_SYNTHETIC',reading_code:'browser-code'}});
    assert.equal(created.status(),201);
    const url = (await created.json()).data.share_url;
    const page = await context.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
    await page.addInitScript(()=>{window.violations=[];document.addEventListener('securitypolicyviolation',e=>window.violations.push(e.violatedDirective));});
    await page.goto(url);
    await page.getByRole('button',{name:'Show Secret',exact:true}).waitFor();
    assert.ok(!(await page.content()).includes('NPM_BROWSER_SYNTHETIC'));
    await page.getByLabel('Reading code',{exact:true}).fill('browser-code');
    await page.getByRole('button',{name:'Show Secret',exact:true}).click();
    await page.getByText('NPM_BROWSER_SYNTHETIC',{exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    assert.deepEqual(await page.evaluate(()=>window.violations),[]);
    console.log('HTTPS browser hydrated; explicit disclosure passed; zero console/page/CSP errors');
    await browser.close(); relay.close();
  } catch(error) {
    console.error(error.message); if(browser) await browser.close(); process.exitCode=1; relay.close();
  }
});
