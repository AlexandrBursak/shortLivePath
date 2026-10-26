# T18 — Canary confidentiality and fault-recovery verification

## Verdict and scope

**T18 local verification complete, with explicit launch blockers below.** This is
local synthetic evidence, **not independent security approval or production
compliance**. No application, API contract, migration, schema, frontend source,
quota policy, scheduler or production control was changed. No tracker, commit,
push or branch changes; no T19 installed-browser matrix, T20 performance sign-off
or monitoring installation was performed. Existing unrelated changes are preserved.

Sources read: T18 taskbrief `tasks/confidentiality-recovery-audit.md`, actual
`tasks.json`, `spec.md` AC-07/09/10/11/11b and NFR-03/04, `test-plan.md` coverage,
isolation and NFR-04 workload, `sad.md` runtime S2/S4/S7 and retention/deployment
boundaries, current ADR-0003/0004 (2026-10-23 amendment)/0005/0008/0009, with retained
non-quota ADR-0006/0007 protections. Actual service, middleware, logging, proxy,
Compose and existing T8/T9/T11 fault tests were inspected before new tests.

## Changed paths (T18 ownership only)

- `backend/tests/security/t18_faults.test.mjs` — four real-store/HTTP verification
  cases: uncertain PG result, uncertain Redis result, healthy full-cap deletion,
  isolated authoritative-time rollback.
- `backend/tests/faults/suspend.test.mjs` — extend existing real90s SIGSTOP case to
  1000 mixed-age partial payload/verifier records, including31-day-old debt; require
  every hash and index entry gone before readiness. Kernel owner exclusion remains.
- `scripts/verify_retention/run.py` — synthetic HTTPS project setup, two canary
  phases, actual forbidden-sink scans, metadata-only restore, empty Redis restart,
  actual PG-down-startup recovery and narrowly scoped cleanup/readback.
- `scripts/verify_retention/faults.sh` — dedicated pinned PG/Redis tmpfs stores,
  complete backend gates and existing/new fault suites; owned-resource trap.
- `scripts/verify_retention/browser.cjs` — one ephemeral Chromium persistence audit,
  no screenshots/traces/body/URL diagnostics, browser `/tmp` tmpfs.
- `scripts/verify_retention/test_audit.py` — three scanner/polling controls,
  including a deliberate leak positive control which must be detected without
  printing its value.
- `scripts/verify_retention/Dockerfile.tooling` — compile current backend using the
  retained locked toolchain; no fresh install/advisory-audit claim.
- `scripts/verify_retention/README.md` — repeatable invocation and evidence limits.
- This file: `docs/features/short-live-path/_audit/runtime-security.md`.

## Actual execution and counts

Sanitized aggregate source of truth: `/tmp/slp-t18-evidence/summary.json` and
`runtime.json`. Counts are aggregated programmatically, not inferred from prose.

```sh
python3 scripts/verify_retention/run.py setup
python3 scripts/verify_retention/run.py audit
python3 scripts/verify_retention/run.py recovery
python3 -m unittest discover -s scripts/verify_retention -p 'test_*.py' -v
docker build -f scripts/verify_retention/Dockerfile.tooling -t slp-t18-tooling backend
sh scripts/verify_retention/faults.sh
python3 scripts/verify_retention/run.py cleanup
```

The initial equivalent fresh-source build used
`-f /tmp/slp-t18-evidence/Dockerfile`; the final build used the checked-in tooling
Dockerfile above. The fault script actually ran, serially:

```sh
node ace.js migration:run --force
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test:integration
node --test --test-concurrency=1 tests/security/*.test.mjs tests/faults/*.test.mjs
```

Final `/tmp/slp-t18-evidence/backend-gates-final.log`: **18 unit +38 integration
+5 scoped security/suspension =61 tests PASS, zero failed/skipped/cancelled**.
ESLint, TypeScript and actual Adonis production build passed. Existing suites
really exercised Redis OOM/noeviction, script errors after index/hash writes,
lost replies, repeated continuity loss, key rotation, duplicate ownership,
stale-generation mutation and delayed old maintenance, real PG connection loss,
clock restart trajectories, exact deadline after held real native verification,
disconnect and final-release refusal. These were reused, not replaced by mocks.
No frontend source was touched, so a new frontend full gate is not claimed; the
parent's T17 gates remain separate evidence.

