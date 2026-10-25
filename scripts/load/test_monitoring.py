import importlib.util
import unittest
from pathlib import Path


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class MonitoringTests(unittest.TestCase):
    def test_month_boundaries_missing_duplicates_and_unavailability(self):
        m = load('availability')
        start, end = m.month_bounds('2028-02')
        self.assertEqual((end - start) // 60, 29 * 1440)
        rows = [{'minute': start, 'available': True}, {'minute': start + 60, 'available': False}]
        report = m.aggregate('2028-02', rows, end)
        self.assertEqual(report['missing'], 29 * 1440 - 2)
        self.assertEqual(report['unavailable'], 1)
        self.assertFalse(report['certified'])
        self.assertEqual(m.aggregate('2028-02', rows + [rows[0]], end)['duplicates'], 1)
        self.assertEqual(m.aggregate('2028-02', rows + [{'minute': end, 'available': True}], end)['observed'], 2)
        complete = [{'minute': t, 'available': True} for t in range(start, end, 60)]
        self.assertTrue(m.aggregate('2028-02', complete, end)['certified'])
        self.assertFalse(m.aggregate('2028-02', complete, end - 1)['certified'])
        self.assertEqual(m.next_minute(start + 17), start + 60)
        with self.assertRaises(ValueError):
            m.aggregate('2028-02', [{'minute': start, 'available': 'yes', 'url': 'forbidden'}], end)

    def test_probe_failures_and_memory_only_roundtrip(self):
        from unittest.mock import patch
        import json
        m = load('availability')
        class Response:
            def __init__(self, status, value):
                self.status, self.value = status, value
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass
            def read(self, limit):
                return json.dumps(self.value).encode()
        class Opener:
            def open(self, request, timeout):
                body = json.loads(request.data)
                if request.full_url.endswith('/secrets'):
                    self.value = body['credential']
                    return Response(201, {'data': {'share_url': 'https://localhost/s/' + 'A' * 43}})
                return Response(200, {'data': {'secret': {'address': '', 'login': '', 'credential': self.value}}})
        with patch.object(m.ssl, 'create_default_context'), patch.object(m.urllib.request, 'build_opener', return_value=Opener()):
            self.assertTrue(m.probe('https://localhost', 'synthetic-ca'))
        with patch.object(m.ssl, 'create_default_context'), patch.object(m.urllib.request, 'build_opener') as factory:
            factory.return_value.open.side_effect = RuntimeError('sensitive failure')
            self.assertFalse(m.probe('https://localhost', 'synthetic-ca'))
        with self.assertRaises(ValueError):
            m.probe('https://example.org', 'synthetic-ca')

    def test_metrics_only_configuration_and_early_warning(self):
        import json
        root = Path(__file__).resolve().parents[2] / 'docker/monitoring'
        collector = json.loads((root / 'otel.json').read_text())
        self.assertEqual(set(collector['service']['pipelines']), {'metrics'})
        job = collector['receivers']['prometheus']['config']['scrape_configs'][0]
        self.assertIn({'action': 'labelkeep', 'regex': '__name__|operation|outcome|le'}, job['metric_relabel_configs'])
        nginx = (root.parent / 'nginx.conf').read_text()
        self.assertIn('location ^~ /health { return 404; }', nginx)
        rules = json.loads((root / 'alerts.json').read_text())['groups'][0]['rules']
        expressions = ' '.join(rule['expr'] for rule in rules)
        for expression in ('slp_ready == 0', 'slp_sample_age_seconds > 30', 'slp_cleanup_age_seconds > 45', 'slp_healthy_expired_breach > 0', 'slp_metadata_bytes', 'slp_limiter_registry', 'slp_redis_noeviction'):
            self.assertIn(expression, expressions)

    def test_closed_runner_map_preserves_ordinary_listener(self):
        f = load('identity_fixture')
        text = f.generate()
        self.assertEqual(text.count('192.0.2.'), 100)
        self.assertIn('listen 9443 ssl', text)
        self.assertIn('default "";', text)
        self.assertIn('proxy_set_header X-Forwarded-For $remote_addr;', text)
        self.assertIn('proxy_set_header X-Forwarded-For $synthetic_identity;', text)
        self.assertIn('allow ${RUNNER_IP};', text)
        self.assertIn('deny all;', text)
        self.assertIn('if ($synthetic_identity = "") { return 403; }', text)


if __name__ == '__main__':
    unittest.main()
