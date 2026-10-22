# API sync report — short-live-path

## Scope and verdict

Size M, route standard (read from .size/.route). HTTP/REST backend-service is declared alongside
web-frontend in SAD frontmatter. data-model.md, sad.md and spec.md are present. No application,
manifest, live error registry, existing contract or check target exists in this repo.

DRAFT — wire projection is source-aligned subject to the explicitly inherited DM-OQ blockers below.
No implementation, security, performance, retention or runtime correctness is claimed by contract linting.
Source documents and migrations are unchanged. No commit is made.

## Resolved conventions

- Product Owner explicitly chose the existing project error envelope {error:{code,message,details}}
  instead of the skill's flat template. Success stays {data,meta}; details is always [] in v1.
- ADR-0003/0005 and SAD §8 prohibit account/JWT authentication. All three operations explicitly use
  security: []; no fictitious BearerAuth scheme or identity requirement is introduced.
- S2 and data-model lifecycle semantics explicitly exclude automatic retries/deduplication. No HTTP
  Idempotency-Key or fabricated TTL is added. S7's internal run identity is not a client idempotency API.
- URL versioning /api/v1 is the stage convention. /s/{token} is the neutral browser Share link route;
  reverse-proxy API requests go directly to AdonisJS. Never use internal lifecycle UUIDs as capabilities.
- No list/history, pagination, management/delete, recovery, generator, external-destination, readiness
  or public maintenance endpoint is justified by these stories. Such surfaces are not invented.
- No central error registry found: neutral short_live_path.* codes are contract proposals. Reconcile
  with the future backend registry and validators; this is not evidence of existing runtime constants.
- Async S7 maintenance is documented in events.md as internal triggers, not an external integration,
  message bus, persistent queue or fourth deployment surface.

## A. Field origins

Transport wrappers (data/meta/error), discriminator state and error code/message/details are explicit
API projections of cited source outcomes/conventions, not new stored columns. Reading code is an
input whose stored origin is its verifier; plaintext never becomes a model column. service_time is
computed, not created_at. High means direct matching model/convention; medium means derived wire
projection. No low-confidence field is silently assumed. Internal id, digest, schema version,
verifier, reservations, address labels and created_at stay off the public interface.

