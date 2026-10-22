# Epic — short-live-path

> Spec: [spec.md](../spec.md) · Design: [sad.md](../sad.md) · Data model: [data-model.md](../data-model.md) · API: [openapi.yaml](../contracts/openapi.yaml) · ADRs: [adr/](../adr/)

## Goal

Deliver anonymous temporary text-only sharing, optional independent Reading codes and repeated explicit reading with exact copying. Service deadlines, bounded ephemeral deletion and durable metadata recognition remain separate obligations. Source: [spec.md](../spec.md) §2, goals, abridged.

Size M, route standard. This is a provisional planning package, NOT executable implementation readiness. No application, manifest, design-system inventory or architecture-map exists at breakdown time. Planned paths are not existing APIs or imports.

## Scope

- In: two decision sessions, backend/frontend foundations and reviewed design canon, staged lifecycle migration promotion, exact validation and bounded ephemeral admission, cleanup/readiness, three HTTP operations, SCR-01…05 and runtime/retention/browser/performance verification.
- Out: accounts, per-person access, history, lost-link/code recovery, uploads, one-time reads, early deletion, external credential operations and recipient-copy revocation. Source: [spec.md](../spec.md) §3, non-goals, abridged.
- Current baseline: T1/T2 source policy is approved and synchronized under ADR-0008/0009. T3/T4 can proceed after test-planning/profile prerequisites. Runtime clocks, publication, cleanup and security remain implementation/launch gates; exact quota reservations are intentionally deferred, not one of those gates.
- Current ADR-0009 inherits the ADR-0006 hash/input profile and ADR-0007 address/HMAC/quiet-window controls, while superseding their quota-reservation prerequisites. ADR-0008 selects PostgreSQL-write lifetime and time. T21 benchmarks after T3 and gates T20. Runtime verification is not implied by policy acceptance.
- An 8h decision session is a timebox, not a promise of approval. If unresolved, retain blocked status and split/replan rather than manufacture an accepted choice. Runtime task estimates are provisional until those protocols and actual scaffolds exist; target <=1 working day and roughly <=500 LOC per focused change.
- Browser/version/hardware/network profile remains spec §8 / SAD §11 input required BEFORE plan-tests. T4 establishes docs/design-system.md before feature UI, matching the component gap in [screens.md](../screens.md) §Source, inherited blockers/component gap, abridged. This package does not waive either prerequisite.

## Task map

```mermaid
flowchart LR
    T1["T1 Resolve verifier budgets and trusted-address continuity"]
    T2["T2 Resolve publication, clock and reservation state machines"]
    T3["T3 Bootstrap the backend with executable quality gates"]
    T4["T4 Bootstrap the neutral frontend and register shared primitives"]
    T5["T5 Promote the staged lifecycle migration and Lucid model"]
    T6["T6 Implement exact validation, token handling and bounded verification"]
    T7["T7 Implement bounded Redis payload and admission transitions"]
    T8["T8 Implement bounded cleanup and generation-fenced readiness"]
    T9["T9 Implement confirmed creation and its HTTP boundary"]
    T10["T10 Implement neutral status and durable lifecycle classification"]
    T11["T11 Implement explicit disclosure with final release checks"]
    T12["T12 Implement typed browser clients and conservative lifecycle guards"]
    T13["T13 Build the exact creation form and lifetime/code controls"]
    T14["T14 Build guarded share confirmation and separate handover"]
    T15["T15 Build neutral reading gate and explicit Show interactions"]
    T16["T16 Build exact reading and distinct unavailable screens"]
    T17["T17 Wire same-origin deployment and confidentiality controls"]
    T18["T18 Verify canary confidentiality and fault-recovery boundaries"]
    T19["T19 Verify all screens, exact copies and browser lifecycle safety"]
    T20["T20 Measure workload budgets and install aggregate synthetic checks"]
    T21["T21 Benchmark Reading code budgets after backend scaffolding"]
    T1 --> T3
    T2 --> T3
    T1 --> T4
    T2 --> T4
    T3 --> T5
    T3 --> T6
    T3 --> T7
    T6 --> T7
    T5 --> T8
    T7 --> T8
    T5 --> T9
    T6 --> T9
    T7 --> T9
    T8 --> T9
    T5 --> T10
    T7 --> T10
    T8 --> T10
    T6 --> T11
    T7 --> T11
    T8 --> T11
    T10 --> T11
    T4 --> T12
    T9 --> T12
    T10 --> T12
    T11 --> T12
    T4 --> T13
    T12 --> T13
    T4 --> T14
    T12 --> T14
    T13 --> T14
    T4 --> T15
    T12 --> T15
    T14 --> T15
    T4 --> T16
    T12 --> T16
    T14 --> T16
    T15 --> T16
    T3 --> T17
    T4 --> T17
    T8 --> T17
    T9 --> T17
    T10 --> T17
    T11 --> T17
    T16 --> T17
    T17 --> T18
    T17 --> T19
    T18 --> T20
    T19 --> T20
    T21 --> T20
    T3 --> T21
```

