import {test,expect} from '@playwright/test';

for(const [status,code,notice] of [
 [422,'invalid_request','Check the Secret text, lifetime and Reading code. The service rejected this input.'],
 [413,'request_too_large','The request is too large. Reduce the input before trying again.'],
 [415,'unsupported_media_type','The service could not accept this request format.'],
 [429,'creation_limited','Creation is temporarily limited for your network address. Wait before trying again.'],
 [503,'capacity_unavailable','Temporary capacity is unavailable. Creation is not confirmed.'],
 [503,'service_unavailable','Creation is not confirmed. It may have occurred. A retry creates a new Secret.'],
 [201,'malformed','Creation is not confirmed. It may have occurred. A retry creates a new Secret.'],
 [0,'network','Creation is not confirmed. It may have occurred. A retry creates a new Secret.'],
 [0,'timeout','Creation is not confirmed. It may have occurred. A retry creates a new Secret.'],
] as const){
 test(`AC-01 AC-02 AC-06: mounted ${code} retains exact form and retries only deliberately`,async({page})=>{
  let posts=0;await page.route('**/api/v1/secrets',async route=>{posts++;if(code==='network')return route.abort();if(code==='timeout')return;await route.fulfill({status:status||503,json:code==='malformed'?{}:{error:{code:'short_live_path.'+code,message:'DO NOT ECHO synthetic canary',details:[]}}});});
  await page.goto('/');if(code==='timeout')await page.clock.install();
  const credential=page.getByLabel('Password or key',{exact:true}),minutes=page.getByLabel('Exact minutes',{exact:true});
  await page.getByLabel('Address (optional)',{exact:true}).fill(' synthetic address ');await page.getByLabel('Login (optional)',{exact:true}).fill('\tlogin ');await credential.fill(' key 😀é\nline ');await minutes.fill('61');
  await page.getByLabel('Require a separate Reading code').check();await page.getByLabel('Reading code',{exact:true}).fill('      ');
  await page.getByRole('button',{name:'Create Secret',exact:true}).click();await expect.poll(()=>posts).toBe(1);if(code==='timeout')await page.clock.runFor(30001);
  await expect(page.getByRole('alert').filter({hasText:notice})).toBeVisible();await expect(credential).toHaveValue(' key 😀é\nline ');await expect(minutes).toHaveValue('61');await expect(page.getByLabel('Address (optional)',{exact:true})).toHaveValue(' synthetic address ');await expect(page.getByLabel('Login (optional)',{exact:true})).toHaveValue('\tlogin ');await expect(page.getByLabel('Reading code',{exact:true})).toHaveValue('      ');
  await expect(credential).toBeEditable();await expect(page.getByRole('heading',{name:'Secret created',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Copy link',exact:true})).toHaveCount(0);await expect(page.getByText('DO NOT ECHO synthetic canary',{exact:true})).toHaveCount(0);expect(posts).toBe(1);
  await page.getByRole('button',{name:'Create a new attempt',exact:true}).click();await expect.poll(()=>posts).toBe(2);
 });
}

test('AC-01 AC-06: mounted pending request freezes every submitted control and prevents duplicate submits',async({page})=>{
 let posts=0;let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});
 await page.route('**/api/v1/secrets',async route=>{posts++;await wait;await route.fulfill({status:503,json:{error:{code:'short_live_path.service_unavailable',message:'synthetic',details:[]}}});});
 await page.goto('/');await page.getByLabel('Password or key',{exact:true}).fill(' synthetic key ');await page.getByLabel('Require a separate Reading code').check();await page.getByLabel('Reading code',{exact:true}).fill('aaaaaa');await page.getByRole('button',{name:'Create Secret',exact:true}).click();
 await expect.poll(()=>posts).toBe(1);for(const control of await page.locator('form input, form textarea, form button').all())await expect(control).toBeDisabled();
 await page.locator('form').evaluate(form=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await page.keyboard.press('Enter');expect(posts).toBe(1);await expect(page.getByLabel('Password or key',{exact:true})).toHaveValue(' synthetic key ');release();await expect(page.getByRole('button',{name:'Create a new attempt',exact:true})).toBeEnabled();expect(posts).toBe(1);
});

test('AC-04 AC-05: mounted lifetime synchronizes exact minutes and native keyboard boundaries',async({page})=>{
 let input:Record<string,unknown>|undefined;await page.route('**/api/v1/secrets',route=>{input=route.request().postDataJSON();return route.fulfill({status:503,json:{error:{code:'short_live_path.service_unavailable',message:'synthetic',details:[]}}});});
 await page.goto('/');const minutes=page.getByLabel('Exact minutes',{exact:true}),range=page.getByRole('slider');await expect(minutes).toHaveValue('60');await expect(range).toHaveValue('60');
 await range.focus();for(const [key,value] of [['ArrowRight','61'],['ArrowUp','62'],['ArrowLeft','61'],['ArrowDown','60'],['Home','1'],['End','1440']]){await range.press(key);await expect(minutes).toHaveValue(value);await expect(range).toHaveValue(value);}
 await minutes.fill('61');await minutes.blur();await expect(range).toHaveValue('61');await page.getByLabel('Password or key',{exact:true}).fill('synthetic');await page.getByRole('button',{name:'Create Secret',exact:true}).click();await expect.poll(()=>input?.lifetime_minutes).toBe(61);await expect(page.getByRole('button',{name:'Create a new attempt',exact:true})).toBeEnabled();
 for(const value of ['', '0','1441','1.5']){await minutes.fill(value);await page.getByRole('button',{name:'Create a new attempt',exact:true}).click();await expect(minutes).toHaveValue(value);await expect(page.getByText('Enter a whole number from 1 to 1440.',{exact:true})).toBeVisible();await expect(range).toBeDisabled();await expect(page.locator('form > div').first()).toBeFocused();}
});

for(const pointerType of ['mouse','touch'] as const)test(`AC-04: mounted ${pointerType} lifetime snapping includes ties and minimum`,async({page})=>{
 await page.goto('/');const range=page.getByRole('slider'),minutes=page.getByLabel('Exact minutes',{exact:true});
 await range.scrollIntoViewIfNeeded();const box=(await range.boundingBox())!;
 const inset=await range.evaluate(el=>{const s=getComputedStyle(el);return parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth)+8;});
 const session=await page.context().newCDPSession(page);
 for(const [raw,expected] of [[1,'1'],[61,'60'],[1440,'1440']] as const){
  const x=box.x+inset+(box.width-2*inset)*(raw-1)/1439,y=box.y+box.height/2;
  const current=Number(await range.inputValue()),start=box.x+inset+(box.width-2*inset)*(current-1)/1439;
  if(pointerType==='mouse'){await page.mouse.move(start,y);await page.mouse.down();await page.mouse.move(x,y,{steps:5});await page.mouse.up();}
  else{await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width-inset,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await expect(minutes).toHaveValue(expected);await expect(range).toHaveValue(expected);
 }
 await session.detach();
 // Exact midpoint vectors complement native mouse/touch delivery above.
 for(const [raw,expected] of [[1,'1'],[61,'60'],[90,'120'],[1440,'1440']] as const){
  await range.dispatchEvent('pointerdown',{pointerType,pointerId:1});await range.evaluate((el,raw)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,String(raw));el.dispatchEvent(new Event('input',{bubbles:true}));},raw);await range.dispatchEvent('pointerup',{pointerType,pointerId:1});await expect(minutes).toHaveValue(expected);await expect(range).toHaveValue(expected);
 }
});

