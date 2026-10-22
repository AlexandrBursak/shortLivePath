---
status: Accepted
owner: "Tech Lead"
reviewers: ["Product Owner"]
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0008 — Anchor lifetime and service time in PostgreSQL

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly selected the PostgreSQL write anchor, approved the proposed time/recovery behavior and deferred exact concurrent quota reservations. This records product/architecture approval, not independent security or runtime verification.

## Context

AC-04 previously described a full selected lifetime after successful creation, while metadata precedes the Redis write. Product Owner clarified that roughly a second of creation overhead is not important and chose the PostgreSQL write as the anchor, eliminating a cross-store timestamp-publication protocol. The subsequently approved recovery proposal preserves expiration and confidentiality rather than recovering lost payloads.

## Decision drivers

- Spec AC-04: service-established expiration and countdown, unaffected by the Recipient clock.
- Spec AC-10/AC-11 and NFR-03: final expiry checks, active cleanup and cleanup-before-serving remain mandatory.
- SAD single-API/single-host deployment: use existing stores, not a distributed clock or transaction coordinator.
- Product Owner's explicit preference for a simple v1 serving approximately five people per day; this is expected usage, not a changed NFR-01 performance target.

## Considered options

1. **Anchor at the PostgreSQL lifecycle INSERT** — one immutable pair of timestamps; database commit, Redis write and response transit consume part of the selected lifetime.
2. **Publish final timestamps after both stores are ready** — preserves a full interval after finalization but needs cross-store publication, failure reconciliation and more mutable state.

## Decision outcome

**Chosen:** Option 1. PostgreSQL supplies created_at at the lifecycle INSERT and expires_at = created_at + selected integer minutes. Sample the database clock once within that INSERT (millisecond-aligned); do not use a transaction-start timestamp from before hashing or an application timestamp from form entry. No database column DEFAULT is required: the INSERT explicitly supplies database-derived values, preserving the staged schema. Keep timestamps immutable after insertion, including partial/unconfirmed creations.

Prepare the optional verifier before inserting metadata. Write the Redis payload only after a confirmed PostgreSQL commit and with the same original hard expiration. Confirm a Share link only after the payload write and final readiness/deadline check; never move expiry to compensate for delay. A definitive/uncertain metadata failure yields no payload write or confirmed link. An uncertain Redis outcome yields no success claim or automatic retry; any orphan keeps its original deadline and cleanup obligation. There is no one-second grace period for disclosure: accepted timing imprecision concerns creation overhead only.

PostgreSQL is the authoritative UTC time source for eligibility and response service_time. Obtain fresh service time for sensitive decisions, particularly after asynchronous code work and immediately before the bounded response release; stale cached time must not authorize a release. Use conservative elapsed-time handling between samples. Detect backward/unsafe clock observations, close readiness and re-establish safe time rather than extend access. Browser countdowns remain conservative monotonic presentation, with transit allowance, offline hiding and concealed background return until neutral revalidation plus explicit Show. Clock detector, transit/sleep implementation and boundary vectors belong to T8/T12 and must be tested before serving Secrets; no numeric tolerance or proven algorithm is invented by this ADR.

On startup/reconnect/discontinuity, close Secret traffic, establish current single-process ownership, check dependencies/time and remove expired payloads before reopening. In-process stale callbacks must not reopen a newer recovery run or release content. Do not overlap API owners. Continue Redis cleanup when possible even if PostgreSQL is unavailable; unsafe time keeps traffic closed. Redis loss never triggers payload reconstruction: durable metadata permits expired/early-unavailable messages only. The scoped <=60-second active deletion bound and no physical RAM-zeroization promise remain unchanged. Address/key continuity retains the inherited quiet-window policy under ADR-0009.

Gate: the anchor/time source changes database insertion, API timing, browser deadlines and recovery tests; multiple modules and a legitimate publication alternative justify an ADR.

## Consequences

**Positive**
- No final timestamp rewrite or cross-store timestamp publication state machine.
- One authoritative timestamp pair supports payload expiry, confirmation and subsequent checks.
- Failure paths remain conservative and cannot lengthen an orphan's sharing window.

**Negative**
- Received usable lifetime is shorter than the selected interval by commit/write/response delay; a sufficiently delayed attempt is refused instead of confirmed.
- Fresh PostgreSQL time checks add a required dependency and round trips; outage or unsafe time temporarily stops Secret traffic.
- Clock/suspend and bounded-cleanup behavior still require real implementation and fault tests; approval is not evidence of those results.

**Neutral**
- The one-hour default, minute range, metadata retention and server-readable model are unchanged.
- SQL columns/constraints need no migration change; insertion semantics and DTO documentation change.
- Exact quota reservations are a separate deferred decision in ADR-0009, not an expiration exemption.

## Links

- Spec: [spec.md](../spec.md), AC-04/AC-10/AC-11 and NFR-03.
- SAD: [sad.md](../sad.md), §§4/6/7/8/11.
- Model: [data-model.md](../data-model.md), link_lifecycles and DM-OQ-02/03.
- Tasks: [T2](../tasks/resolve-time-admission-protocol.md), [T8](../tasks/cleanup-recovery.md), [T12](../tasks/browser-data-time.md).
- Related ADRs: [0004](0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md), [0005](0005-persist-minimal-link-lifecycle-metadata-indefinitely.md), [0009](0009-keep-basic-limits-and-defer-exact-concurrent-quotas.md).
