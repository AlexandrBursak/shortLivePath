import importlib.util
import pathlib
import unittest
p=pathlib.Path(__file__).with_name('t19-safari-refusals.py')
s=importlib.util.spec_from_file_location('refusals',p)
assert s and s.loader
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class FixtureTests(unittest.TestCase):
 def test_restores_payload_and_index_even_after_failure(self):
  calls=[]
  def redis(*args):
   calls.append(args)
   if args[0]=='GET':return 'owned-original'
   if args[0]=='PEXPIRETIME':return '123456'
   return 'OK'
  with self.assertRaises(ValueError):
   with m.corrupt_owned_state(redis,'slp:t19synthetic:creation:owned:state'):
    raise ValueError('test')
  self.assertIn(('SET','slp:t19synthetic:creation:owned:state','owned-original','PXAT','123456'),calls)
  self.assertIn(('ZADD','slp:t19synthetic:limiter:expiry','123456','slp:t19synthetic:creation:owned:state'),calls)
 def test_rejects_foreign_key_before_any_write(self):
  with self.assertRaises(AssertionError):
   with m.corrupt_owned_state(lambda *x:self.fail('foreign access'),'foreign:state'):pass
if __name__=='__main__':unittest.main()
