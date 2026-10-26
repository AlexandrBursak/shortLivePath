# T7 — bounded Redis stores and trusted address identity

GOOD RED: trusted-address service missing; payload store missing; missing-index corruption initially failed with `Missing expected rejection`; basic admission missing. Each slice then passed against real Redis. Payload Lua writes expiry registry before a single complete HSET and absolute PEXPIREAT, refuses collision/1000-entry cap, and never removes conservative orphan capacity on uncertain outcomes. Runtime Lua errors do NOT roll back; pcall return types were diagnosed against real Redis (successful HSET returns a number), then corrected. Stored reads validate field whitelist/version/id/scalar/byte/verifier/timestamps, exact expiry and index membership. No reads extend expiry.

Basic counters store bounded newest25 successes/newest5 failures, atomically prune rolling60s history and write full state+PXAT. Check is not a reservation; admitted concurrent completions can overshoot. Newest threshold events retained under ten simultaneous completions, other address independent, successful verification does not clear failures, refusals do not append/move event timestamps. State expires <=300s after activity, pair <=original link expiry. 10000-entry hard registry cap includes uncertain orphans; missing active state is unavailable, not allowance. Global index keys have no arbitrary TTL. T8 owns current-generation readiness, continuity recovery and bounded index/orphan cleanup; no serving endpoints yet.

TrustedAddressService pins immediate proxy peers, accepts one literal only, rejects zones/ports/multiple headers/shorthand/ambiguous IPv4, canonicalizes full16-byte IPv6 and mapped IPv4, uses exact ADR domain-separated binary HMAC/32-byte key/v1 label. Known-answer, stable-instance, namespace/family and invalid-context vectors pass. No actual deployment peer/key supplied or certified (T17).

Real Redis fault suite: set this suite-owned server's maxmemory to1, publication rejects while existing payload survives; restore maxmemory in finally. Inject actual Lua errors after registry and after HSET: original expiry-index handles remain and no-expiry partial hash is refused by reads. Inject lost reply after actual successful EVAL: caller receives unavailable, actual payload retains original absolute expiry, retry collision cannot extend it. No speculative link or assumed rollback; T8 must delete due index-backed partial records before serving.

Executed from backend:
- Docker slice builds and `node --test tests/integration/admission.test.mjs tests/integration/payload.test.mjs`, both pass.
- `node --test tests/integration/payload_faults.test.mjs` via Docker and mounted tests, 1/1 pass.
- `sh docker/check.sh > /tmp/slp-t7-full-gates.log 2>&1` exit0: unit7/7; real-store integration6/6; lint/typecheck/build clean; actual runtime healthy; runtime filesystem/advisory2/2, native1/1, store/HTTP smoke2/2; missing dependency negative controls fail as required.

Tests use unique synthetic namespaces and dedicated tmpfs Redis/PostgreSQL. No production, ambient .env, FLUSH or global prune. Build-only advisory remains tracked; T21/NFR resource decision unchanged. No commits. T8/T9–T20 and actual mobile/production/security/performance launch gates remain pending.

## Independent findings reconciled in continuation

The exact findings were supplied in `/tmp/slp-continuation.md` and `/tmp/slp-regression-result.md`; the earlier missing-evidence hold is obsolete. Durable `payload_bounds.test.mjs` first reproduced F1 (`Missing expected rejection`) and F2 (`Lua must reject before copying recovered oversized data`) against valid freshly published/current-checksum records. Seven recovered corruption vectors were RED. The Lua read now uses HLEN/HEXISTS/HSTRLEN before fixed-name HMGET, bounding aggregate Secret bytes to65536 and all metadata/verifier/digest values; it never copies unknown field names. Unknown insertion, including `__proto__`, fails exact cardinality/existence validation. Hard TTL and orphan registry were not changed.

- `/tmp/slp-bounds-red.log`:7/7 GOOD RED before production change.
- `/tmp/slp-bounds-green.log`:9/9 targeted regressions/integrity tests pass.
- `/tmp/slp-independent-green.log`:parent's unchanged independent F1/F2a/F2b/F3/F4 executable suite passes5/5 on the rebuilt image against a separate private, no-persistence Redis8.2.6. The private container was removed and read-back verified absent. First Redis probe raced startup; reran with a healthcheck, not a fabricated pass.
- `/tmp/slp-t7-cont-full-gates.log`:`sh docker/check.sh` actually exited0: unit9/9, integration17/17, lint/typecheck/build pass, runtime advisory/filesystem2/2, native1/1, smoke2/2; expected unavailable-PostgreSQL negative controls fail. Wrapper success and teardown observed.
- F3 existing strict history fix verified, additionally strengthened the durable regression to establish five failures and denial before object corruption. F4 existing rollback fix verified by unchanged parent suite and unit tests.

T7 store findings are closed by executed tests. T8 ownership/readiness/scheduler remains separate and must not be inferred from this acceptance.

## Historical reopened review record

Parent independently reported two, then a third concrete Redis issue, but each delivered message was truncated after a long image identifier before the reproduction/assertion. Exact review findings remain unavailable; requested short assertion-first messages or an evidence-file path. Do not equate the following independent fixes with closure of unseen review findings. T7 is `review`, not done.

Independent extra GOOD RED tests in `backend/tests/integration/store_integrity.test.mjs` found:
1. Removing `code_verifier` from a protected hash silently reclassified it as unprotected (Missing expected rejection). Added required Redis-only `integrity_digest` over the canonical ordered full payload/verifier tuple, preserving absent-versus-present semantics. This detects accidental missing/changed fields, NOT hostile operator rewrites. No durable schema/public API change. Model synchronized.
2. A malformed non-array history object silently discarded failures (Missing expected rejection). Lua now bounds raw state to2048 bytes, validates exact state fields, integer lifetime/retention and dense numeric event indexes before transitions.
3. Reordered already-admitted completion timestamps lost accounting by rejecting the older completion. Lua now retains submitted event timestamps, uses max observed activity for pruning/retention, and never shortens existing retention. Two reversed-order failures are retained; exact concurrent quota reservations remain deferred.

After corrections, targeted actual-Redis suites passed5/5 (admission, payload, OOM/partial/lost-reply and two integrity/reorder tests). Build log `/tmp/slp-t7-reordered-build.log`. Full final gates recorded separately in T8 partial evidence. Acceptance remains pending the exact independent review reproductions and reconciliation; no sensitive route installed.
