import {test,expect} from '@playwright/test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {ScreenFrame,TextField,ExactTextArea,ActionButton,Notice} from '../../src/shared/ui';
test('AC-08: labels, keyboard focus, busy and long exact text are usable at 360px',async({page})=>{
 await page.goto('/');
 const css=readFileSync('src/shared/styles/tokens.css','utf8')+readFileSync('src/app/globals.css','utf8');
 const html=renderToStaticMarkup(<ScreenFrame title="Synthetic controls"><TextField id="input" label="Input" help="Help"/><ExactTextArea id="exact" label="Exact text" defaultValue={'synthetic'.repeat(300)}/><ActionButton>Action</ActionButton><ActionButton busy>Waiting</ActionButton><Notice>Safe status</Notice></ScreenFrame>);
 await page.setContent(`<style>${css}</style>${html}`);
 await page.getByLabel('Input').fill('synthetic');await page.getByLabel('Input').focus();
 await page.keyboard.press('Tab');await expect(page.getByLabel('Exact text')).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Action'})).toBeFocused();
 expect(await page.getByRole('button',{name:'Action'}).evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
 await expect(page.getByRole('button',{name:'Waiting'})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
