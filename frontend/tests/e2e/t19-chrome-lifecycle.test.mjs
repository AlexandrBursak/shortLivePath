import test from 'node:test';
import assert from 'node:assert/strict';
import {sameWindowTarget, lifecycleProved} from './t19-chrome-lifecycle.mjs';
test('AC-10 owned Chrome same-window tab must not request a new window',()=>{
 assert.deepEqual(sameWindowTarget('owned-context'),{url:'about:blank',browserContextId:'owned-context',newWindow:false,background:false});
});
test('AC-10 successful commands do not substitute for actual lifecycle events',()=>{
 assert.equal(lifecycleProved('freeze',[{type:'resume'}]),false);
 assert.equal(lifecycleProved('freeze',[{type:'freeze'}]),true);
 assert.equal(lifecycleProved('bfcache',[{type:'pageshow',persisted:false}]),false);
 assert.equal(lifecycleProved('bfcache',[{type:'pageshow',persisted:true}]),true);
 assert.equal(lifecycleProved('hidden',[{type:'visibilitychange',visibility:'visible'}]),false);
 assert.equal(lifecycleProved('hidden',[{type:'visibilitychange',visibility:'hidden'}]),true);
});
