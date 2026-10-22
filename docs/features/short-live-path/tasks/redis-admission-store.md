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

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

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


> **Admission and failure semantics.** Basic admission checks 25 observed successes per rolling sixty-second address window; already-admitted concurrent requests can overshoot. Keep 1000 active Secrets, Redis 256 MiB/noeviction and 10000 transient counter identities, with safe refusal rather than eviction. Address/pair state uses retained keyed pseudonyms and expires within five minutes of last relevant request. No v1 quota reservations/leases or pending-slot registry exists. Known refusal yields no link; uncertain writes do not prove absence, and every possible payload retains its original hard deadline. Immutable metadata is not deleted as rollback. Manual retry is a fresh attempt, never recovery or extension.
>
> — `sad.md §6, S2, abridged` · full text: [sad.md](../sad.md)


> **Concurrent-attempt semantics.** Check the basic rolling pair counter before hashing and deny when five failures are observed. Already-admitted concurrent guesses may exceed five; ADR-0009 explicitly defers exact quota reservations, leases and cross-process fencing to backlog T22. Keep atomic counter updates, no failure timestamp on rejected requests, no previous-failure reset on success, no link consumption and independent address pairs. The global two-native-call/no-queue bound remains hard, including distributed attempts; a timed-out/disconnected native call retains its permit until completion. Invalid input, capacity refusal and dependency uncertainty are not fabricated incorrect-code failures. Only a correct code plus final payload/readiness/PostgreSQL-time checks authorizes that response.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


> **Retention and outage boundaries.** The <=60-second active-record deletion bound remains mandatory while Redis can execute cleanup. TTL, a five-second tick or a fail-closed API alone is not proof; T8/T18 must test cleanup under faults and capacity. No physical RAM-erasure deadline applies during suspension/hang. Startup/recovery closes traffic, establishes current single-process ownership and safe PostgreSQL time, clears expired records and only then reopens. Continue possible Redis cleanup during PostgreSQL outage. Lost payloads are never reconstructed. Address/key continuity keeps ADR-0009 quiet-window recovery, while exact quota reservation reconciliation is deferred.
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


> | `creation:<address_label>:state` | Version, bounded recent successful-creation timestamps, last relevant activity | Basic rolling 60-second check against 25 observed successes; admitted concurrent requests may overshoot. No raw address or pending slots. |
> | `verification:<lifecycle_uuid>:<address_label>:state` | Version, bounded recent failed-verification timestamps, last relevant activity | Basic link/address check against five observed failures; admitted concurrent attempts may overshoot. Success never clears prior failures. |
> | `payload:expiry` | ZSET: lifecycle UUID member, immutable expires_at_ms score | Due payload cleanup/capacity accounting; at most 1000 active payloads, no creation-capacity lease. |
> | `limiter:expiry` | ZSET: bounded address/pair state handles and maintenance deadlines | Due counter cleanup and 10000-record cardinality enforcement; no raw token, IP, content or code. |
>
> — `data-model.md §Temporary admission state, admission keys, verbatim` · full text: [data-model.md](../data-model.md)

> Count every active address/pair record toward the 10000 limiter-identity cap; there are no v1 quota reservation records. Use absolute expiration for per-address/pair state no later than five minutes after the last relevant request, additionally bounded by link expiry for pair state. A throttled request may affect the retention deadline but must not append a failure, reserve work or move existing failure timestamps.
>
> — `data-model.md §Temporary admission state, cardinality and retention, abridged` · full text: [data-model.md](../data-model.md)

> The registry counts each counter identity once, with fixed bounded index overhead. Refuse before allocating a new identity at cap; hard payload publication capacity is checked without a long-lived reservation.
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
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; bounded hash work remains mandatory, while exact concurrent quota reservations are deferred. Basic admission uses observed failure counters; already-admitted simultaneous attempts may exceed the nominal threshold, so v1 does not promise an exact five-failure concurrent ceiling. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


### AC-11

> **Given** a Secret has expired
> **When** the service applies its retention policy
> **Then** active stored Secret data is removed within sixty seconds of expiration while Redis is running and able to execute cleanup. During process or virtual-machine suspension/hang, physical removal from memory within that interval is not guaranteed; after recovery, expired records are cleared before serving Secret traffic resumes. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Implement ADR-0009 basic bounded creation/pair counters and safe hard-cap payload publication; no quota reservations, leases or pending-slot registry in v1. Work area: `backend/app/services/ephemeral_secret_service.ts` (and matching files_hint targets).

- [ ] Check basic observed 25-success/address and five-failure/pair thresholds per rolling minute, explicitly allowing admitted concurrent overshoot. Enforce hard 1000 payloads/10000 counter identities/noeviction and the retained T6 work cap. Work area: `backend/app/services/admission_service.ts` (and matching files_hint targets).

- [ ] Publish full versioned payload/hash/absolute TTL/expiry-index membership, retain original deadlines, validate stored records and use no raw token/address in keys. Work area: `backend/app/services/redis_scripts/` (and matching files_hint targets).

- [ ] Implement approved trusted-address/HMAC continuity from T1. Count unknown/OOM outcomes conservatively; Redis script isolation is not rollback. Never evict active protection or reset old failures on successful verification. Work area: `backend/tests/integration/admission.spec.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Five failures already observed for pair | Refuse without hash or appended/extended failure timestamp; already-admitted concurrent attempts may overshoot the nominal threshold. |
| Redis partial script/OOM | No assumed rollback or speculative link; preserve the original hard deadline, hard storage cap and bounded cleanup of uncertain payload state. No quota lease/fencing protocol is required. |
| Shared public address | Share applicable address/pair limits, never create per-person identity. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-07, AC-11, abridged; [sad.md](../sad.md) §6, S2, S4, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Real-Redis integration tests prove basic rolling counters and retained histories, hard storage/cardinality/work caps, original expiry and safe OOM/timeout publication; acknowledge concurrent quota overshoot without requiring deferred reservation leases.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
