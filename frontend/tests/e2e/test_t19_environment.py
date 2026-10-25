"""AC-11/NFR-04: evaluate only the ENV expression, never import/run stack setup."""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
class EnvironmentIsolation(unittest.TestCase):
    def test_AC_11_synthetic_environment_discards_ambient_overrides(self):
        source = Path(__file__).with_name('t19-environment.py').read_text()
        assignment = next(n for n in ast.parse(source).body if isinstance(n, ast.Assign) and any(isinstance(t,ast.Name) and t.id=='ENV' for t in n.targets))
        expression = ast.Expression(assignment.value)
        fake = SimpleNamespace(environ={'PATH':'/synthetic','SLP_PUBLIC_ORIGIN':'not-a-real-origin','SLP_APP_KEY':'synthetic-not-a-secret','SLP_API_IMAGE':'unowned-image'})
        env = eval(compile(expression,'owned ENV expression','eval'),{'os':fake})
        self.assertEqual(set(env),{'PATH','SLP_WEB_IMAGE','SLP_API_IMAGE'})
        self.assertEqual(env['SLP_API_IMAGE'],'slp-t19-followup-api')
        self.assertEqual(env['SLP_WEB_IMAGE'],'slp-t19-production')
if __name__=='__main__':
    unittest.main()