**3 harness tests PASS** (`harness-tests-final.log`). **6 scoped Chromium checks
PASS** (`browser.log`): protected explicit Show, neutral reload, empty localStorage,
sessionStorage, IndexedDB, CacheStorage and service-worker registrations, zero
external requests and zero canary-bearing console events. Browser context/profile
was ephemeral, with `/tmp` tmpfs, no screenshot, trace or HAR. This is confidentiality
storage coverage, not T19 desktop/mobile validation. Actual invocation:

```sh
docker run --rm --name slp-t18-browser --label com.docker.compose.project=slp-t18 \
  --network slp-t18_edge --log-driver none --tmpfs /tmp --ulimit core=0 \
  -v "$PWD/scripts/verify_retention:/audit:ro" \
  -v /tmp/slp-t18-synthetic/tls:/ca:ro \
  slp-resume-ui-browser node /audit/browser.cjs
```

## Canary and persistence results

**132 runtime/security/cleanup checks, 74 forbidden-sink scans, 3,126,170,876
aggregate scanned bytes, zero canary hits.** Main audit tracked262 distinct field,
code, token/full-link and exact verifier needles; the separate recovery run
tracked6 needles. Values are never printed or retained in reports. These counts
are separate cohorts, not an assertion that their union has268 distinct values.

Two120-second phases each scheduled1200 HTTPS operations at10/s through the real
proxy with protected/unprotected fixtures. Actual outcomes:

| Phase | creation201 | creation429 | disclosure200 | Scheduled total |
|---|---:|---:|---:|---:|
| Unprotected |48|552|600|1200|
| Protected |49|551|600|1200|

The real proxy supplied its actual single client identity; legitimate observed
creation limits were **not bypassed**. These2400 scheduled operations are the
approved confidentiality traffic, **not eligible10ops/s performance attainment**.
Phase wall durations including final verifier capture were123.01s and127.03s.
Missing/wrong-code and invalid-body refusal preflights also passed. Every public
request used the generated CA with Python/Node TLS verification; the isolated
browser alone trusted the test certificate per-context. No global trust changes.

Inspected sinks: all six Docker collectors actually disabled; container health
history and writable-layer diffs; filesystem exports of running proxy/web/API/PG/
Redis; actual proxy/API/web tmpfs/temp/cache paths; persistent PG data including WAL;
API owner-lock volume; Redis `/data`, slowlog, persistence and diagnostic settings;
metadata backup and independently restored metadata streams. Expected live Redis
payloads/verifiers were read only to register exact canaries, not misclassified as
forbidden storage. Source review found disabled request/exception logging and no
installed telemetry exporter; browser observed no external telemetry. This does
not certify an absent external/infrastructure collector.

Exports and backup streams remained in process memory, never host artifact files.
Only approved minimal metadata persisted: actual columns `id:uuid`,
`token_digest:bytea`, `created_at`/`expires_at:timestamptz`. Persistent scans were
zero; Redis actually reported no RDB/AOF, empty `/data`, noeviction256MiB, disabled
slowlog/latency capture. No claim of forensic allocator/RAM zeroization is made.

## Restore, healthy deletion and failure boundaries

- **Metadata-only backup/restore:**201 rows (including earlier disposable audit
  attempts) restored to an independent synthetic DB. Stream scans were zero;
  count and an independent exact ID/digest/creation/expiration row comparison
  passed (`restore-readback.log`). Actual API target was restored from that
  metadata, never from Redis. Empty Redis stop/start returned DBSIZE0. The actual
  API waited60460ms through ordinary quiet recovery; known expired status/410
  and known future early_unavailable/409 survived. **Zero payloads reconstructed.**
- **Healthy bound:**1000 partial payloads, each65536 credential bytes plus a verifier,
  deliberately **without native TTL**, were removed by the actual scheduled API
  cleanup **521ms after their deadline**, including every hash/verifier and index.
  This independently proves active cleanup at configured cap, not merely TTL.
