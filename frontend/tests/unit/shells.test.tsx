import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
test('AC-08 AC-12: both route shells render neutral guidance without server data access',async()=>{
 for(const file of ['src/app/page.tsx','src/app/s/[token]/page.tsx']) {
  assert.ok(existsSync(file),'neutral route must exist: '+file);
  assert.doesNotMatch(readFileSync(file,'utf8'),/fetch\(|localStorage|sessionStorage|generateMetadata|dangerouslySetInnerHTML/);
 }
 const {default:Page}=await import('../../src/app/s/[token]/page.js');
 const html=renderToStaticMarkup(<Page/>);
 assert.match(html,/Opening this page does not reveal/);assert.match(html,/does not change external passwords/);assert.match(html,/disabled/);
});
