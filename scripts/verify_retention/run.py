"""T18 only: synthetic HTTPS confidentiality/recovery. No ambient .env or credentials.
Run: python3 scripts/verify_retention/run.py setup|audit|cleanup
Fault/gate runner: sh scripts/verify_retention/faults.sh (API must be stopped).
All output is aggregate; payloads, codes, links and verifiers stay in memory.
"""
import concurrent.futures as futures
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import ssl
import subprocess as sp
import sys
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = Path('/tmp/slp-t18-synthetic')
OUT = Path('/tmp/slp-t18-evidence')
PROJECT = 'slp-t18'
BASE = ['docker', 'compose', '--env-file', str(PRIVATE/'synthetic.env'), '-p', PROJECT]
ENV = dict(os.environ, SLP_WEB_IMAGE='slp-t17-production', SLP_API_IMAGE='slp-t3-test-85230-runtime')
from typing import Any

REPORT: dict[str, Any] = {'checks': [], 'workload': [], 'scans': []}
NEEDLES = []
PREFIX = 'slp:t18synthetic:'

def command(args, data=None):
    p = sp.run(args, input=data, capture_output=True, cwd=ROOT, env=ENV)
    if p.returncode:
        raise RuntimeError('owned command failed: '+args[0]+' exit '+str(p.returncode))
    return p.stdout

def compose(*args, data=None):
    return command(BASE+list(args), data)

def redis(*args):
    return compose('exec', '-T', 'redis', 'redis-cli', '--raw', *map(str,args)).decode().strip()

def sql(query, database='slp'):
    return compose('exec', '-T', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'slp', '-d', database, '-Atc', query).decode().strip()

def save():
    OUT.mkdir(exist_ok=True, mode=0o700)
    (OUT/'runtime.json').write_text(json.dumps(REPORT, indent=2)+'\n')

def check(name, value=True):
    if not value:
        raise AssertionError(name)
    REPORT['checks'].append(name)
    save()

