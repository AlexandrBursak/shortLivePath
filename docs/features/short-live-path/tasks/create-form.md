---
id: "T13"
title: "Build the exact creation form and lifetime/code controls"
layer: "ui"
deps: ["T4", "T12"]
blocks: ["T14"]
acs: ["AC-01", "AC-02", "AC-04", "AC-05", "AC-06"]
files_hint: ["frontend/src/view/forms/create_secret/", "frontend/src/view/components/lifetime_control/", "frontend/src/view/components/reading_code_control/", "frontend/src/app/page.tsx", "frontend/tests/components/create_secret.spec.ts", "docs/design-system.md"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T13 — Build the exact creation form and lifetime/code controls

## Place in the sequence

- Blocked by: T4 — Bootstrap the neutral frontend and register shared primitives, T12 — Implement typed browser clients and conservative lifecycle guards. Blocks: T14 — Build guarded share confirmation and separate handover. Wave: 9 (dependency depth, not elapsed days).

- Lane: T4, T14, T16 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: T1 source-policy synchronization is complete under Accepted ADR-0006/0007. T2 must still resolve DM-OQ-02…04 before implementation and affected snapshots must be refreshed afterward. T21 benchmarks after T3, not before scaffolding. No runtime/security approval follows from T1 completion.

## Why (user story)

> **As a** Sender
> **I want** to enter optional address and login plus a password or multiline key, create a Share link without registration, and copy it
> **So that** I can give a client access details without keeping a permanent copy in this service.
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Build the exact creation form and lifetime/code controls.

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


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


> | default | Initial form; 60 minutes, Reading code off; S1, AC-04 | NEW: ScreenFrame, TextField, ExactTextArea, LifetimeControl, ReadingCodeControl, ActionButton, Notice | WF-01-A |
> | empty | No entered text; same form, no fabricated empty-list view; AC-02 | NEW: TextField, ExactTextArea, LifetimeControl | WF-01-A |
> | validation | Required credential missing/whitespace-only, total text above 65536 UTF-8 bytes, invalid lifetime, enabled code below six Unicode code points or any code above 1024 UTF-8 bytes; createSecret 422 short_live_path.invalid_request; S1 | NEW: TextField, ExactTextArea, LifetimeControl, ReadingCodeControl, Notice | WF-01-B |
> | loading | One explicit creation pending; retain current values, freeze submitted controls and disable resubmit; S1/S2 | NEW: ActionButton, Notice | WF-01-C |
> | error.creation_limited | createSecret 429 short_live_path.creation_limited; retain text and explain waiting; NFR-05/S2 | NEW: Notice, ActionButton | WF-01-D |
> | error.capacity_unavailable | createSecret 503 short_live_path.capacity_unavailable; preserve text, no link, no eviction promise as UI evidence; S2 | NEW: Notice, ActionButton | WF-01-D |
> | error.service_unavailable | createSecret 503 short_live_path.service_unavailable; no confirmed outcome, preserve text; S2 | NEW: Notice, ActionButton | WF-01-D |
> | error.uncertain | Lost/invalid response, timeout, or outcome not confirmed; no success claim or automatic resend; S2 | NEW: Notice, ActionButton | WF-01-D |
> | success | Confirmed createSecret 201 with valid service timing/link; AC-01/S1 | NEW: ScreenFrame | Transition to WF-02-A, never show a speculative link |
> | Create a Secret                                |
> | Address (optional)                             |
> | [                                            ] |
> | Login (optional)                               |
> | [                                            ] |
> | Password or key                                |
> | [ exact multiline text                       ] |
> | [                                            ] |
> | Secret text: [UTF-8 bytes used] / 65536 bytes    |
> | Lifetime                                       |
> | [o-----------------------------] 1 min..24 h    |
> | Exact minutes [60]       Selected: 1 h          |
> | [ ] Require a separate Reading code            |
> | [ Create Secret ]                              |
> | The service can read the temporary content.     |
> | No recovery. Expiry does not revoke external    |
> | credentials or erase copies already acquired.  |
> | [x] Require a separate Reading code            |
> | Reading code [exact chosen/generated code    ] |
> | [ Generate 20-character code ]                  |
> | At least 6 Unicode code points; case and spaces |
> | matter. A generated code is recommended.        |
> | Send the code separately from the Share link.  |
> | Check the highlighted fields.                  |
> | Password or key [retained exact input         ] |
> | Error: Enter a password or key, not only spaces.|
> | Secret text error: maximum 65536 UTF-8 bytes.    |
> | Exact minutes [retained invalid value]          |
> | Error: Enter a whole number from 1 to 1440.      |
> | Reading code [retained exact input            ] |
> | Error: Use at least 6 Unicode code points.      |
> | [ Create Secret ]                              |
> | [current form values retained; controls busy]  |
> | [ Creating... (disabled) ]                      |
> | [current exact form input remains editable]    |
> | [safe notice for the applicable outcome]       |
> | [ Create a new attempt ]                       |
> | No automatic retry. A manual retry is new.      |
>
> — `screens.md §SCR-01, manifest states, verbatim` · full text: [screens.md](../screens.md)


Reuse/registration contract: Reuse T4-registered ScreenFrame/TextField/ExactTextArea/ActionButton/Notice and canon tokens; NEW LifetimeControl and ReadingCodeControl compose those primitives, registered in docs/design-system.md only if needed. Source: [screens.md](../screens.md) §New components, proposed inventory, abridged; existing canon is absent until T4.

Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

No DB changes.

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
> **Then** expiration is one hour after successful creation by default, or the chosen duration after successful creation. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices. The confirmation and reading experiences show a visible countdown of remaining lifetime based on service-established expiration and service time; changing the device wall clock does not extend access. Countdown display does not replace server-side expiration enforcement.
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

- [ ] Build SCR-01 default/empty/validation/loading/error.creation_limited/error.capacity_unavailable/error.service_unavailable/error.uncertain/success states. Work area: `frontend/src/view/forms/create_secret/` (and matching files_hint targets).

- [ ] Reuse T4-registered ScreenFrame/TextField/ExactTextArea/ActionButton/Notice and canon tokens; NEW LifetimeControl and ReadingCodeControl compose those primitives, registered in docs/design-system.md only if needed. Work area: `frontend/src/view/components/lifetime_control/` (and matching files_hint targets).

- [ ] Synchronize whole-minute numeric input with pointer/touch nearest-hour assistance and minimum 1; ties choose higher hour, keyboard steps 1 minute, Home/End 1/1440, 61 stays 61 without rounding/clamping. Work area: `frontend/src/view/components/reading_code_control/` (and matching files_hint targets).

- [ ] Provide unbiased browser-CSPRNG twenty Latin-letter/digit generator, exact chosen code and nonblocking weak-code guidance. Disabled protection omits reading_code. Work area: `frontend/src/app/page.tsx` (and matching files_hint targets).

- [ ] Retain exact form on refusal/uncertainty, disable duplicate submit and only transition on validated confirmed 201; deliberate retry is new creation. Work area: `frontend/tests/components/create_secret.spec.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Timeout or invalid 201 | Stay on retained form; no speculative URL. |
| Pointer snapping cannot choose 61 | Numeric and keyboard paths still select 61 exactly. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-02, AC-04, AC-05, AC-06, abridged; [sad.md](../sad.md) §6, S1, S2, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] SCR-01 component tests cover every manifest state, 1/60/61/1440/fractional minute interactions, multibyte size boundary, code point/generator behavior, retained input and single-submit/no-auto-retry.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
