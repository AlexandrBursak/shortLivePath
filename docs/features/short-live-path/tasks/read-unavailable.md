---
id: "T16"
title: "Build exact reading and distinct unavailable screens"
layer: "ui"
deps: ["T4", "T12", "T14", "T15"]
blocks: ["T17"]
acs: ["AC-03", "AC-08", "AC-09", "AC-10", "AC-11b", "AC-12"]
files_hint: ["frontend/src/view/widgets/read_secret/", "frontend/src/view/widgets/unavailable_secret/", "frontend/src/view/components/exact_copy_field/", "frontend/tests/components/read_secret.spec.ts", "frontend/tests/components/unavailable_secret.spec.ts", "docs/design-system.md", "frontend/src/app/s/[token]/page.tsx", "frontend/tests/integration/reading_route.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "L" # justified: inseparable exact AC and screen-state contract for this bounded task.
status: "blocked"
---

# T16 — Build exact reading and distinct unavailable screens

## Place in the sequence

- Blocked by: T4 — Bootstrap the neutral frontend and register shared primitives, T12 — Implement typed browser clients and conservative lifecycle guards, T14 — Build guarded share confirmation and separate handover, T15 — Build neutral reading gate and explicit Show interactions. Blocks: T17 — Wire same-origin deployment and confidentiality controls. Wave: 12 (dependency depth, not elapsed days).

- Lane: T4, T13, T14, T15 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Build exact reading and distinct unavailable screens.

## Inlined context

> Content is sent over HTTPS and may be read and processed by the service while retained. Expiration stops further disclosure and removes stored Secret data. Operator-blind browser encryption is not a requirement.
>
> — `spec.md §1, committed approach, verbatim` · full text: [spec.md](../spec.md)


> Thin AdonisJS controllers validate and delegate to services; services own lifecycle rules, Redis access and Lucid metadata operations. The browser uses typed data-layer clients and renders Secret text as inert text, never HTML or a redirect. No recipient identity/list or ownership-management module is introduced.
>
> — `sad.md §5, module boundaries, abridged` · full text: [sad.md](../sad.md)


> **Browser and copy boundaries.** Copy helpers pass the original field string without trimming, newline conversion, Unicode normalization or formatting. Manual selection is a fallback while the same text remains eligible, not a download, stored draft or recovery feature.
>
> — `sad.md §6, S5, abridged` · full text: [sad.md](../sad.md)


> **Time and lifecycle obligations.** The countdown is presentation, not permission. PostgreSQL-derived expiration and fresh service timing govern final release and conservative browser deadlines; device wall-clock changes cannot extend the window. Hide locally offline and on background/pagehide/freeze; invalidate stale asynchronous display/copy callbacks. On return, stay concealed until neutral revalidation and a fresh explicit Show. T8/T12 own runtime clock/transit/sleep tests before serving; representative profiles remain due before plan-tests. No promise covers modified clients or Recipient copies.
>
> — `sad.md §6, S6, abridged` · full text: [sad.md](../sad.md)


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


> | default | Valid exact Secret, active page and strictly eligible deadline | NEW: ScreenFrame, RemainingLifetime, ExactCopyField, Notice | WF-04-A |
> | loading | Individual exact-field clipboard operation pending; guard before submission and after completion | NEW: ExactCopyField | WF-04-B |
> | success | Readable exact text or clipboard success while eligible; announce copied item only | NEW: ExactCopyField, Notice | WF-04-A / WF-04-B |
> | error.copy | Clipboard denied/failed; manual selection only while eligible | NEW: ExactCopyField, Notice | WF-04-B |
> | error.response | Invalid/inconsistent/superseded disclosure: discard without partial rendering; S5 | NEW: ScreenFrame, Notice | Return to safe SCR-03 WF-03-D, preserving no Secret fragments |
> | concealed | Background/freeze/return: hide and invalidate prior work, no content-copy; S6 | NEW: ScreenFrame, Notice | Transition to SCR-03 WF-03-B / WF-03-D |
> | expired | Local offline deadline or late response/completion; discard content, disable copy; AC-10 | NEW: ScreenFrame | Transition to WF-05-B |
> | N/A: empty | Required credential must exist; empty optional address/login are omitted, not a separate empty screen | NEW: ExactCopyField | WF-04-A |
> | N/A: validation | Read-only screen, no credential editing or submission | NEW: ScreenFrame | WF-04-A |
> | Secret                                         |
> | Remaining [HH:MM:SS]                            |
> | Expires [service expiration; explicit zone]     |
> | Address (only if nonempty)                      |
> | [exact inert text]              [ Copy address ]|
> | Login (only if nonempty)                        |
> | [exact inert text]              [ Copy login ]  |
> | Password or key                                |
> | [exact text                                   ]|
> | [  line breaks and spaces preserved           ]|
> | [long lines scroll inside the block           ]|
> | [ Copy password or key ]                       |
> | Expiry stops access through this service, not   |
> | external credentials or copies already saved.   |
> | [ Copying password or key... (disabled) ]      |
> | Success: Password or key copied.               |
> | OR Error: Could not copy. Select the exact     |
> | text manually while it remains available.     |
>
> — `screens.md §SCR-04, manifest states, verbatim` · full text: [screens.md](../screens.md)


> | default | Unknown/malformed token, status state unknown; safe no-content unavailable message | NEW: ScreenFrame, Notice, ActionButton | WF-05-A |
> | empty | No retrievable known Secret for unknown link; same safe default, no fragments | NEW: ScreenFrame, Notice, ActionButton | WF-05-A |
> | error.expired | status state expired, disclosure 410 short_live_path.link_expired or conservative local deadline reached | NEW: ScreenFrame, Notice, ActionButton | WF-05-B |
> | error.early_unavailable | status state early_unavailable (including 409 followed by that neutral classification); AC-11b | NEW: ScreenFrame, Notice, ActionButton | WF-05-C |
> | N/A: loading | No disclosure/recovery request here; any unresolved check remains concealed at SCR-03 | NEW: ScreenFrame | WF-03-B / WF-03-D |
> | N/A: success | Terminal unavailability is not a successful disclosure or physical-erasure receipt | NEW: ScreenFrame | WF-05-A / WF-05-B / WF-05-C |
> | N/A: validation | No editable form; Create a new Secret starts empty SCR-01 | NEW: ActionButton | WF-01-A |
> | The Secret at this link is unavailable          |
> | Recovery is not available. Ask the Sender to    |
> | create and share a new link.                    |
> | This does not change external passwords or     |
> | server keys, or erase copies already acquired.  |
> | [ Create a new Secret ]                         |
> | This Share link has expired                    |
> | Expired [known service expiration; zone]        |
> | No new disclosure is available through it.      |
> | Recovery is not available. Ask the Sender for   |
> | a newly created link.                          |
> | External passwords/keys and previously saved   |
> | copies are not revoked or erased.              |
> | [ Create a new Secret ]                         |
> | The Secret became unavailable before expiry    |
> | Temporary content may be lost after a crash.    |
> | The cause is not confirmed here. No recovery.   |
> | Ask the Sender to create and share a new link.  |
> | External passwords/keys and previously saved   |
> | copies are not revoked or erased.              |
> | [ Create a new Secret ]                         |
>
> — `screens.md §SCR-05, manifest states, verbatim` · full text: [screens.md](../screens.md)


Reuse/registration contract: Reuse canon ScreenFrame/ActionButton/Notice and RemainingLifetime; NEW ExactCopyField composes canon primitives and T12 guarded exact-copy, registering only this composite. Source: [screens.md](../screens.md) §New components, proposed inventory, abridged; existing canon is absent until T4.

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

### AC-03

> **Given** a Secret contains a multiline key
> **When** the Recipient reads and copies it before expiration
> **Then** its characters, spaces, and line breaks are preserved without alteration.
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)


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


