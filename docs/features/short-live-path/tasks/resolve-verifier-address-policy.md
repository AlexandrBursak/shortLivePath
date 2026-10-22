---
id: "T1"
title: "Resolve verifier budgets and trusted-address continuity"
layer: "docs"
deps: []
blocks: ["T3", "T4"]
acs: ["AC-06", "AC-07"]
files_hint: ["docs/features/short-live-path/adr/", "docs/features/short-live-path/data-model.md", "docs/features/short-live-path/contracts/openapi.yaml", "docs/features/short-live-path/spec.md", "docs/features/short-live-path/_audit/generate-api.py", "docs/features/short-live-path/_audit/verify-api.py"]
owner: "Product Owner + coding agent"
estimate: "8h"
context_budget: "M"
status: "done"
---

# T1 — Resolve verifier budgets and trusted-address continuity

## Place in the sequence

- Blocked by: none. Blocks: T3 — Bootstrap the backend with executable quality gates, T4 — Bootstrap the neutral frontend and register shared primitives. Wave: 1 (dependency depth, not elapsed days).

- Lane: T2 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

## Why (user story)

> **As a** Sender
> **I want** to optionally choose or generate a Reading code and communicate it separately
> **So that** possession of the Share link alone need not permit reading.
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Resolve verifier budgets and trusted-address continuity. ADR-0006/0007 are Accepted starting values by explicit Product Owner approval on 2026-10-22; T1 documentation synchronization is complete; see _audit/api-validation.md for executed structural evidence. No independent security review is claimed. Benchmark calibration is T21 after T3, not a T1 completion prerequisite. Actual topology/key configuration and fault verification remain implementation/deployment work.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Concurrent-attempt semantics.** Each link/address pair admits no more in-flight verifications than its remaining failure allowance, so simultaneous wrong codes cannot overshoot five failed verifications in any rolling sixty-second window. Occupied in-flight slots may temporarily refuse even a correct attempt without running its hash.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


> | DM-OQ-01 | Accepted initial values in ADR-0006: Argon2id v19, m=65536 KiB/t=3/p=4, salt 16 bytes/output 32 bytes, 2 concurrent calls/no queue, code <=1024 UTF-8 bytes/body <=524288 wire bytes. T1 spec/API synchronization is complete; T21 calibrates after T3. | Backend/security responsibility; source sync complete; benchmark after scaffolding/before T20. |
>
> — `data-model.md §Open technical decisions, DM-OQ-01, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-05 | Accepted policy in ADR-0007: pinned immediate proxy, canonical full address, versioned HMAC-SHA-256/32-byte deployment key, stable restart identity and fenced >=60s quiet interval on continuity loss/rotation. Actual allowlist/key provisioning and T2 fencing/time integration remain pending. | Backend/security responsibility; T1 source sync complete; T2 executable protocol, deployment verification before launch. |
>
> — `data-model.md §Open technical decisions, DM-OQ-05, abridged` · full text: [data-model.md](../data-model.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

## API contract

> POST /api/v1/secrets (createSecret). Request: required credential; optional address/login default empty, lifetime_minutes integer 1–1440/default 60, optional exact reading_code (create minimum six Unicode code points). Aggregate scalar-text UTF-8 bytes <=65536, excluding code/packaging; reject null, unknown fields and malformed scalar text. 201: data.share_url, data.expires_at, meta.service_time, no content/code echo. 422 short_live_path.invalid_request; 429 short_live_path.creation_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable.
>
> — `contracts/openapi.yaml §paths / components, createSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> POST /api/v1/secrets/{token}/disclosures (discloseSecret). Required JSON object {}, or {reading_code:string}; shorter guesses are allowed, null/unknown fields are invalid. 200: data.secret {address,login,credential}, data.expires_at, meta.service_time. 403 short_live_path.code_required or short_live_path.code_incorrect; 409 short_live_path.link_unavailable; 410 short_live_path.link_expired; 422 short_live_path.invalid_request; 429 short_live_path.verification_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable. No read consumption, sessions or automatic POST retries.
>
> — `contracts/openapi.yaml §paths / components, discloseSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Accepted ADR-0006: code <=1024 UTF-8 bytes, body <=524288 wire bytes, identity-only encoding, two concurrent hash calls/no queue. Both POST operations have safe 413 short_live_path.request_too_large and 415 short_live_path.unsupported_media_type outcomes before expensive work; code overflow is 422 invalid_request with no failed-code increment. ADR-0007 unsafe trusted-address/continuity context is 503 service_unavailable, not wrong code.
>
> — `contracts/openapi.yaml §components / security, shared envelope and headers, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-06

> **Given** a Sender enables a Reading code
> **When** the Sender chooses a code or requests random generation
> **Then** creation requires at least six Unicode code points of any composition, longer codes are allowed up to 1024 UTF-8 bytes, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization. A code over this byte limit is rejected with an explanation, never truncated, and does not create a link.
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [x] Resolve DM-OQ-01: record the Accepted ADR-0006 library/cost, finite code/body bytes and global concurrent/no-queue work budget; delegate reproducible calibration to T21 after T3; retain exact six-code-point minimum and shorter disclosure guesses. Work area: `docs/features/short-live-path/adr/` (and matching files_hint targets).

- [x] Resolve DM-OQ-05: document trusted proxy topology, canonical address representation, HMAC custody/rotation and fail-closed quota continuity across restart/state loss. Work area: `docs/features/short-live-path/data-model.md` (and matching files_hint targets).

- [x] Record Product Owner acceptance without claiming independent security sign-off; synchronize model/spec and Draft contract. An unresolved choice stays blocked, never gets a guessed default. Work area: `docs/features/short-live-path/contracts/openapi.yaml` (and matching files_hint targets).

- [x] This decision-only task uses executed API/task structural checks and recorded Product Owner acceptance as evidence. No application RED/GREEN cycle or runtime security test is claimed; those belong to implementation/verification tasks.

## Edge cases

| Case | Behaviour |
|---|---|
| Untrusted forwarding header | The public proxy overwrites it; API accepts only the pinned immediate proxy with exactly one valid literal address, otherwise fails closed before new limiter state. |
| Unapproved cost, limits or continuity | Keep implementation blocked; request review, not a guessed runtime default. |

Edge-case sources: [spec.md](../spec.md) §5, AC-06, AC-07, abridged; [sad.md](../sad.md) §6, S4, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [x] Record Accepted ADR-0006/0007 starting values and synchronize model/spec/API policy with explicit remaining T2 and deployment obligations; benchmark evidence belongs to post-scaffold T21, not this gate.

- [x] All inlined hard rules still hold; tests cite their AC IDs.

- [x] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [x] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
