#!/usr/bin/env python3
"""Validate staged SQL using only a new, network-isolated disposable container.

Usage: python3 docs/features/short-live-path/_audit/verify-data-model.py
Requires Docker and a locally available postgres:17-alpine test image.
This image is a verification target, not a production-version decision.
"""
from pathlib import Path
import subprocess
import time
import uuid

FEATURE = Path(__file__).resolve().parents[1]
IMAGE = "postgres:17-alpine"


def run(*args, source=None):
    result = subprocess.run(args, input=source, text=True, capture_output=True, check=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    return result.stdout.strip()


def main():
    name = "slp-schema-check-" + uuid.uuid4().hex
    run("docker", "image", "inspect", IMAGE, "--format", "{{.Id}}")
    started = False
    try:
        run("docker", "run", "--detach", "--rm", "--name", name,
            "--network", "none", "--tmpfs", "/var/lib/postgresql/data:rw,noexec,nosuid",
            "--env", "POSTGRES_HOST_AUTH_METHOD=trust", IMAGE)
        started = True
        deadline = time.monotonic() + 45
        while True:
            # The image's temporary init server accepts Unix sockets, not TCP.
            ready = subprocess.run(
                ["docker", "exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"],
                capture_output=True, text=True,
            )
            if ready.returncode == 0:
                break
            if time.monotonic() >= deadline:
                raise RuntimeError("Disposable PostgreSQL did not become ready")
            time.sleep(0.25)

        def sql(text):
            return run("docker", "exec", "--interactive", name, "psql",
                       "-X", "-h", "127.0.0.1", "-U", "postgres", "-d", "postgres",
                       "-v", "ON_ERROR_STOP=1", "--tuples-only", "--no-align", source=text)

        up = (FEATURE / "migrations/01_create_link_lifecycles.up.sql").read_text()
        down = (FEATURE / "migrations/01_create_link_lifecycles.down.sql").read_text()
        sql("SELECT version();")
        sql(up)
        sql(up)
        print("PASS: up and empty-schema replay")
        sql((FEATURE / "_audit/schema-check.sql").read_text())
        if sql("SELECT count(*) FROM link_lifecycles;") != "0":
            raise AssertionError("Fixture transaction leaked rows")
        print("PASS: fixture rollback leaves no data")
        sql("INSERT INTO link_lifecycles VALUES "
            "('00000000-0000-4000-8000-000000000001', decode(repeat('aa',32),'hex'), "
            "'2026-01-01 00:00:00+00', '2026-01-01 01:00:00+00');")
        sql(up)
        if sql("SELECT count(*) FROM link_lifecycles;") != "1":
            raise AssertionError("DDL replay changed existing metadata")
        print("PASS: up replay preserves committed expired metadata")
        sql(down)
        if sql("SELECT to_regclass('public.link_lifecycles') IS NULL;") != "t":
            raise AssertionError("Down did not remove the table")
        if sql("SELECT count(*) FROM pg_indexes WHERE schemaname='public' "
               "AND tablename='link_lifecycles';") != "0":
            raise AssertionError("Down left indexes behind")
        sql(down)
        print("PASS: down removes table/indexes and can be replayed")
        sql(up)
        if sql("SELECT count(*) FROM link_lifecycles;") != "0":
            raise AssertionError("Schema recreation restored data unexpectedly")
        print("PASS: up/down/up round trip; no payload recovery or seed data")
    finally:
        if started:
            run("docker", "rm", "--force", name)
            remaining = run("docker", "ps", "--all", "--quiet", "--filter", "name=" + name)
            if remaining:
                raise RuntimeError("Verification container cleanup failed")
            print("PASS: disposable container removed; no host DB or existing volume touched")


if __name__ == "__main__":
    main()