DAG waves express dependency depth, not elapsed delivery days. T1/T2 share upstream artifacts and must serialize writes despite being separate roots. After the decision gate, T3 backend and T4 frontend are genuinely parallel branches; T5 metadata and T6 validation can also run independently. T9/T10 share routes; UI tasks share canon/components; overlap lanes serialize those edits. T18 and T19 operate on separate backend/security versus browser evidence. See each task's lane before parallel execution.

## Tasks

See [tracker.md](tracker.md) for status. Machine contract: [tasks.json](../tasks.json).

| # | Task | Layer | Blocked by | DoD (short) |
|---|---|---|---|---|
| T1 | [Resolve verifier budgets and trusted-address continuity](resolve-verifier-address-policy.md) | docs | — | Record Accepted ADR-0006/0007 starting values and synchronize model/spec/API policy with explicit remaining T2 and deployment obligations; benchmark evidence belongs to post-scaffold T21, not this gate. |
| T2 | [Resolve publication, clock and reservation state machines](resolve-time-admission-protocol.md) | docs | — | Record Accepted ADR-0008/0009 PostgreSQL-write/time and simplified quota policy, synchronize sources/API/tasks, and put exact concurrent quota reservations in backlog T22 outside the v1 DAG; runtime proof remains implementation work. |
| T3 | [Bootstrap the backend with executable quality gates](bootstrap-backend.md) | wiring | T1, T2 | Docker backend smoke test, pnpm test/lint/typecheck/build scripts and a deliberately invalid layer-import fixture prove active gates; no sensitive endpoint serves before readiness. |
| T4 | [Bootstrap the neutral frontend and register shared primitives](bootstrap-frontend-canon.md) | ui | T1, T2 | Neutral-shell/component tests prove no disclosure request on navigation, keyboard focus/labels/busy states at 360px, active layer lint and green Docker frontend test/lint/typecheck/build. |
| T5 | [Promote the staged lifecycle migration and Lucid model](promote-lifecycle-migration.md) | migration | T3 | Disposable PostgreSQL integration tests apply/revert/reapply the promoted Lucid migration and test all 1–1440-minute durations, invalid digests/times, uniqueness and no sensitive columns. |
| T6 | [Implement exact validation, token handling and bounded verification](validate-and-hash.md) | domain | T3 | AC-citing unit tests cover multibyte/exact multiline boundaries, surrogate rejection, canonical token padding bits, exact code comparison, malformed verifiers and reviewed work-queue exhaustion. |
| T7 | [Implement bounded Redis payload and admission transitions](redis-admission-store.md) | infra | T3, T6 | Real-Redis integration tests prove basic rolling counters and retained histories, hard storage/cardinality/work caps, original expiry and safe OOM/timeout publication; acknowledge concurrent quota overshoot without requiring deferred reservation leases. |
| T8 | [Implement bounded cleanup and generation-fenced readiness](cleanup-recovery.md) | app | T5, T7 | Real-Redis/PostgreSQL fault tests measure <=60s active deletion and prove cleanup-before-serving, safe PostgreSQL time/current-run guards, continued cleanup during PostgreSQL outage and no early-payload recovery; no deferred quota-lease protocol is required. |
| T9 | [Implement confirmed creation and its HTTP boundary](create-secret.md) | ports | T5, T6, T7, T8 | createSecret contract/integration tests assert safe outcomes, fixed PostgreSQL-INSERT creation/expiration timestamps, shortened usable lifetime, no link on uncertain writes, basic observed 25-success checks and orphan nonextension. |
| T10 | [Implement neutral status and durable lifecycle classification](neutral-status.md) | ports | T5, T7, T8 | getSecretStatus contract tests verify four 200 variants, malformed token stops before lookup, no fragments or mutation, known expiration after Redis restart and 503 for corruption/dependency uncertainty. |
| T11 | [Implement explicit disclosure with final release checks](explicit-disclosure.md) | ports | T6, T7, T8, T10 | discloseSecret tests cover safe HTTP outcomes, basic observed five-failure checks with acknowledged concurrent overshoot, hard global work admission, repeat readers and final PostgreSQL-time/readiness checks after asynchronous verification. |
| T12 | [Implement typed browser clients and conservative lifecycle guards](browser-data-time.md) | app | T4, T9, T10, T11 | Deterministic client/clock tests cover wall-clock rollback, transit, suspend discontinuity, invalid/superseded late responses and stale clipboard callbacks with zero late display eligibility. |
| T13 | [Build the exact creation form and lifetime/code controls](create-form.md) | ui | T4, T12 | SCR-01 component tests cover every manifest state, 1/60/61/1440/fractional minute interactions, multibyte size boundary, code point/generator behavior, retained input and single-submit/no-auto-retry. |
| T14 | [Build guarded share confirmation and separate handover](share-confirmation.md) | ui | T4, T12, T13 | SCR-02 tests prove only confirmed link/code handover, separate exact copy, safe failure feedback, no credential repetition, accessible countdown and local expiry disabling all handover actions. |
| T15 | [Build neutral reading gate and explicit Show interactions](reading-gate.md) | ui | T4, T12, T14 | SCR-03 tests cover all manifest states, no POST on navigation/resume/status, explicit repeated Show, missing/wrong/short codes, shared-pair 429, safe 503/offline return and 409 reclassification. |
| T16 | [Build exact reading and distinct unavailable screens](read-unavailable.md) | ui | T4, T12, T14, T15 | SCR-04/05 tests assert byte-exact multiline field/clipboard text, denied-copy manual fallback, no script/link execution, all safe terminal states and no late/stale/partial content restoration. Reading-route integration tests prove status → explicit Show → SCR-04/05 and concealed return at the original URL. |
| T17 | [Wire same-origin deployment and confidentiality controls](secure-compose-wiring.md) | wiring | T3, T4, T8, T9, T10, T11, T16 | Disposable Compose smoke/integration checks prove direct same-origin routing, private stores, no-store/no-referrer on all outcomes, startup fail-closed and inspected Redis persistence/noeviction configuration. |
| T18 | [Verify canary confidentiality and fault-recovery boundaries](confidentiality-recovery-audit.md) | tests | T17 | Canary audit has zero payload/code/full-link log/backup hits; fault suites prove no late releases, <=60s deletion while cleanup executes and cleanup-before-serving, or explicitly block launch with evidence. |
| T19 | [Verify all screens, exact copies and browser lifecycle safety](browser-lifecycle-e2e.md) | tests | T17 | AC-citing E2E/accessibility tests pass on the approved narrow/desktop browser matrix with zero app console errors, no automatic disclosure and no stale/late plaintext after lifecycle transitions. |
| T20 | [Measure workload budgets and install aggregate synthetic checks](performance-observability.md) | tests | T18, T19, T21 | Reproducible load report records achieved eligible throughput/p95, error/limit mix and deletion latency; synthetic/alert smoke tests pass without sensitive labels, and monthly availability remains explicitly unmeasured until a full calendar window. |
| T21 | [Benchmark Reading code budgets after backend scaffolding](benchmark-reading-code.md) | tests | T3 | Reproducible Docker hash/verify benchmark records pinned versions, host/container limits, cold/warm latency, RSS, event-loop delay, throughput and refusals for ADR-0006; retain starting values or record a reviewed adjustment before T20. |

