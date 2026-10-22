---
id: "T22"
title: "Revisit exact concurrent quota reservations"
layer: "docs"
deps: []
blocks: []
acs: ["AC-01", "AC-07"]
files_hint: ["docs/features/short-live-path/adr/", "docs/features/short-live-path/spec.md", "docs/features/short-live-path/data-model.md", "docs/features/short-live-path/contracts/"]
owner: "Product Owner + coding agent"
estimate: "8h"
context_budget: "M"
status: "todo"
---

# T22 — Revisit exact concurrent quota reservations

## Place in the sequence

Explicitly deferred by Product Owner under ADR-0009. This backlog item is NOT in tasks.json, has no active DAG edges and blocks neither scaffolding nor the initial launch. Do not auto-dispatch it after current tasks. Revisit before API replicas or upon an explicit product request driven by observed abuse/concurrency.

## Why (user story)

> **As a** Sender
> **I want** to optionally choose or generate a Reading code and communicate it separately
> **So that** possession of the Share link alone need not permit reading.
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This future review decides whether observed-counter v1 limits should become exact concurrent guarantees.

## Inlined context

> Basic thresholds remain 25 observed creation successes/address and five observed failures/link/address per rolling sixty seconds. Admitted simultaneous operations may overshoot. Exact reservations/leases are deferred, while hard work/input/storage limits and expiration remain mandatory.
>
> — `adr/0009-keep-basic-limits-and-defer-exact-concurrent-quotas.md §Decision outcome, ADR-0009, abridged` · full text: [ADR-0009](../adr/0009-keep-basic-limits-and-defer-exact-concurrent-quotas.md)

Read current artifacts and runtime evidence before proposing a stricter guarantee. Preserve exact codes, privacy, no link consumption and immutable PostgreSQL-derived expiry.

## Data delta

No DB changes. Any future reservation schema must be separately reviewed; no persistent limiter/address table or Secret backup is authorized.

## API contract

Internal — no API surface in this design-review task. A future stricter quota promise requires synchronized spec/API/429 semantics and a new reviewed implementation breakdown.

## Acceptance criteria

### AC-01

> **Given** a Sender has entered a valid Secret
> **When** the Sender successfully creates it
> **Then** the Sender receives a copyable Share link and a confirmed expiration time without registration.
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; bounded hash work remains mandatory, while exact concurrent quota reservations are deferred. Basic admission uses observed failure counters; already-admitted simultaneous attempts may exceed the nominal threshold, so v1 does not promise an exact five-failure concurrent ceiling. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Confirm a real concurrency/abuse or replica need with Product Owner before activating this item.
- [ ] Compare exact atomic publication/counter control and reservation-based alternatives, including timeout/lease/stale-owner/OOM behavior, privacy/cardinality and no-expiry-extension guarantees.
- [ ] Record reviewed protocol and deterministic fault/race vectors in a new ADR; update sources and split executable implementation into atomic tasks. Do not claim leases alone prevent late commits.

## Edge cases

| Case | Behavior |
|---|---|
| No demonstrated need or approval | Keep deferred outside the v1 DAG. |
| Proposed exact guarantee lacks stale-owner/uncertain-write proof | Remain Proposed; do not silently promise exact limits. |
| Review exceeds one day | Split design from implementation; do not generate a monster task. |

## Definition of Done

- [ ] A reviewed future quota protocol and fault/race test plan either justify an exact-guarantee implementation breakdown or explicitly retain the v1 trade-off; no runtime success is fabricated.
- [ ] Activation is explicit and does not retroactively block or misrepresent the initial release.