- **Actual suspension:** only the owned API child received SIGSTOP for90000ms;
  a replacement process exited75 under the existing shared kernel fence. All1000
  mixed-age payload/verifier hashes really remained during suspension. On SIGCONT,
  all debt was cleared before observed ready200, **557ms recovery**. Neither laptop
  suspension nor system clock changes occurred.
- **Actual startup PG outage:**PG was stopped before API restart and held down90s.
  API readiness/create/disclose remained503. All1000 index deadlines were overdue,
  with999 no-TTL partial payload/verifier hashes positively retained (the one
  normal creation had native TTL). Recovery cleared **all** month-old/recent,
  multi-batch original-deadline debt before ready, **595ms recovery**. Correct code
  then received expired410; an expired request during outage received503, never
  content. The91.31s recorded hold/recovery wall span is **accepted outage delay**,
  not healthy-bound attainment (`recovery.log`).
- **Uncertain writes:** real PG transaction commit and real Redis publish were
  completed, then their result acknowledgement was withheld at the injected
  service-result boundary. Both returned503/no link, exactly one durable row,
  no retry or metadata rollback deletion. PG uncertainty published no payload;
  Redis uncertainty left an orphan with its exact original hard deadline.
  These are explicit adapter/result seams, **not claims of packet-level faults**.
- **Rollback:**a child-only preload perturbed the result of a real PostgreSQL time
  query by-5000ms. Actual HTTP disclosure failed503 through unsafe time, and only
  reopened after safe recovery. Existing monotonic/restart/final-native-release
  suites also passed. No app-facing time-bypass flag or host clock change exists.

Separate cases establish the boundaries above; no combined NFR-01 throughput,
full browser matrix, monthly availability or independent security attainment is
claimed. No observed expired release occurred in the executed expiry/fault cases.

## Honest harness failures and corrections

1. First complete canary traffic/scan pass reached real empty-Redis/API restart,
   but the polling helper incorrectly treated startup connection refusal as a
   fatal command failure. Corrected only the helper to remain unready and retry;
   a regression control covers it. The entire audit was repeated successfully.
   Sanitized first-attempt evidence remains in `runtime-first-attempt.json` and
   `audit-first-attempt.log`.
2. First new PG uncertainty test imported a Lucid service before Adonis boot,
   causing a **BAD RED harness startup error**, not an application defect. A
   separate no-network reproduction returned TypeError reading`booted`
   (`preload-diagnosis.log`). Changed only test injection to wrap the existing
   lifecycle writer after the real creation service is invoked. The complete
   backend gates and security/suspension run were repeated: all61 pass. Original
   run is retained as `backend-gates.log` (18/38 pass, scoped4/5).
3. No production bug was found or fixed, and no feature RED→GREEN implementation
   is claimed. These are verification tests of existing behavior, with a scanner
   positive control to reject a vacuous zero-hit claim.

## Runtime, host evidence and unresolved launch controls

Actual evidence: `runtime-manifest.json`, `runtime-versions.txt`,
`host-retention.txt`, `metadata-columns.txt`. macOS26.5.2, arm64 Mac17,8,
25769803776 bytes RAM/18 logical CPUs; Docker Desktop LinuxKit7.0.12/overlayfs;
Node24.17.0, Next16.4.2, PostgreSQL17.10, Redis7.4.9, nginx1.31.5. API allocation
2CPU/768MiB, configured MemorySwap1610612736 bytes. Only loopback HTTPS3448 was
published; stores were private. Other project containers remained running; this
was laptop-local loopback testing, not a representative mobile network profile.

**Launch remains blocked pending actual-host/infrastructure/security verification:**

- Host encrypted swap was active (~20GiB used), and API MemorySwap permits swap.
  Container tmpfs/no RDB/AOF is **not** evidence that host/VM Secret pages cannot
  reach disk. SAD's disabled-swap requirement is not established on this laptop.
- Host `kern.coredump=1`; per-container core soft/hard0 was verified, but host/VM
  crash/hang/memory-dump paths and diagnostic collection remain unverified.
- FileVault reported **Off**. This is factual host evidence, not a change request
  or a claim about another production machine.
