"""T19 scoped Safari viewport safety selftests; no browser/clipboard side effects."""
import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('safari_matrix', pathlib.Path(__file__).with_name('t19-safari-matrix.py'))
assert spec is not None and spec.loader is not None
matrix = importlib.util.module_from_spec(spec)
spec.loader.exec_module(matrix)


class ViewportFence(unittest.TestCase):
    def test_AC_04_NFR_06_actual_width_not_requested_rect(self):
        for width in [360, 1280]:
            with self.assertRaisesRegex(AssertionError, 'actual layout viewport mismatch'):
                matrix.require_viewport({'width':1920, 'visibility':'visible', 'overflow':False}, width)

    def test_AC_10_hidden_document_is_not_visible_coverage(self):
        with self.assertRaisesRegex(AssertionError, 'not visible'):
            matrix.require_viewport({'width':360, 'visibility':'hidden', 'overflow':False}, 360)

    def test_NFR_06_overflow_is_rejected(self):
        with self.assertRaisesRegex(AssertionError, 'overflows'):
            matrix.require_viewport({'width':360, 'visibility':'visible', 'overflow':True}, 360)

    def test_NFR_06_actual_visible_targets_are_accepted(self):
        # Pin the exact harmless document from the parent's successful native probe.
        self.assertIn('data:text/html,<meta name="viewport" content="width=device-width,initial-scale=1"><title>T19 OWNED SAFARI VIEWPORT</title><p>T19 viewport verification</p>', pathlib.Path(__file__).with_name('t19-safari-matrix.py').read_text())
        for width in [360, 1280]:
            matrix.require_viewport({'width':width, 'visibility':'visible', 'overflow':False}, width)


class CaseFilter(unittest.TestCase):
    def test_AC_10_exact_filter_preserves_default_and_executes_only_requested_case(self):
        names = ['confirmation expiry', 'reader expiry', 'reader expiry extra']
        self.assertEqual([n for n in names if matrix.case_selected(n, None)], names)
        self.assertEqual([n for n in names if matrix.case_selected(n, 'reader expiry')], ['reader expiry'])
        self.assertFalse(matrix.case_selected('reader expiry', 'missing'))


if __name__ == '__main__':
    unittest.main()
