"""T17 AC-08/10/11 isolated topology/failure/recovery/persistence smoke.
Only operates project slp-t17, generated synthetic configuration; never production.
"""
import hashlib
import json
import os
import pathlib
import ssl
import subprocess
import time
import urllib.error
import urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
ENV = '/tmp/slp-t17-synthetic/synthetic.env'
OUT = pathlib.Path('/tmp/slp-t17-evidence')
env = dict(os.environ, SLP_WEB_IMAGE='slp-t17-production', SLP_API_IMAGE='slp-t3-test-85230-runtime')
base = ['docker','compose','--env-file',ENV,'-p','slp-t17']
results = []
def cmd(args, allowed=(0,)):
    p = subprocess.run(args,cwd=ROOT,env=env,text=True,capture_output=True)
    assert p.returncode in allowed, (args,p.returncode,p.stdout,p.stderr)
    return p.stdout.strip()
def compose(*args,allowed=(0,)):
    return cmd(base+list(args),allowed)
def check(name, condition=True):
    assert condition,name
    results.append(name)
    (OUT/'operations.json').write_text(json.dumps(results,indent=2))
def redis(*args):
    return compose('exec','-T','redis','redis-cli','--raw',*args)
def request(path, body=None):
    data=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request('https://localhost:3447'+path,data=data,headers={'Content-Type':'application/json'})
    try:
        r=urllib.request.urlopen(req,context=ssl.create_default_context(cafile='/tmp/slp-t17-synthetic/tls/cert.pem'),timeout=8)
    except urllib.error.HTTPError as e:
        r=e
    text=r.read().decode()
    assert 'no-store' in r.headers['Cache-Control']
    assert r.headers['Referrer-Policy']=='no-referrer'
    try: value=json.loads(text)
    except ValueError: value={}
    return r.status,value
def ready():
    return compose('exec','-T','api','node','-e',"fetch('http://127.0.0.1:3333/health/ready').then(r=>console.log(r.status))")
def wait_ready(timeout=110):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        if ready()=='200': return
        time.sleep(1)
    raise AssertionError('readiness did not recover')
config=json.loads(compose('config','--format','json'))
check('only proxy publishes loopback TLS', [k for k,v in config['services'].items() if v.get('ports')]==['proxy'] and config['services']['proxy']['ports'][0]['host_ip']=='127.0.0.1')
check('store network internal',config['networks']['store']['internal'])
check('one API owner',len(json.loads(cmd(['docker','ps','--filter','label=com.docker.compose.project=slp-t17','--filter','label=com.docker.compose.service=api','--format','json']).join(['[',']'])))==1)
# Actual settings, not merely source strings.
settings={key:redis('CONFIG','GET',key).partition('\n')[2] for key in ['maxmemory','maxmemory-policy','appendonly','save','shutdown-on-sigterm','shutdown-on-sigint','slowlog-log-slower-than','latency-monitor-threshold']}
check('Redis 256MiB/noeviction/no persistence/no slow query capture',settings=={'maxmemory':'268435456','maxmemory-policy':'noeviction','appendonly':'no','save':'','shutdown-on-sigterm':'nosave','shutdown-on-sigint':'nosave','slowlog-log-slower-than':'-1','latency-monitor-threshold':'0'})
inspection=json.loads(cmd(['docker','inspect','slp-t17-redis-1']))[0]
mounts=inspection['Mounts']
check('Redis /data is tmpfs, no persistent volume','/data' in inspection['HostConfig']['Tmpfs'] and 'tmpfs on /data type tmpfs' in compose('exec','-T','redis','mount') and not any(m['Type']=='volume' for m in mounts))
check('no Redis RDB/AOF files',redis('CONFIG','GET','dir').endswith('/data') and compose('exec','-T','redis','sh','-c','test -z "$(ls -A /data)"')=='')
# No API relay: deliberately stop Next and still create through HTTPS.
compose('stop','web')
check('API create succeeds with Next stopped',request('/api/v1/secrets',{'credential':'T17_DIRECT_NO_RELAY'})[0]==201)
check('proxy unavailable-upstream carries confidentiality headers',request('/')[0] in (502,504))
compose('start','web')
# Direct socket peer is not the pinned proxy, even with forged XFF.
script="const r=await fetch('http://api:3333/api/v1/secrets',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'192.0.2.1'},body:JSON.stringify({credential:'untrusted'})});console.log(r.status);"
check('untrusted direct peer denied',compose('exec','-T','web','node','--input-type=module','-e',script)=='503')
# Stores are not attached to edge and have no public bindings.
for service in ['postgres','redis']:
    i=json.loads(cmd(['docker','inspect','slp-t17-'+service+'-1']))[0]
    check(service+' private',list(i['NetworkSettings']['Networks'])==['slp-t17_store'] and not i['HostConfig']['PortBindings'])
