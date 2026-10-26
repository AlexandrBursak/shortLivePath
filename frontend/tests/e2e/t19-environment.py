"""T19 owned synthetic stack. Run from repo root: python3 frontend/tests/e2e/t19-environment.py setup|cleanup.
No ambient .env, production data, global trust or foreign project mutations.
"""
from pathlib import Path
import json
import os
import shutil
import subprocess as sp
import sys
ROOT = Path(__file__).resolve().parents[3]
PRIVATE = Path('/tmp/slp-t19-synthetic')
OUT = Path('/tmp/slp-t19-evidence')
PROJECT = 'slp-t19'
ENV = dict({k:v for k,v in os.environ.items() if not k.startswith('SLP_')}, SLP_WEB_IMAGE='slp-t19-production', SLP_API_IMAGE='slp-t19-followup-api')
BASE = ['docker', 'compose', '--env-file', str(PRIVATE/'synthetic.env'), '-p', PROJECT]
def run(args):
    return sp.run(args, cwd=ROOT, env=ENV, check=True, capture_output=True).stdout
if sys.argv[1] == 'setup':
    OUT.mkdir(mode=0o700, exist_ok=True)
    run(['python3','docker/synthetic.py',str(PRIVATE)])
    p = PRIVATE/'synthetic.env'
    p.write_text(p.read_text().replace('t17synthetic','t19synthetic').replace('3447','3449').replace('10.217.17.','10.219.19.').replace('10.217.18.','10.219.20.'))
    # Reuse only installed dependencies; COPY current tree and build a new artifact.
    build = OUT/'Dockerfile'
    build.write_text('FROM slp-resume-ui-browser AS build\nWORKDIR /home/node/app\nCOPY . .\nRUN pnpm build\nFROM node:24.17.0-bookworm-slim\nWORKDIR /home/node/app\nENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000\nCOPY --from=build --chown=node:node /home/node/app/.next/standalone ./\nCOPY --from=build --chown=node:node /home/node/app/.next/static ./.next/static\nUSER node\nCMD ["node","server.js"]\n')
    (OUT/'build.log').write_bytes(run(['docker','build','-f',str(build),'-t','slp-t19-production','frontend']))
    run(BASE+['up','-d','--no-build','--wait','--wait-timeout','210'])
    print('T19 isolated HTTPS/API/PostgreSQL/Redis healthy on loopback 3449.')
elif sys.argv[1] == 'cleanup':
    run(BASE+['down','--volumes','--remove-orphans'])
    counts = {}
    for kind in ['container','network','volume']:
        found = run(['docker',kind,'ls','-q','--filter','label=com.docker.compose.project='+PROJECT]).strip()
        assert not found, 'owned resources remain'
        counts[kind] = 0
    shutil.rmtree(PRIVATE)
    assert not PRIVATE.exists()
    (OUT/'cleanup.json').write_text(json.dumps({'remaining':counts,'synthetic_material_removed':True})+'\n')
    print('T19 owned containers/networks/volumes=0; generated material removed.')
else:
    raise SystemExit('setup|cleanup required')
