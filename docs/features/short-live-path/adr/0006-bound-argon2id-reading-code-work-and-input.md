---
status: Accepted
owner: "Tech Lead"
reviewers: ["Product Owner"]
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0006 — Bound Argon2id Reading code work and input

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly accepted ADR-0006 and ADR-0007 as starting values on 2026-10-22 and deferred benchmarking until after scaffolding. No independent security sign-off or measured performance is claimed.

## Context

SAD §§4/8/11 and data-model DM-OQ-01 require a concrete password-hard verifier and finite work/input budgets before implementation. AC-06 preserves exact codes, including spaces and Unicode, and accepts codes longer than its six-code-point minimum; it does not provide an unlimited HTTP or memory budget. AC-07's per-link/address limiter alone cannot bound hash work from many addresses. These initial values are accepted; T1 source synchronization is complete, while no installed dependency or benchmark result is claimed.

## Decision drivers

- Spec AC-06: exact comparison without trimming/normalization; minimum six Unicode code points on creation; unbiased twenty-character browser-generated codes.
- Spec AC-07 and SAD §6 S4: reserve pair eligibility before expensive verification; no link consumption or link-wide lockout; shorter disclosure guesses remain valid inputs.
- Spec NFR-01: eligible operations must achieve p95 at most two seconds at ten operations per second; hash throughput must be measured, not inferred.
- Spec NFR-04 and SAD §§2/7: verifiers are ephemeral, never logged or backed up; no sensitive persistent work queue.
- SAD §8 and T1: finite body/code bytes, concurrency and queue resources require explicit review.

## Considered options

1. **Argon2id with bounded asynchronous workers and no application waiting queue** — explicit resource refusal and simple sensitive-state ownership; bursts may be refused even below pair quotas.
2. **Argon2id with a bounded in-memory waiting queue** — absorbs brief bursts but adds code-bearing pending state, queue latency and cancellation/lease coordination.
3. **Memory-hard scrypt with equivalent input/work admission** — a credible alternative with runtime support to assess, but requires a reviewed exception to the prescribed Argon2 baseline and its own calibrated costs.

## Decision outcome

**Chosen:** Option 1, accepted as the initial implementation baseline. Use Argon2id through the asynchronous `argon2` package (node-argon2), explicit parameters and a single API-wide work gate covering BOTH verifier creation and verification; pin the exact package/runtime/container versions and verify their APIs during scaffolding and T21. No synchronous event-loop hashing or separate worker deployable is introduced.

Accepted starting profile, subject to T21 calibration:

| Item | Accepted initial value / behavior |
|---|---|
| Algorithm | Argon2id, version 19; memoryCost 65536 KiB, timeCost 3, parallelism 4; independent CSPRNG 16-byte salt and 32-byte output. |
| Encoding | Library PHC encoding retained only in the expiring Redis payload; accept only the reviewed algorithm/version/cost/salt/output profile before invoking verification. Corrupt or excessive-cost stored values fail closed as service unavailability, not wrong code. |
| Concurrent hash calls | At most 2 across creation and disclosure in the single API process; use an explicit shared semaphore, not the default native thread-pool queue as admission. |
| Application waiting queue | 0; when busy, return the existing 503 capacity-unavailable result without executing a hash. Global saturation is not a wrong-code failure or a pair 429. |
| Reading code | At most 1024 UTF-8 bytes, exact scalar text on both operations; creation still requires at least six code points, disclosure permits shorter guesses including empty string. Absent code is distinct from an explicitly supplied code. No truncation, normalization, prehashing or character-class requirement. |
| HTTP body | At most 524288 wire bytes for creation/disclosure, enforced while receiving at proxy and API, including absent/chunked Content-Length. Accept only identity Content-Encoding initially; reject compressed bodies before decompression. |
| Invalid input | Validate scalar text, schema, aggregate Secret size and code bytes before hash admission. Oversize/unsupported encoding produces a safe no-store client error, no link and no hash; exact HTTP/error mapping must be synchronized through the API stage before feature implementation. |

The hash parameters follow RFC 9106 §4's second recommended profile, not a claim that the target host can sustain it. Product Owner accepted the body/code restrictions as starting values. T1 has synchronized spec, OpenAPI (including transport errors), browser guidance and structural validation. Runtime validators remain implementation work. A JSON serialization of otherwise valid data must fit the wire bound; test heavily escaped 64 KiB text and maximum code rather than silently truncating or imposing a smaller aggregate Secret limit.