def request(path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request('https://localhost:3448'+path, data=data, headers={'Content-Type':'application/json'})
    try:
        r = urllib.request.urlopen(req, context=ssl.create_default_context(cafile=str(PRIVATE/'tls/cert.pem')), timeout=15)
    except urllib.error.HTTPError as e:
        r = e
    text = r.read()
    if 'no-store' not in r.headers.get('Cache-Control','') or r.headers.get('Referrer-Policy') != 'no-referrer':
        raise AssertionError('confidentiality headers')
    try:
        return r.status, json.loads(text)
    except ValueError:
        return r.status, {}

def ready():
    try:
        return compose('exec','-T','api','node','-e',"fetch('http://127.0.0.1:3333/health/ready').then(r=>console.log(r.status))").decode().strip() == '200'
    except RuntimeError:
        # A real startup connection refusal is unready, not a failed assertion.
        return False

def wait_ready():
    start = time.monotonic()
    while not ready():
        if time.monotonic()-start > 115:
            raise AssertionError('readiness timeout')
        time.sleep(.3)
    return round((time.monotonic()-start)*1000)

def scan(name, data):
    hits = sum(n in data for n in set(NEEDLES))
    REPORT['scans'].append({'sink':name,'bytes':len(data),'canary_hits':hits})
    save()
    check('zero forbidden canaries: '+name, hits == 0)

def capture_material():
    # Expected live in-memory store is NOT a forbidden sink. Learn exact verifiers
    # without persisting/printing them so subsequent persistent scans include them.
    for key in redis('KEYS',PREFIX+'secret:*:payload').splitlines():
        verifier = redis('HGET',key,'code_verifier')
        if verifier:
            NEEDLES.append(verifier.encode())

def created(body):
    NEEDLES.extend(value.encode() for value in body.values() if isinstance(value,str) and value)
    status, result = request('/api/v1/secrets', body)
    if status == 201:
        link = result['data']['share_url']
        NEEDLES.extend([link.encode(),link.rsplit('/',1)[1].encode()])
    return status, result

def setup():
    if PRIVATE.exists():
        raise RuntimeError('refusing existing synthetic directory')
    command(['python3','docker/synthetic.py',str(PRIVATE)])
    p = PRIVATE/'synthetic.env'
    text = p.read_text().replace('t17synthetic','t18synthetic').replace('3447','3448').replace('10.217.17.','10.218.18.').replace('10.217.18.','10.218.19.')
    p.write_text(text)
    compose('up','-d','--no-build','--wait','--wait-timeout','210')
    check('new isolated HTTPS project ready',ready())

def workload(protected):
    marker = 'T18_'+secrets.token_hex(20)
    code = marker+'_code'
    NEEDLES.extend([marker.encode(),code.encode()])
    # Full link and verifier are included separately; marker covers every field.
    body = {'address':marker+'_address','login':marker+'_login','credential':marker+'_credential','lifetime_minutes':60}
    if protected:
        body['reading_code'] = code
    # Preflight may follow the previous phase's rolling address window.
    while True:
        status, fixture = created(body)
        if status == 201:
            break
        if status != 429:
            raise AssertionError('canary fixture creation')
        time.sleep(1)
    token = fixture['data']['share_url'].rsplit('/',1)[1]
    disclosure = {'reading_code':code} if protected else {}
    check('neutral status protected='+str(protected),request('/api/v1/secrets/'+token+'/status')[0] == 200)
    if protected:
        check('missing code refused',request('/api/v1/secrets/'+token+'/disclosures',{})[0] == 403)
        check('wrong code refused',request('/api/v1/secrets/'+token+'/disclosures',{'reading_code':marker+'_wrong'})[0] == 403)
    check('invalid canary request refused',created({**body,'unknown':marker})[0] == 422)
    counts = {}
    def op(i):
        if i % 2 == 0:
            s, _ = created(body)
            if s not in (201,429,503):
                raise AssertionError('canary creation outcome')
        else:
            s, result = request('/api/v1/secrets/'+token+'/disclosures', disclosure)
            if s == 200 and result['data']['secret']['credential'] != body['credential']:
                raise AssertionError('canary exact disclosure')
            if s not in (200,503):
                raise AssertionError('canary disclosure outcome')
        return ('create' if i%2 == 0 else 'disclose')+':'+str(s)
    start = time.monotonic()
    with futures.ThreadPoolExecutor(max_workers=12) as pool:
        pending = []
        for i in range(1200):
            time.sleep(max(0,start+i/10-time.monotonic()))
            pending.append(pool.submit(op,i))
        for future in pending:
            key = future.result()
            counts[key] = counts.get(key,0)+1
    capture_material()
    REPORT['workload'].append({'protected':protected,'scheduled_operations':1200,'duration_seconds':round(time.monotonic()-start,2),'outcomes':counts,'profile':'10 ops/s 120s; actual single proxy address, basic creation refusals retained; NOT performance sign-off'})
    save()
    check('canary phase completed protected='+str(protected))
    return token

def inspect_sinks():
    manifest = {}
    for service in ['proxy','web','api','postgres','redis','migrate']:
        name = PROJECT+'-'+service+'-1'
        item = json.loads(command(['docker','inspect',name]))[0]
        host = item['HostConfig']
        manifest[service] = {'image':item['Image'],'logging':host['LogConfig'],'read_only':host['ReadonlyRootfs'],'tmpfs':host.get('Tmpfs'),'mounts':[{k:m.get(k) for k in ('Type','Name','Destination','RW')} for m in item['Mounts']],'core_ulimit':[u for u in host.get('Ulimits',[]) if u['Name']=='core']}
        check(service+' collector disabled',host['LogConfig']['Type']=='none')
        scan(service+' health history',json.dumps(item.get('State',{})).encode())
        scan(service+' writable layer diff',command(['docker','diff',name]))
        if service != 'migrate':
            # Export excludes mounted volumes/tmpfs; scan those separately below.
            scan(service+' container filesystem export',command(['docker','export',name]))
            if service in ['proxy','web','api']:
                scan(service+' temp/cache tmpfs',compose('exec','-T',service,'tar','-cf','-','/tmp'))
    scan('PostgreSQL persistent data including WAL',compose('exec','-T','postgres','tar','-cf','-','/var/lib/postgresql/data'))
    scan('API owner volume',compose('exec','-T','api','tar','-cf','-','/run/slp-owner'))
    scan('Redis data tmpfs',compose('exec','-T','redis','tar','-cf','-','/data'))
    scan('Redis slowlog',redis('SLOWLOG','GET','128').encode())
    check('Redis data directory empty',compose('exec','-T','redis','sh','-c','test -z "$(ls -A /data)"') == b'')
    settings = {k:redis('CONFIG','GET',k).partition('\n')[2] for k in ['save','appendonly','maxmemory','maxmemory-policy','slowlog-log-slower-than','latency-monitor-threshold']}
    check('actual Redis persistence and diagnostics disabled',settings == {'save':'','appendonly':'no','maxmemory':'268435456','maxmemory-policy':'noeviction','slowlog-log-slower-than':'-1','latency-monitor-threshold':'0'})
    (OUT/'runtime-manifest.json').write_text(json.dumps({'containers':manifest,'redis':settings},indent=2)+'\n')

def restore(expired_token, future_token):
    compose('stop','api')
    dump = compose('exec','-T','postgres','pg_dump','-U','slp','-d','slp','--table=link_lifecycles','--no-owner','--no-acl')
    scan('metadata-only backup stream',dump)
    check('backup excludes verifier columns',b'code_verifier' not in dump and b'credential' not in dump)
    original = sql('SELECT count(*) FROM link_lifecycles')
    rows_query = "SELECT id,encode(token_digest,'hex'),created_at,expires_at FROM link_lifecycles ORDER BY id"
    original_rows = sql(rows_query)
    # Original database is this project's synthetic database only. Keep source
    # metadata in a separate restore DB until comparison then restore exact target.
    restore_db = 't18_restore_'+secrets.token_hex(6)
    sql('CREATE DATABASE '+restore_db)
    compose('exec','-T','postgres','psql','-v','ON_ERROR_STOP=1','-U','slp','-d',restore_db,data=dump)
    check('metadata-only restore row count',sql('SELECT count(*) FROM link_lifecycles',restore_db) == original)
    check('metadata-only restore exact rows and original deadlines',sql(rows_query,restore_db) == original_rows)
    scan('restored metadata stream',compose('exec','-T','postgres','pg_dump','-U','slp','-d',restore_db,'--table=link_lifecycles','--no-owner','--no-acl'))
    # Empty Redis restart, not FLUSH: tmpfs and no persistence must lose live data.
    compose('stop','redis');compose('start','redis')
    check('Redis restart empty',redis('DBSIZE') == '0')
    # Point actual API at independently restored metadata with no payload recovery.
    # Copy restored table into the original synthetic metadata database, preserving
    # the migration state required by the application.
    sql('DROP TABLE link_lifecycles')
    compose('exec','-T','postgres','psql','-v','ON_ERROR_STOP=1','-U','slp','-d','slp',data=dump)
    del dump
    command(['docker','start',PROJECT+'-api-1'])
    recovery = wait_ready()
    check('empty Redis quiet recovery >=60s',recovery >= 59000)
    for token, expected, status in [(expired_token,'expired',410),(future_token,'early_unavailable',409)]:
        check('restored metadata status '+expected,request('/api/v1/secrets/'+token+'/status')[1].get('data',{}).get('state') == expected)
        check('restore releases no '+expected+' content',request('/api/v1/secrets/'+token+'/disclosures',{})[0] == status)
    check('restore reconstructs no payload',redis('KEYS',PREFIX+'secret:*:payload') == '')
    REPORT['restore'] = {'rows':int(original),'quiet_recovery_ms':recovery,'payloads_restored':0}
    save()

def audit():
    wait_ready()
    NEEDLES.append(b'T18_BROWSER_')
    _, exp = created({'credential':'T18_'+secrets.token_hex(20),'lifetime_minutes':1})
    expired = exp['data']['share_url'].rsplit('/',1)[1]
    NEEDLES.extend([exp['data']['share_url'].encode(),expired.encode()])
    workload(False)
    future = workload(True)
    inspect_sinks()
    restore(expired,future)
    inspect_sinks()
    REPORT['canary_needles'] = len(set(NEEDLES))
    REPORT['total_canary_hits'] = sum(s['canary_hits'] for s in REPORT['scans'])
    save()
    print(json.dumps({'checks':len(REPORT['checks']),'scans':len(REPORT['scans']),'canary_needles':REPORT['canary_needles'],'hits':REPORT['total_canary_hits']}))

def recovery():
    marker = 'T18_RECOVERY_'+secrets.token_hex(20)
    code = marker+'_code'
    NEEDLES.extend([marker.encode(),b'T18_BROWSER_'])
    status, made = created({'credential':marker,'reading_code':code,'lifetime_minutes':1})
    check('outage fixture confirmed',status == 201)
    capture_material()
    token = made['data']['share_url'].rsplit('/',1)[1]
    compose('stop','api')
    # Direct insertion is strictly targeted partial-write/expired debt, never a
    # normal publication path. Include >one bounded batch and month-old debt.
    due = int(time.time()*1000)+1000
    operations = []
    for i in range(999):
        handle = str(uuid.uuid4())
        operations.extend([['HSET',PREFIX+'secret:'+handle+':payload','credential',marker,'code_verifier','synthetic verifier'],['ZADD',PREFIX+'payload:expiry',str(due if i%2 else due-31*86400000),handle]])
    operations.append(['HSET',PREFIX+'safety:continuity','payloads','1000'])
    wire = b''
    for operation in operations:
        parts = [str(x).encode() for x in operation]
        wire += b'*'+str(len(parts)).encode()+b'\r\n'+b''.join(b'$'+str(len(x)).encode()+b'\r\n'+x+b'\r\n' for x in parts)
    compose('exec','-T','redis','redis-cli','--pipe',data=wire)
    del wire
    check('mixed-age debt seeded at full cap',redis('ZCARD',PREFIX+'payload:expiry') == '1000')
    compose('stop','postgres')
    command(['docker','start',PROJECT+'-api-1'])
    time.sleep(2)
    check('PG down startup readiness closed',not ready())
    check('PG down no creation',request('/api/v1/secrets',{'credential':marker})[0] == 503)
    check('PG down no disclosure',request('/api/v1/secrets/'+token+'/disclosures',{'reading_code':code})[0] == 503)
    start = time.monotonic()
    time.sleep(90)
    check('outage delay really retains partial payloads',int(redis('EXISTS',*[op[1] for op in operations if op[0]=='HSET' and ':secret:' in op[1]])) == 999)
    check('all 1000 original deadlines overdue before recovery',redis('ZCOUNT',PREFIX+'payload:expiry','-inf',int(time.time()*1000)) == '1000')
    check('outage remains unready',not ready())
    check('expired request during outage releases nothing',request('/api/v1/secrets/'+token+'/disclosures',{'reading_code':code})[0] == 503)
    command(['docker','start',PROJECT+'-postgres-1'])
    elapsed = wait_ready()
    check('all mixed-age multi-batch debt cleared before ready',redis('ZCARD',PREFIX+'payload:expiry') == '0' and redis('KEYS',PREFIX+'secret:*:payload') == '')
    check('recovered expired status',request('/api/v1/secrets/'+token+'/status')[1].get('data',{}).get('state') == 'expired')
    check('correct code never releases expired content after outage',request('/api/v1/secrets/'+token+'/disclosures',{'reading_code':code})[0] == 410)
    REPORT['outage'] = {'held_seconds':round(time.monotonic()-start,2),'expired_index_debt':1000,'retained_partial_payloads':999,'recovery_ms':elapsed,'remaining_debt_before_traffic':0}
    inspect_sinks()
    REPORT['recovery_canary_needles'] = len(set(NEEDLES))
    REPORT['total_canary_hits'] = sum(s['canary_hits'] for s in REPORT['scans'])
    save()
    print(json.dumps(REPORT['outage']))

def cleanup():
    compose('down','--volumes','--remove-orphans')
    for kind in ['container','network','volume']:
        found = command(['docker',kind,'ls','-q','--filter','label=com.docker.compose.project='+PROJECT])
        check('cleanup no owned '+kind,not found.strip())
    shutil.rmtree(PRIVATE)
    check('cleanup generated keys/env removed',not PRIVATE.exists())
    print('Owned T18 resources and generated keys removed; images/evidence preserved.')

if __name__ == '__main__':
    try:
        if sys.argv[1] in ('recovery','cleanup'):
            REPORT = json.loads((OUT/'runtime.json').read_text())
        {'setup':setup,'audit':audit,'recovery':recovery,'cleanup':cleanup}[sys.argv[1]]()
    except Exception as error:
        # Never serialize request objects, values or exception bodies.
        save()
        print('T18 failed: '+type(error).__name__+'; last successful check: '+(REPORT['checks'][-1] if REPORT['checks'] else 'none'),file=sys.stderr)
        raise SystemExit(1)
