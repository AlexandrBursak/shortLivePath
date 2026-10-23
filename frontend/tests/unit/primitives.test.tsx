import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
test('AC-08: generic primitives expose persistent labels, help, errors and busy semantics', async () => {
  assert.ok(existsSync('src/shared/ui/index.tsx'), 'generic primitives must be implemented');
  const {TextField, ExactTextArea, ActionButton, Notice, ScreenFrame} = await import('../../src/shared/ui/index.js');
  const html=renderToStaticMarkup(<ScreenFrame title="Neutral"><TextField id="code" label="Code" help="Exact" error="Required" /><ExactTextArea id="key" label="Key" defaultValue={' <script>\r\n  key  '} /><ActionButton busy>Show</ActionButton><Notice tone="error">Unavailable</Notice></ScreenFrame>);
  assert.match(html, /for="code"/); assert.match(html, /aria-describedby="code-help code-error"/);
  assert.match(html,/aria-invalid="true"/); assert.match(html,/aria-busy="true"/); assert.match(html,/disabled=""/);
  assert.match(html,/role="alert"/); assert.match(html,/&lt;script&gt;/); assert.doesNotMatch(html,/<script>/);
});
