---
id: "T15"
title: "Build neutral reading gate and explicit Show interactions"
layer: "ui"
deps: ["T4", "T12", "T14"]
blocks: ["T16"]
acs: ["AC-07", "AC-08", "AC-09", "AC-11b"]
files_hint: ["frontend/src/view/widgets/reading_gate/", "frontend/src/app/s/[token]/page.tsx", "frontend/tests/components/reading_gate.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T15 — Build neutral reading gate and explicit Show interactions

## Place in the sequence

- Blocked by: T4 — Bootstrap the neutral frontend and register shared primitives, T12 — Implement typed browser clients and conservative lifecycle guards, T14 — Build guarded share confirmation and separate handover. Blocks: T16 — Build exact reading and distinct unavailable screens. Wave: 11 (dependency depth, not elapsed days).

- Lane: T4, T16 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Build neutral reading gate and explicit Show interactions.

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


> **Concurrent-attempt semantics.** Check the basic rolling pair counter before hashing and deny when five failures are observed. Already-admitted concurrent guesses may exceed five; ADR-0009 explicitly defers exact quota reservations, leases and cross-process fencing to backlog T22. Keep atomic counter updates, no failure timestamp on rejected requests, no previous-failure reset on success, no link consumption and independent address pairs. The global two-native-call/no-queue bound remains hard, including distributed attempts; a timed-out/disconnected native call retains its permit until completion. Invalid input, capacity refusal and dependency uncertainty are not fabricated incorrect-code failures. Only a correct code plus final payload/readiness/PostgreSQL-time checks authorizes that response.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


> **Time and lifecycle obligations.** The countdown is presentation, not permission. PostgreSQL-derived expiration and fresh service timing govern final release and conservative browser deadlines; device wall-clock changes cannot extend the window. Hide locally offline and on background/pagehide/freeze; invalidate stale asynchronous display/copy callbacks. On return, stay concealed until neutral revalidation and a fresh explicit Show. T8/T12 own runtime clock/transit/sleep tests before serving; representative profiles remain due before plan-tests. No promise covers modified clients or Recipient copies.
>
> — `sad.md §6, S6, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> **Chosen:** Option 1. Add PostgreSQL for minimal link lifecycle records: a non-reversible lookup digest of an unguessable token, creation time and expiration time.
>
> — `adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md §Decision outcome, ADR-0005, abridged` · full text: [adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md](../adr/0005-persist-minimal-link-lifecycle-metadata-indefinitely.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


> | default | getSecretStatus 200 state available, reading_code_required false or true | NEW: ScreenFrame, RemainingLifetime, TextField, ActionButton, Notice | WF-03-A |
> | loading.status | Initial or return neutral lifecycle check; Show disabled, no Secret | NEW: Notice, ActionButton | WF-03-B |
> | validation | Required code omitted; local explanation or discloseSecret 403 short_live_path.code_required | NEW: TextField, Notice | WF-03-C |
> | loading.disclosure | Explicit Show pending; no content, disable repeated submission, no automatic retry | NEW: ActionButton, Notice | WF-03-B |
> | error.code_incorrect | discloseSecret 403 short_live_path.code_incorrect; no fragments or permanent consumption | NEW: TextField, Notice, ActionButton | WF-03-C |
> | error.verification_limited | discloseSecret 429 short_live_path.verification_limited; shared link/address slots occupied | NEW: Notice, ActionButton | WF-03-C |
> | error.invalid_request | discloseSecret 422 short_live_path.invalid_request; safe request explanation, no fabricated field details | NEW: Notice, ActionButton | WF-03-C |
> | error.temporary | Status/disclosure 503 short_live_path.service_unavailable or short_live_path.capacity_unavailable; network/offline/invalid response; never claim wrong code, expiry or unknown from a timeout | NEW: Notice, ActionButton | WF-03-D |
> | concealed | Background/resume/discontinuity: no old content/copy; recheck status then require fresh Show; S6 | NEW: Notice, ActionButton | WF-03-B / WF-03-D |
> | success | Eligible discloseSecret 200, valid active request and safe deadline before display | NEW: ScreenFrame | Transition to WF-04-A |
> | expired | Status state expired, discloseSecret 410 short_live_path.link_expired, local deadline or late eligible response; AC-10 | NEW: ScreenFrame | Transition to WF-05-B |
> | unavailable | Status state unknown/early_unavailable, or discloseSecret 409 short_live_path.link_unavailable | NEW: ScreenFrame | Transition to WF-05-A / WF-05-C; 409 uses a neutral recheck to distinguish, without auto-disclosure |
> | N/A: empty | No collection; unknown/malformed token is an unavailable state, not an empty reader | NEW: ScreenFrame | WF-05-A |
> | A Secret was shared with you                   |
> | Remaining [HH:MM:SS]                            |
> | Expires [service expiration; explicit zone]     |
> | Reading code [                              ]  |
> | (field only when reading_code_required = true)  |
> | [ Show Secret ]                                |
> | Opening this page does not reveal the content.  |
> | Repeated reading is allowed while available     |
> | before expiry. No account is required.          |
> | A Secret was shared with you                   |
> | Checking availability...                       |
> | [ Show Secret (disabled) ]                     |
> | No Secret content or enabled copy action.      |
> | [gate and safe countdown remain, if trusted]   |
> | Reading code [exact current entry           ]  |
> | [applicable error below; no submitted values]   |
> | [ Show Secret ]                               |
> | Content remains hidden.                        |
> | Availability could not be checked right now.   |
> | [ Check availability again ]                   |
> | This does not establish that the link expired. |
>
> — `screens.md §SCR-03, manifest states, verbatim` · full text: [screens.md](../screens.md)


Reuse/registration contract: Reuse ScreenFrame/TextField/ActionButton/Notice and T14 RemainingLifetime with canon styles; no new primitive needed. Source: [screens.md](../screens.md) §New components, proposed inventory, abridged; existing canon is absent until T4.

Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

## API contract

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

- [ ] Keep T15 green before T16: define typed disclosure/terminal-state callback props with this working gate, exercise parent callbacks in component tests, and keep the route neutral/concealed when no content renderer is attached. Never import or stub nonexistent SCR-04/05 widgets. T16 owns final route composition; no intermediate claim that content/terminal UI is feature-complete.

- [ ] Build SCR-03 default, status/disclosure loading, code validation/required/incorrect, verification-limited, safe temporary errors, offline/return concealed states and transitions. Work area: `frontend/src/view/widgets/reading_gate/` (and matching files_hint targets).

- [ ] Reuse ScreenFrame/TextField/ActionButton/Notice and T14 RemainingLifetime with canon styles; no new primitive needed. Work area: `frontend/src/app/s/[token]/page.tsx` (and matching files_hint targets).

- [ ] Initial/repeat visit does only neutral status; explicit Show alone invokes disclosure. Code entry has no create-only minimum and no retained unlocking session. Work area: `frontend/tests/components/reading_gate.spec.ts` (and matching files_hint targets).

- [ ] 409 triggers neutral classification, never auto-disclosure; map expiry and early loss to SCR-05 without turning a 503/network uncertainty into terminal loss. Work area: `frontend/tests/components/reading_gate.spec.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Code was correct on previous visit | Fresh Show and verification remain required. |
| Resume offline | Keep hidden, show safe temporary state rather than guessed expiration. |

Edge-case sources: [spec.md](../spec.md) §5, AC-07, AC-08, AC-09, AC-11b, abridged; [sad.md](../sad.md) §6, S3, S4, S6, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] SCR-03 tests cover all manifest states, no POST on navigation/resume/status, explicit repeated Show, missing/wrong/short codes, shared-pair 429, safe 503/offline return and 409 reclassification.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
