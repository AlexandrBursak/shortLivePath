"""Nonsensitive retained-image/source provenance, used by NPM boundary smoke."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[2]

def verify(run, api, web):
    paths=[p for p in run(['git','ls-files','backend']).splitlines() if p.endswith('.ts') and not p.endswith('.d.ts')]
    relative=[p.removeprefix('backend/') for p in paths]
    script="const fs=require('fs'),crypto=require('crypto');const paths="+json.dumps(relative)+";console.log(JSON.stringify(Object.fromEntries(paths.map(p=>[p,fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null]))))"
    source=json.loads(run(['docker','run','--rm','--entrypoint','node','slp-prepush-backend-gates:latest','-e',script]))
    mismatch=[p for p in paths if hashlib.sha256((ROOT/p).read_bytes()).hexdigest()!=source[p.removeprefix('backend/')]]
    assert not mismatch, 'retained tooling sources differ: '+str(mismatch)
    tree="const fs=require('fs'),crypto=require('crypto');let o={};function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.js'))o[f]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}}walk('build');console.log(JSON.stringify(o))"
    built=json.loads(run(['docker','run','--rm','--entrypoint','node','slp-prepush-backend-gates:latest','-e',tree]))
    actual=json.loads(run(['docker','run','--rm','--entrypoint','node',api,'-e',tree]))
    assert built==actual, 'retained API compiled JS differs from current-source tooling build'
    proxy="const fs=require('fs'),c=require('crypto');console.log(c.createHash('sha256').update(fs.readFileSync('src/proxy.ts')).digest('hex'))"
    digest=run(['docker','run','--rm','--entrypoint','node','slp-t19-followup-tooling:latest','-e',proxy])
    assert digest==hashlib.sha256((ROOT/'frontend/src/proxy.ts').read_bytes()).hexdigest()
    return {'backend_source_files_matched':len(paths),'compiled_backend_js_matched':len(built),'frontend_proxy_source_sha256':digest,'limitation':'Frontend complete build/source reproducibility not independently rebuilt; retained production artifact exercised with matching critical proxy source.'}
