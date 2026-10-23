# T18 synthetic confidentiality and recovery verification

From repository root, with Docker Desktop running and retained prerequisite images
`slp-t17-production`, `slp-t3-test-85230-runtime`, `slp-t3-test-85230-api` and
`slp-resume-ui-browser` available:

```sh
python3 -m unittest discover -s scripts/verify_retention -p 'test_*.py' -v
python3 scripts/verify_retention/run.py setup
python3 scripts/verify_retention/run.py audit
python3 scripts/verify_retention/run.py recovery
# Reuse the retained installed toolchain; compile current backend source.
docker build -f scripts/verify_retention/Dockerfile.tooling -t slp-t18-tooling backend
sh scripts/verify_retention/faults.sh
# Run before cleanup (independent ephemeral Chromium, not a browser matrix):
docker run --rm --name slp-t18-browser --label com.docker.compose.project=slp-t18 \
  --network slp-t18_edge --log-driver none --tmpfs /tmp --ulimit core=0 \
  -v "$PWD/scripts/verify_retention:/audit:ro" \
  -v /tmp/slp-t18-synthetic/tls:/ca:ro \
  slp-resume-ui-browser node /audit/browser.cjs
python3 scripts/verify_retention/run.py cleanup
```

`setup` refuses an existing synthetic directory. It generates new materials with
`docker/synthetic.py`, explicitly changes only the new fixture to project `slp-t18`,
loopback TLS3448, namespace `t18synthetic`, unused subnets10.218.18/19.0/24.
Never use the T17 wrapper, ambient `.env`, deployment credentials or global trust.
The fault runner refuses collisions and uses dedicated10.218.20.0/24 tmpfs stores
and a cleanup trap; no other project's stores are used or pruned.

`audit` schedules1200 operations at10/s in each120s protected/unprotected phase.
It uses the real proxy's single client identity, deliberately preserving legitimate
creation refusals; these are **security traffic, not eligible throughput/performance
attainment**. Secret fields/codes, canonical links/tokens and exact live verifiers
are held in memory and scanned against container filesystem exports, actual
writable tmpfs/cache paths, health history, persistent PostgreSQL data/WAL,
metadata-only backup/restore streams, owner volume and disabled slowlog.
Raw exports/dumps never become host files; output contains only aggregate counts.
Docker collectors are inspected as disabled, not claimed to contain retained logs.
No telemetry integration exists in this application; the browser additionally
checks zero external requests and empty application storage/cache/worker stores.
No claim is made about external collectors, host/VM swap, snapshots or backups.

`recovery` holds actual PostgreSQL down at API startup for90s; it seeds1000
mixed-age original-deadline debt records (999 partial payload/verifier hashes
without native TTL, plus one actual protected creation). It proves closed traffic,
positive retained debt, full backlog clearance before ready, and expired denial
with the correct code. Month-old debt is a test vector, not a retention horizon.

Backend new security tests cover actual committed PG/Redis operations with lost
acknowledgement at service-result seams (not a claim of packet-level faults),
full-cap64KiB healthy scheduled deletion without native TTL and isolated PG-time
rollback during actual HTTP. Existing real OOM/script/lost-reply/stale-generation/
maintenance suites are rerun, not replaced. Existing owned-process SIGSTOP90s test
now verifies1000 mixed-age payload/verifier removals before readiness; it never
suspends the host or changes its clock.

A negative-control scanner test deliberately injects a nonsecret marker and must
fail the scan while keeping the marker out of output. Existing behavior being
verified is expected to pass; no production implementation/fix was introduced.
Read `_audit/runtime-security.md` for actual results and remaining launch blockers.
