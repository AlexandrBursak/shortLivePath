---
id: "T10"
title: "Implement neutral status and durable lifecycle classification"
layer: "ports"
deps: ["T5", "T7", "T8"]
blocks: ["T11", "T12", "T17"]
acs: ["AC-08", "AC-09", "AC-11b"]
files_hint: ["backend/app/services/secret_status_service.ts", "backend/app/controllers/secret_status_controller.ts", "backend/start/routes.ts", "backend/tests/integration/secret_status.spec.ts"]
owner: "<TBD lead>"
estimate: "6h"
context_budget: "M"
status: "blocked"
---

# T10 — Implement neutral status and durable lifecycle classification

## Place in the sequence

- Blocked by: T5 — Promote the staged lifecycle migration and Lucid model, T7 — Implement bounded Redis payload and admission transitions, T8 — Implement bounded cleanup and generation-fenced readiness. Blocks: T11 — Implement explicit disclosure with final release checks, T12 — Implement typed browser clients and conservative lifecycle guards, T17 — Wire same-origin deployment and confidentiality controls. Wave: 6 (dependency depth, not elapsed days).

- Lane: T3, T9, T11 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement neutral status and durable lifecycle classification.

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


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `token_digest` | bytea | NOT NULL, UNIQUE, exactly 32 bytes | SHA-256 over the decoded 32 random token bytes, not over an arbitrary textual spelling. |
> | `expires_at` | timestamptz | NOT NULL, finite, no DEFAULT | Exactly created_at plus the selected integer minutes, 1–1440. UTC instants; millisecond-aligned service values allow exact Redis/DTO mapping. |
> | `code_verifier` | Encoded salted password-hard hash, or absent field | Absence means no code required. Never persist the plaintext code; malformed present verifier fails closed, not as code-disabled. Algorithm/cost/budget follow Accepted ADR-0006 initial values; calibration is T21. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

> GET /api/v1/secrets/{token}/status (getSecretStatus), no body/code. Token: 43 canonical base64url characters decoding to 32 bytes, checked before lookup. 200 data variants: available {state,reading_code_required,expires_at}, expired or early_unavailable {state,expires_at}, unknown {state}; all with meta.service_time. Invalid token is unknown without lookup. 503 short_live_path.service_unavailable or short_live_path.capacity_unavailable; never infer terminal loss from dependency/corruption failure. No content, verifier, UUID or digest.
>
> — `contracts/openapi.yaml §paths / components, getSecretStatus, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Accepted ADR-0006: code <=1024 UTF-8 bytes, body <=524288 wire bytes, identity-only encoding, two concurrent hash calls/no queue. Both POST operations have safe 413 short_live_path.request_too_large and 415 short_live_path.unsupported_media_type outcomes before expensive work; code overflow is 422 invalid_request with no failed-code increment. ADR-0007 unsafe trusted-address/continuity context is 503 service_unavailable, not wrong code.
>
> — `contracts/openapi.yaml §components / security, shared envelope and headers, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-08

> **Given** a Share link has not expired and its reading conditions are satisfied
> **When** the Recipient explicitly chooses Show on the neutral page, on an initial or repeat visit
> **Then** the Recipient can read and copy the Secret without registration while it remains available and unexpired. Opening the page alone reveals no Secret content, including in previews. Concurrent reading is permitted; no visit consumes the link.
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)


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

- [ ] Implement getSecretStatus: canonical token check before lookup, digest resolution through Lucid service and safe available/expired/unknown/early_unavailable projections. Work area: `backend/app/services/secret_status_service.ts` (and matching files_hint targets).

- [ ] Check current readiness and service time; known expired metadata needs no payload access, but does not bypass global recovery gating. Work area: `backend/app/controllers/secret_status_controller.ts` (and matching files_hint targets).

- [ ] No code verification, recipient identity, Secret fields, view consumption or deadline mutation. Recheck expiry before classifying a missing payload. Work area: `backend/start/routes.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Unexpired row plus confirmed missing payload | early_unavailable, not expired or recoverable. |
| Dependency timeout | 503 service_unavailable, never inferred unknown/loss. |

Edge-case sources: [spec.md](../spec.md) §5, AC-08, AC-09, AC-11b, abridged; [sad.md](../sad.md) §6, S3, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] getSecretStatus contract tests verify four 200 variants, malformed token stops before lookup, no fragments or mutation, known expiration after Redis restart and 503 for corruption/dependency uncertainty.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
