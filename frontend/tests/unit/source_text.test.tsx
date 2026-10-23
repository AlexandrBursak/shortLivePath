import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
test('AC-02 AC-03 AC-06: source edits use selection-anchored UTF16 mappings, raw-distinct undo and untouched CRLF',async()=>{
 assert.ok(existsSync('src/shared/lib/source_text.ts'),'source-preserving edit model must be implemented');
 const {SourceText}=await import('../../src/shared/lib/source_text');
 const model=new SourceText('a\r\na\nb');
 model.replace(0,2,'');assert.equal(model.value,'a\nb');model.undo();assert.equal(model.value,'a\r\na\nb');model.redo();assert.equal(model.value,'a\nb');
 const same=new SourceText('a\r\nb');same.replace(0,3,'a\nb');assert.equal(same.value,'a\nb');same.undo();assert.equal(same.value,'a\r\nb');same.redo();assert.equal(same.value,'a\nb');
 const unicode=new SourceText('😀é\r\nZ\rQ');unicode.replace(3,4,'');assert.equal(unicode.value,'😀e\r\nZ\rQ');
 unicode.replace(0,2,'𝄞');assert.equal(unicode.value,'𝄞e\r\nZ\rQ');
});
