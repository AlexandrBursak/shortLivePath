---
id: "T3"
title: "Bootstrap the backend with executable quality gates"
layer: "wiring"
deps: ["T1", "T2"]
blocks: ["T5", "T6", "T7", "T17", "T21"]
acs: ["AC-11"]
files_hint: ["backend/package.json", "backend/pnpm-lock.yaml", "backend/tsconfig.json", "backend/eslint.config.mjs", "backend/compose.yml", "backend/docker/", "backend/start/", "backend/config/", "backend/tests/", "backend/docs/architecture.md", "backend/app/middleware/"]
owner: "<TBD lead>"
estimate: "6h"
context_budget: "M"
status: "blocked"
---

# T3 — Bootstrap the backend with executable quality gates

## Place in the sequence

- Blocked by: T1 — Resolve verifier budgets and trusted-address continuity, T2 — Resolve publication, clock and reservation state machines. Blocks: T5 — Promote the staged lifecycle migration and Lucid model, T6 — Implement exact validation, token handling and bounded verification, T7 — Implement bounded Redis payload and admission transitions, T17 — Wire same-origin deployment and confidentiality controls, T21 — Benchmark Reading code budgets after backend scaffolding. Wave: 2 (dependency depth, not elapsed days).

- Lane: T5, T6, T7, T8, T9, T10, T11, T17, T18 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Recipient
> **I want** the Secret to become unavailable after expiration and to understand what that means
> **So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Bootstrap the backend with executable quality gates.

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


> **Chosen:** web-frontend and backend-service. Set these exact values in sad.md target_surfaces.
>
> — `adr/0001-build-responsive-web-frontend-and-backend-service.md §Decision outcome, ADR-0001, abridged` · full text: [adr/0001-build-responsive-web-frontend-and-backend-service.md](../adr/0001-build-responsive-web-frontend-and-backend-service.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> **Chosen:** Option 1. Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds while Redis is running and able to execute cleanup.
>
> — `adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md §Decision outcome, ADR-0004, abridged` · full text: [adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md](../adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-11

> **Given** a Secret has expired
> **When** the service applies its retention policy
> **Then** active stored Secret data is removed within sixty seconds of expiration while Redis is running and able to execute cleanup. During process or virtual-machine suspension/hang, physical removal from memory within that interval is not guaranteed; after recovery, expired records are cleared before serving Secret traffic resumes. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Pin compatible AdonisJS 7/TypeScript/pnpm versions; generate only the backend skeleton and Docker-based test runner, with no public Secret endpoints yet. Pin the asynchronous argon2 package/native build from Accepted ADR-0006 for the post-scaffold T21 harness; no pre-scaffold benchmark is required. Work area: `backend/package.json` (and matching files_hint targets).

- [ ] Activate existing layer lint preset plus its resolver; add unit/integration scripts and typecheck/build gates, using synthetic fixtures only. Work area: `backend/pnpm-lock.yaml` (and matching files_hint targets).

- [ ] Record SAD-approved monorepo, Redis ephemeral-primary and metadata-only PostgreSQL exceptions in the baseline exception section. Keep test utilities bounded and logs allowlisted. Work area: `backend/tsconfig.json` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Dependency unavailable | Smoke reports failure; never claim a runnable app from files alone. |

Edge-case sources: [spec.md](../spec.md) §5, AC-11, abridged; [sad.md](../sad.md) §6, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Docker backend smoke test, pnpm test/lint/typecheck/build scripts and a deliberately invalid layer-import fixture prove active gates; no sensitive endpoint serves before readiness.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
