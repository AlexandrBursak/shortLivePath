---
id: "T2"
title: "Resolve publication, clock and reservation state machines"
layer: "docs"
deps: []
blocks: ["T3", "T4"]
acs: ["AC-01", "AC-04", "AC-07", "AC-10", "AC-11"]
files_hint: ["docs/features/short-live-path/adr/", "docs/features/short-live-path/sad.md", "docs/features/short-live-path/data-model.md", "docs/features/short-live-path/contracts/openapi.yaml", "docs/features/short-live-path/contracts/events.md", "docs/features/short-live-path/spec.md"]
owner: "Product Owner + coding agent"
estimate: "8h"
context_budget: "M"
status: "done"
---

# T2 — Resolve publication, clock and reservation state machines

## Place in the sequence

- Blocked by: none. Blocks: T3 — Bootstrap the backend with executable quality gates, T4 — Bootstrap the neutral frontend and register shared primitives. Wave: 1 (dependency depth, not elapsed days).

- Lane: T1 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Sender
> **I want** to select a lifetime from one minute to twenty-four hours, defaulting to one hour
> **So that** disclosure lasts only for the intended handover window.
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)


This task records approved ADR-0008/0009: PostgreSQL-write lifetime/time, cleanup-before-serving and basic observed counters; exact quota reservations are deferred backlog T22 outside the v1 DAG. Runtime verification is explicitly not claimed.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Timing and scope obligations.** Expiration is the chosen interval after the PostgreSQL lifecycle INSERT (ADR-0008), not after final confirmation. Prepare the optional verifier before INSERT; sample database-derived millisecond timestamps once and never republish them. Commit/Redis/response delay consumes lifetime; no one-second release grace is implied. Lost confirmation and uncertain writes produce no link, auto-retry or deadline extension. Exact concurrent quota reservation is deferred by ADR-0009; input/hash bounds remain mandatory.
>
> — `sad.md §6, S1, abridged` · full text: [sad.md](../sad.md)


> **Admission and failure semantics.** Basic admission checks 25 observed successes per rolling sixty-second address window; already-admitted concurrent requests can overshoot. Keep 1000 active Secrets, Redis 256 MiB/noeviction and 10000 transient counter identities, with safe refusal rather than eviction. Address/pair state uses retained keyed pseudonyms and expires within five minutes of last relevant request. No v1 quota reservations/leases or pending-slot registry exists. Known refusal yields no link; uncertain writes do not prove absence, and every possible payload retains its original hard deadline. Immutable metadata is not deleted as rollback. Manual retry is a fresh attempt, never recovery or extension.
>
> — `sad.md §6, S2, abridged` · full text: [sad.md](../sad.md)


> **Time and lifecycle obligations.** The countdown is presentation, not permission. PostgreSQL-derived expiration and fresh service timing govern final release and conservative browser deadlines; device wall-clock changes cannot extend the window. Hide locally offline and on background/pagehide/freeze; invalidate stale asynchronous display/copy callbacks. On return, stay concealed until neutral revalidation and a fresh explicit Show. T8/T12 own runtime clock/transit/sleep tests before serving; representative profiles remain due before plan-tests. No promise covers modified clients or Recipient copies.
>
> — `sad.md §6, S6, abridged` · full text: [sad.md](../sad.md)


> **Retention and outage boundaries.** The <=60-second active-record deletion bound remains mandatory while Redis can execute cleanup. TTL, a five-second tick or a fail-closed API alone is not proof; T8/T18 must test cleanup under faults and capacity. No physical RAM-erasure deadline applies during suspension/hang. Startup/recovery closes traffic, establishes current single-process ownership and safe PostgreSQL time, clears expired records and only then reopens. Continue possible Redis cleanup during PostgreSQL outage. Lost payloads are never reconstructed. Address/key continuity keeps ADR-0009 quiet-window recovery, while exact quota reservation reconciliation is deferred.
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


> | DM-OQ-02 | RESOLVED by ADR-0008: sample PostgreSQL creation/expiration once at lifecycle INSERT after verifier preparation. Redis and confirmation retain that original deadline; no final timestamp publication. | T9 implements/tests write failures and shortened usable lifetime; not a decision blocker. |
>
> — `data-model.md §Open technical decisions, DM-OQ-02, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-03 | APPROVED policy in ADR-0008: PostgreSQL time, final release check, conservative browser timing, unsafe-clock closure and startup/recovery cleanup before serving. Runtime clock/suspend and cleanup-budget implementation/evidence remain T8/T12 obligations. | Runtime verification before serving Secrets/launch, not an unresolved product choice. |
>
> — `data-model.md §Open technical decisions, DM-OQ-03, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-04 | DEFERRED by ADR-0009: exact concurrent creation/failure ceilings, quota reservations, leases and cross-process quota reconciliation. Basic rolling counters, hard resource caps and current-process readiness protection remain mandatory. | Backlog T22 outside tasks.json; revisit before replicas or when actual abuse/concurrency warrants it. |
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
> **Then** expiration is one hour after the service records creation by default, or the chosen duration after that recorded creation time. Confirmation and delivery delay consume part of the chosen duration and do not restart or extend it. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices. The confirmation and reading experiences show a visible countdown of remaining lifetime based on service-established expiration and service time; changing the device wall clock does not extend access. Countdown display does not replace server-side expiration enforcement.
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; bounded hash work remains mandatory, while exact concurrent quota reservations are deferred. Basic admission uses observed failure counters; already-admitted simultaneous attempts may exceed the nominal threshold, so v1 does not promise an exact five-failure concurrent ceiling. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
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

- [x] Record DM-OQ-02 as resolved by ADR-0008: one PostgreSQL-derived INSERT timestamp pair, no final timestamp publication or extension. Work area: `docs/features/short-live-path/adr/` (and matching files_hint targets).

- [x] Record DM-OQ-03 policy approval: PostgreSQL time, final check, browser conceal/revalidation and cleanup before serving; T8/T12/T18 implement and verify runtime details. Work area: `docs/features/short-live-path/sad.md` (and matching files_hint targets).

- [x] Record DM-OQ-04 as explicitly deferred to backlog T22, outside tasks.json with no scaffold/launch dependency. Retain basic counters, hard resource caps and expiry/privacy checks. Work area: `docs/features/short-live-path/data-model.md` (and matching files_hint targets).

- [x] Record actual Product Owner approval, synchronize source/API/task snapshots and run structural checks; no independent security or runtime verification is claimed. Work area: `docs/features/short-live-path/contracts/openapi.yaml` (and matching files_hint targets).

- [x] Use executed documentation/API/task structural checks for this decision-only task; runtime RED/GREEN and fault tests remain implementation obligations.

## Edge cases

| Case | Behaviour |
|---|---|
| Metadata confirmed, payload uncertain | No confirmed URL; retain metadata and original deadline; never infer absence or extend expiry. |
| Concurrent quota checks admit together | Acknowledge possible nominal-threshold overshoot; exact reservation proof is deferred. Hard native-work/storage/expiry limits remain. |
| Cleanup/clock uncertain | Readiness remains closed; executable cleanup continues. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-04, AC-07, AC-10, AC-11, abridged; [sad.md](../sad.md) §6, S1, S2, S6, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [x] Record Accepted ADR-0008/0009 PostgreSQL-write/time and simplified quota policy, synchronize sources/API/tasks, and put exact concurrent quota reservations in backlog T22 outside the v1 DAG; runtime proof remains implementation work.

- [x] All inlined hard rules still hold; tests cite their AC IDs.

- [x] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [x] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
