"""Regression coverage for final-service readiness; no Docker required."""
import contextlib
import importlib.util
import io
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    "verify_data_model", Path(__file__).with_name("verify-data-model.py")
)
assert SPEC is not None and SPEC.loader is not None
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)


class FinalPostgresServiceTests(unittest.TestCase):
    def exercise(self, *, temporary_server=False):
        calls = []
        tcp_probes = 0
        row_counts = iter(("0", "1", "0"))

        def fake_run(args, **kwargs):
            nonlocal tcp_probes
            calls.append(tuple(args))
            output = ""
            if "pg_isready" in args:
                # Official-image init server accepts Unix sockets, not TCP.
                tcp = "-h" in args and args[args.index("-h") + 1] == "127.0.0.1"
                if tcp:
                    tcp_probes += 1
                return subprocess.CompletedProcess(
                    args, int(temporary_server and tcp and tcp_probes == 1), "", ""
                )
            if "psql" in args:
                if temporary_server:
                    self.assertGreaterEqual(
                        tcp_probes, 2,
                        "SQL must wait past the temporary Unix-only init server",
                    )
                self.assertIn("-h", args, "SQL must explicitly connect to final TCP service")
                self.assertEqual(args[args.index("-h") + 1], "127.0.0.1")
                sql = kwargs["input"]
                if sql == "SELECT count(*) FROM link_lifecycles;":
                    output = next(row_counts)
                elif "to_regclass" in sql:
                    output = "t"
                elif "pg_indexes" in sql:
                    output = "0"
            return subprocess.CompletedProcess(args, 0, output, "")

        with patch.object(verifier.subprocess, "run", side_effect=fake_run), \
             patch.object(verifier.time, "sleep") as poll_wait, \
             contextlib.redirect_stdout(io.StringIO()):
            verifier.main()
        probes = [call for call in calls if "pg_isready" in call]
        self.assertTrue(probes)
        for probe in probes:
            self.assertIn("-h", probe)
            self.assertEqual(probe[probe.index("-h") + 1], "127.0.0.1")
        self.assertEqual(poll_wait.call_count, int(temporary_server))
        self.assertEqual(calls[-2][:3], ("docker", "rm", "--force"))
        self.assertEqual(calls[-1][:4], ("docker", "ps", "--all", "--quiet"))

    def test_temporary_unix_server_is_not_final_service_readiness(self):
        self.exercise(temporary_server=True)

    def test_every_sql_call_uses_explicit_loopback_tcp(self):
        self.exercise()


if __name__ == "__main__":
    unittest.main()
