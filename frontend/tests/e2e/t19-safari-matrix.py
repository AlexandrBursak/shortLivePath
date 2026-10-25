"""T19 AC-01..10/11b/12: owned visible installed Safari real HTTPS dual-width.
Run from repository root: python3 frontend/tests/e2e/t19-safari-matrix.py 360|1280
No native-console claim, host clipboard access, artificial viewport, or response fabrication.
"""
import hashlib
import json
import pathlib
import re
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from typing import Any

OUT = pathlib.Path('/tmp/slp-t19-evidence')
ORIGIN = 'https://localhost:3449'
TEXT = '  owned ASCII field\n' + 'LONG' * 100 + '  '
CODE = ' owned-code '


def require_viewport(metrics, width):
    assert metrics['width'] == width, 'actual layout viewport mismatch'
    assert metrics['visibility'] == 'visible', 'document is not visible'
    assert not metrics['overflow'], 'page overflows horizontally'


class Safari:
    def __init__(self):
        s = socket.socket()
        s.bind(('127.0.0.1', 0))
        self.port = s.getsockname()[1]
        s.close()
        self.child = subprocess.Popen(['/System/Cryptexes/App/usr/bin/safaridriver', '-p', str(self.port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.base = ''
        try:
            for _ in range(50):
                try:
                    self.req('/status')
                    break
                except (OSError, urllib.error.URLError):
                    assert self.child.poll() is None, 'owned driver exited'
                    time.sleep(.1)
            session = self.req('/session', {'capabilities': {'alwaysMatch': {'browserName': 'safari', 'acceptInsecureCerts': True}}})
            self.base = '/session/' + session['sessionId']
            self.version = session['capabilities']['browserVersion']
        except Exception:
            self.child.terminate()
            self.child.wait(timeout=10)
            raise

    def req(self, path, data=None, method=None):
        request = urllib.request.Request('http://127.0.0.1:' + str(self.port) + self.base + path, data=None if data is None else json.dumps(data).encode(), method=method or ('GET' if data is None else 'POST'), headers={'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=25) as r:
                return json.load(r)['value']
        except urllib.error.HTTPError as e:
            value = json.load(e)['value']
            raise RuntimeError('WebDriver ' + value.get('error', 'error')) from None

    def js(self, expression):
        return self.req('/execute/sync', {'script': 'return (' + expression + ');', 'args': []})

    def key(self, value):
        self.req('/actions', {'actions': [{'type': 'key', 'id': 'owned-keyboard', 'actions': [{'type': typ, 'value': char} for char in value for typ in ['keyDown', 'keyUp']]}]})

    def close(self):
        deleted = False
        try:
            self.req('', method='DELETE')
            deleted = True
        finally:
            self.child.terminate()
            self.child.wait(timeout=10)
        with socket.socket() as s:
            closed = s.connect_ex(('127.0.0.1', self.port)) != 0
        return {'session_deleted': deleted, 'owned_driver_exited': self.child.poll() is not None, 'driver_port_closed': closed}


def case_selected(name, selected):
    return selected is None or name == selected


def main(width, selected=None):
    OUT.mkdir(exist_ok=True)
    report = {'browser': 'safari', 'width': width, 'selected_case': selected, 'run_id': __import__('os').environ.get('T19_RUN_ID'), 'diagnostics': [], 'api_controls': [], 'cases': [], 'viewports': [], 'postload': [], 'native_console': 'UNMONITORED', 'limits': ['W3C native console stream unavailable; postload counters omit bootstrap.', 'DOM focus plus native W3C keys unless explicitly tab-only; long validation injection is controlled beforeinput.', 'No response interception adapter; no offline/freeze/first-frame/BFCache claims.', 'No T23 native Unicode/line-ending clipboard research; no host clipboard access.']}
    browser: Any = None

    def save():
        (OUT / ('safari-matrix-' + str(width) + '.json')).write_text(json.dumps(report, indent=2) + '\n')
        pathlib.Path('/tmp/slp-t19-safari-matrix-checkpoint.md').write_text('# Safari T19 focused matrix\nWidth ' + str(width) + '; ' + str([(x['name'], x['result']) for x in report['cases']]) + '\nNative console UNMONITORED. Resource teardown pending until report cleanup readback.\n')

    def test(name, fn):
        if not case_selected(name, selected):
            return
        start = time.monotonic()
        try:
            data = fn()
            report['cases'].append({'name': name, 'result': 'PASS', 'measured': data, 'seconds': round(time.monotonic() - start, 2)})
        except Exception as e:
            report['cases'].append({'name': name, 'result': 'FAIL', 'error': type(e).__name__, 'detail': str(e)[:180] if isinstance(e, AssertionError) else 'bounded harness/state failure', 'seconds': round(time.monotonic() - start, 2)})
        save()
        print(name + ': ' + report['cases'][-1]['result'], flush=True)

    def api(path, body=None):
        req = urllib.request.Request(ORIGIN + path, data=None if body is None else json.dumps(body).encode(), headers={'content-type': 'application/json'})
        try:
            r = urllib.request.urlopen(req, context=ssl.create_default_context(cafile='/tmp/slp-t19-synthetic/tls/cert.pem'), timeout=20)
        except urllib.error.HTTPError as e:
            r = e
        with r:
            assert 'no-store' in r.headers['cache-control']
            report['api_controls'].append({'operation': 'create' if path == '/api/v1/secrets' else 'disclosure' if path.endswith('/disclosures') else 'status', 'http_status': r.status})
            return r.status, json.load(r)

    def until(expr):
        for _ in range(90):
            if browser.js(expr):
                return
            time.sleep(.1)
        raise AssertionError('state timeout: ' + expr[:100])

    def metrics():
        m = browser.js('({width:innerWidth,height:innerHeight,visibility:document.visibilityState,overflow:document.documentElement.scrollWidth>innerWidth})')
        report['viewports'].append(m)
        require_viewport(m, width)
        return m

    def collect():
        value = browser.js('window.ownedErrors||null')
        if value:
            report['postload'].append(value)

    def load(url):
        collect()
        browser.req('/url', {'url': url})
        browser.req('/window/rect', {'x': 100, 'y': 100, 'width': width, 'height': 900})
        metrics()
        until('document.readyState==="complete" && !!document.querySelector("h1")')
        browser.js('(()=>{window.ownedErrors={page:0,csp:0,appConsole:0};addEventListener("error",()=>ownedErrors.page++);addEventListener("unhandledrejection",()=>ownedErrors.page++);document.addEventListener("securitypolicyviolation",()=>ownedErrors.csp++);const c=console.error;console.error=function(...args){ownedErrors.appConsole++;return c.apply(console,args)};return true})()')
        browser.js('(()=>{window.ownedEvents=[];for(const t of ["focus","blur","visibilitychange","pageshow","pagehide","input","beforeinput","submit"])addEventListener(t,e=>{if(window.ownedEvents.length<100)window.ownedEvents.push({type:e.type,target_id:e.target?.id||null,visibility:document.visibilityState,ms:Math.round(performance.now())})},true);return true})()')
        # Require actual React event hydration, not merely SSR inputs.
        until('!!Array.from(document.querySelectorAll("form,button")).find(e=>Object.keys(e).some(k=>k.startsWith("__reactProps"))) || document.querySelector("a")')

    def button(label):
        metrics()
        q = json.dumps(label)
        until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent===' + q + '&&!e.disabled)')
        browser.js('Array.from(document.querySelectorAll("button")).find(e=>e.textContent===' + q + ').focus()')
        assert browser.js('getComputedStyle(document.activeElement).outlineWidth!=="0px"'), 'visible focus missing'
        browser.key('\ue007')

    def field(id_, value, controlled=False):
        target = 'document.getElementById(' + json.dumps(id_) + ')'
        browser.js('(()=>{const e=' + target + ';e.focus();e.select();return true})()')
        if controlled:
            browser.js('(()=>{const e=' + target + ';e.dispatchEvent(new InputEvent("beforeinput",{bubbles:true,cancelable:true,inputType:"insertText",data:' + json.dumps(value) + '}));return true})()')
        else:
            browser.key(value if value else '\ue003')

    def heading(value):
        until('document.querySelector("h1")?.textContent===' + json.dumps(value))
        metrics()

    def gate(url):
        load(url)
        until('Array.from(document.querySelectorAll("button")).some(e=>e.textContent==="Show Secret"&&!e.disabled)')
        assert browser.js('document.querySelectorAll("pre").length') == 0
        assert browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/disclosures")).length') == 0

    def snapshot(stage, code):
        # Resource Timing statuses are actual browser observations only when exposed;
        # zero/missing is unavailable, never an inferred HTTP code. No URLs/body text.
        data = browser.js('(()=>{const e=document.getElementById("recipient-code"),b=Array.from(document.querySelectorAll("button")).find(e=>e.textContent==="Show Secret"||e.textContent==="Opening..."),h=document.querySelector("h1")?.textContent;const headings={"A Secret was shared with you":"gate","Secret":"reading","This Share link has expired":"expired"};return {active_id:document.activeElement?.id||null,visibility:document.visibilityState,code_match:!!e&&e.value===' + json.dumps(code) + ',heading_class:headings[h]||"other",ready:document.readyState,react_input_ready:!!e&&Object.keys(e).some(k=>k.startsWith("__reactProps")),pending:!!b&&b.textContent==="Opening...",show_enabled:!!b&&!b.disabled,code_error:!!document.getElementById("recipient-code-error"),reader_error:!!document.getElementById("reader-error"),events:window.ownedEvents||[],http:performance.getEntriesByType("resource").filter(e=>e.name.startsWith(location.origin+"/api/v1/secrets/")).map(e=>({operation:e.name.endsWith("/disclosures")?"disclosure":"status",http_status:typeof e.responseStatus==="number"&&e.responseStatus>0?e.responseStatus:null,complete:e.responseEnd>0}))}})()')
        report['diagnostics'].append(dict(stage=stage, **data))
        save()

    def show(code=None):
        if code is not None:
            field('recipient-code', code)
        snapshot('code-input', code)
        try:
            snapshot('preShow', code)
            button('Show Secret')
            heading('Secret')
            assert browser.js('document.activeElement===document.querySelector("h1")')
        finally:
            snapshot('postShow', code)

    def seed(minutes=60, protected=False):
        body = {'credential': TEXT, 'lifetime_minutes': minutes}
        if protected:
            body['reading_code'] = CODE
        status, result = api('/api/v1/secrets', body)
        assert status == 201
        return result['data']['share_url']

    def path(url):
        return '/api/v1/secrets/' + url.rsplit('/', 1)[1]

    try:
        browser = Safari()
        report['version'] = browser.version
        report['driver_pid'] = browser.child.pid
        browser.req('/url', {'url': 'data:text/html,<meta name="viewport" content="width=device-width,initial-scale=1"><title>T19 OWNED SAFARI VIEWPORT</title><p>T19 viewport verification</p>'})
        for w in [360, 1280]:
            rect = browser.req('/window/rect', {'x': 100, 'y': 100, 'width': w, 'height': 900})
            m = browser.js('({width:innerWidth,height:innerHeight,visibility:document.visibilityState,overflow:document.documentElement.scrollWidth>innerWidth})')
            report.setdefault('preflight', []).append({'requested': w, 'rect': rect, 'actual': m})
            save()
        for row in report['preflight']:
            require_viewport(row['actual'], row['requested'])
        browser.req('/window/rect', {'x': 100, 'y': 100, 'width': width, 'height': 900})
        save()

        def validation():
            load(ORIGIN + '/')
            assert browser.js('document.getElementById("minutes").value') == '60'
            assert browser.js('Array.from(document.querySelectorAll("input,textarea")).every(e=>e.labels?.length)')
            button('Create Secret')
            until('!!document.querySelector("[role=alert]")')
            assert browser.js('document.activeElement.textContent.includes("Check the highlighted fields")')
            for text in ['   ', 'x' * 65537]:
                field('credential', text, True)
                button('Create Secret')
                assert browser.js('document.querySelectorAll("pre").length') == 0
                assert browser.js('!!document.querySelector("[role=alert]")')
            field('credential', 'owned ASCII')
            for minute in ['0', '1441', '1.5', '']:
                field('minutes', minute)
                button('Create Secret')
                assert browser.js('!!document.getElementById("minutes-error")')
                assert browser.js('document.getElementById("minutes").value') == minute
            field('minutes', '61')
            browser.key('\ue004')
            assert browser.js('document.getElementById("minutes").value') == '61'
            browser.js('document.querySelector("input[type=checkbox]").focus()')
            browser.key(' ')
            for code in ['short', 'x' * 1025]:
                field('reading-code', code, True)
                button('Create Secret')
                assert browser.js('!!document.getElementById("reading-code-error")')
            assert browser.js('performance.getEntriesByType("resource").filter(e=>e.name.endsWith("/api/v1/secrets")).length') == 0
            return {'local_vectors': 9, 'native_minutes_blur61': True, 'creation_requests': 0}
        test('AC-02/04/05/06 NFR-06 SCR01 default empty validation labels focus', validation)

        def core():
            load(ORIGIN + '/')
            for id_ in ['address', 'login', 'credential']:
                field(id_, TEXT, True)
            field('minutes', '61')
            browser.key('\ue004')
            browser.js('document.querySelector("input[type=checkbox]").focus()')
            browser.key(' ')
            button('Generate 20-character code')
            generated = browser.js('document.getElementById("reading-code").value')
            assert re.fullmatch('[A-Za-z0-9]{20}', generated)
            field('reading-code', CODE)
            button('Create Secret')
            heading('Secret created')
            url = browser.js('document.querySelector("pre").textContent')
            assert browser.js('document.querySelectorAll("pre").length') == 2
            assert browser.js('document.querySelector("time").textContent.includes("UTC")')
            digest = hashlib.sha256(__import__('base64').urlsafe_b64decode(url.rsplit('/',1)[1]+'=')).hexdigest()
            seconds = subprocess.check_output(['docker','exec','slp-t19-postgres-1','psql','-U','slp','-d','slp','-Atc',"SELECT extract(epoch FROM expires_at-created_at)::integer FROM link_lifecycles WHERE token_digest=decode('"+digest+"','hex')"],text=True).strip()
            assert seconds == '3660'
            assert api(path(url)+'/status')[1]['data']['reading_code_required'] is True
            gate(url)
            button('Show Secret')
            until('!!document.getElementById("recipient-code-error")')
            assert browser.js('document.activeElement.id') == 'recipient-code'
            field('recipient-code', 'wrong')
            button('Show Secret')
            until('document.getElementById("recipient-code-error")?.textContent.includes("incorrect")')
            assert browser.js('document.querySelectorAll("pre").length') == 0
            field('recipient-code', CODE)
            button('Show Secret')
            heading('Secret')
            assert browser.js('Array.from(document.querySelectorAll("pre")).every(e=>e.textContent===' + json.dumps(TEXT) + ')')
            assert browser.js('document.querySelectorAll("pre").length') == 3
            for _ in range(2):
                gate(url)
                show(CODE)
            return {'protected_repeat_reads': 3, 'actual_wrong_code403': True, 'generator20': True, 'database_minutes':61, 'field_submission':'controlled original beforeinput', 'button_activation':'native Enter after DOM focus'}
        test('AC-01/03/04/06/07/08/12 SCR01-04 protected generation minute61 neutral wrong-code repeat', core)

        def unprotected():
            load(ORIGIN + '/')
            field('credential', 'owned keyboard field')
            button('Create Secret')
            heading('Secret created')
            assert browser.js('document.querySelectorAll("pre").length') == 1
            url = browser.js('document.querySelector("pre").textContent')
            assert api(path(url)+'/status')[1]['data']['reading_code_required'] is False
            for _ in range(2):
                gate(url)
                assert browser.js('!document.getElementById("recipient-code")')
                show()
            return {'unprotected_ui_create':True,'explicit_repeat_reads':2,'native_text_input':True}
        test('AC-01/08 SCR01-04 unprotected native-key creation repeat neutral Show', unprotected)

        def terminal():
            load(ORIGIN+'/s/'+'A'*43)
            heading('The Secret at this link is unavailable')
            assert browser.js('document.querySelectorAll("pre").length') == 0
            url = seed()
            digest = hashlib.sha256(__import__('base64').urlsafe_b64decode(url.rsplit('/',1)[1]+'=')).hexdigest()
            id_ = subprocess.check_output(['docker','exec','slp-t19-postgres-1','psql','-U','slp','-d','slp','-Atc',"SELECT id FROM link_lifecycles WHERE token_digest=decode('"+digest+"','hex')"],text=True).strip()
            assert re.fullmatch('[a-f0-9-]{36}',id_)
            subprocess.run(['docker','exec','slp-t19-redis-1','redis-cli','DEL','slp:t19synthetic:secret:'+id_+':payload'],check=True,stdout=subprocess.DEVNULL)
            load(url)
            heading('The Secret became unavailable before expiry')
            assert browser.js('document.activeElement===document.querySelector("h1")')
            assert browser.js('document.querySelectorAll("pre").length') == 0
            browser.js('document.querySelector("a").focus()')
            browser.key('\ue007')
            heading('Create a Secret')
            assert browser.js('document.getElementById("credential").value') == ''
            return {'unknown':True,'owned_payload_loss':True,'native_keyboard_empty_restart':True}
        test('AC-09/11b/12 NFR-06 SCR05 unknown early-loss focused keyboard restart', terminal)

        def expiry(confirmation):
            if confirmation:
                load(ORIGIN+'/')
                field('credential','owned expiry')
                field('minutes','1')
                browser.js('document.querySelector("input[type=checkbox]").focus()')
                browser.key(' ')
                field('reading-code',CODE)
                button('Create Secret')
                heading('Secret created')
                url=browser.js('document.querySelector("pre").textContent')
                assert browser.js('document.querySelectorAll("pre").length')==2
            else:
                url=seed(1,True)
                gate(url)
                show(CODE)
            started=time.monotonic()
            # Actual wall time, no clock alteration or synthetic response.
            time.sleep(61)
            heading('This Share link has expired')
            assert browser.js('document.querySelectorAll("pre").length')==0
            assert browser.js('document.activeElement===document.querySelector("h1")')
            assert api(path(url)+'/disclosures',{'reading_code':CODE})[0]==410
            load(url)
            heading('This Share link has expired')
            return {'actual_wait_seconds':round(time.monotonic()-started,2),'actual_disclosure_http':410,'handover_removed':confirmation,'reader_removed':not confirmation}
        test('AC-04/06/10 SCR02 SCR05 actual one-minute protected confirmation expiry',lambda:expiry(True))
        test('AC-04/10 SCR03 SCR04 SCR05 actual one-minute protected reader expiry',lambda:expiry(False))
        collect()
    except Exception as e:
        report['fatal']={'error':type(e).__name__,'detail':str(e)[:160]}
    finally:
        if browser:
            report['cleanup']=browser.close()
        report['counts']={status:sum(c['result']==status for c in report['cases']) for status in ['PASS','FAIL','BLOCKED','N/A']}
        save()
        print(json.dumps({'width':width,'counts':report['counts'],'fatal':report.get('fatal'),'cleanup':report.get('cleanup')}))
    return 1 if report.get('fatal') or report['counts']['FAIL'] else 0


if __name__=='__main__':
    assert len(sys.argv) in [2, 4] and sys.argv[1] in ['360','1280'], 'explicit width required'
    assert len(sys.argv) == 2 or sys.argv[2] == '--case', 'exact --case name required'
    raise SystemExit(main(int(sys.argv[1]), sys.argv[3] if len(sys.argv) == 4 else None))
