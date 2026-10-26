"""T17 AC-08/10/11: deployment packaging invariants (runtime smoke is separate)."""
import pathlib
import unittest
ROOT = pathlib.Path(__file__).resolve().parents[2]

class Wiring(unittest.TestCase):
    def test_private_production_topology(self):
        text = (ROOT / 'compose.yml').read_text()
        for required in ['127.0.0.1:', 'target: runtime', 'target: production', 'internal: true', 'SLP_TRUSTED_PROXY', 'api-owner:/run/slp-owner', 'service_completed_successfully', 'no-new-privileges:true']:
            self.assertIn(required, text)
        self.assertEqual(text.count('ports:'), 1)
        self.assertNotIn('next dev', text)

    def test_proxy_confidentiality(self):
        text = (ROOT / 'docker/nginx.conf').read_text()
        for required in ['access_log off', 'error_log /dev/null', 'proxy_request_buffering off', 'proxy_buffering off', 'proxy_next_upstream off', 'proxy_set_header X-Forwarded-For $remote_addr', 'no-store', 'no-referrer', 'location ^~ /health', 'proxy_pass http://api:3333']:
            self.assertIn(required, text)

    def test_redis_volatile(self):
        text = (ROOT / 'docker/redis.conf').read_text()
        for required in ['maxmemory 256mb', 'maxmemory-policy noeviction', 'appendonly no', 'save ""', 'shutdown-on-sigterm nosave', 'slowlog-log-slower-than -1', 'latency-monitor-threshold 0']:
            self.assertIn(required, text)

    def test_nonce_policy(self):
        text = (ROOT / 'frontend/src/proxy.ts').read_text()
        self.assertIn("'nonce-${nonce}'", text)
        self.assertIn("'strict-dynamic'", text)
        self.assertNotIn("'unsafe-inline'", text.split('style-src')[0])

if __name__ == '__main__':
    unittest.main()