Total: 21 tasks, 154h = 19.25 person-days at eight hours/day. The explicit post-scaffold benchmark requested by Product Owner is a documented exception to the original 8–20-task sizing guideline; existing task IDs are preserved. No staffed owners or overnight delivery are promised; <TBD lead> denotes a responsibility to assign.

## Deferred backlog (not in executable DAG)

- [T22 — Revisit exact concurrent quota reservations](../backlog/exact-concurrent-quotas.md): explicitly postponed by Product Owner for low expected use (approximately five legitimate users/day). No active task depends on it, and it is not a v1 scaffold or launch gate. Revisit before replicas or when actual abuse/concurrency warrants stricter quotas.

## Risks / Hard rules

- HTTPS and live server-readable processing are accepted; no browser/operator-blind encryption requirement. No Secret/code/verifier persistence, backups or payload-bearing telemetry; PostgreSQL only retains UUID/digest/creation/expiration metadata. Source: [adr/](../adr/) §Decision outcome, ADR-0003/0005, abridged.
- Final service release must be strictly before expiration, independently of cleanup. Active records delete within 60s while Redis executes; suspension has no physical RAM-erasure deadline and recovery cleans before serving. Source: [spec.md](../spec.md) §5, AC-10/11, abridged; [adr/](../adr/) §Decision outcome, ADR-0004, abridged.
- Preserve surviving basic counters/quiet-window recovery, never extend orphan deadlines or evict existing payloads, and never treat script isolation as rollback. Exact concurrent quota ceilings/reservations are deferred to backlog T22; hard resource/expiry/privacy controls are not. Source: [data-model.md](../data-model.md) §Temporary admission state, reservations/continuity, abridged.
- Schema promotion uses installed Lucid BaseSchema; rollback destroys durable recognition and requires authorization/metadata-only backup. No production command is part of this breakdown. Source: [data-model.md](../data-model.md) §Migrations and rollback, staged pair, abridged.
- Every task names tests/review vectors, but real security review, benchmark, monthly availability and host retention evidence remain unperformed. Tests use synthetic data and AC-citing case names. Source: [sad.md](../sad.md) §10/11, quality/readiness, abridged.

Structural verification evidence: [tasks-validation.md](../_audit/tasks-validation.md). Passing structural validation is not approval of unresolved decisions or runtime behavior.
