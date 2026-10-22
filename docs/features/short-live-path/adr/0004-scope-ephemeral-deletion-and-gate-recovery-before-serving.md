---
status: Accepted
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-22"
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

1. **Bound deletion while cleanup can execute and clear expired data before serving after recovery** — selected; do not promise a physical memory-erasure deadline during suspension/hang.
2. **Keep unconditional sixty-second erasure through suspension/hang as a blocking requirement** — explicitly offered and not selected; would require a different demonstrated mechanism rather than ordinary Redis TTL. This describes the earlier requirement, not a claim that a compliant infrastructure option was demonstrated.

## Decision outcome

**Chosen:** Option 1. Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds while Redis is running and able to execute cleanup. During process/VM suspension or hang, no physical RAM-erasure deadline is promised. Before Secret traffic resumes following recovery, clear expired records. Independent expiration checks still refuse all expired releases, even if cleanup lags. No disk persistence, Secret backups or recovery is introduced.

This is active-record deletion, not guaranteed forensic zeroization of allocator memory or RAM. Host swap, dumps, snapshots and other retained-copy paths remain launch checks. Implementation must provide bounded cleanup rather than treating passive TTL as a completion signal, and must test recovery ordering. Exact readiness/liveness supervision, clock handling, bounded sweep and deployment configuration remain subsequent design details, not assumed verified properties.

Gate: frontend/backend retention contract and deployment/recovery behavior change together, with a deliberate revision of the previously accepted guarantee.

## Consequences

**Positive**
- A testable distinction between access expiration, active-record cleanup and physical memory remnants.
- No persistence or recovery pipeline that could resurrect expired Secrets.

**Negative**
- Suspended/hung infrastructure may retain expired content in memory beyond sixty seconds.
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
