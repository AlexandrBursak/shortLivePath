---
id: "T5"
title: "Promote the staged lifecycle migration and Lucid model"
layer: "migration"
deps: ["T3"]
blocks: ["T8", "T9", "T10"]
acs: ["AC-09", "AC-11b"]
files_hint: ["docs/features/short-live-path/migrations/01_create_link_lifecycles.up.sql", "docs/features/short-live-path/migrations/01_create_link_lifecycles.down.sql", "backend/app/models/link_lifecycle.ts", "backend/tests/integration/link_lifecycles.spec.ts"]
owner: "<TBD lead>"
estimate: "4h"
context_budget: "M"
status: "blocked"
---

# T5 — Promote the staged lifecycle migration and Lucid model

## Place in the sequence

- Blocked by: T3 — Bootstrap the backend with executable quality gates. Blocks: T8 — Implement bounded cleanup and generation-fenced readiness, T9 — Implement confirmed creation and its HTTP boundary, T10 — Implement neutral status and durable lifecycle classification. Wave: 3 (dependency depth, not elapsed days).

- Lane: T3 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Promote the staged lifecycle migration and Lucid model.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Status boundaries.** Neutral status does not decrement a view count, verify a Reading code, change expiration or persist a recipient identity. Read-only availability inspection is not permission to serialize payload fields into a status response, neutral HTML, preview, logs or cache.
>
> — `sad.md §6, S3, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `id` | uuid | PK, NOT NULL | Service-generated UUID v4; internal handle for the Redis payload. Not an authorization capability or public lookup endpoint. |
> | `token_digest` | bytea | NOT NULL, UNIQUE, exactly 32 bytes | SHA-256 over the decoded 32 random token bytes, not over an arbitrary textual spelling. |
> | `created_at` | timestamptz | NOT NULL, finite, no DEFAULT | PostgreSQL clock sampled once at lifecycle INSERT, millisecond-aligned; commit/Redis/response delay consumes lifetime (ADR-0008). |
> | `expires_at` | timestamptz | NOT NULL, finite, no DEFAULT | Exactly created_at plus the selected integer minutes, 1–1440. UTC instants; millisecond-aligned service values allow exact Redis/DTO mapping. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


Staged pair (only migration inputs): docs/features/short-live-path/migrations/01_create_link_lifecycles.up.sql and docs/features/short-live-path/migrations/01_create_link_lifecycles.down.sql. Promote via the installed Lucid BaseSchema into backend/database/migrations after inspecting history. UUID v4, binary 32-byte digest unique, finite timestamps and whole-minute 60–86400s duration; no sensitive columns or automatic deletion. Source: [data-model.md](../data-model.md) §Migrations and rollback / Entities, staged promotion, abridged.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-09

> **Given** a Share link is invalid or unavailable
> **When** the Recipient opens it
> **Then** a safe unavailability message contains no Secret fragments; simply viewing a page never consumes a valid Share link. For a known expired link, opening the original URL shows an explicit expired state rather than a missing-page/404 experience. Persist minimal link lifecycle metadata indefinitely for now so this distinction survives Secret deletion and Redis restarts. An unknown link remains safely unavailable. If a known unexpired link has lost its Secret, explain early unavailability, not expiration or recovery.
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)


### AC-11b

> **Given** a crash or restart has removed a Secret before its scheduled expiration
> **When** a Recipient attempts to show it
> **Then** the page explains that the Secret is unavailable, reveals no content, and does not offer recovery; a new Share link must be requested from the Sender.
>
> — `spec.md §5, AC-11b, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Inspect installed Lucid API/history, wrap the staged SQL pair in a real timestamp-prefixed BaseSchema under backend/database/migrations; do not copy raw SQL into the live runner. Work area: `docs/features/short-live-path/migrations/01_create_link_lifecycles.up.sql` (and matching files_hint targets).

- [ ] Add the metadata-only Lucid model and binary-digest lookup exercised through a service; preserve named constraints/indefinite retention and collision refusal. Work area: `docs/features/short-live-path/migrations/01_create_link_lifecycles.down.sql` (and matching files_hint targets).

- [ ] Run synthetic up/down/reapply and schema compatibility checks; real rollback is destructive to recognition and requires explicit authorization plus metadata-only backup. Work area: `backend/app/models/link_lifecycle.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Preexisting incompatible table | Fail promotion instead of trusting IF NOT EXISTS. |
| Rollback after real writes | Do not run without explicit approval and metadata-only backup. |

Edge-case sources: [spec.md](../spec.md) §5, AC-09, AC-11b, abridged; [sad.md](../sad.md) §6, S3, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Disposable PostgreSQL integration tests apply/revert/reapply the promoted Lucid migration and test all 1–1440-minute durations, invalid digests/times, uniqueness and no sensitive columns.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
