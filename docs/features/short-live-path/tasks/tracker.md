# Tracker — short-live-path

> States: todo · in_progress · blocked · review · done. No task is implemented or approved as done.
> T1/T2 are decision work only. ADR-0006/0007 initial policy is Accepted by Product Owner; T1 source synchronization and T2 protocols remain open. Implementation tasks stay blocked on those prerequisites; T21 benchmarks after T3, not before scaffolding. A missing source approval cannot be bypassed by editing tracker status.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | [Resolve verifier budgets and trusted-address continuity](resolve-verifier-address-policy.md) | docs | Product Owner + coding agent | 8h | — | todo |
| T2 | [Resolve publication, clock and reservation state machines](resolve-time-admission-protocol.md) | docs | Product Owner + coding agent | 8h | — | todo |
| T3 | [Bootstrap the backend with executable quality gates](bootstrap-backend.md) | wiring | <TBD lead> | 6h | T1, T2 | blocked |
| T4 | [Bootstrap the neutral frontend and register shared primitives](bootstrap-frontend-canon.md) | ui | <TBD lead> | 8h | T1, T2 | blocked |
| T5 | [Promote the staged lifecycle migration and Lucid model](promote-lifecycle-migration.md) | migration | <TBD lead> | 4h | T3 | blocked |
| T6 | [Implement exact validation, token handling and bounded verification](validate-and-hash.md) | domain | <TBD lead> | 8h | T3 | blocked |
| T7 | [Implement bounded Redis payload and admission transitions](redis-admission-store.md) | infra | <TBD lead> | 8h | T3, T6 | blocked |
| T8 | [Implement bounded cleanup and generation-fenced readiness](cleanup-recovery.md) | app | <TBD lead> | 8h | T5, T7 | blocked |
| T9 | [Implement confirmed creation and its HTTP boundary](create-secret.md) | ports | <TBD lead> | 8h | T5, T6, T7, T8 | blocked |
| T10 | [Implement neutral status and durable lifecycle classification](neutral-status.md) | ports | <TBD lead> | 6h | T5, T7, T8 | blocked |
| T11 | [Implement explicit disclosure with final release checks](explicit-disclosure.md) | ports | <TBD lead> | 8h | T6, T7, T8, T10 | blocked |
| T12 | [Implement typed browser clients and conservative lifecycle guards](browser-data-time.md) | app | <TBD lead> | 8h | T4, T9, T10, T11 | blocked |
| T13 | [Build the exact creation form and lifetime/code controls](create-form.md) | ui | <TBD lead> | 8h | T4, T12 | blocked |
| T14 | [Build guarded share confirmation and separate handover](share-confirmation.md) | ui | <TBD lead> | 6h | T4, T12, T13 | blocked |
| T15 | [Build neutral reading gate and explicit Show interactions](reading-gate.md) | ui | <TBD lead> | 8h | T4, T12, T14 | blocked |
| T16 | [Build exact reading and distinct unavailable screens](read-unavailable.md) | ui | <TBD lead> | 8h | T4, T12, T14, T15 | blocked |
| T17 | [Wire same-origin deployment and confidentiality controls](secure-compose-wiring.md) | wiring | <TBD lead> | 8h | T3, T4, T8, T9, T10, T11, T16 | blocked |
| T18 | [Verify canary confidentiality and fault-recovery boundaries](confidentiality-recovery-audit.md) | tests | <TBD lead> | 8h | T17 | blocked |
| T19 | [Verify all screens, exact copies and browser lifecycle safety](browser-lifecycle-e2e.md) | tests | <TBD lead> | 8h | T17 | blocked |
| T20 | [Measure workload budgets and install aggregate synthetic checks](performance-observability.md) | tests | <TBD lead> | 8h | T18, T19, T21 | blocked |
| T21 | [Benchmark Reading code budgets after backend scaffolding](benchmark-reading-code.md) | tests | Product Owner + coding agent | 4h | T3 | blocked |

Total: 21 tasks, 154h, approximately 19.25 person-days at eight hours/day. Estimates are provisional, not a commitment; all tasks are <=8h. Overlapping file lanes serialize shared changes.
