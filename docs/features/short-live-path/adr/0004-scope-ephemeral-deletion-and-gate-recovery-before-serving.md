---
status: Accepted
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-23"
feature_size: M
ticket: null
---

# 0004 — Scope ephemeral deletion to running cleanup and gate recovery before serving

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly chose the proposed scoped guarantee. Coding agent documents acceptance; deployment and security verification are still required.

## Context

ADR-0003 selects server-readable Secrets in ephemeral Redis without disk persistence or Secret backups. The original spec required deletion within sixty seconds even through failures. A suspended/hung process or VM cannot execute cleanup, and Redis TTL is not proof of physical erasure on that timeline. Product Owner approved the narrower, explicit promise rather than retaining an unproven unconditional requirement.

## Decision drivers

- Preserve zero new service releases at or after expiration and normal-application expiration behavior.
- State a retention promise that the intended runtime can implement and test honestly.
- Permit loss of unexpired Secrets on crash/restart, without recovery or persistence.

## Considered options

1. **Bound deletion during normal healthy operation and catch all expired backlog before serving after recovery** — selected, with approval amended 2026-10-23; outages, dependency downtime and suspension/hang may delay physical cleanup even when Redis alone is reachable.
2. **Keep unconditional sixty-second erasure through suspension/hang as a blocking requirement** — explicitly offered and not selected; would require a different demonstrated mechanism rather than ordinary Redis TTL. This describes the earlier requirement, not a claim that a compliant infrastructure option was demonstrated.

## Decision outcome

**Chosen:** Option 1 (approval amended 2026-10-23 in ADR-0004). Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds during normal healthy operation; outages, dependency downtime and suspension may delay physical cleanup. Subsequent cleanup catches all expired backlog by original deadline, not only a recent interval, before Secret traffic resumes. Never release expired data. No physical RAM-erasure deadline is promised during those unavailable periods. Independent expiration checks still refuse all expired releases, even if cleanup lags. No disk persistence, Secret backups or recovery is introduced.

This is active-record deletion, not guaranteed forensic zeroization of allocator memory or RAM. Host swap, dumps, snapshots and other retained-copy paths remain launch checks. Implementation must provide bounded cleanup rather than treating passive TTL as a completion signal, and must test recovery ordering. Exact readiness/liveness supervision, clock handling, bounded sweep and deployment configuration remain subsequent design details, not assumed verified properties.

Gate: frontend/backend retention contract and deployment/recovery behavior change together, with a deliberate revision of the previously accepted guarantee.

## Approval amendment — 2026-10-23

**Status: Accepted. Decider: Product Owner, explicit chat approval.** The Product Owner accepts missed physical cleanup during outages and requires each later cleanup to catch **all expired backlog**, not only the last interval. This amendment replaces the original Redis-alone availability condition above: the <=60-second target is for normal healthy operation. Service/runtime outages, dependency downtime (including PostgreSQL down at startup), and suspension/hang may delay physical erasure beyond sixty seconds even if Redis is reachable.

Every sweep considers original expiration deadlines up to the current safe cleanup cutoff, with no lower bound tied to the last successful run, tick, or a recent window. Bounded batches/retries remain appropriate; unresolved due debt carries forward and **all expired backlog must be cleared before Secret traffic resumes**. Independent final release checks must never disclose expired data. This is accepted delayed erasure, not extended Secret validity, payload recovery, or permission to serve through an unsafe gate.

The startup-PostgreSQL-down T8/T8b finding is disposed as **accepted delayed erasure under this policy**, not a requirement to redesign or decouple the scheduler. Existing evidence of cleanup continuing after an established PostgreSQL session fails remains useful but does not prove startup-outage cleanup. Catch-up and cleanup-before-serving still require runtime evidence; this documentation amendment does not supply it.

The month-long backlog example is illustrative of arbitrarily old expired payloads only: it introduces neither a one-month cleanup lookback/retention period nor a lifetime change. Selected lifetime remains 1–1440 whole minutes (default 60), with the original PostgreSQL anchor unchanged. Minimal lifecycle metadata remains retained indefinitely under ADR-0005; payload cleanup must not delete it. No disk persistence, Secret backups, reconstruction or forensic RAM-zeroization guarantee is introduced.

The stricter alternative—require <=60-second deletion whenever Redis alone remains reachable, including startup dependency failure—was considered and explicitly not retained. Choosing accepted delay avoids imposing scheduler redesign solely for that failure case, at the cost of expired in-memory records persisting through outages and additional recovery unavailability. Other safety/launch obligations remain unchanged.

## Consequences

**Positive**
- A testable distinction between access expiration, active-record cleanup and physical memory remnants.
- No persistence or recovery pipeline that could resurrect expired Secrets.

**Negative**
- Outages, dependency downtime and suspended/hung infrastructure may retain expired content in memory beyond sixty seconds, even when Redis alone is reachable.
- Availability must remain closed during recovery cleanup; earlier loss of valid Secrets is allowed.
- Runtime and host controls still need validation; this ADR is not operational evidence.

**Neutral**
- The browser still hides content locally at expiration and suppresses late responses.
- Recipient-controlled copies and external credentials remain outside revocation guarantees.
- This amends the retention driver and failure discussion in ADR-0003, without changing its server-readable or optional-code decisions.

## Links

- Spec: [spec.md](../spec.md), AC-10/AC-11, NFR-03 and §6.1.
- SAD: [sad.md](../sad.md), §§1–4; concrete deployment and verification follow in §§7–10.
- Related ADR: [0003](0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md).
