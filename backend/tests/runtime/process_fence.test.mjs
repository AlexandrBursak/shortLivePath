import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawn} from 'node:child_process'
import {once} from 'node:events'
test('AC-07 AC-11: kernel process fence excludes replacement while any old process/native threads remain',{timeout:10000},async()=>{
 const script='/home/node/app/process-fence.sh'
 assert.ok(existsSync(script),'runtime process fence must be installed')
 const dir=mkdtempSync(join(tmpdir(),'slp-owned-lock-'))
 const run=(code)=>spawn('sh',[script,process.execPath,'--input-type=module','-e',code],{env:{...process.env,SLP_LOCK_DIRECTORY:dir},stdio:['ignore','pipe','pipe']})
 const first=run("console.log('owned');setInterval(()=>{},1000)")
 try{
  await once(first.stdout,'data')
  const denied=run("process.exit(0)");assert.equal((await once(denied,'exit'))[0],75)
  first.kill('SIGKILL');await once(first,'exit')
  const next=run("process.exit(0)");assert.equal((await once(next,'exit'))[0],0)
 }finally{if(first.exitCode===null && first.signalCode===null)first.kill('SIGKILL');rmSync(dir,{recursive:true,force:true})}
})
