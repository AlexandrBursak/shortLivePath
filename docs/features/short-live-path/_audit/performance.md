# T20 implementation checkpoint — INCOMPLETE / acceptance BLOCKED

This is not a performance report or NFR attainment claim. T19's actual disposition
is [BLOCKED](browser-verification.md). No permission assumption, Safari/clipboard
change, load/browser/fault/native benchmark, production call or monthly observation
was made by this phase. No tracker, commit or push. HEAD at entry:
`b7f2e8bb089e5757f2b6932a35e0047cde79fe31`.

## Delivered implementation subset

- Fixed-enum/numeric, bounded process-local aggregate metrics; successful create and
  disclosure handler histograms, with capacity/quota/rejected/unavailable outcomes
  separate. No request URLs/bodies/tokens/IPs/pseudonyms/errors as telemetry labels.
- Private `/health/metrics`, under the unchanged public nginx health exclusion and
  private unexposed API. Readiness, two-call hash activity, successful sweep age,
  cleanup exhaustion/recovery and stale-sample observations. No hash/profile/cap,
  ownership, readiness gating or 500ms cleanup scheduling redesign.
- Ten-second, nonoverlapping bounded numeric sampling: 128 due handles maximum,
  registry debt versus observed actual payload presence, continuous-healthy breach
  classification, Redis memory/noeviction and one-relation metadata estimate/bytes.
  Sampling fails stale/closed, not healthy. Presence is a lower bound, NOT physical
  deletion latency, total expired presence, outage-debt measurement or RAM erasure.
- Metrics-only OTel collector/Prometheus/Grafana configuration artifacts, strict
  label keeps, initial alerts including 45s cleanup early warning and metadata
  growth. No request/query/Redis command auto-instrumentation, log or trace pipeline.
  Configurations are NOT installed or validated by a real collector/alert engine.
- Loopback HTTPS minute create/read probe with verified CA/no redirects/retries;
  values/link/code exist only in memory. Sanitized minute booleans only. Full UTC
  calendar-month aggregation, leap boundaries, failures, duplicate penalties,
  explicit missing samples and incomplete-month refusal. Not an external scheduler
  deployment or monthly 99.5% evidence.
- Closed 100-index trusted-proxy template generator: ordinary listener socket-XFF
  unchanged; additional unexposed TLS listener has fixed-runner ACL and rejects
  missing/unknown identity selection. Application trust unchanged. Fixture lifecycle
  and actual distinct-identity/public-spoofing verification remain absent.

Exact implementation and reusable command handles:
[scripts/load/README.md](../../../../scripts/load/README.md) and
[docker/monitoring/README.md](../../../../docker/monitoring/README.md).
No complete load runner was added; bounded scope was explicitly split before coding.

## Deterministic RED → GREEN and actual checks

- Initial Node test: `ERR_MODULE_NOT_FOUND` for the unimplemented aggregate service;
  1 failed test file. Initial Python: 2 missing-module errors. Configuration test
  separately failed before `otel.json` existed. These are implementation-absent RED,
  not reproduced application defects, runtime faults or measurement evidence.
- Final offline image build executes **`pnpm build && pnpm test && pnpm lint &&
  pnpm typecheck`: PASS, 22 tests / 22 pass / 0 fail**. The four new backend metric
  tests include runtime label rejection, bounded histogram state, sampled debt vs
  presence/healthy-history/stale failure and bounded-query static checks. Injected
  sampling interfaces are deterministic unit tests, NOT mocked datastore acceptance.
- **Python: 4 tests PASS**, covering calendar-month/duplicates/missing/boundaries,
  memory-only probe response handling and failures, closed identity template and
  private metrics-only configuration/alert-expression contracts.
- `git diff --check`: PASS. No real collector/promtool alert smoke, nginx fixture
  startup, real Redis/PostgreSQL sampling or HTTP endpoint acceptance was executed.
- Gates use current backend source copied over the retained local build-toolchain
  image with network disabled. This is NOT a fresh dependency install or production
  runtime validation. Existing native Argon2 unit cases ran, not T21 benchmarking.
- A relative-path Python discovery command once failed from backend cwd; corrected
  root-workdir discovery passed. This was command setup, not an application failure.

Evidence: `/tmp/slp-t20-gates.log`, `/tmp/slp-t20-python.log`,
`/tmp/slp-t20-unit-static.log`, `/tmp/slp-t20-implementation-manifest.json`,
`/tmp/slp-t20-checkpoint.md`. Gate image: `slp-t20-gates`. Only offline build/unit
containers were used and auto-removed; no new application/stores/networks/volumes
were started. Existing T19 files/tracker changes and unrelated containers preserved.

## Remaining stages — T20 MUST remain INCOMPLETE

1. **Prerequisite:** parent resolves/closes T19 and explicitly releases live work.
   Safari, host clipboard, lifecycle/BFCache and state matrix are not waived.
2. **Fixture/harness implementation:** new isolated Compose overlay/material/env,
   fixed runner/proxy IP and closed 100 identity validation, current runtime build,
   seed/quiesce/reset, scheduler/eligible denominators, sanitized aggregate evidence,
   browser completion probes and project-only cleanup. No public bypass.
3. **Runtime instrumentation acceptance:** actual private endpoint/public hiding,
   bounded Redis/PG samples, stale/outage/recovery classification, leak/canary audit,
   pinned metrics-only collector/Prometheus/Grafana wiring, real alert smoke and
   validate the 45s early warning under load. Observe outage debt/deletion latency
   independently; do not infer either from registry-member removal or TTL alone.
4. **Real measurements after release:** unchanged separate protected/unprotected
   phases, EACH 30s warm-up/reset + 120s measurement, 5 create + 5 disclose/s,
   65,536 text bytes, 60min, 100 identities; intended eligible/refusal/failure/pending
   denominators separate. Include actual browser completion. Measure configured
   1000/10000 caps and real 256MiB/noeviction pressure, quota boundaries, NFR-03
   expiry/healthy-deletion versus outage/recovery and confidentiality scenarios.
   Retain API 2 CPU / 768MiB and hard two hashes/no queue. Failure remains a blocker.
5. **Operational availability/launch:** separately authorized external scheduler,
   whole calendar month, missing-sample reconciliation, actual-host retention/key/
   TLS/security review and real-phone gates. No local unit/smoke can replace these.
