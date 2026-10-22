---
id: "T11"
title: "Implement explicit disclosure with final release checks"
layer: "ports"
deps: ["T6", "T7", "T8", "T10"]
blocks: ["T12", "T17"]
acs: ["AC-03", "AC-07", "AC-08", "AC-10"]
files_hint: ["backend/app/services/disclose_secret_service.ts", "backend/app/controllers/disclose_secret_controller.ts", "backend/app/validators/disclose_secret.ts", "backend/start/routes.ts", "backend/tests/integration/disclose_secret.spec.ts"]
owner: "<TBD lead>"
estimate: "8h"
context_budget: "M"
status: "blocked"
---

# T11 — Implement explicit disclosure with final release checks

## Place in the sequence

- Blocked by: T6 — Implement exact validation, token handling and bounded verification, T7 — Implement bounded Redis payload and admission transitions, T8 — Implement bounded cleanup and generation-fenced readiness, T10 — Implement neutral status and durable lifecycle classification. Blocks: T12 — Implement typed browser clients and conservative lifecycle guards, T17 — Wire same-origin deployment and confidentiality controls. Wave: 7 (dependency depth, not elapsed days).

- Lane: T3, T6, T9, T10 share files_hint; serialize overlapping changes, including shared route/registry/canon files.

Planning gate: this package is provisional. T1/T2 must close DM-OQ-01…05 with recorded review; then re-run tasks to refresh snapshots before T3…T20. Do not execute implementation with Draft parameters.

## Why (user story)

> **As a** Recipient
> **I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
> **So that** I can use the supplied access details without registering.
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)


This task contributes: Implement explicit disclosure with final release checks.

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


Fallback: if an inline is insufficient, outdated or contradicts code, open its named source and follow it; never invent missing parameters. Proposed code paths below are planned targets, not claims of existing imports/APIs.

## Data delta

> | `lifecycle_id` | Canonical UUID string | Must equal the key handle and resolved PostgreSQL id. |
> | `credential` | UTF-8 string | Required, not whitespace-only; retain all valid submitted characters and line breaks. |
> | `code_verifier` | Encoded salted password-hard hash, or absent field | Absence means no code required. Never persist the plaintext code; malformed present verifier fails closed, not as code-disabled. Algorithm/cost/budget remain TBD. |
> | `expires_at_ms` | UTC epoch-millisecond integer string | Must match PostgreSQL and absolute Redis expiry. Never refresh on read or verification. |
>
> — `data-model.md §Entities / Indexes, task-owned fields, verbatim` · full text: [data-model.md](../data-model.md)


No SQL schema changes. Use the existing metadata/ephemeral fields above; never persist payload/code/verifier in PostgreSQL. Source: [data-model.md](../data-model.md) §Entities, storage separation, abridged.

## API contract

> POST /api/v1/secrets/{token}/disclosures (discloseSecret). Required JSON object {}, or {reading_code:string}; shorter guesses are allowed, null/unknown fields are invalid. 200: data.secret {address,login,credential}, data.expires_at, meta.service_time. 403 short_live_path.code_required or short_live_path.code_incorrect; 409 short_live_path.link_unavailable; 410 short_live_path.link_expired; 422 short_live_path.invalid_request; 429 short_live_path.verification_limited; 503 short_live_path.capacity_unavailable or short_live_path.service_unavailable. No read consumption, sessions or automatic POST retries.
>
> — `contracts/openapi.yaml §paths / components, discloseSecret, abridged` · full text: [contracts/openapi.yaml](../contracts/openapi.yaml)


> All operations use security: [] (no account/Bearer auth). Every response requires Cache-Control: no-store and Referrer-Policy: no-referrer. Success uses {data,meta}; errors use {error:{code,message,details}}, details always []. Finite code/body bounds remain DM-OQ-01 until reviewed.
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


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)


### AC-08

> **Given** a Share link has not expired and its reading conditions are satisfied
> **When** the Recipient explicitly chooses Show on the neutral page, on an initial or repeat visit
> **Then** the Recipient can read and copy the Secret without registration while it remains available and unexpired. Opening the page alone reveals no Secret content, including in previews. Concurrent reading is permitted; no visit consumes the link.
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)


### AC-10

> **Given** a Share link has reached expiration
> **When** a Recipient attempts a new disclosure, including with the correct Reading code
> **Then** the service refuses to release Secret data at or after expiration, checking the time immediately before release rather than only when reading begins. The normal application checks expiration before display and must not show a response that arrives after expiration. A running page hides displayed content locally at expiration even without network access; after suspension or a return to the page it checks expiration before redisplaying content. This is a normal-application guarantee, not remote revocation of plaintext or ciphertext and keys already obtained by a Recipient. Data released before expiration cannot be recalled while in transit.
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)


## Checklist

- [ ] Implement discloseSecret as one nonstreaming authorized response; validate stored shape and metadata/payload identity/timestamps before serialization. Work area: `backend/app/services/disclose_secret_service.ts` (and matching files_hint targets).

- [ ] Reserve pair/global work before code verification; missing code is not failed hash work. Wrong-code response requires confirmed failure accounting; success releases only its slot. Work area: `backend/app/controllers/disclose_secret_controller.ts` (and matching files_hint targets).

- [ ] Immediately after asynchronous work and before actual response release recheck readiness/current generation, payload consistency and strict service now < expires_at; do not rely on earlier service checks. Work area: `backend/app/validators/disclose_secret.ts` (and matching files_hint targets).

- [ ] No session, consumption, exclusive reader or deadline extension. Keep handlers thin and errors fragment-free. Work area: `backend/start/routes.ts` (and matching files_hint targets).

- [ ] Write the named tests first (RED), then implement and pass GREEN; for decision tasks use executable evidence/review vectors rather than claiming runtime success from prose.

## Edge cases

| Case | Behaviour |
|---|---|
| Correct code finishes at expiry | 410; no content released. |
| Successful code after prior failures | Release own reservation; never clear previous failures. |
| Accounting uncertain | 503, not code_incorrect or a successful disclosure. |

Edge-case sources: [spec.md](../spec.md) §5, AC-03, AC-07, AC-08, AC-10, abridged; [sad.md](../sad.md) §6, S4, abridged. Decisions T1/T2 also follow [data-model.md](../data-model.md) §Open technical decisions, DM-OQ-01…05, abridged.

## Definition of Done

- [ ] discloseSecret tests cover all 200/403/409/410/422/429/503 outcomes, parallel five-failure reservations, repeat readers and delayed correct verification/readiness changes at final release.

- [ ] All inlined hard rules still hold; tests cite their AC IDs.

- [ ] Installed application test/lint/typecheck/build gates pass for touched code; decision-only tasks pass artifact validation and recorded review instead.

- [ ] Stay within one working day; split/replan if the change exceeds roughly 500 LOC. Never close unresolved safety choices as done.
