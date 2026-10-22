---
status: Accepted
owner: "Tech Lead"
reviewers: ["Product Owner"]
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0009 — Keep basic limits and defer exact concurrent quotas

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly selected the PostgreSQL write anchor, approved the proposed time/recovery behavior and deferred exact concurrent quota reservations. This records product/architecture approval, not independent security or runtime verification.

## Context

The earlier design required pre-verification quota reservations, leases and generation-fenced reconciliation before scaffolding. Product Owner expects approximately five people per day and explicitly deferred this machinery, then confirmed retaining basic abuse/resource controls without promising exact quota enforcement under simultaneous requests. This changes guarantees, not merely the date of an unchanged mandatory gate.

## Decision drivers

- Product Owner's explicit scope reduction: defer exact concurrent quotas, not all Reading code protection.
- Spec AC-06/AC-07 and NFR-04: preserve exact codes, no consumption, bounded work and privacy-safe transient counters.
- SAD capacity/retention policy: keep 1000 active payloads, Redis 256 MiB/noeviction, 10000 limiter-record units and five-minute counter retention.
- Simplicity of one API owner; v1 does not need distributed quota ownership or a durable reservation ledger.

## Considered options

1. **Basic rolling counters now, exact concurrent reservations deferred** — smaller initial implementation; admitted simultaneous requests may exceed the nominal per-address/pair thresholds.
2. **Complete exact reservations before scaffolding** — stronger race guarantees but delays the low-volume product with leases/fencing/reconciliation work.

## Decision outcome

**Chosen:** Option 1. Retain the 25-successes/rolling-sixty-second address threshold and five-failed-verifications/rolling-sixty-second link/address threshold as basic observed-counter admission checks. Refuse when the observed threshold is reached, update counters without lost updates, do not clear failures on success, and never extend existing failure timestamps on rejected requests. Requests already admitted concurrently may overshoot; neither five nor twenty-five is an exact concurrent ceiling in v1. No request count can extend expiration or authorize a wrong code. Missing/uncertain dependencies still fail closed, not as a fabricated incorrect-code result.

Do not implement quota reservations, lease expiry, pending-slot registries or cross-process quota fencing in the initial release. These are recorded in backlog T22, outside tasks.json and with no dependency blocking scaffolding or launch. Revisit before adding API replicas or when actual abuse/concurrency makes the trade-off unacceptable; restoring a strict concurrent promise requires a reviewed specification/contract amendment and implementation evidence, not silent reactivation of old text.

This ADR supersedes ADR-0006/0007 as current documents while explicitly retaining their non-quota protections:

- Argon2id v19 through asynchronous node-argon2; memoryCost 65536 KiB, timeCost 3, parallelism 4, independent 16-byte salt, 32-byte output and reviewed PHC parsing. At most two native calls across creation/disclosure, zero waiting queue. Timeout/disconnect retains its work permit until actual completion; this process-local work cap is NOT deferred quota reservation machinery.
- Code maximum 1024 UTF-8 bytes; creation minimum six Unicode code points; shorter/empty supplied disclosure guesses allowed. Body maximum 524288 wire bytes, uncompressed JSON only, safe 413/415/422 refusals before hashing and no incorrect-code increment on invalid input. Exact comparison, no truncation and no sensitive persistence/telemetry.
- One explicitly pinned immediate reverse proxy supplies exactly one sanitized literal address. Retain ADR-0007's canonical binary IPv4/full-IPv6 representation, IPv4-mapped IPv6 folding and no hostname/port/zone/shorthand fallback.
- Retain the precise ADR-0007 domain-separated versioned HMAC-SHA-256 label construction and independent stable 32-byte deployment key through restricted mounted configuration. No raw addresses, forwarding headers or pseudonyms in logs; no durable address/counter records. Actual proxy/key provisioning is verified before launch.
- Same-key restart preserves surviving counters. On continuity loss/key rotation, close traffic, ensure old single-process owners can no longer mutate state, then observe at least sixty continuous seconds without admitted creation/verification plus cleanup before reopening. A timer alone is insufficient. This conservative recovery rule remains; exact per-request reservation/fencing is deferred, not process ownership or stale-readiness protection.
- Active-payload/counter cardinality and memory caps remain safety controls, not best-effort per-address quotas. Check/enforce storage capacity at payload publication without a long-lived creation reservation; uncertainty never permits unmetered publication or evicts existing payloads. T7 proves safe writes/partial-failure cleanup. Do not use the reduced expected traffic as proof of safety.

No code failure, counter operation or read consumes a link. Manual retry is a new token/attempt with original prior deadlines unchanged. Unknown writes never produce a speculative link. T21 still calibrates the retained hash profile after T3; T17/T18/T20 remain real deployment/security/performance checks. There is no distributed deployment, payload backup or silent removal of expiration guarantees.

Gate: changes user-visible rate guarantees, Redis state, API 429 meaning, tests and the task DAG; multiple modules and a real stricter alternative justify an ADR.

## Consequences

**Positive**
- Scaffolding no longer depends on designing and verifying a quota reservation protocol.
- Basic code-guessing checks, hard work/input/memory bounds and expiry remain in the first release.
- Deferred work is explicitly outside the executable v1 DAG, avoiding an indirect launch gate.

**Negative**
- Concurrent attempts may exceed nominal per-address/pair thresholds; v1 does not provide the earlier strict rolling-window ceiling.
- Attackers are not limited by expected legitimate traffic; distributed guessing remains a risk. Basic controls still need implementation and tests.
- A later strict quota/replica design requires source-contract changes and dedicated fault/race evidence.

**Neutral**
- ADR-0006/0007 remain historical evidence; only their explicitly inherited non-quota rules are current via this ADR.
- PostgreSQL lifetime/time behavior follows ADR-0008 independently of counter accuracy.
- No runtime test, security review, benchmark or production readiness is claimed by this scope approval.

## Links

- Spec: [spec.md](../spec.md), AC-06/AC-07 and NFR-04/NFR-05.
- SAD: [sad.md](../sad.md), §§4/6/8/9/11.
- Model: [data-model.md](../data-model.md), temporary admission state and DM-OQ-04.
- Task: [T2](../tasks/resolve-time-admission-protocol.md); deferred [T22](../backlog/exact-concurrent-quotas.md).
- Superseded ADRs: [0006](0006-bound-argon2id-reading-code-work-and-input.md), [0007](0007-canonicalize-trusted-addresses-and-fence-quota-resets.md).
- Related ADR: [0008](0008-anchor-lifetime-and-service-time-in-postgresql.md).
