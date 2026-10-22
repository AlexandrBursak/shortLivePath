---
status: Accepted
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0005 — Persist minimal link lifecycle metadata indefinitely

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner requested PostgreSQL lifecycle metadata and chose indefinite retention for now. Coding agent records the decision; no independent security review is claimed.

## Context

The initial §5 proposal omitted PostgreSQL because Secret content is ephemeral. Product Owner requested a visible remaining-lifetime countdown and the ability to revisit an expired URL and see an explicit expired state, rather than a missing-page result. A countdown alone needs only service time and expiration, but durable recognition after Redis loss requires separate lifecycle metadata. Secret deletion must not delete the ability to identify expired links.

## Decision drivers

- Amended AC-04: visible remaining-lifetime countdown based on service-established time.
- Amended AC-09: known expired URLs remain recognizably expired without a missing-page/404 experience.
- NFR-03 and NFR-04 retain ephemeral payload deletion, HTTPS and no content/code persistence or backups.
- Existing PostgreSQL/Lucid baseline for durable records.

## Considered options

1. **Retain minimal lifecycle metadata indefinitely** — Product Owner selected this for now, with future retention policy reconsideration possible.
2. **Retain it for ninety days after expiration** — offered; after deletion only generic unavailability could be reported. Not selected.
3. **Choose another retention duration** — offered; no alternative duration supplied.

The earlier Redis-only proposal was amended by Product Owner; it would not satisfy the newly requested durable recognition behavior.

## Decision outcome

**Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time. Do not store Secret content, address/login fields, Reading codes, code verifiers, raw link tokens, full Share links or client addresses in these durable records. Keep payloads and code verifiers exclusively in ephemeral Redis. The digest algorithm and exact schema are resolved by subsequent technical design/data-model work.

Retain lifecycle metadata indefinitely for now. This is an explicit current policy, not an implementation omission or a ninety-day default. Changing it later requires a new retention decision. Metadata-only backup/restore rules must remain distinct from forbidden Secret persistence and must never restore payload availability.

A known expired URL shows an expired state at SCR-05 even after Redis restart or payload deletion. A known unexpired link with missing Redis data shows early unavailability; an unknown link shows safe generic unavailability. No status query discloses Secret fragments or consumes a link. The same URL may be shared with multiple readers; no recipient identity or list is introduced.

Confirmation and reading experiences display remaining lifetime using server-established expiration and timing information, without allowing device wall-clock changes to extend access. Countdown is a presentation aid, not authorization. Readiness/dependency failures must not be misrepresented as evidence that a link is unknown. Creation ordering and cross-store failure behavior are explicit §6 decisions.

Gate: durable schema, frontend state distinctions and service contracts change together; legitimate retention alternatives and long-lived operational consequences.

## Consequences

**Positive**
- Durable recognition of expired links independently of ephemeral Secret storage.
- Clear separation between lifecycle metadata and sensitive payload retention.
- Uses the baseline Lucid metadata path without persisting credentials.

**Negative**
- PostgreSQL adds a runtime dependency, migrations, backup policy and cross-store failure paths.
- Indefinite pseudonymous activity metadata grows without a time-based retention bound; future review is required rather than silently deleting records.
- Anyone with a valid link can learn its lifecycle state without a Reading code; content remains protected by the configured code.

**Neutral**
- A persistent metadata row never proves the Secret is still available and cannot recover it.
- Lookup digest records are pseudonymous, not anonymous data; no content-recovery capability is intended.
- This amends ADR-0003's storage topology only. Its prohibition on PostgreSQL Secret payload rows remains in force; ADR-0004's scoped deletion applies to ephemeral payloads/verifiers, not intentionally retained metadata.

## Links

- Spec: [spec.md](../spec.md), AC-04, AC-09 and §6.1.
- SAD: [sad.md](../sad.md), §§4–5.
- UX: [ux-flows.md](../ux-flows.md), SCR-02 through SCR-05.
- Related ADRs: [0003](0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md), [0004](0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md).
