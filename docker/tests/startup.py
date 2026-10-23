"""T17 extra fail-closed admission checks; only the synthetic slp-t17 project."""
import json
import os
import pathlib
import subprocess
import time
root=pathlib.Path(__file__).resolve().parents[2]
env=dict(os.environ,SLP_API_IMAGE='slp-t3-test-85230-runtime',SLP_WEB_IMAGE='slp-t17-production')
base=['docker','compose','--env-file','/tmp/slp-t17-synthetic/synthetic.env','-p','slp-t17']
def run(args,ok=True):
 p=subprocess.run(args,cwd=root,env=env,text=True,capture_output=True)
 if ok: assert p.returncode==0,(args,p.stderr,p.stdout)
 return p
results=[]
# Empty mandatory deployment configuration is rejected before any container action.
p=run(['docker','compose','--env-file','/dev/null','-p','slp-t17','config','-q'],False)
assert p.returncode!=0;results.append('missing mandatory Compose configuration fails before startup')
run(base+['stop','api'])
p=run(base+['run','--rm','--no-deps','-e','SLP_PUBLIC_ORIGIN=http://localhost:3447','api'],False)
assert p.returncode not in [0,75];results.append('invalid non-HTTPS origin prevents runtime startup')
run(base+['stop','redis'])
# docker start, not compose start: Compose may automatically start dependencies.
run(['docker','start','slp-t17-api-1']);time.sleep(3)
p=run(['docker','exec','slp-t17-api-1','node','-e',"fetch('http://127.0.0.1:3333/health/ready').then(r=>console.log(r.status))"])
assert p.stdout.strip()=='503';results.append('Redis unavailable at API startup stays ready503')
# Restore and wait for the real continuity quiet window, no bypass/marker reset.
run(['docker','start','slp-t17-redis-1'])
end=time.monotonic()+110
while time.monotonic()<end:
 p=run(['docker','exec','slp-t17-api-1','node','-e',"fetch('http://127.0.0.1:3333/health/ready').then(r=>console.log(r.status))"])
 if p.stdout.strip()=='200': break
 time.sleep(1)
else: raise AssertionError('Redis startup recovery did not reopen')
results.append('Redis startup recovery reopens only through ordinary readiness')
pathlib.Path('/tmp/slp-t17-evidence/startup-extra.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'passed':len(results),'checks':results},indent=2))