- VM/host suspend-with-memory, snapshots, hypervisor backups and actual backup
  exclusions/retention/storage/key custody are unaudited. This harness verifies
  synthetic metadata-only streams, not an operator's real backup infrastructure.
- Real domain/TLS certificate/renewal, deployment address-key custody/rotation,
  immediate proxy trust, production telemetry/diagnostic collectors, independent
  security review and actual deployment recovery procedures remain unverified.
- T19 real-device/installed-browser and T20 performance/monitoring/availability
  obligations remain outside this task; they were not executed or silently closed.

No host security control, clock, trust store or personal/production credential was
changed/read. No production/real-phone access was attempted.

## Evidence handles, cleanup and ownership return

Durable checkpoint: `/tmp/slp-t18-checkpoint.md`. Nonsensitive evidence directory:
`/tmp/slp-t18-evidence/`, especially `summary.json`, `runtime.json`, `audit.log`,
`recovery.log`, `backend-gates-final.log`, `build-final.log`, `browser.log`,
`harness-tests-final.log`, `restore-readback.log`, `runtime-manifest.json`,
`runtime-versions.txt`, `host-retention.txt`, `cleanup.log`,
`cleanup-readback.json`, `final-owned-resource-readback.json`. No screenshots exist.

Image handles (final images read back; no image removal/pruning):

- `slp-t18-tooling` final:
  `sha256:ae3499e0e1de4011acd399cb0334db54d7179aec3f533fba03860e9e99039be4`
- Earlier build's historical manifest handle (superseded by the final retag;
  **no longer inspectable**, not a retained-image claim):
  `sha256:bb2f33f617cb48a6118796229548117a080731a54d1c5c25f88b2f58c6876c02`
  No image removal/prune command was run; parent should use the final handle.
- `slp-t17-production`:
  `sha256:aaacc3f03f02e5bb33661afbb5229627d81c553c05d1cab3139e8fff2a442f2a`
- `slp-t3-test-85230-runtime`:
  `sha256:665c6bf023b3cd84a231acb41af3b2392b1af9ab81b8ce2b93f8738e830af929`
- Existing browser `slp-resume-ui-browser` was reused, not rebuilt.

**Authorized owned cleanup completed and independently read back:** project
`slp-t18` has zero containers/networks/volumes; its two metadata/owner volumes and
two networks were removed. `/tmp/slp-t18-synthetic` including all generated test
keys, cert and env is absent; TCP3448 is closed. Dedicated `slp-t18-fault` runner,
PG/Redis tmpfs containers and explicit network were trap-cleaned; final exact-label
readback returned zero containers/networks/volumes for **both** projects. Browser
container was `--rm`. Images, nonsensitive reports and other projects remain.

## Parent verification and final disposition

Parent independently repeated the 3 harness controls and backend unit/static/build/integration gates: 18 unit and 38 integration passed, lint/typecheck/build passed. The foreground wrapper exceeded the execution tool's 420-second limit after those suites, so its overall exit is **not** represented as a complete successful fault-script run. Parent inspected the remaining owned resources, reran the complete 5-case security/suspension suite explicitly against the same isolated real stores, and obtained 5 pass, zero fail/skip/cancel. Separate logs: `/tmp/slp-parent-t18-backend-gates.log` and `/tmp/slp-parent-t18-security.log`. Together these executed batches cover all 61 backend cases. The repeated 90-second suspension recovered in 539ms, and healthy full-cap cleanup completed 535ms after deadline; these are new measurements, separate from the agent's earlier 557ms/521ms.

Parent parsed `runtime.json` and independently recounted 132 checks, 74 scans and zero canary hits against `summary.json`; the agent's HTTPS traffic/backup/recovery measurements were reviewed, not claimed as a second full canary run. After the timeout and targeted repeat, parent removed only its remaining fault PG/Redis containers and network. Exact project-label readbacks for both `slp-t18` and `slp-t18-fault` returned no containers/networks/volumes. Generated test materials are absent and loopback3448 is closed. `git diff --check` passed.

T18 is complete for the documented local verification scope; the host/production/security launch blockers above remain open. No T19/T20 work was started. No commit, push or production change. Execution stops at T18.