test('AC-02 AC-06: mounted validation retains overflow and omits a disabled invalid code',async({page})=>{
 let posts=0;let input:Record<string,unknown>|undefined;await page.route('**/api/v1/secrets',route=>{posts++;input=route.request().postDataJSON();return route.fulfill({status:503,json:{error:{code:'short_live_path.service_unavailable',message:'synthetic',details:[]}}});});
 await page.goto('/');const credential=page.getByLabel('Password or key',{exact:true});const submit=()=>page.getByRole('button',{name:posts?'Create a new attempt':'Create Secret',exact:true}).click();
 await credential.fill('synthetic');
 for(const label of ['Address (optional)','Login (optional)','Password or key']){
  const field=page.getByLabel(label,{exact:true});await field.fill('');await field.evaluate(el=>{const data=new DataTransfer();data.setData('text/plain','bad\ud800');el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));});
  await submit();await expect(page.getByText('Text must contain valid Unicode characters.',{exact:true})).toBeVisible();expect(posts).toBe(0);await field.fill(label==='Password or key'?'synthetic':'');
 }
 for(const value of ['', ' \t\n', 'é'.repeat(32768)+'a']){await credential.fill(value);await submit();await expect(credential).toHaveValue(value);await expect(page.getByText('Check the highlighted fields.',{exact:true})).toBeVisible();expect(posts).toBe(0);await expect(page.locator('form > div').first()).toBeFocused();}
 await credential.fill('é'.repeat(32768));await page.getByLabel('Require a separate Reading code').check();const code=page.getByLabel('Reading code',{exact:true});
 for(const value of ['😀'.repeat(5),'é'.repeat(512)+'a']){await code.fill(value);await submit();await expect(code).toHaveValue(value);expect(posts).toBe(0);await expect(page.getByText('Use at least 6 Unicode code points, up to 1024 UTF-8 bytes.',{exact:true})).toBeVisible();}
 await code.fill('é'.repeat(512));await submit();await expect.poll(()=>posts).toBe(1);expect(input?.reading_code).toBe('é'.repeat(512));await expect(page.getByRole('button',{name:'Create a new attempt',exact:true})).toBeEnabled();await code.fill('short');await page.getByLabel('Require a separate Reading code').uncheck();await submit();await expect.poll(()=>posts).toBe(2);expect(input).not.toHaveProperty('reading_code');
});

test('AC-01: confirmed creation transitions only from a valid response',async({page})=>{
 await page.route('**/api/v1/secrets',route=>route.fulfill({status:201,json:{data:{share_url:new URL('/s/'+'A'.repeat(43),route.request().url()).href,expires_at:new Date(Date.now()+3600000).toISOString()},meta:{service_time:new Date().toISOString()}}}));await page.goto('/');await page.getByLabel('Password or key',{exact:true}).fill('synthetic');await page.getByRole('button',{name:'Create Secret',exact:true}).click();await expect(page.getByRole('heading',{name:'Secret created',exact:true})).toBeVisible();await expect(page.getByLabel('Password or key',{exact:true})).toHaveCount(0);
});
