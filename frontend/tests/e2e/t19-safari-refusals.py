"""AC-01/07/08/09/11b: actual installed Safari refusals and neutral recheck.
Reuse existing native W3C session/preflight. Real API, owned store faults only.
No outgoing interception/response hold, offline retest, clipboard, or console claim.
"""
from contextlib import contextmanager
from typing import Any
import importlib.util
import pathlib
import json
import hashlib
import base64
import subprocess
import ssl
import time
import urllib.request
import urllib.error

PREFIX='slp:t19synthetic:'
@contextmanager
def corrupt_owned_state(redis,key,replacement='invalid-json'):
    assert key.startswith(PREFIX+'creation:') and key.endswith(':state')
    old=redis('GET',key);ttl=redis('PEXPIRETIME',key)
    try:
        redis('SET',key,replacement,'PXAT',ttl)
        yield
    finally:
        redis('SET',key,old,'PXAT',ttl)
        redis('ZADD',PREFIX+'limiter:expiry',ttl,key)
        assert redis('GET',key)==old


def main():
    spec=importlib.util.spec_from_file_location('matrix',pathlib.Path(__file__).with_name('t19-safari-matrix.py'))
    assert spec and spec.loader
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    report={'browser':'safari','cases':[],'viewports':[],'api_controls':[],'native_console':'UNMONITORED','limits':['API control HTTP statuses are independent HTTPS controls, not intercepted Safari traffic.','Safari ResourceTiming responseStatus unavailable; browser refusal verified by UI plus original server fixture/control.','No response hold/pre-module fetch interception capability claimed.','No native clipboard/offline/first-frame/BFCache/freeze retest.']}
    out=pathlib.Path('/tmp/slp-t19-evidence/automatic-safari-refusals.json')
    save=lambda:out.write_text(json.dumps(report,indent=2)+'\n')
    browser: Any=None
    origin='https://localhost:3449'
    def redis(*args):
        return subprocess.check_output(['docker','exec','slp-t19-redis-1','redis-cli','--raw',*args],text=True).strip()
    def reset():
        redis('EVAL',"for _,k in ipairs(redis.call('KEYS',ARGV[1])) do local ok,v=pcall(cjson.decode,redis.call('GET',k));if ok then v.events={};redis.call('SET',k,cjson.encode(v),'KEEPTTL');redis.call('ZADD',ARGV[2],v.expires,k) end end return 1",'0',PREFIX+'creation:*:state',PREFIX+'limiter:expiry')
    def api(path,body=None):
        req=urllib.request.Request(origin+path,data=None if body is None else json.dumps(body).encode(),headers={'content-type':'application/json'})
        try:r=urllib.request.urlopen(req,context=ssl.create_default_context(cafile='/tmp/slp-t19-synthetic/tls/cert.pem'),timeout=15)
        except urllib.error.HTTPError as e:r=e
        with r:
            assert 'no-store' in r.headers['cache-control']
            report['api_controls'].append({'operation':'create' if path=='/api/v1/secrets' else 'disclosure' if path.endswith('/disclosures') else 'status','http_status':r.status})
            return r.status,json.load(r)
    def seed(protected=False):
        reset();body={'credential':'owned Safari refusal field','lifetime_minutes':60}
        if protected:body['reading_code']='owned-code'
        status,data=api('/api/v1/secrets',body);assert status==201
        return data['data']['share_url']
    def path(url):return '/api/v1/secrets/'+url.rsplit('/',1)[1]
    def until(expr):
        for _ in range(100):
            if browser.js(expr):return
            time.sleep(.08)
        raise AssertionError('bounded state timeout: '+expr[:100])
    def metrics(width):
        data=browser.js('({width:innerWidth,height:innerHeight,visibility:document.visibilityState,overflow:document.documentElement.scrollWidth>innerWidth})')
        module.require_viewport(data,width);report['viewports'].append(data);return data
    def load(url,width):
        browser.req('/url',{'url':url});browser.req('/window/rect',{'x':100,'y':100,'width':width,'height':900})
        metrics(width);until('document.readyState==="complete" && !!document.querySelector("h1")')
        until('Array.from(document.querySelectorAll("form,button")).some(e=>Object.keys(e).some(k=>k.startsWith("__reactProps")))')
    def click(label):
        q=json.dumps(label);until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==='+q+'&&!e.disabled)')
        browser.js('Array.from(document.querySelectorAll("button")).find(e=>e.textContent==='+q+').focus()');browser.key('\ue007')
    def field(id_,text):
        browser.js('(()=>{const e=document.getElementById('+json.dumps(id_)+');e.focus();e.select();return true})()');browser.key(text)
    def plain():assert browser.js('document.querySelectorAll("pre").length')==0
    def gate(url,width):
        load(url,width);until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)');plain()
    def notice(part):
        until('document.body.textContent.includes('+json.dumps(part)+')');plain()
    def count(op):
        return browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith('+json.dumps(op)+')).length')
    def run(name,width,fn):
        started=time.monotonic()
        try:report['cases'].append({'name':name,'width':width,'result':'PASS','measured':fn()})
        except Exception as e:report['cases'].append({'name':name,'width':width,'result':'FAIL','error':type(e).__name__,'detail':str(e)[:150] if isinstance(e,AssertionError) else 'bounded harness failure'})
        report['cases'][-1]['seconds']=round(time.monotonic()-started,2);save();print(name,width,report['cases'][-1]['result'],flush=True)
    def payload_key(url):
        digest=hashlib.sha256(base64.urlsafe_b64decode(url.rsplit('/',1)[1]+'=')).hexdigest()
        id_=subprocess.check_output(['docker','exec','slp-t19-postgres-1','psql','-U','slp','-d','slp','-Atc',"SELECT id FROM link_lifecycles WHERE token_digest=decode('"+digest+"','hex')"],text=True).strip()
        assert __import__('re').fullmatch('[a-f0-9-]{36}',id_)
        return PREFIX+'secret:'+id_+':payload'
    try:
        browser=module.Safari();report['version']=browser.version;report['driver_pid']=browser.child.pid
        browser.req('/url',{'url':'data:text/html,<meta name="viewport" content="width=device-width,initial-scale=1"><title>T19 OWNED SAFARI VIEWPORT</title><p>T19 viewport verification</p>'})
        for width in [360,1280]:
            browser.req('/window/rect',{'x':100,'y':100,'width':width,'height':900});metrics(width)
        for width in [360,1280]:
            def create_refusal(quota):
                seed();load(origin+'/',width);field('credential','owned preserved form')
                keys=redis('KEYS',PREFIX+'creation:*:state').splitlines();assert len(keys)==1
                old=json.loads(redis('GET',keys[0]));old['events']=[old['last']]*25
                with corrupt_owned_state(redis,keys[0],json.dumps(old) if quota else 'invalid-json'):
                    control=api('/api/v1/secrets',{'credential':'owned control'})[0];assert control==(429 if quota else 503)
                    click('Create Secret');notice('temporarily limited' if quota else 'not confirmed')
                    assert browser.js('document.getElementById("credential").value')=='owned preserved form'
                    time.sleep(.25);assert count('/api/v1/secrets')==1
                    metrics(width)
                return {'independent_api_http':control,'retained_input':True,'browser_creation_resources':1,'fault':'owned quota state' if quota else 'owned invalid creation state','restored_state_and_index':True}
            run('AC-01 SCR01 creation limited actual API429 owned quota fixture',width,lambda:create_refusal(True))
            run('AC-01 SCR01 service unavailable actual API503 restored fixture',width,lambda:create_refusal(False))
            def limited():
                url=seed(True);gate(url,width)
                for _ in range(5):
                    field('recipient-code','wrong');click('Show Secret');notice('incorrect')
                field('recipient-code','owned-code');click('Show Secret');notice('temporarily limited')
                assert count('/disclosures')==6
                control=api(path(url)+'/disclosures',{'reading_code':'owned-code'})[0];assert control==429
                assert browser.js('document.getElementById("recipient-code").value')=='owned-code'
                metrics(width)
                return {'wrong_ui_attempts':5,'explicit_ui_attempts':6,'independent_api_http':control,'correct_guess_limited':True}
            run('AC-07 SCR03 five incorrect then correct temporarily limited no content',width,limited)
            def temporary():
                url=seed();key=payload_key(url);old=redis('HGET',key,'login')
                try:
                    redis('HSET',key,'login','corrupt')
                    assert api(path(url)+'/status')[0]==503
                    load(url,width);notice('could not be checked');assert count('/disclosures')==0
                    click('Check availability again');notice('could not be checked');assert count('/disclosures')==0
                finally:
                    redis('HSET',key,'login',old);assert redis('HGET',key,'login')==old
                click('Check availability again');until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)');plain();assert count('/disclosures')==0
                click('Show Secret');until('document.querySelector("h1")?.textContent==="Secret"');assert count('/disclosures')==1
                return {'independent_status_http':503,'neutral_checks':count('/status'),'no_automatic_disclosure':True,'restored_then_fresh_show':True,**metrics(width)}
            run('AC-08 SCR03 real status503 safe failed retry restore neutral fresh Show',width,temporary)
            def conflict():
                url=seed();gate(url,width);key=payload_key(url);redis('DEL',key)
                assert api(path(url)+'/disclosures',{})[0]==409
                click('Show Secret');until('document.querySelector("h1")?.textContent==="The Secret became unavailable before expiry"');plain()
                assert count('/disclosures')==1;assert count('/status')==2
                return {'independent_disclosure_http':409,'neutral_status_resources':2,'explicit_disclosures':1,'owned_payload_deleted':True,**metrics(width)}
            run('AC-09/11b SCR03 real409 reclassifies early unavailable no automatic retry',width,conflict)
    except Exception as e:report['fatal']={'error':type(e).__name__,'detail':str(e)[:150] if isinstance(e,AssertionError) else 'bounded prerequisite failure'}
    finally:
        if browser:report['cleanup']=browser.close()
        report['counts']={s:sum(x['result']==s for x in report['cases']) for s in ['PASS','FAIL','BLOCKED']};save();print(json.dumps({'counts':report['counts'],'fatal':report.get('fatal'),'cleanup':report.get('cleanup')}))
    return 1 if report.get('fatal') or report['counts']['FAIL'] else 0
if __name__=='__main__':raise SystemExit(main())
