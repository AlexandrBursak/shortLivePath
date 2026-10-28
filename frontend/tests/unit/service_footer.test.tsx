import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ServiceFooter} from '../../src/view/components/ServiceFooter.js';
test('footer shows the RexSoft copyright for the current year',()=>{
 assert.match(renderToStaticMarkup(<ServiceFooter/>),new RegExp(`^<footer class="serviceFooter"><p>© ${new Date().getFullYear()} RexSoft</p></footer>$`));
});
