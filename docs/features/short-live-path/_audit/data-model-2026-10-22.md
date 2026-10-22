---
status: Draft
owner: "Backend Lead"
updated_at: "2026-10-22"
feature_size: M
---

# Data-model audit — short-live-path — 2026-10-22

## Scope and result

Size M and route standard read from feature .size/.route. Target surfaces are web-frontend and backend-service from SAD frontmatter; no surface fallback was needed. Structural self-check: PASS for the staged PostgreSQL schema, paired rollback, index rationale and rendered ER diagram. Runtime readiness: NOT APPROVED; five inherited technical decisions remain open. Redis shapes are a documented design contract, not executed scripts or proof of concurrency, expiry or privacy controls.

Prerequisite gate passed: spec.md and sad.md exist. Reviewed spec §5/§6.1, SAD persistence/building-block/runtime/crosscutting sections, S1–S7, Accepted ADR-0001/0003/0004/0005, backend/AGENTS.md and backend/docs/architecture.md. ADR-0002 is superseded and was not applied as a current requirement. No architecture-map.md, installed application dependencies, README, Compose file, domain classes, existing migrations or schema were present; none were invented.

## Artifacts

- `docs/features/short-live-path/data-model.md` — durable/ephemeral aggregate boundaries, rendered ER, columns, token representation, Redis state/key design, query-index rationale, retention/failure behavior and five open technical decisions.
- `docs/features/short-live-path/migrations/01_create_link_lifecycles.up.sql` — new metadata-only table with separate UUID primary key, unique binary digest and explicit finite lifecycle bounds.
- `docs/features/short-live-path/migrations/01_create_link_lifecycles.down.sql` — matching non-CASCADE table rollback, with destructive-data-loss warning.
- `docs/features/short-live-path/_audit/schema-check.sql` — rollback-only synthetic metadata fixtures and assertions; not a seed migration.
- `docs/features/short-live-path/_audit/verify-data-model.py` — reproducible isolated PostgreSQL verification, replay/round-trip checks and guaranteed container cleanup on normal Python error paths.
- `docs/features/short-live-path/_audit/data-model-2026-10-22.md` — this audit.

Migrations are staged — not yet in the live migrations tree; implement promotes them. No files were written to backend/database/migrations/ or a root live migrations/ directory; both remain absent. No commit, push, application scaffold or production change was performed.

## Conventions and promotion hint

The backend baseline chooses PostgreSQL/Lucid and paired rollback, UUIDs for appropriate identifiers and query-driven indexes. The Product Owner was offered the minimal digest-keyed schema and explicitly selected a separate UUID primary key. The accompanying proposal established snake_case, 32-byte SHA-256/bytea digest, timestamptz, finite whole-minute lifetime CHECKs, explicit service timestamps, no updated_at and no soft-delete. Data-model chooses internal service-generated UUID v4 without a database extension; public credentials remain independent random 32-byte tokens, canonically encoded in unpadded base64url.

Promote-time hint: Lucid timestamp-prefixed TypeScript migration under backend/database/migrations/, not a guessed numeric SQL sequence. No existing history supplies a next timestamp. Implement assigns the real timestamp using the scaffolded application's actual tooling and wraps the staged SQL in its installed BaseSchema up/down API. Raw SQL files alone are not assumed to be discoverable by Lucid. No uninstalled API/import was authored.

Naming, PKs, audit and deletion behavior are consistent with the approved feature contract. There are no preexisting project DDL conventions for CHECK/defaults; choices were proposed explicitly rather than claimed as detected history. No extra expired_at index is generated: expiration cleanup queries Redis, and permanent history has no time-filtering/deletion query. No duplicate index is created for UNIQUE/PK constraints.

## Four mandatory self-checks

| Check | Result | Evidence |
|---|---|---|
| Naming | PASS | Lowercase snake_case table/columns/constraints; one ordinal `01_` staged pair. No conflicting live convention exists. |
| Down reversibility | PASS, schema only | Executed up twice, tested constraints, replayed up with committed expired metadata, down twice, then up again. Down removes table and its two indexes. Dropped data is not recovered. |
| FK indexes | N/A, satisfied | No PostgreSQL foreign keys. The optional Redis association is cross-store, not a missing relational FK. |
| Convention adherence | PASS with explicit architecture exceptions | Durable metadata only, separate UUID selected by Product Owner, Lucid promotion deferred. Redis-primary and one-repository exceptions were already approved in SAD/ADRs. No rules file or baseline rewrite. |

IF NOT EXISTS replay was tested for the intended identical schema. It does not repair a preexisting incompatible table; implement must compare schema/history before promotion. This is an additive greenfield table, so no backfill or expand/contract phase is needed. Any actual destructive rollback needs stopped dependent code, a metadata-only backup and explicit authorization; neither was needed for a disposable empty test database.

## Execution evidence

Ran:

    python3 docs/features/short-live-path/_audit/verify-data-model.py

