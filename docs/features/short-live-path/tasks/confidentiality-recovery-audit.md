---
id: "T18"
title: "Verify canary confidentiality and fault-recovery boundaries"
layer: "tests"
deps: ["T17"]
blocks: ["T20"]
acs: ["AC-07", "AC-09", "AC-10", "AC-11", "AC-11b"]
files_hint: ["backend/tests/security/", "backend/tests/integration/faults/", "scripts/verify_retention/", "docs/features/short-live-path/_audit/runtime-security.md"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T18 — Verify canary confidentiality and fault-recovery boundaries

## Place in the sequence

- Blocked by: T17 — Wire same-origin deployment and confidentiality controls. Blocks: T20 — Measure workload budgets and install aggregate synthetic checks. Wave: 14 (dependency depth, not elapsed days).

- Lane: T3 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Recipient
> **I want** the Secret to become unavailable after expiration and to understand what that means
> **So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Verify canary confidentiality and fault-recovery boundaries.

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


> **Retention and outage boundaries.** The <=60-second active-record deletion target applies during normal healthy operation, not merely whenever Redis alone is reachable. Physical cleanup may be delayed or missed during service/runtime outages, dependency downtime (including PostgreSQL unavailable at startup), or suspension/hang. Each subsequent cleanup selects all expired backlog by original deadline, with no recent-interval lower cutoff; bounded batches continue until all due debt is cleared before Secret traffic resumes. TTL, a scheduler tick or closed readiness alone is not proof. Startup/recovery establishes current ownership, safe PostgreSQL time and dependencies before reopening. Continuing safe cleanup during PostgreSQL outage is useful but is not an outage erasure guarantee or a reason to redesign the scheduler (ADR-0004 amendment, 2026-10-23). Lost payloads are never reconstructed. Address/key continuity keeps ADR-0009 quiet-window recovery, while exact quota reservation reconciliation is deferred.
>
> — `sad.md §6, S7, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


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

### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; bounded hash work remains mandatory, while exact concurrent quota reservations are deferred. Basic admission uses observed failure counters; already-admitted simultaneous attempts may exceed the nominal threshold, so v1 does not promise an exact five-failure concurrent ceiling. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


### AC-09

> **Given** a Share link is invalid or unavailable
> **When** the Recipient opens it
> **Then** a safe unavailability message contains no Secret fragments; simply viewing a page never consumes a valid Share link. For a known expired link, opening the original URL shows an explicit expired state rather than a missing-page/404 experience. Persist minimal link lifecycle metadata indefinitely for now so this distinction survives Secret deletion and Redis restarts. An unknown link remains safely unavailable. If a known unexpired link has lost its Secret, explain early unavailability, not expiration or recovery.
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)


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

- [ ] Create disposable canary payloads/codes/tokens, exercise success/refusal/errors, and inspect proxy/app/datastore/telemetry/cache/disk/backup artifacts without printing sensitive test values. Work area: `backend/tests/security/` (and matching files_hint targets).

- [ ] Test metadata-only backup/restore, empty Redis restart, original expired recognition and unexpired early loss. Never restore payloads or verifiers. Work area: `backend/tests/integration/faults/` (and matching files_hint targets).

- [ ] Fault-inject uncertain PG/Redis commits, runtime/OOM script errors, duplicate maintenance and stale generations, clock rollback and suspension beyond 60s; independently measure the normal-healthy-operation deletion target and verify all-expired-backlog catch-up before serving after outages. Work area: `scripts/verify_retention/` (and matching files_hint targets).

- [ ] Record actual runtime and host retention evidence and unresolved launch controls; do not mark independent security approval or production compliance from local tests. Work area: `docs/features/short-live-path/_audit/runtime-security.md` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| PG outage while Redis executes, including startup PG down | Retain closed readiness; delayed physical cleanup is accepted. Verify all expired backlog is caught before serving resumes, not <=60s outage erasure or a new scheduler design. |
| Suspended VM holds old memory | No physical-zeroization claim; verify closed recovery ordering. |

Edge-case sources: [spec.md](../spec.md) §5, AC-07, AC-09, AC-10, AC-11, AC-11b, abridged; [sad.md](../sad.md) §6, S2, S4, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Canary audit has zero payload/code/full-link log/backup hits; fault suites prove no late releases, <=60s deletion during normal healthy operation and all-expired-backlog cleanup before serving after accepted outage/dependency-down/suspension delay, or explicitly block launch on remaining unmet obligations with evidence.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
