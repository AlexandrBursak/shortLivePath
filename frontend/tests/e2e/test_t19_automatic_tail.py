"""AC-10: isolated manifest/fixture contract, no browser or secret artifacts."""
import importlib.util
import pathlib
import unittest

class TailContract(unittest.TestCase):
    def test_manifest_and_exact_capacity(self):
        spec=importlib.util.spec_from_file_location('tail',pathlib.Path(__file__).with_name('t19-automatic-tail.py'))
        assert spec and spec.loader
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        self.assertEqual(module.cell_key({'browser':'safari','width':360,'screen':'SCR-02','case':'loading'}),'safari|360|SCR-02|loading')
        self.assertEqual(module.capacity_missing(7),9993)
        with self.assertRaises(AssertionError):module.capacity_missing(10001)
        with self.assertRaises(AssertionError):module.unique_cells([{'browser':'safari','width':360,'screen':'SCR-02','case':'loading'}]*2)

if __name__=='__main__':unittest.main()
