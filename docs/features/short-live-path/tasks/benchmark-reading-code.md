---
id: "T21"
title: "Benchmark Reading code budgets after backend scaffolding"
layer: "tests"
deps: ["T3"]
blocks: ["T20"]
acs: ["AC-06", "AC-07"]
files_hint: ["scripts/benchmark/", "backend/package.json", "backend/compose.yml", "docs/features/short-live-path/_audit/reading-code-benchmark.md"]
owner: "Product Owner + coding agent"
estimate: "4h"
context_budget: "M"
status: "blocked"
---

# T21 — Benchmark Reading code budgets after backend scaffolding

## Place in the sequence

- Blocked by: T3 — Bootstrap the backend with executable quality gates. Blocks: T20 — Measure workload budgets and install aggregate synthetic checks. Wave: 3 (dependency depth, not elapsed days).
- Lane: shares backend package/Compose files with T3 and the ADR-0006 library setup; serialize changes. T21 does not depend on feature endpoints or T6, and does not block T3/T4. Final end-to-end performance remains T20.

Product Owner accepted ADR-0006/0007 as starting values on 2026-10-22 and explicitly moved benchmarking after scaffolding. T1 source synchronization is complete; T2 protocols still gate T3; this task must not become an indirect pre-scaffold prerequisite.

## Why (user story)

> **As a** Sender
> **I want** to optionally choose or generate a Reading code and communicate it separately
> **So that** possession of the Share link alone need not permit reading.
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This task measures the accepted Reading code resource budget on the actual scaffold without claiming whole-application performance.

## Inlined context

> Argon2id version 19, memoryCost 65536 KiB, timeCost 3, parallelism 4, independent 16-byte salt and 32-byte output. At most two concurrent native calls cover creation and verification together; no application waiting queue. Codes are exact scalar text up to 1024 UTF-8 bytes, with the six-code-point creation minimum unchanged.
>
> — `adr/0006-bound-argon2id-reading-code-work-and-input.md §Decision outcome, ADR-0006, abridged` · full text: [ADR-0006](../adr/0006-bound-argon2id-reading-code-work-and-input.md)

> A timeout or client disconnect does not release a work permit until native computation ends. Late results are discarded; no sensitive queue, persistence or telemetry. Two calls alone do not establish a whole-process memory bound.
>
> — `adr/0006-bound-argon2id-reading-code-work-and-input.md §Decision outcome, permit lifetime, abridged` · full text: [ADR-0006](../adr/0006-bound-argon2id-reading-code-work-and-input.md)

> p95 at most 2 seconds at 10 operations per second for Secret text up to 64 KiB
>
> — `spec.md §6, NFR-01, verbatim` · full text: [spec.md](../spec.md)

> No content, Reading codes or full Share links in logs/backups. Use synthetic disposable input and report aggregate measurements only.
>
> — `spec.md §6, NFR-04, abridged` · full text: [spec.md](../spec.md)

This benchmark uses the asynchronous library pinned by T3, not a fabricated application API or an unrelated local CLI. Read source ADRs and installed package interfaces when a slice is insufficient.

## Data delta

No DB changes.

## API contract

Internal — no API surface. Hash-only results cannot prove HTTPS/browser/store end-to-end NFR-01. T20 must measure that after integration; limiter/capacity refusals must not be counted as successful throughput.

## Acceptance criteria

Coverage is this task’s contribution, not a claim that prerequisite/whole-system AC behavior is already implemented.

### AC-06

> **Given** a Sender enables a Reading code
> **When** the Sender chooses a code or requests random generation
> **Then** creation requires at least six Unicode code points of any composition, longer codes are allowed up to 1024 UTF-8 bytes, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization. A code over this byte limit is rejected with an explanation, never truncated, and does not create a link.
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)


### AC-07

> **Given** a Secret requires a Reading code
> **When** a Recipient attempts reading without the correct code
> **Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link. After five incorrect code verifications in any rolling sixty-second window for the same Share link and client network address, further code verification for that pair is temporarily denied until fewer than five failures remain in that window. Rejected requests do not extend the window. Other addresses are not blocked by that pair's failures; people behind one network address share its limit. Store only a code verification hash, not the plaintext code. This is basic online protection, not a guarantee against distributed guessing; atomic concurrency controls and the bounded hash implementation remain design obligations. Disclosure accepts shorter code guesses, including an explicitly supplied empty code, within the same 1024 UTF-8 byte maximum. Invalid or oversized input and temporary work-capacity refusals do not run code verification or count as an incorrect-code failure.
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Add a reproducible disposable Docker benchmark under scripts/benchmark/ using the scaffold's pinned runtime and asynchronous Argon2 package. Record image/package versions, CPU architecture, host class, CPU/memory limits and exact command.
- [ ] Exercise six-code-point, generated twenty-character, maximum-byte, multibyte and whitespace-sensitive inputs; measure hash and correct/incorrect verify separately, cold/warm, one/two calls and overload with no queue. Include malformed-PHC rejection and permit lifetime after disconnect/timeout in an isolated harness where applicable.
- [ ] Record sample counts, durations, achieved throughput, latency percentiles, peak RSS, event-loop delay and refusal mix in _audit/reading-code-benchmark.md. Include a ten-operation/s synthetic code-work profile with explicit work mix, not a claim of full endpoint throughput or production-host equivalence.
- [ ] If evidence rejects the starting profile, report the blocker and obtain a reviewed adjustment; never silently weaken hashing, increase concurrency/queue or relax NFRs. Keep T20 blocked until a reviewed disposition exists. Broader pairing/fencing fault tests remain T7/T8/T18.

## Edge cases

| Case | Behaviour |
|---|---|
| Native build or target measurement profile unavailable | Report missing prerequisite and leave task blocked; no substituted CLI timing or invented throughput. |
| Third concurrent operation | Refuse without starting native work; report refusal separately from success latency. |
| Timeout during native call | Retain permit until completion and discard late result; do not oversubscribe. |
| Initial costs cannot meet resource/performance budget | Record measured evidence and request a reviewed adjustment; no silent parameter change. |

Sources: [ADR-0006](../adr/0006-bound-argon2id-reading-code-work-and-input.md) §Decision outcome and follow-up obligations, abridged; [spec.md](../spec.md) AC-06/07 and NFR-01/04, abridged.

## Definition of Done

- [ ] Reproducible Docker hash/verify benchmark records pinned versions, host/container limits, cold/warm latency, RSS, event-loop delay, throughput and refusals for ADR-0006; retain starting values or record a reviewed adjustment before T20.
- [ ] AC-06/AC-07 cases cite their IDs; synthetic benchmark artifacts contain no code values or credential-bearing labels. Container smoke and relevant test/lint/typecheck checks pass.
- [ ] Runtime security, proxy/fault verification and whole-application NFR-01 remain distinct obligations; no monthly availability claim is made.
