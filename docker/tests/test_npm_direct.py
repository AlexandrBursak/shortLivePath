"""NPM-direct boundary; no ambient credentials or deployment changes."""
import pathlib
import subprocess
import unittest
ROOT = pathlib.Path(__file__).resolve().parents[2]

class NpmDirect(unittest.TestCase):
    def render(self, *args):
        return subprocess.run(['python3', str(ROOT/'docker/npm-direct.py'), *args], capture_output=True, text=True)

    def test_valid_literal_routes_and_single_forwarding(self):
        p = self.render('--upstream-ip','192.168.10.233','--api-port','3333','--web-port','3000')
        self.assertEqual(p.returncode, 0, p.stderr)
        for text in ['location ^~ /api/', 'location ^~ /health', 'location / {', 'proxy_pass http://192.168.10.233:3333;', 'proxy_pass http://192.168.10.233:3000;', 'proxy_set_header X-Forwarded-For $realip_remote_addr;', 'proxy_set_header Forwarded "";', 'proxy_request_buffering off;', 'proxy_cache off;', 'proxy_store off;', 'proxy_max_temp_file_size 0;', 'access_log off;', 'error_log /dev/null;', '$upstream_http_content_security_policy']:
            self.assertIn(text, p.stdout)
        self.assertNotIn('proxy_add_x_forwarded_for',p.stdout)
        self.assertNotIn('3333/;',p.stdout)
        self.assertNotIn('map ',p.stdout)

    def test_reject_injection_and_nonprivate_bind(self):
        for value in ['192.168.1.2;return 200', '192.168.1.2\n', 'api.internal','0.0.0.0','8.8.8.8','::','fe80::1%eth0']:
            with self.subTest(value=value):
                self.assertNotEqual(self.render('--upstream-ip',value).returncode,0)
        for value in ['0','65536','3333;','3\n']:
            self.assertNotEqual(self.render('--upstream-ip','192.168.1.2','--api-port',value).returncode,0)

    def test_scoped_nonce_and_frontend_error_fallback(self):
        text=self.render('--upstream-ip','192.168.1.2').stdout
        api=text.split('location ^~ /api/ {')[1].split('location / {')[0]
        web=text.split('location / {')[1].split('location @slp_unavailable')[0]
        self.assertNotIn('proxy_intercept_errors',api)
        self.assertNotIn('error_page',api)
        self.assertIn('error_page 500 502 503 504 = @slp_unavailable;',web)
        self.assertNotIn("default-src 'none'",web)
        self.assertIn('add_header Content-Security-Policy $upstream_http_content_security_policy always;',web)

    def test_private_ipv6_and_distinct_ports(self):
        p=self.render('--upstream-ip','fd12::1','--api-port','4300','--web-port','4301')
        self.assertEqual(p.returncode,0,p.stderr)
        self.assertIn('http://[fd12::1]:4300;',p.stdout)
        self.assertNotEqual(self.render('--upstream-ip','192.168.1.2','--api-port','3000').returncode,0)

    def test_overlay_only_app_ports_and_exact_peer(self):
        text=(ROOT/'compose.npm-direct.yml').read_text()
        self.assertIn('profiles: [internal-proxy]',text)
        self.assertIn('SLP_TRUSTED_PROXY: ${SLP_NPM_PEER:?required',text)
        self.assertEqual(text.count('ports:'),2)
        self.assertNotIn('postgres:',text)
        self.assertNotIn('redis:',text)
        self.assertNotIn('volumes:',text)
        self.assertIn('${SLP_BIND_IP:?required',text)

if __name__=='__main__': unittest.main()
