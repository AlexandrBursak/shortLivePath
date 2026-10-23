# Tracker — short-live-path

> States: todo · in_progress · blocked · review · done. T1/T2 are done for approved documentation/policy; T3 is done for the executable backend bootstrap with verified build/runtime isolation. This does not mean the feature or its security/production gates are complete.
> Dependency disposition: the Product Owner selected build/runtime separation. The final runtime's installed inventory excludes the vulnerable assembler/glob chain and passes its npm advisory audit. GHSA-vfj7-8cjw-p6xm remains unpatched in build tooling and is tracked, not suppressed or broadly waived. Evidence: [backend bootstrap audit](../_audit/bootstrap-backend.md). The approved code-only UI foundation is recorded in [design-system.md](../../../design-system.md); T4 neutral bootstrap is done; [frontend evidence](../_audit/bootstrap-frontend.md). Exact source/paste/copy behavior remains T13/T16, desktop browser matrix T19.
> T21 is done as calibration evidence with a reviewed disposition: Product Owner retained 2 CPU / 768 MiB after the baseline completed 299/300 offered native operations with one capacity refusal. The 4-CPU comparison is not adopted. NFR-01 remains unconfirmed and unchanged; T20 still must prove its full eligible workload before launch. Evidence: [Reading-code benchmark](../_audit/reading-code-benchmark.md).
> Execution evidence: T4 [frontend bootstrap](../_audit/bootstrap-frontend.md), T5 [Lucid migration](../_audit/lifecycle-migration.md), T6 [validation/verifier](../_audit/validation-verification.md). T7 is done after reproducing and closing the exact independent Redis findings; [Redis evidence and corrected regressions](../_audit/redis-admission.md). T8 is done for internal ownership/readiness/cleanup after actual full gates and a real 90s suspension test; [execution evidence](../_audit/cleanup-recovery-partial.md). T9–T11 are done after their full backend gates ([HTTP evidence](../_audit/http-operations.md)). T12–T16 are in progress in the shared browser/UI lane; T17–T20 remain unimplemented.
> Task-brief frontmatter retains the original planning snapshot validated by `_audit/verify-tasks.py`; this tracker records current execution status and additional runtime/security blockers.
> T1/T2 are decision work only. Current ADR-0008/0009 policy is Accepted by Product Owner; ADR-0008/0009 resolve the creation/time baseline and explicitly defer exact quota reservations; T21 benchmarks after T3, not before scaffolding. A missing source approval cannot be bypassed by editing tracker status.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | [Resolve verifier budgets and trusted-address continuity](resolve-verifier-address-policy.md) | docs | Product Owner + coding agent | 8h | — | done |
| T2 | [Resolve publication, clock and reservation state machines](resolve-time-admission-protocol.md) | docs | Product Owner + coding agent | 8h | — | done |
| T3 | [Bootstrap the backend with executable quality gates](bootstrap-backend.md) | wiring | coding agent | 6h | — | done |
| T4 | [Bootstrap the neutral frontend and register shared primitives](bootstrap-frontend-canon.md) | ui | coding agent | 8h | T1, T2 | done |
| T5 | [Promote the staged lifecycle migration and Lucid model](promote-lifecycle-migration.md) | migration | coding agent | 4h | T3 | done |
| T6 | [Implement exact validation, token handling and bounded verification](validate-and-hash.md) | domain | coding agent | 8h | T3 | done |
| T7 | [Implement bounded Redis payload and admission transitions](redis-admission-store.md) | infra | coding agent | 8h | T3, T6 | done |
| T8 | [Implement bounded cleanup and generation-fenced readiness](cleanup-recovery.md) | app | coding agent | 8h | T5, T7 | done |
| T9 | [Implement confirmed creation and its HTTP boundary](create-secret.md) | ports | <TBD lead> | 8h | T5, T6, T7, T8 | done |
| T10 | [Implement neutral status and durable lifecycle classification](neutral-status.md) | ports | <TBD lead> | 6h | T5, T7, T8 | done |
| T11 | [Implement explicit disclosure with final release checks](explicit-disclosure.md) | ports | <TBD lead> | 8h | T6, T7, T8, T10 | done |
| T12 | [Implement typed browser clients and conservative lifecycle guards](browser-data-time.md) | app | <TBD lead> | 8h | T4, T9, T10, T11 | in_progress |
| T13 | [Build the exact creation form and lifetime/code controls](create-form.md) | ui | <TBD lead> | 8h | T4, T12 | in_progress |
| T14 | [Build guarded share confirmation and separate handover](share-confirmation.md) | ui | <TBD lead> | 6h | T4, T12, T13 | in_progress |
| T15 | [Build neutral reading gate and explicit Show interactions](reading-gate.md) | ui | <TBD lead> | 8h | T4, T12, T14 | in_progress |
| T16 | [Build exact reading and distinct unavailable screens](read-unavailable.md) | ui | <TBD lead> | 8h | T4, T12, T14, T15 | in_progress |
| T17 | [Wire same-origin deployment and confidentiality controls](secure-compose-wiring.md) | wiring | <TBD lead> | 8h | T3, T4, T8, T9, T10, T11, T16 | blocked |
| T18 | [Verify canary confidentiality and fault-recovery boundaries](confidentiality-recovery-audit.md) | tests | <TBD lead> | 8h | T17 | blocked |
| T19 | [Verify all screens, exact copies and browser lifecycle safety](browser-lifecycle-e2e.md) | tests | <TBD lead> | 8h | T17 | blocked |
| T20 | [Measure workload budgets and install aggregate synthetic checks](performance-observability.md) | tests | <TBD lead> | 8h | T18, T19, T21 | blocked |
| T21 | [Benchmark Reading code budgets after backend scaffolding](benchmark-reading-code.md) | tests | Product Owner + coding agent | 4h | — | done |

Deferred outside tasks.json: [T22 — Revisit exact concurrent quota reservations](../backlog/exact-concurrent-quotas.md). No current dependency or launch gate; activate only by explicit product decision.

Total: 21 active tasks, 154h, approximately 19.25 person-days at eight hours/day. Estimates are provisional, not a commitment; all tasks are <=8h. Overlapping file lanes serialize shared changes.
