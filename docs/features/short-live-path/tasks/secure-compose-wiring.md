---
id: "T17"
title: "Wire same-origin deployment and confidentiality controls"
layer: "wiring"
deps: ["T3", "T4", "T8", "T9", "T10", "T11", "T16"]
blocks: ["T18", "T19"]
acs: ["AC-08", "AC-10", "AC-11"]
files_hint: ["compose.yml", "docker/", "backend/config/", "frontend/next.config.ts", "backend/app/middleware/", "backend/start/kernel.ts", "docs/operations.md"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T17 — Wire same-origin deployment and confidentiality controls

## Place in the sequence

- Blocked by: T3 — Bootstrap the backend with executable quality gates, T4 — Bootstrap the neutral frontend and register shared primitives, T8 — Implement bounded cleanup and generation-fenced readiness, T9 — Implement confirmed creation and its HTTP boundary, T10 — Implement neutral status and durable lifecycle classification, T11 — Implement explicit disclosure with final release checks, T16 — Build exact reading and distinct unavailable screens. Blocks: T18 — Verify canary confidentiality and fault-recovery boundaries, T19 — Verify all screens, exact copies and browser lifecycle safety. Wave: 13 (dependency depth, not elapsed days).

- Lane: T3, T20 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Recipient
> **I want** the Secret to become unavailable after expiration and to understand what that means
> **So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Wire same-origin deployment and confidentiality controls.

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


> **Concurrent-attempt semantics.** Each link/address pair admits no more in-flight verifications than its remaining failure allowance, so simultaneous wrong codes cannot overshoot five failed verifications in any rolling sixty-second window. Occupied in-flight slots may temporarily refuse even a correct attempt without running its hash.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


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


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


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


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Finite code/body bounds remain DM-OQ-01 until reviewed.
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

- [ ] Compose one HTTPS proxy, Next.js, one API/cleanup owner, private PostgreSQL and dedicated nonclustered Redis. Route /api/v1 directly to backend, not Next.js relay. Work area: `compose.yml` (and matching files_hint targets).

- [ ] Configure Redis 256MiB/noeviction with no AOF/RDB/save-on-shutdown/persistent volume/backup. PostgreSQL volume and backup contain metadata only. Work area: `docker/` (and matching files_hint targets).

- [ ] Activate reviewed proxy/address policy, bounded request processing, no-store/no-referrer/restrictive self-hosted script policy and scrub route templates before proxy/app/datastore/telemetry collection. Work area: `backend/config/` (and matching files_hint targets).

- [ ] Document host swap/core-dump/snapshot exclusions, private health/readiness operations and startup/recovery checks. No fabricated public maintenance endpoint or deployment domain. Work area: `frontend/next.config.ts` (and matching files_hint targets).

- [ ] Use only newly generated nonsecret configuration examples; do not read existing credentials or operate production. Host controls that cannot be verified remain launch blockers. Work area: `backend/app/middleware/` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Host snapshots/swap unverified | Report unresolved launch gate; Compose alone is not proof. |
| Required dependency drops | Refuse Secret traffic without bypass; executable cleanup still runs. |

Edge-case sources: [spec.md](../spec.md) §5, AC-08, AC-10, AC-11, abridged; [sad.md](../sad.md) §6, S3, S4, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Disposable Compose smoke/integration checks prove direct same-origin routing, private stores, no-store/no-referrer on all outcomes, startup fail-closed and inspected Redis persistence/noeviction configuration.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
