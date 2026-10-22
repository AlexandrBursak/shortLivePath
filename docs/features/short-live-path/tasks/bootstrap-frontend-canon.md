---
id: "T4"
title: "Bootstrap the neutral frontend and register shared primitives"
layer: "ui"
deps: ["T1", "T2"]
blocks: ["T12", "T13", "T14", "T15", "T16", "T17"]
acs: ["AC-08", "AC-12"]
files_hint: ["frontend/package.json", "frontend/pnpm-lock.yaml", "frontend/tsconfig.json", "frontend/eslint.config.mjs", "frontend/compose.yml", "frontend/docker/", "frontend/src/app/", "frontend/src/shared/ui/", "frontend/tests/", "frontend/docs/architecture.md", "docs/design-system.md"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T4 — Bootstrap the neutral frontend and register shared primitives

## Place in the sequence

- Blocked by: T1 — Resolve verifier budgets and trusted-address continuity, T2 — Resolve publication, clock and reservation state machines. Blocks: T12 — Implement typed browser clients and conservative lifecycle guards, T13 — Build the exact creation form and lifetime/code controls, T14 — Build guarded share confirmation and separate handover, T15 — Build neutral reading gate and explicit Show interactions, T16 — Build exact reading and distinct unavailable screens, T17 — Wire same-origin deployment and confidentiality controls. Wave: 2 (dependency depth, not elapsed days).

- Lane: T12, T13, T14, T15, T16, T19 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Bootstrap the neutral frontend and register shared primitives.

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


> **Time and lifecycle obligations.** The countdown is presentation, never permission to bypass S4's final service-side release check. Device wall-clock changes cannot extend the lifetime.
>
> — `sad.md §6, S6, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** web-frontend and backend-service. Set these exact values in sad.md target_surfaces.
>
> — `adr/0001-build-responsive-web-frontend-and-backend-service.md §Decision outcome, ADR-0001, abridged` · full text: [adr/0001-build-responsive-web-frontend-and-backend-service.md](../adr/0001-build-responsive-web-frontend-and-backend-service.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


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


No design-system or frontend inventory exists at breakdown time. Establish and review docs/design-system.md before registering primitives; no claimed preexisting component reuse. Source: [screens.md](../screens.md) §Source, component gap, abridged.

Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-08

> **Given** a Share link has not expired and its reading conditions are satisfied
> **When** the Recipient explicitly chooses Show on the neutral page, on an initial or repeat visit
> **Then** the Recipient can read and copy the Secret without registration while it remains available and unexpired. Opening the page alone reveals no Secret content, including in previews. Concurrent reading is permitted; no visit consumes the link.
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)


### AC-12

> **Given** a Recipient has copied external access details and the Share link later expires
> **When** the Recipient checks what expiration means
> **Then** the service explains that it does not change external passwords or revoke external server keys, and does not claim to erase saved copies.
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Pin compatible Next.js App Router/TypeScript/pnpm and browser-test tooling; establish Docker build/lint/typecheck/test scripts. Work area: `frontend/package.json` (and matching files_hint targets).

- [ ] Create docs/design-system.md with reviewed tokens and inventory before feature UI. No existing canon or architecture-map is present: do not claim reuse or assume a component library. Work area: `frontend/pnpm-lock.yaml` (and matching files_hint targets).

- [ ] Register only NEW ScreenFrame, TextField, ExactTextArea, ActionButton and Notice; compose them into thin neutral / and /s/{token} shells. Shared primitives stay generic and lower-layer-safe. Work area: `frontend/tsconfig.json` (and matching files_hint targets).

- [ ] Use safe title/metadata and no server Secret fetch, analytics, browser persistence or automatic disclosure. Record the same-repository exception. Work area: `frontend/eslint.config.mjs` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Direct open of capability URL | Neutral shell only; no Secret in HTML or metadata. |
| Canon not reviewed | Feature UI remains blocked; no invented tokens are treated as approved. |

Edge-case sources: [spec.md](../spec.md) §5, AC-08, AC-12, abridged; [sad.md](../sad.md) §6, S3, S6, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] Neutral-shell/component tests prove no disclosure request on navigation, keyboard focus/labels/busy states at 360px, active layer lint and green Docker frontend test/lint/typecheck/build.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