Exit 0. Used the already-local `postgres:17-alpine` verification image, image id `sha256:979c4379dd698aba0b890599a6104e082035f98ef31d9b9291ec22f2b13059ca`. Actual server: PostgreSQL 17.10, aarch64 Alpine. This is the tested SQL compatibility target, not a production version selection or proof of an Adonis/Lucid integration.

Isolation: a newly named `slp-schema-check-*` container, no network, no host port, tmpfs PostgreSQL data and no existing-volume mounts. Trust authentication was scoped to this unreachable disposable container only. The harness removed it and read back Docker's container listing to confirm absence. No host PostgreSQL, existing project database, production service or existing volume was accessed or deleted.

Actual SQL output reported 23 schema checks:

- Durable four-column allowlist, all NOT NULL/no defaults, exactly two constraint-backed indexes.
- Acceptance of every integer lifetime from 1 through 1440 using synthetic fixtures.
- UUID/digest uniqueness; null rejection for each column; digest byte lengths 0/31/33 rejected.
- Negative/zero/59-second/fractional-minute/fractional-second/over-maximum durations rejected.
- Infinite timestamps rejected; elapsed-hour validity across spring DST accepted; 25-hour fall-DST interval rejected.
- Expired metadata remains present with no application deletion trigger.

Additional harness checks passed: rollback-only fixtures leave zero rows; replay of up with a committed expired row preserves it; down removes table/indexes; repeated down succeeds; up/down/up recreates an empty schema without seeds or recovery data. No SQL fixtures, bootstrap rows or lookup seeds are promoted with the migration.

Rendered the single ER block with the available cached mermaid-cli and installed Chrome:

    PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' /Users/obursak/.npm/_npx/668c188756b835f3/node_modules/.bin/mmdc -i docs/features/short-live-path/data-model.md -o /tmp/slp-data-model-check.md

Exit 0; renderer reported one chart and produced `/tmp/slp-data-model-check-1.svg` plus `/tmp/slp-data-model-check.md`. Render outputs are temporary, not repository artifacts.

Structural script verified exactly one matching staged up/down pair, no SQL REFERENCES requiring a missing index, no live migration directories and exactly five TBD markers. Git diff whitespace check passed for tracked changes; final artifact whitespace checks are run separately for newly created files. Working tree contains only the new feature data-model, staged migrations and audit/verification artifacts.

## Drift detection

Domain-to-DDL drift: N/A, not a measured zero-drift claim. No backend/app domain/models/services, generated schema or prior migrations exist. There are no fields to map and no live schema to compare, so no `_drift/` fix migrations are justified. Future Lucid mapping must preserve UUID id, binary digest, timestamp nullability and precision and must not synthesize updated_at or sensitive columns. Serialize public DTOs explicitly rather than exposing the model wholesale.

Existing baseline/document discrepancy: generic backend baseline still says separate repositories, Redis cache-only and PostgreSQL sole truth. SAD §§2/4–5 and ADR-0003/0005 explicitly override these for this feature. Their exception sections need alignment at scaffolding as already required by SAD §11; this stage does not rewrite unrelated baseline files. Generic skill examples for raw-IP Redis keys, account roles and broad event logging do not apply to anonymous confidential-data flows.

## Open decisions and limits

All five literal `<!-- TBD -->` markers are in data-model.md's open-decision table:

| ID | Remaining decision | Gate |
|---|---|---|
| DM-OQ-01 | Argon2/verifier suite, library/cost, code/request budget, global work/queue budget and benchmark profile | Resolve with security review before executable tasks/implementation. |
| DM-OQ-02 | Exact successful-creation anchor and cross-store timestamp publication/failure transitions | Resolve before executable tasks; do not silently count metadata insertion time as successful creation. |
| DM-OQ-03 | Clock/discontinuity handling, cleanup batches/retries and run/readiness fencing | Resolve before executable tasks; final release and recovery tests remain mandatory. |
| DM-OQ-04 | Reservation leases, stale-work fencing, uncertain/OOM script outcomes and atomic accounting | Resolve before executable tasks; Redis script execution does not imply rollback on errors. |
| DM-OQ-05 | Trusted proxy/address canonicalization, HMAC custody/rotation and restart continuity | Resolve before executable tasks; state loss/key changes must not reset active protections silently. |

No application build/linter/unit-test commands exist yet. The actual checks above validate PostgreSQL DDL and documentation only. They do not verify Redis scripts, cleanup timing, cryptographic verifier strength, browser behavior, safe runtime clocks, load/availability targets, backup exclusions, production files or a deployed system. No independent security approval is claimed.

## Handoff

Proposed commit, not executed: `data-model: short-live-path (data-model.md + staged migrations)`.

Next stage: `api short-live-path`, after review in a fresh session. Route standard does not offer the no-contract-change skip: anonymous creation, neutral status and explicit disclosure introduce new API contracts. API design can proceed from this schema but must carry unresolved runtime decisions forward rather than mark the implementation ready.
