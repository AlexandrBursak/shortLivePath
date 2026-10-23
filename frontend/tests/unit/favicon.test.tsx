import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
test('AC-08: neutral browser favicon requests do not generate console 404 errors',async()=>{
 assert.ok(existsSync('src/app/favicon.ico/route.ts'),'safe favicon route must exist');
 const {GET}=await import('../../src/app/favicon.ico/route.js');
 const response=GET();assert.equal(response.status,200);assert.match(response.headers.get('Content-Type') ?? '',/^image\//);
});
