---
id: "T2"
title: "Resolve publication, clock and reservation state machines"
layer: "docs"
deps: []
blocks: ["T3", "T4"]
acs: ["AC-01", "AC-04", "AC-07", "AC-10", "AC-11"]
files_hint: ["docs/features/short-live-path/adr/", "docs/features/short-live-path/sad.md", "docs/features/short-live-path/data-model.md", "docs/features/short-live-path/contracts/openapi.yaml", "docs/features/short-live-path/contracts/events.md"]
owner: "Product Owner + coding agent"
estimate: "8h"
context_budget: "M"
status: "todo"
---

# T2 — Resolve publication, clock and reservation state machines

## Place in the sequence

- Blocked by: none. Blocks: T3 — Bootstrap the backend with executable quality gates, T4 — Bootstrap the neutral frontend and register shared primitives. Wave: 1 (dependency depth, not elapsed days).

- Lane: T1 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

## Why (user story)

> **As a** Sender
> **I want** to select a lifetime from one minute to twenty-four hours, defaulting to one hour
> **So that** disclosure lasts only for the intended handover window.
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Resolve publication, clock and reservation state machines.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Timing and scope obligations.** Expiration is the selected duration after successful creation, not form entry or initial reservation. The messages above state the approved cross-store order, not a concrete timestamp-publication algorithm: §11 still requires the exact creation-time anchor, final timestamp publication and atomic successful-quota accounting to be resolved and tested before implementation.
>
> — `sad.md §6, S1, abridged` · full text: [sad.md](../sad.md)


> **Admission and failure semantics.** At most 25 successful creations per rolling sixty-second address window and 1000 active Secrets are allowed, with Redis maxmemory 256 MiB/noeviction and at most 10,000 limiter records including reservations. People sharing a public address share its quota.
>
> — `sad.md §6, S2, abridged` · full text: [sad.md](../sad.md)


> **Time and lifecycle obligations.** The countdown is presentation, never permission to bypass S4's final service-side release check. Device wall-clock changes cannot extend the lifetime.
>
> — `sad.md §6, S6, abridged` · full text: [sad.md](../sad.md)


