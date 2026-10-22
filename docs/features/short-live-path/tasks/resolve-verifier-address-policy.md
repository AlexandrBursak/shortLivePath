---
id: "T1"
title: "Resolve verifier budgets and trusted-address continuity"
layer: "docs"
deps: []
blocks: ["T3", "T4"]
acs: ["AC-06", "AC-07"]
files_hint: ["docs/features/short-live-path/adr/", "docs/features/short-live-path/data-model.md", "docs/features/short-live-path/contracts/openapi.yaml"]
owner: "Product Owner + coding agent"
estimate: "8h"
context_budget: "M"
status: "todo"
---

# T1 — Resolve verifier budgets and trusted-address continuity

## Place in the sequence

- Blocked by: none. Blocks: T3 — Bootstrap the backend with executable quality gates, T4 — Bootstrap the neutral frontend and register shared primitives. Wave: 1 (dependency depth, not elapsed days).

- Lane: T2 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Sender
> **I want** to optionally choose or generate a Reading code and communicate it separately
> **So that** possession of the Share link alone need not permit reading.
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Resolve verifier budgets and trusted-address continuity.

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


> | DM-OQ-01 | Salted password-hard verifier (baseline Argon2), implementation, parameters, finite code/request bytes, global work/queue budgets and benchmark profile. Preserve exact code comparison and approved minimum.  | Backend/security responsibility, before executable tasks/implementation. |
>
> — `data-model.md §Open technical decisions, DM-OQ-01, abridged` · full text: [data-model.md](../data-model.md)


> | DM-OQ-05 | Trusted proxy list, canonical address representation, HMAC key custody/rotation and restart continuity. Redis state loss or key rotation must not silently reset active quotas; choose a fail-closed continuity policy.  | Backend/security responsibility, before executable tasks. |
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


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Finite code/body bounds remain DM-OQ-01 until reviewed.
>
> — `contracts/openapi.yaml §components / security, shared envelope and headers, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-06

> **Given** a Sender enables a Reading code
> **When** the Sender chooses a code or requests random generation
> **Then** creation requires at least six Unicode code points of any composition, longer codes are allowed, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization.
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Resolve DM-OQ-01: pin the salted password-hard library/cost, finite code/body bytes and global concurrent/queued work using a reproducible benchmark; retain exact six-code-point minimum and shorter disclosure guesses. Work area: `docs/features/short-live-path/adr/` (and matching files_hint targets).

- [ ] Resolve DM-OQ-05: document trusted proxy topology, canonical address representation, HMAC custody/rotation and fail-closed quota continuity across restart/state loss. Work area: `docs/features/short-live-path/data-model.md` (and matching files_hint targets).

- [ ] Record Product Owner/security review evidence; synchronize model and Draft contract. An unresolved choice stays blocked, never gets a guessed default. Work area: `docs/features/short-live-path/contracts/openapi.yaml` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Untrusted forwarding header | Ignore it; canonicalize only the trusted connection/proxy-derived address. |
| Unapproved cost, limits or continuity | Keep implementation blocked; request review, not a guessed runtime default. |

Edge-case sources: [spec.md](../spec.md) §5, AC-06, AC-07, abridged; [sad.md](../sad.md) §6, S4, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Decision review verifies DM-OQ-01/05 have concrete reviewed values, benchmark evidence and spoofing/restart/rotation test vectors; no unresolved value is marked approved.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