Acquire the process-wide work permit and the relevant Redis creation/pair reservation before dispatching native work; if either gate refuses, safely release the other without counting a code failure. The T2 protocol must define acquisition order, reservation fencing and completion accounting. A timeout or client disconnect does NOT release a work permit until native computation actually ends; discard late results and recheck readiness/deadline before any disclosure. Native cancellation must not be assumed. Pending codes stay only in bounded request/work memory, never Redis queues, logs or metrics. The HTTP layer still needs measured connection/in-flight body limits: a two-call hash cap alone is not a whole-process memory bound.

Gate: changes validators, browser/API contracts, service admission, Redis verifier parsing and security/load tests; multiple modules plus legitimate alternatives meet the ADR threshold. ADR-0003 defines the security boundary but deliberately leaves this verifier choice open; no Accepted ADR is replaced.

Follow-up verification obligations (not prerequisites for Accepted status):

- T3 pins the library/runtime/image and native build. T21 runs the container benchmark after T3, records CPU/memory limits and host class, and blocks final performance verification T20, not scaffolding.
- Run a reproducible container benchmark using synthetic six-code-point, generated twenty-character, maximum-byte and exact-Unicode cases; record cold/warm hash and verify latency, memory/RSS, event-loop delay, throughput and rejections. Compare accepted initial costs/work cap under the approved ten-operation workload with an explicit create/read/code mix. Representative host/network profile remains unselected; no measured performance claim is made.
- AC-06 vectors: six multibyte code points; byte bound and one byte over; composed/decomposed Unicode, case and trailing-space differences; short disclosure guesses; heavily escaped maximum-size JSON. Exact matching must survive round trips.
- AC-07 vectors: distributed pairs cannot exceed the global work cap; pair/global refusal starts no native work; successful verification does not erase failures; stale/aborted work retains its permit until completion; malformed PHC values cannot request attacker-selected costs. T2 must supply reservation-race proof separately.
- Product Owner approval is recorded above. T1 source-contract synchronization is complete; T2 owns reservation integration, T21 owns calibration, and implementation/security tasks own runtime vectors. Initial parameter selection is accepted; verification is deferred explicitly, not waived. No vector above has run against an application.

## Consequences

**Positive**
- One shared work gate limits expensive code creation and verification, including distributed attempts.
- No waiting queue avoids a second code-bearing storage lifecycle and queue-delay policy.
- Exact codes, optional protection and existing pair-limit semantics remain distinct from resource admission.

**Negative**
- The accepted code/body maxima restrict input and still require API/UI synchronization.
- Two workers without a queue may refuse legitimate office bursts; fairness and target throughput are unproven.
- Native package builds and memory-hard work require container/host headroom beyond Redis's separate memory budget; costs may need a reviewed revision after measurement.

**Neutral**
- A stronger verifier cannot fix weak or reused codes or guarantee protection against distributed guessing.
- Changing costs later needs a version-policy review, not automatic rehashing that extends payload expiration; ephemeral records may expire naturally before a planned profile change.
- Acceptance approves starting values, not runtime performance or security. Draft contract synchronization and T2 gates remain; benchmarking is no longer a pre-scaffold gate.

## Links

- Spec: [spec.md](../spec.md), AC-06/AC-07 and §6 NFR-01/NFR-04.
- SAD: [sad.md](../sad.md), §§4/6 S4/8/11.
- Model: [data-model.md](../data-model.md), DM-OQ-01 and temporary admission state.
- Tasks: [T1](../tasks/resolve-verifier-address-policy.md), [T21 — post-scaffold benchmark](../tasks/benchmark-reading-code.md).
- Contract: [openapi.yaml](../contracts/openapi.yaml), Draft input/resource bounds.
- Related ADRs: [0003](0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md), [0007](0007-canonicalize-trusted-addresses-and-fence-quota-resets.md).
- Parameter reference: [RFC 9106 §4](https://www.rfc-editor.org/rfc/rfc9106.html#section-4), second recommended Argon2id profile; retrieved 2026-10-22. A recommendation is not a workload benchmark.
