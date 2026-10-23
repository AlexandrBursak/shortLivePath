"""Generate NEW test-only materials, never read ambient credentials or trust stores."""
import os
import pathlib
import secrets
import subprocess
import sys
p = pathlib.Path(sys.argv[1]).resolve()
p.mkdir(mode=0o700)  # refuse existing directory
(p / 'tls').mkdir(mode=0o700)
(p / 'keys').mkdir(mode=0o700)
(p / 'keys/address.key').write_bytes(secrets.token_bytes(32))
(p / 'keys/address.key').chmod(0o600)
subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-days','2','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1','-keyout',str(p/'tls/key.pem'),'-out',str(p/'tls/cert.pem')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(p / 'tls/key.pem').chmod(0o600)
values = {'SLP_APP_KEY':secrets.token_hex(32),'SLP_PG_PASSWORD':secrets.token_hex(24),'SLP_NAMESPACE':'t17synthetic','SLP_HTTPS_PORT':'3447','SLP_PUBLIC_ORIGIN':'https://localhost:3447','SLP_PROXY_IP':'10.217.17.254','SLP_EDGE_SUBNET':'10.217.17.0/24','SLP_STORE_SUBNET':'10.217.18.0/24','SLP_KEY_DIRECTORY':str(p/'keys'),'SLP_TLS_DIRECTORY':str(p/'tls')}
(p / 'synthetic.env').write_text(''.join(f'{k}={v}\n' for k,v in values.items()))
(p / 'synthetic.env').chmod(0o600)
print('Created test-only material:', p)
