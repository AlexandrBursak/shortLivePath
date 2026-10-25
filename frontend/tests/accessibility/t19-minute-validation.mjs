// AC-05 / NFR-06: real installed-browser form validation, no mocked API response.
// Run after the serial matrix: node frontend/tests/accessibility/t19-minute-validation.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,firefox,delay} from '../e2e/t19-drivers.mjs';
const report={cases:[],errors:{}};
async function until(p,expression){for(let n=0;n<100;n++){if(await p.eval(expression))return;await delay(100);}throw Error('safe state timeout');}
for(const factory of [chromium,firefox]){
 const browser=await factory();
 try{
  for(const width of [360,1280]){
   const p=await browser.page();await p.viewport(width,800);await p.goto('https://localhost:3449/');
   await until(p,'document.querySelector("button[type=submit]")!==null');await p.eval('document.querySelector("button[type=submit]").focus()');await p.key('Enter');await until(p,'document.querySelector("[role=alert]")!==null');
   await p.eval('document.getElementById("credential").focus()');await p.key('x');
   for(const value of ['0','1441','1.5','']){
    const item={name:`AC-05 NFR-06 ${browser.name} ${width} ${value||'empty'}`,result:'FAIL'};
    try{
     await p.eval('(()=>{const e=document.getElementById("minutes");e.focus();e.select();return true})()');
     if(value==='')await p.key('Backspace');else if(p.raw)await p.raw.keyboard.insertText(value);else for(const char of value)await p.key(char);
     await p.eval('document.querySelector("button[type=submit]").focus()');await p.key('Enter');await until(p,'document.getElementById("minutes-error")!==null');
     assert.equal(await p.eval('document.getElementById("minutes").value'),value);
     assert.equal(await p.eval('document.getElementById("minutes-error").textContent.includes("1 to 1440")'),true);
     assert.equal(await p.eval('document.getElementById("minutes").getAttribute("aria-describedby").includes("minutes-error")'),true);
     assert.equal(await p.eval('document.activeElement.textContent.includes("Check the highlighted fields.")'),true);
     assert.equal(await p.eval('document.querySelectorAll("pre").length'),0);
     assert.equal(await p.eval('document.documentElement.scrollWidth<=innerWidth'),true);
     assert.equal(p.metrics?p.metrics.posts:await p.eval('window.t19.posts'),0);
     item.result='PASS';
    }catch(e){item.error=e.name;}
    report.cases.push(item);
   }
   await p.close();
  }
  report.errors[browser.name]=browser.errors;
 }finally{await browser.close();}
}
fs.writeFileSync('/tmp/slp-t19-evidence/minute-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases.length,pass:report.cases.filter(c=>c.result==='PASS').length,fail:report.cases.filter(c=>c.result==='FAIL').length,errors:report.errors}));
if(report.cases.some(c=>c.result!=='PASS'))process.exitCode=1;