### AC-10

> **Given** a Share link has reached expiration
> **When** a Recipient attempts a new disclosure, including with the correct Reading code
> **Then** the service refuses to release Secret data at or after expiration, checking the time immediately before release rather than only when reading begins. The normal application checks expiration before display and must not show a response that arrives after expiration. A running page hides displayed content locally at expiration even without network access; after suspension or a return to the page it checks expiration before redisplaying content. This is a normal-application guarantee, not remote revocation of plaintext or ciphertext and keys already obtained by a Recipient. Data released before expiration cannot be recalled while in transit.
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)


### AC-11b

> **Given** a crash or restart has removed a Secret before its scheduled expiration
> **When** a Recipient attempts to show it
> **Then** the page explains that the Secret is unavailable, reveals no content, and does not offer recovery; a new Share link must be requested from the Sender.
>
> — `spec.md §5, AC-11b, verbatim` · full text: [spec.md](../spec.md)


### AC-12

> **Given** a Recipient has copied external access details and the Share link later expires
> **When** the Recipient checks what expiration means
> **Then** the service explains that it does not change external passwords or revoke external server keys, and does not claim to erase saved copies.
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Compose SCR-03/04/05 in `frontend/src/app/s/[token]/page.tsx` using the existing thin route and client reading-widget boundary. Connect T15 typed outcome callbacks to T16 read/unavailable widgets; no sensitive server rendering. Add `frontend/tests/integration/reading_route.spec.ts` for status → explicit Show → exact reading, unknown/expired/early-unavailable states and concealed return.

- [ ] Build SCR-04 loading/default/success/error.copy/error.response/concealed/expired and SCR-05 default/empty/error.expired/error.early_unavailable; preserve original shared URL. Work area: `frontend/src/view/widgets/read_secret/` (and matching files_hint targets).

- [ ] Reuse canon ScreenFrame/ActionButton/Notice and RemainingLifetime; NEW ExactCopyField composes canon primitives and T12 guarded exact-copy, registering only this composite. Work area: `frontend/src/view/widgets/unavailable_secret/` (and matching files_hint targets).

- [ ] Display exact inert selectable preformatted strings with internal long-line scroll; omit empty optional fields, per-field copy only, no Copy all/download/linkification/preview fetching. Work area: `frontend/src/view/components/exact_copy_field/` (and matching files_hint targets).

- [ ] Discard invalid/late responses without partial render; conceal on lifecycle events, disable copy and route to safe states. Distinguish unknown, known expiry and early loss without recovery or erasure claims. Work area: `frontend/tests/components/read_secret.spec.ts` (and matching files_hint targets).

- [ ] Show explicit external password/key and saved-copy limits; Create a new Secret starts blank SCR-01. Work area: `frontend/tests/components/unavailable_secret.spec.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Payload looks partly valid | Discard whole response, no fragments. |
| Known expired URL after Redis loss | Explicit expired screen, not framework 404. |
| Already submitted clipboard data | Explain copies cannot be recalled; never imply remote deletion. |

Edge-case sources: [spec.md](../spec.md) §5, AC-03, AC-08, AC-09, AC-10, AC-11b, AC-12, abridged; [sad.md](../sad.md) §6, S5, S6, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] SCR-04/05 tests assert byte-exact multiline field/clipboard text, denied-copy manual fallback, no script/link execution, all safe terminal states and no late/stale/partial content restoration. Reading-route integration tests prove status → explicit Show → SCR-04/05 and concealed return at the original URL.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