| schema_path | origin | confidence |
|---|---|---|
| `createSecret.request.address` | data-model.md §ephemeral_secret.address; spec AC-02/AC-03 | high |
| `createSecret.request.credential` | data-model.md §ephemeral_secret.credential; spec AC-02/AC-03 | high |
| `createSecret.request.lifetime_minutes` | data-model.md §link_lifecycles.expires_at - created_at; spec AC-04/AC-05 | high |
| `createSecret.request.login` | data-model.md §ephemeral_secret.login; spec AC-02/AC-03 | high |
| `createSecret.request.reading_code.allOf[0]` | spec AC-06/AC-07; data-model.md §ephemeral_secret.code_verifier input | medium |
| `createSecret.response.201.data.expires_at` | data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms | high |
| `createSecret.response.201.data.share_url` | data-model.md §Token and digest representation; sad.md S1; spec AC-01/AC-06 | medium |
| `createSecret.response.201.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `createSecret.response.201.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `createSecret.response.201.meta.service_time` | sad.md S1/S3/S4/S6; spec AC-04/AC-10 service timing | medium |
| `createSecret.response.422.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `createSecret.response.422.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `createSecret.response.422.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `createSecret.response.422.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `createSecret.response.422.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `createSecret.response.429.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `createSecret.response.429.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `createSecret.response.429.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `createSecret.response.429.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `createSecret.response.429.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `createSecret.response.503.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `createSecret.response.503.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `createSecret.response.503.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `createSecret.response.503.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `createSecret.response.503.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.path.token` | data-model.md §Token and digest representation | high |
| `discloseSecret.request.reading_code` | spec AC-06/AC-07; data-model.md §ephemeral_secret.code_verifier input | medium |
| `discloseSecret.response.200.data.expires_at` | data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms | high |
| `discloseSecret.response.200.data.secret.address` | data-model.md §ephemeral_secret.address; spec AC-02/AC-03 | high |
| `discloseSecret.response.200.data.secret.credential` | data-model.md §ephemeral_secret.credential; spec AC-02/AC-03 | high |
| `discloseSecret.response.200.data.secret.login` | data-model.md §ephemeral_secret.login; spec AC-02/AC-03 | high |
| `discloseSecret.response.200.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.200.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.200.meta.service_time` | sad.md S1/S3/S4/S6; spec AC-04/AC-10 service timing | medium |
| `discloseSecret.response.403.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.403.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.403.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.403.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.403.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.409.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.409.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.409.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.409.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.409.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.410.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.410.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.410.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.410.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.410.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.422.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.422.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.422.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.422.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.422.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.429.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.429.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.429.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.429.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.429.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.503.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `discloseSecret.response.503.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `discloseSecret.response.503.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `discloseSecret.response.503.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `discloseSecret.response.503.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `getSecretStatus.path.token` | data-model.md §Token and digest representation | high |
| `getSecretStatus.response.200.data.oneOf[0].expires_at` | data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms | high |
| `getSecretStatus.response.200.data.oneOf[0].reading_code_required` | data-model.md §ephemeral_secret.code_verifier presence; sad.md S3 | high |
| `getSecretStatus.response.200.data.oneOf[0].state` | sad.md S3 eligible gate; data-model.md §Lifecycle and failure semantics | medium |
| `getSecretStatus.response.200.data.oneOf[1].expires_at` | data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms | high |
| `getSecretStatus.response.200.data.oneOf[1].state` | data-model.md §link_lifecycles.expires_at; sad.md S3 | medium |
| `getSecretStatus.response.200.data.oneOf[2].expires_at` | data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms | high |
| `getSecretStatus.response.200.data.oneOf[2].state` | data-model.md §Lifecycle and failure semantics missing unexpired payload; sad.md S3 | medium |
| `getSecretStatus.response.200.data.oneOf[3].state` | data-model.md §Token and digest representation and unknown lookup; sad.md S3 | medium |
| `getSecretStatus.response.200.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `getSecretStatus.response.200.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |
| `getSecretStatus.response.200.meta.service_time` | sad.md S1/S3/S4/S6; spec AC-04/AC-10 service timing | medium |
| `getSecretStatus.response.503.error.code` | API wire projection of sad.md S1-S4/S7 refusal branches | medium |
| `getSecretStatus.response.503.error.details` | backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope | medium |
| `getSecretStatus.response.503.error.message` | spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches | medium |
| `getSecretStatus.response.503.header.Cache-Control` | sad.md §8 cache/browser headers | high |
| `getSecretStatus.response.503.header.Referrer-Policy` | sad.md §8 cache/browser headers | high |

## B. Bidirectional drift checklist

1. ✓ Endpoint ↔ model (core): create writes LinkLifecycle plus ephemeral_secret/admission;
   status resolves lifecycle and inspects ephemeral availability/verifier presence; disclosure reads
   lifecycle/payload and updates only temporary verification admission. Permanent metadata is not
   removed on expiration. Browser-local copy/generation and internal cleanup need no new HTTP endpoint.
2. ✓ Error code ↔ repo (core, greenfield exception): no runtime registry exists; all proposed codes
   are enumerated in Error and used in response examples. Implement the same registry and reconcile.
3. ✓ Validation ↔ constraints (core, draft): integer lifetime 1–1440/default 60; canonical 32-byte token;
   aggregate text <=65536 UTF-8 bytes; credential not whitespace-only; create code minimum six Unicode
   code points; exact Unicode/spaces/newlines; millisecond UTC timestamps. Aggregate bytes, canonical
   decoding, stored-record consistency and clocks need service validators, not a misleading maxLength.
   The finite code/body limit is unresolved, not invented. No per-field byte or arbitrary URL/login
   format rule restricts valid Secret text. Null is not an alias for omitted optional text/code.
4. ✓ OpenAPI ↔ sequences (supporting): HTTP methods/statuses/field names are derived here; sequences
   intentionally use semantic messages. Mapping below covers service outcomes and distinguishes
   no-response/network loss and browser/internal branches from representable HTTP responses.

### User stories and acceptance coverage

| Source | Operations / outcomes | Non-HTTP responsibility |
|---|---|---|
| US-01 | createSecret 201/422/429/503 | Copy confirmed Share link; retain current form on refusal |
| US-02 | createSecret 201/422; getSecretStatus 200; discloseSecret 200/410 | Every minute choice, hour snapping, countdown |
| US-03 | createSecret 201/422; discloseSecret 403/429/503 | Local twenty-character secure generator; separate code handover |
| US-04 | getSecretStatus 200/503; discloseSecret 200/403/409/410/429/503 | Explicit Show; repeat/concurrent exact copy |
| US-05 | getSecretStatus 200/503; discloseSecret 200/410/503 | Expiry explanations; S7 deletion/recovery |
| AC-01 | createSecret 201; 422/429/503 issue no confirmed link | Copy only confirmed success |
| AC-02 | createSecret 422; CreateSecretRequest aggregate-byte/non-whitespace rules | Preserve entered valid text |
| AC-03 | createSecret 201; discloseSecret 200 Secret fields | S5 exact inert rendering and clipboard, no newline rewriting |
| AC-04 | createSecret 201/default 60; status/disclosure service_time + expires_at | S6 conservative monotonic timing; minute-level slider |
| AC-05 | createSecret 422; integer lifetime bounds | Explain bounds without clamping |
| AC-06 | createSecret 201/422; discloseSecret 200/403 | Local generator; nonblocking weak-code advice; no code in URL |
| AC-07 | discloseSecret 403/429/503 | Pair reservations and salted verifier; no consuming/rebinding link |
| AC-08 | getSecretStatus 200; discloseSecret 200 | Initial/repeat neutral page; no automatic Show or consumption |
| AC-09 | getSecretStatus 200 unknown/expired/early_unavailable; discloseSecret 409/410 | Original browser URL shows state, never a missing-page experience |
| AC-10 | discloseSecret 410/503 final check; status revalidation | S5/S6 late-response discard, offline hide, concealed resume |
| AC-11 | createSecret 503 uncertain outcomes; status/disclosure 503 recovery gate | S2 orphan expiry; S7 cleanup; infrastructure/log/backup canary audit |
| AC-11b | getSecretStatus early_unavailable; discloseSecret 409 | No recovery; ask Sender for new link |
| AC-12 | status expired; discloseSecret 410 | S6 guidance: no external revocation or recipient-copy erasure |

Every operation names at least one story and AC using x-user-stories/x-acceptance-criteria.
API responses support but do not themselves prove browser-only or infrastructure acceptance criteria.

### Sequence branch mapping (forward and back-feed)

| Source branches | HTTP mapping / explicit non-HTTP boundary |
|---|---|
| S1 code disabled/chosen/generated | optional reading_code; local generator, no generator endpoint |
| S1 content/lifetime/code invalid | createSecret 422 invalid_request |
| S1/S2 ready/clock/dependency unsafe | createSecret 503 service_unavailable |
| S1/S2 address quota/reservations occupied | createSecret 429 creation_limited |
| S2 payload/limiter/memory/work capacity | createSecret 503 capacity_unavailable |
| S1/S2 admission/preparation/metadata/payload/accounting failure or uncertainty | createSecret 503 service_unavailable; no link, no automatic retry |
| S1/S2 final eligibility unsafe | createSecret 503; no confirmed link even if orphan exists |
| S1/S2 confirmation eligible/received | createSecret 201 with Share link and service timing |
| S2 lost response or ended connection | No fabricated HTTP result; client outcome unconfirmed; manual retry is new attempt |
| S3 malformed token/unknown digest | getSecretStatus 200 state unknown; malformed stops before lookup |
| S3/S4 unsafe readiness/clock, failed dependency, invalid metadata | 503 service_unavailable, not wrong code or known loss |
| S3/S4 known expired, including after lookup or work | status 200 expired; disclosure 410 link_expired |
| S3/S4 missing unexpired payload | status 200 early_unavailable; disclosure 409 link_unavailable |
| S3/S4 corrupt/inconsistent payload/verifier | 503 service_unavailable; safe no-content failure, never code-disabled |
| S3 eligible gate | 200 available + reading_code_required + unchanged expires_at, no Secret |
| S3 late arrival, repeat visit | UI discards expired gate; starts neutral, never auto-discloses |
| S4 invalid body/request bounds | 422 invalid_request; concrete resource upper bound awaits DM-OQ-01 |
| S4 malformed/unknown token | 409 link_unavailable; malformed stops before lookup |
| S4 no required code | authorize only current request; final checks still mandatory |
| S4 required code absent/incorrect with confirmed accounting | 403 code_required / code_incorrect, no payload |
| S4 pair failures or in-flight slots occupy allowance | 429 verification_limited, no hash/window extension |
| S4 limiter/hash-work capacity exhausted | 503 capacity_unavailable, no expensive work or protection bypass |
| S4 reservation uncertainty, verifier internal error, accounting/completion failure | 503 service_unavailable, no fabricated wrong-code result |
| S4 correct code and confirmed completion | recheck payload/readiness/clock then 200/409/410/503, no durable authorization |
| S4 final eligible bounded nonstreaming release | 200 exact Secret + original expires_at + service timing |
| S5 invalid/stale/concealed/late response | UI discards, not another HTTP endpoint/status |
| S5 eligible display, copy/manual-copy success/failure and async feedback | UI-only guarded rendering/clipboard; no copy telemetry API |
| S5 leave/reload/concurrent readers | status + new explicit disclosure; no consumption or identity binding |
| S6 late/active offline expiry/background/bfcache/resume | local conceal/discard and neutral recheck; failed recheck stays concealed |
| S6 external-credential/copy/no-recovery explanation | UI content; no remote-revocation endpoint |
| S7 duplicate/current run, health failure, bounded batch/retry/dead-letter/recovery checks | internal events.md, serving gate exposes only 503 until ready |
| S7 early payload loss/metadata-only restoration | status early_unavailable before expiry, expired after; no payload recovery |

No new missing-AC or missing-sequence branch was found. Mapping of safe invalid-record refusal to
503 is the technical temporary-failure class in data-model.md §Lifecycle and failure semantics;
it does not label corruption as a proven incorrect code. Status terminal states intentionally use
200, while explicit disclosure refusals use the error envelope. A 410 API response must not become
an HTTP 404 web page. Intermediaries must apply the same noncacheable/sanitized refusal rules.

## Inherited open decisions — finalization gate

These are existing source obligations, not newly accepted defaults or waivers. No source was edited.

| ID | Contract impact | Owner / due |
|---|---|---|
| DM-OQ-01 | Concrete finite UTF-8/code/body budget, hash suite/cost and global queue/concurrency. Until resolved, lack of maxLength does not authorize unbounded input; proxy limits must not silently shrink valid 65536-byte text after JSON escaping. Decide any body-size status/schema branches together. | Backend/security (data-model/design), before contract finalization and executable tasks |
| DM-OQ-02 | Successful-creation anchor and final timestamps across PostgreSQL then Redis. Matching DTO timestamps alone cannot prove exact lifetime from successful creation. | Backend with Product Owner (data-model/design), before contract finalization and executable tasks |
| DM-OQ-03 | Safe authoritative/monotonic timing, transit-aware client deadline, discontinuity detection, cleanup batches/retry budgets and current-run fencing. | Backend/frontend (design/sequences), before contract finalization and executable tasks |
| DM-OQ-04 | Admission leases/fencing, bounded uncertain/OOM accounting and recovery; no late commit after releasing slots. | Backend (data-model/design), before contract finalization and executable tasks |
| DM-OQ-05 | Trusted proxies, address canonicalization, HMAC custody/rotation/restart continuity; no arbitrary forwarded-header trust or quota reset. | Backend/security (design), before contract finalization and executable tasks |

Browser/network test profile remains due before plan-tests and UI language/slider behavior before
screens approval, as already recorded in SAD §11/spec §8. These do not justify fabricated API fields.

## Verification

Run `_audit/verify-api.py` with PyYAML, openapi-spec-validator and jsonschema in an isolated uv
environment. It validates OpenAPI 3.1, resolves local refs, checks every request/response example,
source story/AC coverage and exact field-origin table projection, exercises schema boundaries and
checks the maintenance branch table. Read `_audit/api-validation.md` for actual execution results.
This is structural documentation verification, not an application/security/performance test.

Proposed commit (not executed): `api: short-live-path contract`.
Next: `screens short-live-path` after review; no no-UI skip applies to declared web-frontend.
