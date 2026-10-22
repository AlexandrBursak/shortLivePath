---
id: "T6"
title: "Implement exact validation, token handling and bounded verification"
layer: "domain"
deps: ["T3"]
blocks: ["T7", "T9", "T11"]
acs: ["AC-02", "AC-03", "AC-05", "AC-06", "AC-07"]
files_hint: ["backend/app/validators/", "backend/app/services/secret_validation_service.ts", "backend/app/services/reading_code_service.ts", "backend/app/services/link_token_service.ts", "backend/tests/unit/secret_validation.spec.ts", "backend/tests/unit/reading_code.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T6 — Implement exact validation, token handling and bounded verification

## Place in the sequence

- Blocked by: T3 — Bootstrap the backend with executable quality gates. Blocks: T7 — Implement bounded Redis payload and admission transitions, T9 — Implement confirmed creation and its HTTP boundary, T11 — Implement explicit disclosure with final release checks. Wave: 3 (dependency depth, not elapsed days).

- Lane: T3, T9, T11 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Sender
> **I want** to optionally choose or generate a Reading code and communicate it separately
> **So that** possession of the Share link alone need not permit reading.
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement exact validation, token handling and bounded verification.

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


> **Concurrent-attempt semantics.** Each link/address pair admits no more in-flight verifications than its remaining failure allowance, so simultaneous wrong codes cannot overshoot five failed verifications in any rolling sixty-second window. Occupied in-flight slots may temporarily refuse even a correct attempt without running its hash.
>
> — `sad.md §6, S4, abridged` · full text: [sad.md](../sad.md)


> **Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS.
>
> — `adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md §Decision outcome, ADR-0003, abridged` · full text: [adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md](../adr/0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md)


> Zero Secret content or Reading codes in logs, analytics or backups; zero full Share links in logs. No persistent Secret copies; minimal link lifecycle metadata may persist indefinitely without Secret content, Reading code or full Share link
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `credential` | UTF-8 string | Required, not whitespace-only; retain all valid submitted characters and line breaks. |
> | `code_verifier` | Encoded salted password-hard hash, or absent field | Absence means no code required. Never persist the plaintext code; malformed present verifier fails closed, not as code-disabled. Algorithm/cost/budget follow Accepted ADR-0006 initial values; calibration is T21. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

Internal — no API surface.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-02

> **Given** a Sender has omitted the password or key, provided only whitespace in that field, or entered more than 64 KiB of Secret text
> **When** the Sender attempts creation
> **Then** creation is blocked with a plain-language explanation and no Share link is issued. The 64 KiB limit counts the sum of the UTF-8 encoded address, login, and password or key text, excluding the Reading code and packaging overhead. Nonempty password or key text is preserved verbatim, not trimmed or normalized.
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)


### AC-03

> **Given** a Secret contains a multiline key
> **When** the Recipient reads and copies it before expiration
> **Then** its characters, spaces, and line breaks are preserved without alteration.
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)


### AC-05

> **Given** a Sender has entered a lifetime shorter than one minute, longer than twenty-four hours, or not a whole number of minutes
> **When** the Sender attempts creation
> **Then** creation is blocked and the permitted lifetime bounds are explained.
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)


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

- [ ] Validate well-formed scalar text, aggregate 65536 UTF-8 bytes, non-whitespace credential and whole-minute 1–1440/default 60 without mutating text. Work area: `backend/app/validators/` (and matching files_hint targets).

- [ ] Generate 32 random bytes, enforce canonical 43-character base64url by decode/re-encode, hash decoded bytes with SHA-256; never use a lifecycle UUID as a capability. Work area: `backend/app/services/secret_validation_service.ts` (and matching files_hint targets).

- [ ] Implement the reviewed DM-OQ-01 salted verifier and bounded global work admission. Create-only six-code-point minimum is not applied to disclosure guesses; never trim/normalize codes or retain plaintext. Work area: `backend/app/services/reading_code_service.ts` (and matching files_hint targets).

- [ ] Define internal types together with these first working implementations, not as a standalone compile-breaking contract task. Work area: `backend/app/services/link_token_service.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| 65536 versus 65537 UTF-8 bytes | Accept boundary, reject excess; do not substitute JS character count. |
| Malformed stored verifier | Fail closed, never treat as code-disabled. |
| Short disclosure guess | Verify under admission policy; no create-only minimum rejection. |

Edge-case sources: [spec.md](../spec.md) §5, AC-02, AC-03, AC-05, AC-06, AC-07, abridged; [sad.md](../sad.md) §6, S1, S4, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] AC-citing unit tests cover multibyte/exact multiline boundaries, surrogate rejection, canonical token padding bits, exact code comparison, malformed verifiers and reviewed work-queue exhaustion.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
