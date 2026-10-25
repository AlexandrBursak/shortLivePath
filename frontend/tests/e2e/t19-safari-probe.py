import subprocess as s, urllib.request as u, urllib.error, json, time, plistlib
from pathlib import Path
p=s.Popen(['/System/Cryptexes/App/usr/bin/safaridriver','-p','3450'],stdout=s.DEVNULL,stderr=s.DEVNULL)
result={}
try:
 for _ in range(30):
  try:
   u.urlopen('http://localhost:3450/status',timeout=1);break
  except Exception:time.sleep(.1)
 request=u.Request('http://localhost:3450/session',data=json.dumps({'capabilities':{'alwaysMatch':{'browserName':'safari','acceptInsecureCerts':False}}}).encode(),headers={'Content-Type':'application/json'})
 try:r=u.urlopen(request,timeout=20)
 except urllib.error.HTTPError as e:r=e
 body=json.load(r);result={'http':r.status,'response':body,'version':plistlib.loads(Path('/Applications/Safari.app/Contents/Info.plist').read_bytes())['CFBundleShortVersionString']}
 if body.get('value',{}).get('sessionId'):
  u.urlopen(u.Request('http://localhost:3450/session/'+body['value']['sessionId'],method='DELETE'))
finally:
 p.terminate();p.wait(timeout=10)
 result['driver_terminated']=p.poll() is not None
 Path('/tmp/slp-t19-evidence/safari.json').write_text(json.dumps(result,indent=2))
 print(json.dumps(result))