# Shared kernel lock rejects another API owner with exact exit 75.
p=subprocess.run(base+['run','--rm','--no-deps','api'],cwd=ROOT,env=env,capture_output=True)
check('second API owner exits75',p.returncode==75)
# Capture schema column names: metadata only, no payload or verifier.
columns=compose('exec','-T','postgres','psql','-U','slp','-d','slp','-Atc',"SELECT column_name FROM information_schema.columns WHERE table_name='link_lifecycles' ORDER BY ordinal_position")
(OUT/'metadata-columns.txt').write_text(columns+'\n')
check('metadata schema has no content/code/token',bool(columns) and all(x not in columns for x in ['credential','reading_code','share_url','verifier']))
# Expired debt must clear before recovery admission. Stop owner and PG, retain Redis.
status,created=request('/api/v1/secrets',{'credential':'T17_EXPIRY_DEBT','lifetime_minutes':1})
assert status==201
share=created['data']['share_url'];token=share.rsplit('/',1)[1]
compose('stop','api')
# Missing raw key must prevent the actual runtime from starting.
p=subprocess.run(base+['run','--rm','--no-deps','-e','SLP_ADDRESS_KEY_FILE=/missing','api'],cwd=ROOT,env=env,capture_output=True)
check('missing key startup exits nonzero',p.returncode!=0 and p.returncode!=75)
compose('stop','postgres')
cmd(['docker','start','slp-t17-api-1'])
time.sleep(3)
check('PG down at startup ready503',ready()=='503')
check('PG down no confirmed creation',request('/api/v1/secrets',{'credential':'unsafe'})[0]==503)
check('PG down no disclosure',request('/api/v1/secrets/'+token+'/disclosures',{})[0]==503)
# Explicit outage allowance; no claim of physical erasure during this downtime.
time.sleep(62)
prefix='slp:t17synthetic:'
check('expired index backlog exists before PG recovery',int(redis('ZCOUNT',prefix+'payload:expiry','-inf',str(int(time.time()*1000))))>0)
compose('start','postgres')
wait_ready()
prefix='slp:t17synthetic:'
now=str(int(time.time()*1000))
check('all due payload debt gone before ready',redis('ZCOUNT',prefix+'payload:expiry','-inf',now)=='0')
check('expired status is terminal',request('/api/v1/secrets/'+token+'/status')[1]['data']['state']=='expired')
check('expired disclosure denied410',request('/api/v1/secrets/'+token+'/disclosures',{})[0]==410)
check('creation resumes only after readiness',request('/api/v1/secrets',{'credential':'T17_RECOVERED'})[0]==201)
# Unknown token gives contracted conflict; fill five observed failures for 429.
check('unknown disclosure conflict409',request('/api/v1/secrets/'+'A'*43+'/disclosures',{})[0]==409)
status,c=request('/api/v1/secrets',{'credential':'T17_LIMIT','reading_code':'T17-code'})
assert status==201
path='/api/v1/secrets/'+c['data']['share_url'].rsplit('/',1)[1]+'/disclosures'
for _ in range(5): assert request(path,{'reading_code':'wrong'})[0]==403
check('verification limit429 retains headers',request(path,{'reading_code':'wrong'})[0]==429)
# Stop Redis cleanly with a marker; restart must not restore any key/data file.
redis('SET','t17-no-persistence-canary','synthetic')
compose('stop','redis')
check('Redis down blocks creation',request('/api/v1/secrets',{'credential':'unsafe'})[0]==503)
compose('start','redis')
check('clean shutdown/restart does not restore marker',redis('EXISTS','t17-no-persistence-canary')=='0')
wait_ready()
check('recovered after Redis restart')
# All layers suppress request-bearing collection, not just canary string matches.
for service in ['proxy','web','api','postgres','redis','migrate']:
    i=json.loads(cmd(['docker','inspect','slp-t17-'+service+'-1']))[0]
    check(service+' Docker logs disabled',i['HostConfig']['LogConfig']['Type']=='none')
print(json.dumps({'passed':len(results),'checks':results},indent=2))
