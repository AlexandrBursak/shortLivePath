"""Generate ONLY a private test proxy config; never mounted by ordinary Compose."""
from pathlib import Path


def generate():
    ordinary = (Path(__file__).resolve().parents[2] / 'docker/nginx.conf').read_text()
    mapping = '\n'.join(f'    "{i}" 192.0.2.{i + 1};' for i in range(100))
    header = '  map $http_x_slp_test_identity $synthetic_identity {\n    default "";\n' + mapping + '\n  }\n'
    listener = ordinary[ordinary.index('  server {'):ordinary.rindex('}')]
    listener = listener.replace('listen 8443 ssl;', 'listen 9443 ssl;\n    allow ${RUNNER_IP};\n    deny all;\n    if ($synthetic_identity = "") { return 403; }')
    listener = listener.replace('proxy_set_header X-Forwarded-For $remote_addr;', 'proxy_set_header X-Forwarded-For $synthetic_identity;')
    return ordinary.replace('http {', 'http {\n' + header, 1).rstrip()[:-1] + listener + '}\n'


if __name__ == '__main__':
    print(generate(), end='')
