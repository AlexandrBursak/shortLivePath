"""Isolated real nginx TLS boundary smoke, NOT deployed NPM certification.
Uses retained runtime images; creates/removes only unique owned synthetic resources.
No environment credentials are read; sanitized evidence survives cleanup in /tmp.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import ssl
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from npm_direct_provenance import verify

ROOT=Path(__file__).resolve().parents[2]
PROJECT='slp-npm-direct-'+str(os.getpid())
OUT=Path(tempfile.mkdtemp(prefix=PROJECT+'-evidence-'))
MAT=OUT/'material'
checks=[]
# Explicit retained images; never pull/build or touch existing projects.
API='slp-t19-followup-api:latest'
WEB='slp-t19-production:latest'
base=['docker','compose','--env-file',str(MAT/'synthetic.env'),'-p',PROJECT,'-f',str(ROOT/'compose.yml'),'-f',str(ROOT/'compose.npm-direct.yml')]
env={'PATH':os.environ['PATH'],'HOME':os.environ['HOME']}
def run(args):
    p=subprocess.run(args,cwd=ROOT,env=env,text=True,capture_output=True)
    if p.returncode: raise RuntimeError('command failed: '+ ' '.join(args[:8])+'; exit '+str(p.returncode))
    return p.stdout.strip()
def compose(*args): return run(base+list(args))
def check(name, ok=True):
    assert ok,name
    checks.append(name)
    (OUT/'checks.json').write_text(json.dumps(checks,indent=2))
def inspect(service): return json.loads(run(['docker','inspect',PROJECT+'-'+service+'-1']))[0]
def snapshot():
    return {s:{'id':inspect(s)['Id'],'mounts':[(m['Name'],m['Destination']) for m in inspect(s)['Mounts'] if m['Type']=='volume']} for s in ['postgres','redis','api']}
def req(path,body=None,headers=None):
    h={'Content-Type':'application/json',**(headers or {})}
    q=urllib.request.Request('https://localhost:3469'+path,data=None if body is None else json.dumps(body).encode(),headers=h)
    try:r=urllib.request.urlopen(q,context=ssl.create_default_context(cafile=str(MAT/'tls/cert.pem')),timeout=10)
    except urllib.error.HTTPError as e:r=e
    text=r.read().decode()
    assert 'no-store' in r.headers.get('Cache-Control','')
    assert r.headers.get('Referrer-Policy')=='no-referrer'
    try:value=json.loads(text)
    except ValueError:value={}
    return r.status,value,r.headers,text

foreign=run(['docker','ps','-q']).splitlines()
# Refuse to publish over an occupied listener or overlap an existing network.
for port in [3369,3069,3469]:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',port))
networks=run(['docker','network','ls','-q']).splitlines()
if networks:
    import ipaddress
    for network in json.loads(run(['docker','network','inspect',*networks])):
        for subnet in (network.get('IPAM',{}).get('Config') or []):
            if subnet.get('Subnet'):
                existing=ipaddress.ip_network(subnet['Subnet'])
                assert all(not existing.overlaps(ipaddress.ip_network(n)) for n in ['10.219.71.0/24','10.219.72.0/24'])
try:
    run(['python3',str(ROOT/'docker/synthetic.py'),str(MAT)])
    f=MAT/'synthetic.env'
    values=dict(line.split('=',1) for line in f.read_text().splitlines())
    values.update(SLP_NAMESPACE=PROJECT,SLP_HTTPS_PORT='3469',SLP_PUBLIC_ORIGIN='https://localhost:3469',SLP_PROXY_IP='10.219.71.253',SLP_NPM_PEER='10.219.71.254',SLP_EDGE_SUBNET='10.219.71.0/24',SLP_STORE_SUBNET='10.219.72.0/24',SLP_BIND_IP='127.0.0.1',SLP_NPM_API_PORT='3369',SLP_NPM_WEB_PORT='3069',SLP_API_IMAGE=API,SLP_WEB_IMAGE=WEB)
    f.write_text(''.join(k+'='+v+'\n' for k,v in values.items()))
    # Parse merged model in memory only: never persist/print interpolated credentials.
    rawbase=['docker','compose','--env-file',str(f),'-p',PROJECT,'-f',str(ROOT/'compose.yml')]
    original=json.loads(run(rawbase+['config','--format','json']))
    merged=json.loads(compose('config','--format','json'))
    check('default active publishers only api/web',sorted(k for k,v in merged['services'].items() if v.get('ports'))==['api','web'])
    check('exact immediate peer pinned',merged['services']['api']['environment']['SLP_TRUSTED_PROXY']==values['SLP_NPM_PEER'])
    for service in ['postgres','redis']:
        check(service+' model byte-equivalent',original['services'][service]==merged['services'][service])
    check('volume declarations unchanged',original['volumes']==merged['volumes'])
    check('loopback-only fixture publications',all(p['host_ip']=='127.0.0.1' for s in ['api','web'] for p in merged['services'][s]['ports']))
    fixture=OUT/'fixture.json'
    fixture.write_text(json.dumps({'services':{'api':{'networks':{'edge':{'ipv4_address':'10.219.71.10'},'store':{}}},'web':{'networks':{'edge':{'ipv4_address':'10.219.71.11'}}},'npm-fixture':{'image':'nginx:alpine','entrypoint':['nginx','-g','daemon off;'],'logging':{'driver':'none'},'ports':['127.0.0.1:3469:8443'],'volumes':[str(OUT/'nginx.conf')+':/etc/nginx/nginx.conf:ro',str(MAT/'tls')+':/run/tls:ro'],'networks':{'edge':{'ipv4_address':'10.219.71.254'}}}}}))
    base.extend(['-f',str(fixture)])
    snippet=run(['python3',str(ROOT/'docker/npm-direct.py'),'--upstream-ip','10.219.71.10'])
    # Fixture services use distinct IPs instead of a single production published host.
    snippet=snippet.replace('http://10.219.71.10:3000','http://10.219.71.11:3000')
    (OUT/'advanced.conf').write_text(snippet+'\n')
    identity=snippet.split('location ^~ /api/ {')[1].split('location / {')[0]
    identity='location = /__fixture_identity {'+identity.replace('http://10.219.71.10:3333','http://10.219.71.11:3101')
    # Model NPM's broad private-source realip trust; clients forge X-Real-IP.
    (OUT/'nginx.conf').write_text('pid /tmp/nginx.pid; error_log /dev/null; events {} http { access_log off; set_real_ip_from 10.219.71.0/24; real_ip_header X-Real-IP; client_body_temp_path /tmp/body; proxy_temp_path /tmp/proxy; server { listen 8443 ssl; ssl_certificate /run/tls/cert.pem; ssl_certificate_key /run/tls/key.pem; '+snippet+'\n'+identity+'\n} }\n')
    # Image provenance and current critical-source fingerprints, no credentials.
    images={name:json.loads(run(['docker','image','inspect',name]))[0]['Id'] for name in [API,WEB,'nginx:alpine']}
    sources={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'backend/start/secret_context.ts',ROOT/'backend/app/services/trusted_address_service.ts',ROOT/'frontend/src/proxy.ts',ROOT/'compose.yml',ROOT/'docker/npm-direct.conf.template']}
    fingerprint=verify(run,API,WEB)
    check('retained API compiled JS and current-source tooling match',fingerprint['compiled_backend_js_matched']>0)
    (OUT/'provenance.json').write_text(json.dumps({'images':images,'source_sha256':sources,'verified_retained_source':fingerprint,'git':run(['git','rev-parse','HEAD'])},indent=2))
    compose('up','-d','--no-build','--pull','never','--wait','postgres','redis','migrate','api','web')
    compose('up','-d','--no-deps','npm-fixture')
    check('real nginx -t', 'successful' in run(['docker','exec',PROJECT+'-npm-fixture-1','sh','-c','nginx -t 2>&1']))
    (OUT/'nginx-T.txt').write_text(run(['docker','exec',PROJECT+'-npm-fixture-1','nginx','-T']))
    before=snapshot()
    compose('up','-d','--no-deps','--force-recreate','--wait','--no-build','--pull','never','api','web')
    after=snapshot()
    check('app up preserves store container IDs',all(before[s]==after[s] for s in ['postgres','redis']))
    check('app up preserves api-owner volume',before['api']['mounts']==after['api']['mounts'])
    check('app up exercised API replacement',before['api']['id']!=after['api']['id'])
    echo="require('http').createServer((q,s)=>s.end(JSON.stringify({xff:q.headers['x-forwarded-for']}))).listen(3101,'0.0.0.0')"
    compose('exec','-d','web','node','-e',echo)
    compose('exec','-T','web','node','-e',"(async()=>{for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:3101');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,50))}process.exit(1)})()")
    captured=[req('/__fixture_identity',headers={'X-Real-IP':fake,'X-Forwarded-For':fake+', 192.0.2.99'})[1]['xff'] for fake in ['198.51.100.11','198.51.100.12']]
    check('broad realip trust cannot spoof forwarded socket identity',captured[0]==captured[1] and captured[0] not in ['198.51.100.11','198.51.100.12'] and ',' not in captured[0])
    status,_,headers,html=req('/')
    check('real HTTPS frontend nonce CSP',status==200 and "'nonce-" in headers['Content-Security-Policy'])
    match=re.search(r"'nonce-([^']+)'",headers['Content-Security-Policy'])
    assert match is not None
    nonce=match.group(1)
    check('nonce policy agrees with HTML',nonce in html)
    for path in ['/health','/health/live','/health/ready','/health%2fready']:
        check(path+' hidden',req(path)[0]==404)
    status,created,_,_=req('/api/v1/secrets',{'credential':'NPM_DIRECT_SYNTHETIC_CANARY','reading_code':'fixture-code'}, {'X-Forwarded-For':'192.0.2.1, 192.0.2.2','Forwarded':'for=192.0.2.3','X-Forwarded-Host':'evil.invalid'})
    check('real API create through trusted exact peer and overwritten spoof',status==201)
    token=created['data']['share_url'].rsplit('/',1)[1]
    route='/api/v1/secrets/'+token
    check('API prefix preserved and status available',req(route+'/status')[1]['data']['state']=='available')
    check('wrong code refused',req(route+'/disclosures',{'reading_code':'wrong'})[0]==403)
    check('real disclosure exact payload',req(route+'/disclosures',{'reading_code':'fixture-code'})[1]['data']['secret']['credential']=='NPM_DIRECT_SYNTHETIC_CANARY')
    _,quota,_,_=req('/api/v1/secrets',{'credential':'quota-canary','reading_code':'quota-code'})
    quota_route='/api/v1/secrets/'+quota['data']['share_url'].rsplit('/',1)[1]+'/disclosures'
    for i in range(5):
        assert req(quota_route,{'reading_code':'wrong'},{'X-Real-IP':'198.51.100.'+str(20+i),'X-Forwarded-For':'192.0.2.'+str(i+1)})[0]==403
    check('forged realip/XFF rotation cannot bypass verification quota',req(quota_route,{'reading_code':'wrong'},{'X-Real-IP':'198.51.100.99','X-Forwarded-For':'192.0.2.99'})[0]==429)
    script="const r=await fetch('http://api:3333/api/v1/secrets',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'192.0.2.1'},body:JSON.stringify({credential:'spoof'})});console.log(r.status)"
    check('untrusted direct peer spoof refused',compose('exec','-T','web','node','--input-type=module','-e',script)=='503')
    for s in ['api','web','postgres','redis','npm-fixture','migrate']:
        check(s+' Docker logging none',inspect(s)['HostConfig']['LogConfig']['Type']=='none')
    check('nginx no request temp files',compose('exec','-T','npm-fixture','sh','-c','find /tmp/body /tmp/proxy -type f 2>/dev/null || true')=='')
    effective=(OUT/'nginx-T.txt').read_text()
    sinks=re.findall(r'\b(?:access_log|error_log)\s+([^;]+);',effective)
    check('nginx generated host no file log sinks',bool(sinks) and all(s.strip() in ['off','/dev/null'] for s in sinks))
    browser=run(['docker','run','--rm','--pull','never','--label','com.docker.compose.project='+PROJECT,'--network',PROJECT+'_edge','-v',str(ROOT/'docker/tests/npm-direct-browser.cjs')+':/smoke/npm-direct-browser.cjs:ro','--entrypoint','node','slp-resume-ui-browser:latest','/smoke/npm-direct-browser.cjs'])
    check('real Chromium nonce-safe hydration and explicit disclosure','zero console/page/CSP errors' in browser)
    (OUT/'browser.txt').write_text(browser+'\n')
    compose('stop','web')
    status,_,headers,_=req('/')
    check('frontend outage deny-all fallback',status==503 and "default-src 'none'" in headers['Content-Security-Policy'])
    check('API independent of frontend outage',req('/api/v1/secrets',{'credential':'independent'})[0]==201)
    # Exercise the actual loopback-published API path, not just edge networking.
    direct=urllib.request.Request('http://127.0.0.1:3369/api/v1/secrets',data=b'{"credential":"spoof"}',headers={'Content-Type':'application/json','X-Forwarded-For':'192.0.2.1'})
    try:
        urllib.request.urlopen(direct,timeout=10)
        raise AssertionError('untrusted published API admitted')
    except urllib.error.HTTPError as error:
        check('published API direct spoof refused',error.code==503)
    print(json.dumps({'passed':len(checks),'evidence':str(OUT),'project':PROJECT}))
finally:
    # Exact project only: no down/prune/orphan cleanup; preserve all foreign resources.
    ids=run(['docker','ps','-aq','--filter','label=com.docker.compose.project='+PROJECT]).splitlines()
    if ids:run(['docker','rm','-f',*ids])
    for typ,label in [('network','com.docker.compose.project='+PROJECT),('volume','com.docker.compose.project='+PROJECT)]:
        names=run(['docker',typ,'ls','-q','--filter','label='+label]).splitlines()
        if names:run(['docker',typ,'rm',*names])
        assert not run(['docker',typ,'ls','-q','--filter','label='+label])
    assert not run(['docker','ps','-aq','--filter','label=com.docker.compose.project='+PROJECT])
    shutil.rmtree(MAT)
    assert not MAT.exists()
    for port in [3369,3069,3469]:
        with socket.socket() as sock:
            assert sock.connect_ex(('127.0.0.1',port))!=0
    check('owned fixture containers/networks/volumes/keys removed')
    check('owned published listeners removed')
    check('foreign running containers preserved',set(foreign).issubset(set(run(['docker','ps','-q']).splitlines())))
    (OUT/'cleanup.json').write_text(json.dumps({'owned_resources_remaining':0,'keys_remaining':False,'foreign_containers_preserved':True},indent=2))
    print('Cleanup verified; nonsensitive evidence: '+str(OUT))
