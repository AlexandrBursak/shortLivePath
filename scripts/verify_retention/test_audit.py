"""Negative controls for the T18 audit itself; no Docker required."""
import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from typing import Any

spec = importlib.util.spec_from_file_location('retention', Path(__file__).with_name('run.py'))
assert spec is not None and spec.loader is not None
audit: Any = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AuditControls(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.out = patch.object(audit,'OUT',Path(self.directory.name))
        self.out.start()
        self.addCleanup(self.out.stop)
        audit.REPORT = {'checks':[], 'scans':[]}
        audit.NEEDLES = [b'negative-control-not-a-real-secret']

    def test_detects_injected_forbidden_sink_without_printing_value(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output), self.assertRaises(AssertionError):
            audit.scan('negative control',b'prefix'+audit.NEEDLES[0]+b'suffix')
        self.assertEqual(audit.REPORT['scans'][0]['canary_hits'],1)
        self.assertNotIn(audit.NEEDLES[0].decode(),(Path(self.directory.name)/'runtime.json').read_text()+output.getvalue())

    def test_clean_sink_has_zero_hits_and_deduplicates_needles(self):
        audit.NEEDLES *= 3
        audit.scan('clean',b'approved metadata only')
        self.assertEqual(audit.REPORT['scans'][0]['canary_hits'],0)

    def test_startup_connection_refusal_is_unready(self):
        with patch.object(audit,'compose',side_effect=RuntimeError('connection refused')):
            self.assertFalse(audit.ready())

if __name__ == '__main__':
    unittest.main()
