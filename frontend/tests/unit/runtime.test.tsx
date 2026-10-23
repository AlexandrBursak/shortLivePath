import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('AC-08: default Docker artifact selects minimal non-root production runtime',()=>{
 const dockerfile=readFileSync('docker/Dockerfile','utf8');
 assert.match(dockerfile,/FROM runtime AS production\s*$/);
 assert.match(dockerfile,/USER node/);
});
