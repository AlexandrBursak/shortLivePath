import {createRequire} from 'node:module';
import type {Page} from '@playwright/test';

// Test-only development React bundle: production Next does not replay effects.
// esbuild is the pinned tsx toolchain dependency, not a new runtime dependency.
export async function mountStrictConfirmation(page:Page){
 const require=createRequire(import.meta.url);
 const esbuild=require(require.resolve('esbuild',{paths:[require.resolve('tsx')]}));
 const bundle=esbuild.buildSync({stdin:{contents:`
 import {StrictMode} from 'react';
 import {createRoot} from 'react-dom/client';
 import {ExactCopyField} from './src/view/components/ExactCopyField';
 import {ShareConfirmation} from './src/view/widgets/ShareConfirmation';
 import {EligibleDeadline,stamp} from './src/shared/lib/eligible_deadline';
 const expires=new Date(Date.now()+60000).toISOString();
 const result={value:{share_url:location.origin+'/s/'+'A'.repeat(43),expires_at:expires},deadline:new EligibleDeadline(Date.parse(expires),Date.now(),stamp())};
 createRoot(document.getElementById('root')).render(<StrictMode><ExactCopyField label="Standalone" value="strict exact" eligible={()=>true}/><ShareConfirmation result={result} code={' strict code '} startNew={()=>{}}/></StrictMode>);
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'}}).outputFiles[0].text;
 await page.route('**/__t14-mounted',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div><script>'+bundle.replaceAll('</script','<\\/script')+'</script>'}));
 await page.goto('/__t14-mounted');
}
