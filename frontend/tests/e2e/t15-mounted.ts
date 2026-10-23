import {createRequire} from 'node:module';
import type {Page} from '@playwright/test';
export async function mountGate(page:Page){
 page.on('pageerror',error=>{throw error;});
 const require=createRequire(import.meta.url),esbuild=require(require.resolve('esbuild',{paths:[require.resolve('tsx')]}));
 const bundle=esbuild.buildSync({stdin:{contents:`
 import {createRoot} from 'react-dom/client';
 import {ReadingGate as Gate} from './src/view/widgets/SecretReader';
 window.events=[];
 createRoot(document.getElementById('root')).render(<Gate onDisclosure={value=>window.events.push({kind:'disclosure',credential:value.secret.credential})} onTerminal={value=>window.events.push({kind:'terminal',...value})}/>);
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"development"'}}).outputFiles[0].text;
 await page.route('**/s/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div><script>'+bundle.replaceAll('</script','<\\/script')+'</script>'}));
 await page.goto('/s/'+'A'.repeat(43));
}
