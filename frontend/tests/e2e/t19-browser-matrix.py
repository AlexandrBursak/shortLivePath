"""Run the installed-browser T19 matrix serially (never concurrent with load).
Prereq: t19-environment.py setup; Playwright JS tooling extracted to /tmp/slp-t19-tools.
Exit 0=executed cases passed; 1=failed; 2=capability blocked. Safari is separately probed.
"""
from pathlib import Path
import json
import subprocess as sp
import sys
ROOT = Path(__file__).resolve().parents[3]
OUT = Path('/tmp/slp-t19-evidence')
results = {}
for browser, expected in [('chrome',18), ('firefox',17)]:
    previous = OUT/(browser+'.json')
    if previous.exists():
        (OUT/(browser+'-before-final.json')).write_bytes(previous.read_bytes())
    with (OUT/(browser+'-final.log')).open('wb') as log:
        p = sp.run(['node','frontend/tests/e2e/t19-real-api.mjs',browser],cwd=ROOT,stdout=log,stderr=sp.STDOUT)
    result = json.loads(previous.read_text())
    assert len(result['cases']) == expected
    counts = {s:sum(c['result']==s for c in result['cases']) for s in ['PASS','FAIL','BLOCKED']}
    results[browser] = {'exit':p.returncode,'version':result['version'],'cases':len(result['cases']),**counts,'browser_pid_gone':result.get('browser_pid_gone')}
    (OUT/'matrix-process.json').write_text(json.dumps(results,indent=2)+'\n')
    print(browser, json.dumps(results[browser]), flush=True)
raise SystemExit(max(r['exit'] for r in results.values()))
