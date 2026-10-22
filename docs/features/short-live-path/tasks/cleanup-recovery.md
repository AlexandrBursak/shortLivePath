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

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

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


> **Retention and outage boundaries.** Active Secret/verifier data must be removed within sixty seconds of expiration while Redis can execute cleanup. The five-second tick and TTL are supporting mechanisms, not proof of that bound.
>
> — `sad.md §6, S7, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 1. Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds while Redis is running and able to execute cleanup.
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

> | `payload:expiry` | ZSET: lifecycle UUID member, absolute expires_at_ms score | S7 due-record index; bounded by active/uncertain payload admission. Payload TTL can remove a hash first; index cleanup must tolerate that. |
> | `limiter:expiry` | ZSET: limiter-state key or reservation handle member, maintenance deadline score | Enumerates active temporary state/reservations for bounded cleanup and cardinality accounting; no raw token, IP, code or content. |
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
> **Then** active stored Secret data is removed within sixty seconds of expiration while Redis is running and able to execute cleanup. During process or virtual-machine suspension/hang, physical removal from memory within that interval is not guaranteed; after recovery, expired records are cleared before serving Secret traffic resumes. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
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

- [ ] Delete expired payloads/verifiers and stale limiter/index handles within 60s while Redis executes; do not scan permanent metadata or use unbounded KEYS. Work area: `backend/app/services/readiness_service.ts` (and matching files_hint targets).

- [ ] Close and fence serving on startup/reconnect/identity/clock changes; reopen only after current-generation dependency checks, cleanup and conservative reservation reconciliation. Work area: `backend/app/services/service_clock.ts` (and matching files_hint targets).

- [ ] Continue Redis cleanup when PostgreSQL health fails. Old completion cannot reopen current readiness; report aggregate internal failure on exhausted retries. Work area: `backend/start/maintenance.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Suspension exceeds 60s | No RAM-erasure claim during suspension; clean expired records before resuming traffic. |
| Readiness closed but Redis runs | Continue cleanup; closed traffic alone is not deletion proof. |

Edge-case sources: [spec.md](../spec.md) §5, AC-10, AC-11, AC-11b, abridged; [sad.md](../sad.md) §6, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Real-Redis/PostgreSQL fault tests measure <=60s active deletion and prove cleanup-before-serving after suspension/reconnect, stale-owner fencing, PostgreSQL-outage cleanup and no early-payload recovery.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
