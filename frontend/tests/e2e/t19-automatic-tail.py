"""AC-01/07/08/10 T19 bounded tail; original API, controlled page clock/copy only."""
import importlib.util,json,pathlib,subprocess,time,ssl,urllib.request,urllib.error,traceback,os
from typing import Any
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=pathlib.Path('/tmp/slp-t19-evidence')
ORIGIN='https://localhost:3449'
PREFIX='slp:t19synthetic:'
def cell_key(c):return '|'.join(str(c[k]) for k in ['browser','width','screen','case'])
def unique_cells(cells):
    keys=[cell_key(c) for c in cells];assert len(keys)==len(set(keys));return keys
def capacity_missing(count):
    assert 0<=count<=10000
    return 10000-count

def main():
    spec=importlib.util.spec_from_file_location('matrix',pathlib.Path(__file__).with_name('t19-safari-matrix.py'));assert spec and spec.loader;m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    report={'browser':'safari','cases':[],'api':[],'limits':['controlled page Date.now seam; not OS clock','controlled clipboard promises and copy-event carrier; not native keyboard/clipboard','Safari native console UNMONITORED','inert DOM activation; not full keyboard coverage']}
    browser: Any=None
    def save():
        (OUT/('tail-safari'+os.environ.get('T19_TAIL_RUN','')+'.json')).write_text(json.dumps(report,indent=2)+'\n')
        pathlib.Path('/tmp/slp-t19-automatic-tail-checkpoint.md').write_text('# T19 automatic tail checkpoint\n'+json.dumps({'phase': '10/20/30 progressive', 'safari_executions':len(report['cases']),'results':[(c['name'],c['width'],c['result']) for c in report['cases']]},indent=2)+'\nInitial stable 30-cell manifest /tmp/slp-t19-automatic-tail-manifest.json. Ownership active until cleanup readback.\n')
    def run(name,w,cells,fn):
        if os.environ.get('T19_TAIL_FILTER') and name not in os.environ['T19_TAIL_FILTER'].split(';'):return
        t=time.monotonic()
        try:r={'name':name,'width':w,'cells':cells,'result':'PASS','measured':fn()}
        except Exception as e:r={'name':name,'width':w,'cells':cells,'result':'BLOCKED' if isinstance(e,Capability) else 'FAIL','error':type(e).__name__,'detail':str(e)[:130] if isinstance(e,(AssertionError,Capability)) else 'harness exception','line':traceback.extract_tb(e.__traceback__)[-1].lineno}
        r['seconds']=round(time.monotonic()-t,2);report['cases'].append(r);save();print(name,w,r['result'],r.get('detail',''),flush=True)
    def redis(*args):return subprocess.check_output(['docker','exec','slp-t19-redis-1','redis-cli','--raw',*map(str,args)],text=True).strip()
    def reset():redis('EVAL',"for _,k in ipairs(redis.call('KEYS',ARGV[1])) do local ok,v=pcall(cjson.decode,redis.call('GET',k));if ok then v.events={};redis.call('SET',k,cjson.encode(v),'KEEPTTL');redis.call('ZADD',ARGV[2],v.expires,k) end end return 1",0,PREFIX+'creation:*:state',PREFIX+'limiter:expiry')
    def api(path,body=None):
        req=urllib.request.Request(ORIGIN+path,data=None if body is None else json.dumps(body).encode(),headers={'content-type':'application/json'})
        try:r=urllib.request.urlopen(req,context=ssl.create_default_context(cafile='/tmp/slp-t19-synthetic/tls/cert.pem'),timeout=15)
        except urllib.error.HTTPError as e:r=e
        with r:report['api'].append({'op':'create' if path=='/api/v1/secrets' else 'status' if path.endswith('/status') else 'disclosure','status':r.status});assert 'no-store' in r.headers['cache-control'];return r.status,json.load(r)
    def seed(protected=False,minutes=60):
        reset();body={'credential':'[owned tail field]','lifetime_minutes':minutes}
        if protected:body['reading_code']='tail-owned-code'
        s,d=api('/api/v1/secrets',body);assert s==201;return d['data']['share_url']
    def until(expr,seconds=9):
        end=time.monotonic()+seconds
        while time.monotonic()<end:
            if browser.js(expr):return
            time.sleep(.08)
        raise AssertionError('state timeout: '+expr[:100])
    def metrics(w):
        x=browser.js('({width:innerWidth,height:innerHeight,visibility:document.visibilityState,overflow:document.documentElement.scrollWidth>innerWidth})');m.require_viewport(x,w);return x
    def load(url,w):
        browser.req('/url',{'url':url});browser.req('/window/rect',{'x':100,'y':100,'width':w,'height':900});metrics(w)
        until('document.readyState==="complete"&&!!Array.from(document.querySelectorAll("form,button")).find(e=>Object.keys(e).some(k=>k.startsWith("__reactProps")))')
    def click(label):
        q=json.dumps(label);until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==='+q+'&&!e.disabled)');browser.js('Array.from(document.querySelectorAll("button")).find(e=>e.textContent==='+q+').click()')
    def field(id_,v):browser.js('(()=>{const e=document.getElementById('+json.dumps(id_)+');e.focus();e.select();e.dispatchEvent(new InputEvent("beforeinput",{bubbles:true,cancelable:true,inputType:"insertText",data:'+json.dumps(v)+'}));return true})()')
    def gate(url,w):
        load(url,w);until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)');assert browser.js('document.querySelectorAll("pre").length')==0
    def show(protected=False):
        if protected:field('recipient-code','tail-owned-code')
        click('Show Secret');until('document.querySelector("h1")?.textContent==="Secret"')
    def confirm(w,minutes=60):
        reset();load(ORIGIN+'/',w);field('credential','[owned tail field]')
        if minutes!=60:
            browser.js('document.getElementById("minutes").focus()');browser.key('\ue009a\ue000');browser.key(str(minutes));browser.key('\ue004')
        click('Create Secret');until('document.querySelector("h1")?.textContent==="Secret created"');return browser.js('document.querySelector("pre").textContent')
    def copyseam():browser.js('(()=>{window.tailCopy={mode:"pending",writes:0};Object.defineProperty(navigator.clipboard,"writeText",{configurable:true,value:()=>{tailCopy.writes++;return tailCopy.mode==="reject"?Promise.reject(Error("controlled")):tailCopy.mode==="resolve"?Promise.resolve():new Promise((r,j)=>{tailCopy.resolve=r;tailCopy.reject=j})}});return true})()')
    def manual(eligible=True):
        return browser.js('(()=>{const e=document.querySelector("pre"),s={calls:0,match:false};if(!e)return s;const event=new Event("copy",{bubbles:true,cancelable:true});Object.defineProperty(event,"clipboardData",{value:{setData:(type,value)=>{s.calls++;s.match=type==="text/plain"&&value===e.textContent}}});e.dispatchEvent(event);return s})()')
    class Capability(Exception):pass
    try:
        browser=m.Safari();report.update(version=browser.version,pid=browser.child.pid,port=browser.port)
        browser.req('/url',{'url':'data:text/html,<meta name="viewport" content="width=device-width,initial-scale=1"><title>T19 OWNED SAFARI VIEWPORT</title><p>T19 viewport verification</p>'})
        for w in [360,1280]:browser.req('/window/rect',{'x':100,'y':100,'width':w,'height':900});metrics(w)
        for w in ([int(os.environ['T19_TAIL_WIDTH'])] if os.environ.get('T19_TAIL_WIDTH') else [360,1280]):
            def capacity():
                seed();load(ORIGIN+'/',w);field('credential','[owned retained form]')
                index=PREFIX+'limiter:expiry';old=redis('ZRANGE',index,0,-1,'WITHSCORES').splitlines();states={k:(redis('GET',k),redis('PEXPIRETIME',k)) for k in redis('KEYS',PREFIX+'creation:*:state').splitlines()};original_count=int(redis('ZCARD',index))
                try:
                    # Remove only owned creation state/index membership to force a new admission.
                    for k in states:redis('DEL',k);redis('ZREM',index,k)
                    count=int(redis('ZCARD',index));n=capacity_missing(count)
                    redis('EVAL',"for i=1,tonumber(ARGV[2]) do redis.call('ZADD',KEYS[1],ARGV[3],ARGV[1]..i) end return redis.call('ZCARD',KEYS[1])",1,index,PREFIX+'tail-capacity:',n,int(time.time()*1000)+300000)
                    assert int(redis('ZCARD',index))==10000
                    redis('HSET',PREFIX+'safety:continuity','limiters',10000)
                    status,data=api('/api/v1/secrets',{'credential':'[owned capacity control]'})
                    assert status==503 and data['error']['code']=='short_live_path.capacity_unavailable'
                    click('Create Secret');until('document.body.textContent.includes("not confirmed")');assert browser.js('document.getElementById("credential").value')=='[owned retained form]';assert browser.js('document.querySelectorAll("pre").length')==0
                finally:
                    redis('EVAL',"for _,k in ipairs(redis.call('ZRANGE',KEYS[1],0,-1)) do if string.sub(k,1,string.len(ARGV[1]))==ARGV[1] then redis.call('ZREM',KEYS[1],k) end end return 1",1,index,PREFIX+'tail-capacity:')
                    for k,(v,ttl) in states.items():redis('SET',k,v,'PXAT',ttl)
                    for k,score in zip(old[::2],old[1::2]):redis('ZADD',index,score,k)
                    redis('HSET',PREFIX+'safety:continuity','limiters',original_count)
                    assert int(redis('ZCARD',index))==original_count
                    for k,(v,ttl) in states.items():assert redis('GET',k)==v and redis('PEXPIRETIME',k)==ttl and redis('ZSCORE',index,k)==ttl
                return {'exact_fixture_cardinality':10000,'restored_count':original_count,'state_ttl_index_restored':True,'independent_https_control':503,'actual_width':metrics(w)['width']}
            run('capacity actual API refusal restored fixture',w,[['SCR-01','error.capacity_unavailable']],capacity)
            def copies():
                confirm(w);copyseam();click('Copy link');until('document.body.textContent.includes("Copying share link")');assert browser.js('tailCopy.writes')==1
                assert manual()=={'calls':1,'match':True}
                browser.js('tailCopy.resolve()');until('document.body.textContent.includes("Share link copied.")')
                browser.js('tailCopy.mode="reject"');click('Copy link');until('document.body.textContent.includes("Could not copy.")');assert browser.js('document.activeElement.tagName')=='PRE';assert manual()=={'calls':1,'match':True}
                return {'pending_resolved_rejected':True,'manual_eligible_carrier':True,'actual_width':metrics(w)['width']}
            run('confirmation controlled copy states',w,[['SCR-02',x] for x in ['loading','success','error']],copies)
            def readercopy():
                gate(seed(),w);show();copyseam();click('Copy password or key');until('document.body.textContent.includes("Copying password or key")');assert manual()=={'calls':1,'match':True};browser.js('tailCopy.reject(Error("controlled"))');until('document.body.textContent.includes("Could not copy.")');assert browser.js('document.activeElement.tagName')=='PRE';assert manual()=={'calls':1,'match':True}
                return {'pending_rejected_manual_eligible':True,'actual_width':metrics(w)['width']}
            run('reader controlled pending rejected manual fallback',w,[['SCR-04','loading'],['SCR-04','error.copy']],readercopy)
            def clocks():
                rows=[]
                for screen in ['confirmation','gate','reader']:
                    for offset in [-3600000,3600000]:
                        if screen=='confirmation':confirm(w)
                        else:gate(seed(),w)
                        if screen=='reader':show()
                        before=browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/disclosures")).length')
                        browser.js('(()=>{window.tailNow=Date.now;Date.now=()=>tailNow()+'+str(offset)+';return true})()')
                        try:
                            until('document.querySelectorAll("pre").length===0 && !Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)')
                            assert browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/disclosures")).length')==before
                            browser.js('Date.now=tailNow');time.sleep(.35);assert browser.js('document.querySelectorAll("pre").length')==0
                        finally:browser.js('Date.now=tailNow')
                        rows.append({'screen':screen,'offset_ms':offset,'fail_closed_after_restore':True,'budget_not_extended':True,'width':metrics(w)['width']})
                return {'controlled_page_clock_seam':True,'host_clock_changed':False,'vectors':rows}
            run('wallclock both directions confirmation gate reader',w,[['lifecycle','wall-clock jump confirmation/gate/reader']],clocks)
            def hidden():
                events=[]
                mainhandle=browser.req('/window')
                for stage in ['gate','reader']:
                    gate(seed(),w)
                    if stage=='reader':show()
                    browser.js('(()=>{window.tailHidden=[];document.addEventListener("visibilitychange",()=>tailHidden.push(document.visibilityState));return true})()')
                    before=browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/status")).length')
                    second=None
                    try:
                        try:second=browser.req('/window/new',{'type':'tab'})['handle'];browser.req('/window',{'handle':second});browser.req('/url',{'url':'about:blank'})
                        except RuntimeError:raise Capability('W3C owned second-tab unavailable; one bounded attempt')
                        browser.req('/window',{'handle':mainhandle})
                        seen=browser.js('tailHidden');events.append({'stage':stage,'events':seen})
                        if 'hidden' not in seen:raise Capability('W3C tab switch emitted no genuine hidden event; no pass')
                        until('document.querySelectorAll("pre").length===0');until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)');assert browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/status")).length')>before
                        show();metrics(w)
                    finally:
                        if second:browser.req('/window',{'handle':second});browser.req('/window',method='DELETE');browser.req('/window',{'handle':mainhandle})
                return {'genuine_events':events,'fresh_status_explicit_show':True}
            run('genuine owned second-tab hidden return',w,[['SCR-03','concealed'],['SCR-04','concealed'],['lifecycle','genuine background-return fresh status + Show']],hidden)
            def late():
                # Two original API one-minute readers; promise success and rejection each cross real expiry.
                rows=[]
                for reject in [False,True]:
                    url=seed(minutes=1);gate(url,w);show();copyseam();click('Copy password or key');until('document.body.textContent.includes("Copying password or key")')
                    until('document.querySelector("h1")?.textContent==="This Share link has expired"',seconds=68)
                    browser.js('tailCopy.reject(Error("controlled"))' if reject else 'tailCopy.resolve()');time.sleep(.25)
                    assert browser.js('document.querySelectorAll("pre").length')==0;assert browser.js('document.body.textContent.includes("copied.")||document.body.textContent.includes("Select the")') is False
                    assert api('/api/v1/secrets/'+url.rsplit('/',1)[1]+'/disclosures',{})[0]==410
                    rows.append({'completion':'rejected' if reject else 'resolved','actual_api_expired':410,'manual_fallback_ineligible':True,'width':metrics(w)['width']})
                return {'controlled_clipboard':True,'real_one_minute_expiry':True,'vectors':rows}
            run('clipboard late completion across actual expiry',w,[['lifecycle','clipboard completion across expiry']],late)
            def concurrency():
                rows=[];first=browser.req('/window')
                for protected in [False,True]:
                    url=seed(protected);second=None
                    try:
                        gate(url,w)
                        second=browser.req('/window/new',{'type':'window'})['handle'];browser.req('/window',{'handle':second});gate(url,w)
                        handles=[first,second]
                        for h in handles:
                            browser.req('/window',{'handle':h});metrics(w)
                            until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)')
                            if protected:field('recipient-code','tail-owned-code')
                            browser.js('(()=>{window.tailSeen=false;new MutationObserver(()=>{if(Array.from(document.querySelectorAll("pre")).some(e=>e.textContent==="[owned tail field]"))tailSeen=true}).observe(document.body,{subtree:true,childList:true});return true})()')
                        target=int(time.time()*1000)+1800
                        for h in handles:
                            browser.req('/window',{'handle':h})
                            browser.js('(()=>{window.tailScheduledVisibility=null;setTimeout(()=>{tailScheduledVisibility=document.visibilityState;const e=document.getElementById("recipient-code");if(e){e.focus();e.select();e.dispatchEvent(new InputEvent("beforeinput",{bubbles:true,cancelable:true,inputType:"insertText",data:"tail-owned-code"}))}setTimeout(()=>{const b=Array.from(document.querySelectorAll("button")).find(e=>e.textContent==="Show Secret");if(b&&!b.disabled)b.click()},0)},Math.max(0,'+str(target)+'-Date.now()));return true})()')
                        time.sleep(2.5)
                        proof=[]
                        for h in handles:
                            browser.req('/window',{'handle':h})
                            x=browser.js('(()=>{const e=performance.getEntriesByType("resource").find(e=>e.name.endsWith("/disclosures"));return {seen:tailSeen,scheduled_visibility:tailScheduledVisibility,request_start:e?performance.timeOrigin+e.requestStart:null,response_start:e?performance.timeOrigin+e.responseStart:null,response_end:e?performance.timeOrigin+e.responseEnd:null,positive_native_status:e?.responseStatus>0?e.responseStatus:null}})()')
                            proof.append(x)
                        report.setdefault('concurrency_diagnostics',[]).append({'width':w,'protected':protected,'proof':proof});save()
                        if not all(x['scheduled_visibility']=='visible' for x in proof):raise Capability('Independent W3C windows did not stay visible at explicit scheduled Show')
                        assert all(x['seen'] and x['response_end'] for x in proof),'both original application responses must disclose before concealment'
                        overlap=min(x['response_end'] for x in proof)-max(x['request_start'] for x in proof)
                        assert overlap>0,'actual browser request/response intervals did not overlap'
                        rows.append({'protected':protected,'independent_contexts':2,'overlap_ms':round(overlap,3),'response_proof':proof,'activation':'scheduled explicit inert DOM Show; not trusted keys','numeric_status_claim':'native only when exposed; parsed original app disclosure success otherwise'})
                    finally:
                        if second:browser.req('/window',{'handle':second});browser.req('/window',method='DELETE');browser.req('/window',{'handle':first})
                return {'cohorts':rows,'background_plaintext_not_required':True}
            run('protected unprotected overlapping independent readers',w,[['lifecycle','concurrent protected/unprotected readers']],concurrency)
    except Exception as e:report['fatal']={'error':type(e).__name__,'line':traceback.extract_tb(e.__traceback__)[-1].lineno}
    finally:
        if browser:report['cleanup']=browser.close()
        save();print(json.dumps({'executions':len(report['cases']),'fatal':report.get('fatal'),'cleanup':report.get('cleanup')}))
if __name__=='__main__':main()
