import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
test('AC-08: active layer lint rejects a shared-to-route import',()=>{
 const path='src/shared/__invalid_layer_probe.ts';
 try {
  writeFileSync(path, "import Page from '../app/page'; export default Page;\n");
  let output='';try {execFileSync('pnpm',['exec','eslint',path],{encoding:'utf8',stdio:'pipe'});}catch(e){output=String((e as {stdout?:string}).stdout);}
  assert.match(output,/import\/no-restricted-paths/);
 }finally{unlinkSync(path);}
});
