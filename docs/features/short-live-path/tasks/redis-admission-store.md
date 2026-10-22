---
id: "T7"
title: "Implement bounded Redis payload and admission transitions"
layer: "infra"
deps: ["T3", "T6"]
blocks: ["T8", "T9", "T10", "T11"]
acs: ["AC-01", "AC-07", "AC-11"]
files_hint: ["backend/app/services/ephemeral_secret_service.ts", "backend/app/services/admission_service.ts", "backend/app/services/redis_scripts/", "backend/tests/integration/admission.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T7 — Implement bounded Redis payload and admission transitions

## Place in the sequence

- Blocked by: T3 — Bootstrap the backend with executable quality gates, T6 — Implement exact validation, token handling and bounded verification. Blocks: T8 — Implement bounded cleanup and generation-fenced readiness, T9 — Implement confirmed creation and its HTTP boundary, T10 — Implement neutral status and durable lifecycle classification, T11 — Implement explicit disclosure with final release checks. Wave: 4 (dependency depth, not elapsed days).

- Lane: T3 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Sender
> **I want** to enter optional address and login plus a password or multiline key, create a Share link without registration, and copy it
> **So that** I can give a client access details without keeping a permanent copy in this service.
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement bounded Redis payload and admission transitions.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Admission and failure semantics.** At most 25 successful creations per rolling sixty-second address window and 1000 active Secrets are allowed, with Redis maxmemory 256 MiB/noeviction and at most 10,000 limiter records including reservations. People sharing a public address share its quota.
>
> — `sad.md §6, S2, abridged` · full text: [sad.md](../sad.md)


> **Concurrent-attempt semantics.** Each link/address pair admits no more in-flight verifications than its remaining failure allowance, so simultaneous wrong codes cannot overshoot five failed verifications in any rolling sixty-second window. Occupied in-flight slots may temporarily refuse even a correct attempt without running its hash.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


> **Retention and outage boundaries.** Active Secret/verifier data must be removed within sixty seconds of expiration while Redis can execute cleanup. The five-second tick and TTL are supporting mechanisms, not proof of that bound.
>
> — `sad.md §6, S7, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `schema_version` | Integer string `1` | Reject unknown versions or incomplete hashes safely. |
> | `lifecycle_id` | Canonical UUID string | Must equal the key handle and resolved PostgreSQL id. |
> | `address` | UTF-8 string | Optional input represented as empty string when absent; do not trim supplied text. |
> | `login` | UTF-8 string | Optional input represented as empty string when absent; do not trim supplied text. |
> | `credential` | UTF-8 string | Required, not whitespace-only; retain all valid submitted characters and line breaks. |
> | `code_verifier` | Encoded salted password-hard hash, or absent field | Absence means no code required. Never persist the plaintext code; malformed present verifier fails closed, not as code-disabled. Algorithm/cost/budget follow Accepted ADR-0006 initial values; calibration is T21. |
> | `created_at_ms` | UTC epoch-millisecond integer string | Must match the final PostgreSQL timestamp. |
> | `expires_at_ms` | UTC epoch-millisecond integer string | Must match PostgreSQL and absolute Redis expiry. Never refresh on read or verification. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


> | `creation:<address_label>:state` | Version, ordered successful-creation `(attempt_id, at_ms)` entries, pending `(attempt_id, lease_until_ms, generation)` reservations, last relevant activity | Address-scoped rolling 60-second successful quota; successes plus potentially successful in-flight reservations cannot exceed 25. No raw address. |
> | `verification:<lifecycle_uuid>:<address_label>:state` | Version, ordered failure `(attempt_id, at_ms)` entries, pending verification reservations with owner generation/lease, last relevant activity | Link/address pair; at most five failures plus occupied slots per rolling 60 seconds. Success releases only its slot, never clears prior failures. |
> | `capacity:reservations` | Reservation id to lifecycle id, lease deadline and owner generation | Global concurrent creation safety; count committed active payloads plus occupied/uncertain reservations against 1000, with an atomic transition to avoid double counting on commit. |
> | `payload:expiry` | ZSET: lifecycle UUID member, absolute expires_at_ms score | S7 due-record index; bounded by active/uncertain payload admission. Payload TTL can remove a hash first; index cleanup must tolerate that. |
> | `limiter:expiry` | ZSET: limiter-state key or reservation handle member, maintenance deadline score | Enumerates active temporary state/reservations for bounded cleanup and cardinality accounting; no raw token, IP, code or content. |
>
> — `data-model.md §Temporary admission state, admission keys, verbatim` · full text: [data-model.md](../data-model.md)

> Count each pair/address record and every individual reservation toward the approved 10000 limiter-record units, even if reservations are embedded rather than separate Redis keys. Use absolute expiration for per-address/pair state no later than five minutes after the last relevant request, additionally bounded by link expiry for pair state. A throttled request may affect the retention deadline but must not append a failure, reserve work or move existing failure timestamps.
>
> — `data-model.md §Temporary admission state, cardinality and retention, abridged` · full text: [data-model.md](../data-model.md)

> The registry counts each unit exactly once; global structural index keys themselves are fixed overhead, not extra client limiter identities. Refuse before allocating a new unit at cap. The capacity-reservation map and registry must represent the same reservation, not create an uncounted parallel admission path.
>
> Global expiry/registry structures have no arbitrary whole-key TTL: dropping them would bypass safety or lose cleanup handles. Delete empty structures and prune due members explicitly, including index orphans when hashes expire first.
>
> — `data-model.md §Temporary admission state, registry and structural-key invariants, abridged` · full text: [data-model.md](../data-model.md)

No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-01

> **Given** a Sender has entered a valid Secret
> **When** the Sender successfully creates it
> **Then** the Sender receives a copyable Share link and a confirmed expiration time without registration.
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


### AC-11

> **Given** a Secret has expired
> **When** the service applies its retention policy
> **Then** active stored Secret data is removed within sixty seconds of expiration while Redis is running and able to execute cleanup. During process or virtual-machine suspension/hang, physical removal from memory within that interval is not guaranteed; after recovery, expired records are cleared before serving Secret traffic resumes. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Implement reviewed DM-OQ-04 atomic creation/capacity and pair-verification reservation state transitions with fencing; include contracts with first implementers. Work area: `backend/app/services/ephemeral_secret_service.ts` (and matching files_hint targets).

- [ ] Enforce 25 successes/60s/address, 1000 active payloads, 10000 limiter units including embedded reservations, five failures/60s/link-address pair; bound global work through T6. Work area: `backend/app/services/admission_service.ts` (and matching files_hint targets).

- [ ] Publish full versioned payload/hash/absolute TTL/expiry-index membership, retain original deadlines, validate stored records and use no raw token/address in keys. Work area: `backend/app/services/redis_scripts/` (and matching files_hint targets).

- [ ] Implement approved trusted-address/HMAC continuity from T1. Count unknown/OOM outcomes conservatively; Redis script isolation is not rollback. Never evict active protection or reset old failures on successful verification. Work area: `backend/tests/integration/admission.spec.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Five pair slots occupied | Refuse without hash or appended/extended failure timestamp. |
| Redis partial script/OOM | No assumed rollback or freed uncertain slot; reconcile under reviewed fencing. |
| Shared public address | Share applicable address/pair limits, never create per-person identity. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-07, AC-11, abridged; [sad.md](../sad.md) §6, S2, S4, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Real-Redis integration tests race both quotas and all caps, exercise exact rolling boundaries, short/failed/successful attempts, lease fencing, OOM/timeout partial outcomes and five-minute state retention.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