> **Retention and outage boundaries.** Active Secret/verifier data must be removed within sixty seconds of expiration while Redis can execute cleanup. The five-second tick and TTL are supporting mechanisms, not proof of that bound.
>
> — `sad.md §6, S7, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> **Chosen:** Option 1. Revise AC-11 and NFR-03: delete expired records from active storage within sixty seconds while Redis is running and able to execute cleanup.
>
> — `adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md §Decision outcome, ADR-0004, abridged` · full text: [adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md](../adr/0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md)


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


> | DM-OQ-02 | Successful-creation anchor and cross-store final timestamp publication. PostgreSQL precedes Redis, so simply stamping metadata before hash/store work cannot prove AC-04. Define exact publication/failure transitions without extending any published/orphan deadline.  | Backend responsibility with Product Owner review, before executable tasks. |
>
> — `data-model.md §Open technical decisions, DM-OQ-02, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-03 | Authoritative clock, monotonic deadlines, discontinuity detection, cleanup batch/retry budget, maintenance run identity and readiness fencing.  | Backend/frontend responsibility, before executable tasks. |
>
> — `data-model.md §Open technical decisions, DM-OQ-03, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-04 | Reservation leases, generation fencing, uncertain/OOM partial-script outcomes, exact successful-quota/failure accounting and recovery reconciliation. Prove bounded cleanup and no late commit after lease release.  | Backend responsibility, before executable tasks. |
>
> — `data-model.md §Open technical decisions, DM-OQ-04, abridged` · full text: [data-model.md](../data-model.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

## API contract

> POST /api/v1/secrets (createSecret). Request: required credential; optional address/login default empty, lifetime_minutes integer 1–1440/default 60, optional exact reading_code (create minimum six Unicode code points). Aggregate scalar-text UTF-8 bytes <=65536, excluding code/packaging; reject null, unknown fields and malformed scalar text. 201: data.share_url, data.expires_at, meta.service_time, no content/code echo. 422 short_live_path.invalid_request; 429 short_live_path.creation_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable.
>
> — `contracts/openapi.yaml §paths / components, createSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> GET /api/v1/secrets/{token}/status (getSecretStatus), no body/code. Token: 43 canonical base64url characters decoding to 32 bytes, checked before lookup. 200 data variants: available {state,reading_code_required,expires_at}, expired or early_unavailable {state,expires_at}, unknown {state}; all with meta.service_time. Invalid token is unknown without lookup. 503 short_live_path.service_unavailable or short_live_path.capacity_unavailable; never infer terminal loss from dependency/corruption failure. No content, verifier, UUID or digest.
>
> — `contracts/openapi.yaml §paths / components, getSecretStatus, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> POST /api/v1/secrets/{token}/disclosures (discloseSecret). Required JSON object {}, or {reading_code:string}; shorter guesses are allowed, null/unknown fields are invalid. 200: data.secret {address,login,credential}, data.expires_at, meta.service_time. 403 short_live_path.code_required or short_live_path.code_incorrect; 409 short_live_path.link_unavailable; 410 short_live_path.link_expired; 422 short_live_path.invalid_request; 429 short_live_path.verification_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable. No read consumption, sessions or automatic POST retries.
>
> — `contracts/openapi.yaml §paths / components, discloseSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Accepted ADR-0006: code <=1024 UTF-8 bytes, body <=524288 wire bytes, identity-only encoding, two concurrent hash calls/no queue. Both POST operations have safe 413 short_live_path.request_too_large and 415 short_live_path.unsupported_media_type outcomes before expensive work; code overflow is 422 invalid_request with no failed-code increment. ADR-0007 unsafe trusted-address/continuity context is 503 service_unavailable, not wrong code.
>
> — `contracts/openapi.yaml §components / security, shared envelope and headers, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-01

> **Given** a Sender has entered a valid Secret
> **When** the Sender successfully creates it
> **Then** the Sender receives a copyable Share link and a confirmed expiration time without registration.
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)


### AC-04

> **Given** a Sender is creating a Secret
> **When** creation succeeds with the default lifetime or a chosen whole number of minutes from 1 to 1440
> **Then** expiration is one hour after successful creation by default, or the chosen duration after successful creation. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices. The confirmation and reading experiences show a visible countdown of remaining lifetime based on service-established expiration and service time; changing the device wall clock does not extend access. Countdown display does not replace server-side expiration enforcement.
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


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


## Checklist

- [ ] Resolve DM-OQ-02 with exact successful-creation timestamp publication transitions for PostgreSQL-before-Redis, without moving any published/orphan expiration. Work area: `docs/features/short-live-path/adr/` (and matching files_hint targets).

- [ ] Resolve DM-OQ-03 with authoritative/monotonic time, browser transit/sleep safety, discontinuity detection, bounded cleanup batches/retries and generation-fenced readiness. Work area: `docs/features/short-live-path/sad.md` (and matching files_hint targets).

- [ ] Resolve DM-OQ-04 with reservation leases/fencing, successful-quota accounting, uncertain/OOM partial writes and reconciliation; specify deterministic failure test vectors. Work area: `docs/features/short-live-path/data-model.md` (and matching files_hint targets).

- [ ] Obtain recorded technical/Product Owner review, update source artifacts, then re-run tasks to refresh affected inline slices before any implementation task starts. An 8h decision session may end blocked, not falsely complete. Work area: `docs/features/short-live-path/contracts/openapi.yaml` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Metadata confirmed, payload uncertain | No confirmed URL; retain metadata, original deadline and conservative occupied eligibility. |
| Old lease expires while work continues | Fencing prevents later publication before any slot is reused. |
| Cleanup/clock uncertain | Readiness remains closed; executable cleanup continues. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-04, AC-07, AC-10, AC-11, abridged; [sad.md](../sad.md) §6, S1, S2, S6, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] State-machine review walks success, uncertainty, stale-owner, clock-rollback and recovery vectors against AC-04/07/10/11; all DM-OQ-02/03/04 choices are reviewed before this gate closes.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
