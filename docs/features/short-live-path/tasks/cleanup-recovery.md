---
id: "T8"
title: "Implement bounded cleanup and generation-fenced readiness"
layer: "app"
deps: ["T5", "T7"]
blocks: ["T9", "T10", "T11", "T17"]
acs: ["AC-10", "AC-11", "AC-11b"]
files_hint: ["backend/app/services/cleanup_service.ts", "backend/app/services/readiness_service.ts", "backend/app/services/service_clock.ts", "backend/start/maintenance.ts", "backend/tests/integration/cleanup_recovery.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T8 — Implement bounded cleanup and generation-fenced readiness

## Place in the sequence

- Blocked by: T5 — Promote the staged lifecycle migration and Lucid model, T7 — Implement bounded Redis payload and admission transitions. Blocks: T9 — Implement confirmed creation and its HTTP boundary, T10 — Implement neutral status and durable lifecycle classification, T11 — Implement explicit disclosure with final release checks, T17 — Wire same-origin deployment and confidentiality controls. Wave: 5 (dependency depth, not elapsed days).

- Lane: T3 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Recipient
> **I want** the Secret to become unavailable after expiration and to understand what that means
> **So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement bounded cleanup and generation-fenced readiness.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Retention and outage boundaries.** The <=60-second active-record deletion target applies during normal healthy operation, not merely whenever Redis alone is reachable. Physical cleanup may be delayed or missed during service/runtime outages, dependency downtime (including PostgreSQL unavailable at startup), or suspension/hang. Each subsequent cleanup selects all expired backlog by original deadline, with no recent-interval lower cutoff; bounded batches continue until all due debt is cleared before Secret traffic resumes. TTL, a scheduler tick or closed readiness alone is not proof. Startup/recovery establishes current ownership, safe PostgreSQL time and dependencies before reopening. Continuing safe cleanup during PostgreSQL outage is useful but is not an outage erasure guarantee or a reason to redesign the scheduler (ADR-0004 amendment, 2026-10-23). Lost payloads are never reconstructed. Address/key continuity keeps ADR-0009 quiet-window recovery, while exact quota reservation reconciliation is deferred.
>
> — `sad.md §6, S7, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 1 (approval amended 2026-10-23 in ADR-0004). Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds during normal healthy operation; outages, dependency downtime and suspension may delay physical cleanup. Subsequent cleanup catches all expired backlog by original deadline, not only a recent interval, before Secret traffic resumes. Never release expired data.
>
> — `adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md §Decision outcome, ADR-0004, abridged` · full text: [adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md](../adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md)


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `payload:expiry` | ZSET: lifecycle UUID member, immutable expires_at_ms score | Due payload cleanup/capacity accounting; at most 1000 active payloads, no creation-capacity lease. |
> | `limiter:expiry` | ZSET: bounded address/pair state handles and maintenance deadlines | Due counter cleanup and 10000-record cardinality enforcement; no raw token, IP, content or code. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-10

> **Given** a Share link has reached expiration
> **When** a Recipient attempts a new disclosure, including with the correct Reading code
> **Then** the service refuses to release Secret data at or after expiration, checking the time immediately before release rather than only when reading begins. The normal application checks expiration before display and must not show a response that arrives after expiration. A running page hides displayed content locally at expiration even without network access; after suspension or a return to the page it checks expiration before redisplaying content. This is a normal-application guarantee, not remote revocation of plaintext or ciphertext and keys already obtained by a Recipient. Data released before expiration cannot be recalled while in transit.
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)


### AC-11

> **Given** a Secret has expired
> **When** the service applies its retention policy
> **Then** active stored Secret data is removed within sixty seconds of expiration during normal healthy operation. Physical cleanup may be delayed or missed during service/runtime outages, dependency downtime (including PostgreSQL unavailable at startup), or process/virtual-machine suspension/hang. Each subsequent cleanup catches all expired backlog using the original expiration deadlines, not only records expired since the previous tick or within a recent interval; bounded batches may continue across runs, but all expired backlog must be cleared before Secret traffic resumes after recovery. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)


### AC-11b

> **Given** a crash or restart has removed a Secret before its scheduled expiration
> **When** a Recipient attempts to show it
> **Then** the page explains that the Secret is unavailable, reveals no content, and does not offer recovery; a new Share link must be requested from the Sender.
>
> — `spec.md §5, AC-11b, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Implement T2-reviewed service clock, five-second internal scheduler, indexed bounded sweep/retry budgets and current-run ownership; no separate worker, broker or durable maintenance table. Work area: `backend/app/services/cleanup_service.ts` (and matching files_hint targets).

- [ ] Delete expired payloads/verifiers and stale limiter/index handles within 60s during normal healthy operation; catch all expired backlog on subsequent sweeps, including older missed intervals; do not scan permanent metadata or use unbounded KEYS. Work area: `backend/app/services/readiness_service.ts` (and matching files_hint targets).

- [ ] Close and fence serving on startup/reconnect/identity/clock changes; reopen only after current-run dependency/PostgreSQL-time checks, expired cleanup and retained address-key continuity checks; exact quota leases are deferred. Work area: `backend/app/services/service_clock.ts` (and matching files_hint targets).

- [ ] Safe Redis cleanup may continue when PostgreSQL health fails, but missed physical cleanup (including startup PostgreSQL down) is accepted; catch all expired backlog before serving resumes, without redesigning the scheduler solely for this case. Old completion cannot reopen current readiness; report aggregate internal failure on exhausted retries. Work area: `backend/start/maintenance.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Suspension exceeds 60s | No RAM-erasure claim during suspension; clean expired records before resuming traffic. |
| Readiness closed but Redis runs | Redis availability alone creates no outage erasure deadline. Safe cleanup may continue; missed cleanup must catch all expired backlog before serving resumes. |

Edge-case sources: [spec.md](../spec.md) §5, AC-10, AC-11, AC-11b, abridged; [sad.md](../sad.md) §6, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Real-Redis/PostgreSQL tests measure <=60s active deletion during normal healthy operation; outage/dependency-down/suspension delay is accepted. Recovery must catch all expired backlog (including debt older than the last tick/recent interval) before serving, preserve safe PostgreSQL time/current-run guards, deny expired release and never reconstruct payloads; no scheduler redesign for startup PostgreSQL downtime or deferred quota-lease protocol is required.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
