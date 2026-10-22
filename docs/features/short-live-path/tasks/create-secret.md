---
id: "T9"
title: "Implement confirmed creation and its HTTP boundary"
layer: "ports"
deps: ["T5", "T6", "T7", "T8"]
blocks: ["T12", "T17"]
acs: ["AC-01", "AC-02", "AC-04", "AC-05", "AC-06"]
files_hint: ["backend/app/services/create_secret_service.ts", "backend/app/controllers/create_secret_controller.ts", "backend/app/validators/create_secret.ts", "backend/start/routes.ts", "backend/tests/integration/create_secret.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T9 — Implement confirmed creation and its HTTP boundary

## Place in the sequence

- Blocked by: T5 — Promote the staged lifecycle migration and Lucid model, T6 — Implement exact validation, token handling and bounded verification, T7 — Implement bounded Redis payload and admission transitions, T8 — Implement bounded cleanup and generation-fenced readiness. Blocks: T12 — Implement typed browser clients and conservative lifecycle guards, T17 — Wire same-origin deployment and confidentiality controls. Wave: 6 (dependency depth, not elapsed days).

- Lane: T3, T6, T10, T11 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Sender
> **I want** to enter optional address and login plus a password or multiline key, create a Share link without registration, and copy it
> **So that** I can give a client access details without keeping a permanent copy in this service.
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement confirmed creation and its HTTP boundary.

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

> | `id` | uuid | PK, NOT NULL | Service-generated UUID v4; internal handle for the Redis payload. Not an authorization capability or public lookup endpoint. |
> | `token_digest` | bytea | NOT NULL, UNIQUE, exactly 32 bytes | SHA-256 over the decoded 32 random token bytes, not over an arbitrary textual spelling. |
> | `created_at` | timestamptz | NOT NULL, finite, no DEFAULT | PostgreSQL clock sampled once at lifecycle INSERT, millisecond-aligned; commit/Redis/response delay consumes lifetime (ADR-0008). |
> | `expires_at` | timestamptz | NOT NULL, finite, no DEFAULT | Exactly created_at plus the selected integer minutes, 1–1440. UTC instants; millisecond-aligned service values allow exact Redis/DTO mapping. |
> | `code_verifier` | Encoded salted password-hard hash, or absent field | Absence means no code required. Never persist the plaintext code; malformed present verifier fails closed, not as code-disabled. Algorithm/cost/budget follow Accepted ADR-0006 initial values; calibration is T21. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

> POST /api/v1/secrets (createSecret). Request: required credential; optional address/login default empty, lifetime_minutes integer 1–1440/default 60, optional exact reading_code (create minimum six Unicode code points). Aggregate scalar-text UTF-8 bytes <=65536, excluding code/packaging; reject null, unknown fields and malformed scalar text. 201: data.share_url, data.expires_at, meta.service_time, no content/code echo. 422 short_live_path.invalid_request; 429 short_live_path.creation_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable.
>
> — `contracts/openapi.yaml §paths / components, createSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


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


### AC-02

> **Given** a Sender has omitted the password or key, provided only whitespace in that field, or entered more than 64 KiB of Secret text
> **When** the Sender attempts creation
> **Then** creation is blocked with a plain-language explanation and no Share link is issued. The 64 KiB limit counts the sum of the UTF-8 encoded address, login, and password or key text, excluding the Reading code and packaging overhead. Nonempty password or key text is preserved verbatim, not trimmed or normalized.
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)


### AC-04

> **Given** a Sender is creating a Secret
> **When** creation succeeds with the default lifetime or a chosen whole number of minutes from 1 to 1440
> **Then** expiration is one hour after the service records creation by default, or the chosen duration after that recorded creation time. Confirmation and delivery delay consume part of the chosen duration and do not restart or extend it. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices. The confirmation and reading experiences show a visible countdown of remaining lifetime based on service-established expiration and service time; changing the device wall clock does not extend access. Countdown display does not replace server-side expiration enforcement.
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)


### AC-05

> **Given** a Sender has entered a lifetime shorter than one minute, longer than twenty-four hours, or not a whole number of minutes
> **When** the Sender attempts creation
> **Then** creation is blocked and the permitted lifetime bounds are explained.
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)


### AC-06

> **Given** a Sender enables a Reading code
> **When** the Sender chooses a code or requests random generation
> **Then** creation requires at least six Unicode code points of any composition, longer codes are allowed up to 1024 UTF-8 bytes, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization. A code over this byte limit is rejected with an explanation, never truncated, and does not create a link.
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Thin controller validates, calls service and serializes the exact createSecret contract; service owns DB/Redis/hash coordination. Work area: `backend/app/services/create_secret_service.ts` (and matching files_hint targets).

- [ ] Prepare the optional verifier within hard work admission, then sample PostgreSQL creation/expiration once in the lifecycle INSERT. Confirm metadata before payload publication with the original deadline; return 201 only after final time/readiness/store confirmation. Work area: `backend/app/controllers/create_secret_controller.ts` (and matching files_hint targets).

- [ ] Definitive PG failure stops before payload; uncertain outcomes issue no confirmed link and never auto-retry. Preserve possible metadata/orphan original deadline with bounded cleanup; no quota reservation protocol is required. Work area: `backend/app/validators/create_secret.ts` (and matching files_hint targets).

- [ ] Install only this route with required no-store/no-referrer and safe error envelopes; no code/payload echo, Idempotency-Key guarantee or recovery surface. Work area: `backend/start/routes.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Lost response | No automatic retry/deduplication; deliberate retry creates fresh token and lifetime. |
| Metadata committed but payload absent | Retain lifecycle; no success claim or rollback of permanent recognition. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-02, AC-04, AC-05, AC-06, abridged; [sad.md](../sad.md) §6, S1, S2, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] createSecret contract/integration tests assert safe outcomes, fixed PostgreSQL-INSERT creation/expiration timestamps, shortened usable lifetime, no link on uncertain writes, basic observed 25-success checks and orphan nonextension.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
