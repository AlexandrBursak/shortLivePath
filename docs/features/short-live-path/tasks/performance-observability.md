---
id: "T20"
title: "Measure workload budgets and install aggregate synthetic checks"
layer: "tests"
deps: ["T18", "T19", "T21"]
blocks: []
acs: ["AC-01", "AC-04", "AC-07", "AC-11"]
files_hint: ["scripts/load/", "docker/monitoring/", "docs/operations.md", "docs/features/short-live-path/_audit/performance.md"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T20 — Measure workload budgets and install aggregate synthetic checks

## Place in the sequence

- Blocked by: T18 — Verify canary confidentiality and fault-recovery boundaries, T19 — Verify all screens, exact copies and browser lifecycle safety, T21 — Benchmark Reading code budgets after backend scaffolding. Blocks: none. Wave: 15 (dependency depth, not elapsed days).

- Lane: T17 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

## Why (user story)

> **As a** Recipient
> **I want** the Secret to become unavailable after expiration and to understand what that means
> **So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Measure workload budgets and install aggregate synthetic checks.

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


> **Concurrent-attempt semantics.** Each link/address pair admits no more in-flight verifications than its remaining failure allowance, so simultaneous wrong codes cannot overshoot five failed verifications in any rolling sixty-second window. Occupied in-flight slots may temporarily refuse even a correct attempt without running its hash.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


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


### AC-11

> **Given** a Secret has expired
> **When** the service applies its retention policy
> **Then** active stored Secret data is removed within sixty seconds of expiration while Redis is running and able to execute cleanup. During process or virtual-machine suspension/hang, physical removal from memory within that interval is not guaranteed; after recovery, expired records are cleared before serving Secret traffic resumes. The service never releases expired data, independently of cleanup. Secret records have no disk persistence, backups or recovery; Secret content, Reading codes, and full Share links are absent from logs and backups. Removal means deletion from active service storage, not guaranteed forensic zeroization of RAM.
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Use the reviewed browser/network/hardware/workload profile; measure HTTPS end-to-end p95 <=2s at 10ops/s with up-to-64KiB payloads and optional hash work. Record mix and address/link distribution. Work area: `scripts/load/` (and matching files_hint targets).

- [ ] Exercise 1000-payload/256MiB/10000-limiter limits, 25-success rolling quotas and bounded work with distinct intended rejection/eligible-success measurements; no production load. Work area: `docker/monitoring/` (and matching files_hint targets).

- [ ] Install aggregate allowlisted latency, readiness, cleanup age/deletion breach, capacity/cardinality and metadata-growth monitoring; external synthetic creation/read uses disposable values without logged links. Work area: `docs/operations.md` (and matching files_hint targets).

- [ ] Document calendar-month 99.5% availability measurement policy. A short load run is not evidence of monthly availability; retain launch blockers on failed measurements. Work area: `docs/features/short-live-path/_audit/performance.md` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Rate rejection counted as fast success | Exclude from eligible latency attainment and report separately. |
| Capacity below target under measured memory | Report failure and tune reviewed budgets without evicting existing Secrets. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-04, AC-07, AC-11, abridged; [sad.md](../sad.md) §6, S1, S2, S4, S7, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Reproducible load report records achieved eligible throughput/p95, error/limit mix and deletion latency; synthetic/alert smoke tests pass without sensitive labels, and monthly availability remains explicitly unmeasured until a full calendar window.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
