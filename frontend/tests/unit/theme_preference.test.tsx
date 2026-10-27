import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readThemePreference,resolveTheme,themeBootScript,writeThemePreference} from '../../src/shared/lib/theme_preference.js';
function memoryStorage(initial:Record<string,string>={}){
 const values=new Map(Object.entries(initial));
 return {values,getItem:(key:string)=>values.get(key) ?? null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
}
test('stored light/dark wins; anything else falls back to system',()=>{
 assert.equal(readThemePreference(memoryStorage({'snap-link:theme':'dark'})),'dark');
 assert.equal(readThemePreference(memoryStorage({'snap-link:theme':'sepia'})),'system');
 assert.equal(readThemePreference(undefined),'system');
});
test('choosing system forgets the stored choice',()=>{
 const storage=memoryStorage({'snap-link:theme':'light'});
 writeThemePreference('system',storage);assert.equal(storage.values.has('snap-link:theme'),false);
 writeThemePreference('dark',storage);assert.equal(storage.values.get('snap-link:theme'),'dark');
});
test('a storage that throws never breaks the page',()=>{
 const broken={getItem:()=>{throw new Error('denied');},setItem:()=>{throw new Error('denied');},removeItem:()=>{throw new Error('denied');}};
 assert.equal(readThemePreference(broken),'system');
 assert.doesNotThrow(()=>writeThemePreference('dark',broken));
});
test('system follows the OS preference and the boot script reads the same key',()=>{
 assert.equal(resolveTheme('system',true),'dark');assert.equal(resolveTheme('system',false),'light');assert.equal(resolveTheme('light',true),'light');
 assert.match(themeBootScript,/"snap-link:theme"/);
});
