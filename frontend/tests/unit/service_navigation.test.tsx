import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ServiceNavigation} from '../../src/view/components/ServiceNavigation.js';
test('navigation links every RexSoft service and marks Snap Link as current',()=>{
 const html=renderToStaticMarkup(<ServiceNavigation/>);
 assert.match(html,/<nav aria-label="RexSoft services">/);
 assert.match(html,/<a href="https:\/\/snap-link\.rexsoftproduction\.com\/" aria-current="page">Snap Link<\/a>/);
 assert.match(html,/<a href="https:\/\/passgen\.rexsoftproduction\.com\/">Password Generator<\/a>/);
 assert.match(html,/<a href="https:\/\/markdown-convertor\.rexsoftproduction\.com\/">Markdown to HTML<\/a>/);
});
