---
id: "T14"
title: "Build guarded share confirmation and separate handover"
layer: "ui"
deps: ["T4", "T12", "T13"]
blocks: ["T15", "T16"]
acs: ["AC-01", "AC-04", "AC-06", "AC-12"]
files_hint: ["frontend/src/view/widgets/share_confirmation/", "frontend/src/view/components/remaining_lifetime/", "frontend/tests/components/share_confirmation.spec.ts", "docs/design-system.md"]
owner: "<TBD lead>"
estimate: "6h"
context_budget: "M"
status: "blocked"
---

# T14 — Build guarded share confirmation and separate handover

## Place in the sequence

- Blocked by: T4 — Bootstrap the neutral frontend and register shared primitives, T12 — Implement typed browser clients and conservative lifecycle guards, T13 — Build the exact creation form and lifetime/code controls. Blocks: T15 — Build neutral reading gate and explicit Show interactions, T16 — Build exact reading and distinct unavailable screens. Wave: 10 (dependency depth, not elapsed days).

- Lane: T4, T13, T16 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: ADR-0008/0009 select PostgreSQL-write time and simplified v1 counters. T1/T2 documentation is complete; runtime guards require implementation/tests before Secret traffic. T21 follows T3. Exact concurrent quotas are deferred backlog T22 outside tasks.json, not a scaffold/launch gate. Fix test-profile/planning inputs before dispatch.

## Why (user story)

> **As a** Sender
> **I want** to enter optional address and login plus a password or multiline key, create a Share link without registration, and copy it
> **So that** I can give a client access details without keeping a permanent copy in this service.
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Build guarded share confirmation and separate handover.

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


> **Browser and copy boundaries.** Copy helpers pass the original field string without trimming, newline conversion, Unicode normalization or formatting. Manual selection is a fallback while the same text remains eligible, not a download, stored draft or recovery feature.
>
> — `sad.md §6, S5, abridged` · full text: [sad.md](../sad.md)


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


> | default | Confirmed link, timing and optional separate in-memory code | NEW: ScreenFrame, RemainingLifetime, ExactCopyField, Notice, ActionButton | WF-02-A |
> | loading | Individual clipboard operation pending, not another creation; UX US-01 | NEW: ExactCopyField | WF-02-B |
> | success | Confirmed creation; successful eligible clipboard completion announces only the copied item; AC-01/S5 copy safety | NEW: Notice, ExactCopyField | WF-02-A / WF-02-B |
> | error | Clipboard denied/failed: no false success; manual selection while eligible; UX US-01 | NEW: Notice, ExactCopyField | WF-02-B |
> | expired | Conservative deadline reached; remove handover blocks and disable their copy, including code; AC-04/S6 | NEW: ScreenFrame | Transition to WF-05-B |
> | N/A: empty | No confirmed link means remain at SCR-01, not an empty confirmation | NEW: ScreenFrame | WF-01-D |
> | N/A: validation | No editing/submission on this screen | NEW: ScreenFrame | WF-02-A |
> | Secret created                                 |
> | Remaining [HH:MM:SS]                            |
> | Expires [service expiration; explicit zone]     |
> | Share link                                     |
> | [confirmed HTTPS Share link; selectable]        |
> | [ Copy link ]                                  |
> | Reading code (only when enabled)                |
> | [code from this page memory; selectable]        |
> | [ Copy code ]                                  |
> | Send the code separately, preferably through    |
> | another channel. Link and code cannot be        |
> | recovered. A crash may end availability early.  |
> | Expiry does not revoke credentials/saved copies.|
> | [ Create a new Secret ]                         |
> | [ Copying link... (disabled) ]                 |
> | Success: Link copied.                          |
> | OR Error: Could not copy. Select the link       |
> | manually while it remains eligible.            |
>
> — `screens.md §SCR-02, manifest states, verbatim` · full text: [screens.md](../screens.md)


Reuse/registration contract: Reuse canon ScreenFrame/ActionButton/Notice plus T12 exact-copy/deadline helpers; register NEW RemainingLifetime composed from canon primitives. Source: [screens.md](../screens.md) §New components, proposed inventory, abridged; existing canon is absent until T4.

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


### AC-04

> **Given** a Sender is creating a Secret
> **When** creation succeeds with the default lifetime or a chosen whole number of minutes from 1 to 1440
> **Then** expiration is one hour after the service records creation by default, or the chosen duration after that recorded creation time. Confirmation and delivery delay consume part of the chosen duration and do not restart or extend it. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices. The confirmation and reading experiences show a visible countdown of remaining lifetime based on service-established expiration and service time; changing the device wall clock does not extend access. Countdown display does not replace server-side expiration enforcement.
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)


### AC-06

> **Given** a Sender enables a Reading code
> **When** the Sender chooses a code or requests random generation
> **Then** creation requires at least six Unicode code points of any composition, longer codes are allowed up to 1024 UTF-8 bytes, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization. A code over this byte limit is rejected with an explanation, never truncated, and does not create a link.
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)


### AC-12

> **Given** a Recipient has copied external access details and the Share link later expires
> **When** the Recipient checks what expiration means
> **Then** the service explains that it does not change external passwords or revoke external server keys, and does not claim to erase saved copies.
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Build SCR-02 confirmed/default, copy loading/success/failure, handover and expired transition. Do not repeat credential/address/login. Work area: `frontend/src/view/widgets/share_confirmation/` (and matching files_hint targets).

- [ ] Reuse canon ScreenFrame/ActionButton/Notice plus T12 exact-copy/deadline helpers; register NEW RemainingLifetime composed from canon primitives. Work area: `frontend/src/view/components/remaining_lifetime/` (and matching files_hint targets).

- [ ] Separate link and optional code copy actions, with eligible manual fallback and no code in URL. Show service expiration with explicit zone and HH:MM:SS countdown without per-second screen-reader announcements. Work area: `frontend/tests/components/share_confirmation.spec.ts` (and matching files_hint targets).

- [ ] Expiry removes handover blocks/copy actions and reaches SCR-05; new creation starts empty. Explain service-readable temporary content and no external credential/copy revocation. Work area: `docs/design-system.md` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Clipboard finishes after expiry/concealment | No success feedback or revived handover. |
| Code disabled | No phantom code handover section. |

Edge-case sources: [spec.md](../spec.md) §5, AC-01, AC-04, AC-06, AC-12, abridged; [sad.md](../sad.md) §6, S1, S5, S6, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] SCR-02 tests prove only confirmed link/code handover, separate exact copy, safe failure feedback, no credential repetition, accessible countdown and local expiry disabling all handover actions.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
