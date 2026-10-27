import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ServiceHeader} from '../../src/view/components/ServiceHeader.js';
test('header lists RexSoft services in the shared order and marks Snap Link as current',()=>{
 const html=renderToStaticMarkup(<ServiceHeader/>);
 assert.match(html,/<nav aria-label="RexSoft services">/);
 const labels=[...html.matchAll(/<a [^>]*>.*?<\/svg>([^<]+)<\/a>/g)].map(match=>match[1]);
 assert.deepEqual(labels,['Password Generator','Markdown to HTML','Snap Link']);
 assert.match(html,/<a [^>]*href="https:\/\/snap-link\.rexsoftproduction\.com\/" aria-current="page"/);
 assert.match(html,/<a [^>]*href="https:\/\/passgen\.rexsoftproduction\.com\/">/);
 assert.match(html,/<a [^>]*href="https:\/\/markdown-convertor\.rexsoftproduction\.com\/">/);
});
test('header carries the System/Light/Dark theme switch',()=>{
 const html=renderToStaticMarkup(<ServiceHeader/>);
 assert.match(html,/<legend[^>]*>Theme<\/legend>/);
 for(const label of ['System','Light','Dark']) assert.match(html,new RegExp(`<input[^>]*type="radio"[^>]*/>${label}</label>`));
});
