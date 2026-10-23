# T21 — Reading-code benchmark evidence

## Result and reviewed disposition

Benchmark implementation, native execution and quality gates PASS. The two-CPU
baseline did **not** attain the complete offered workload: one capacity refusal
is retained in the report and excluded from successful throughput. The four-CPU
comparison completed its offered workload but is not adopted.

Product Owner reviewed both results and explicitly chose to retain **2 CPU / 768
MiB**, with the performance target still unconfirmed. Cryptographic parameters,
the hard two-native-call bound, zero waiting queue and NFR targets are unchanged.
This closes T21 as a measured calibration with an explicit disposition, not as
NFR-01 attainment. T20 must still prove the original HTTPS/browser/store workload;
its target remains a launch gate. No production resource approval or security
sign-off is implied. API/runtime and baseline benchmark remain at two CPU.

## Reproduce and isolate

From repository root:

    sh scripts/benchmark/run.sh
    sh scripts/benchmark/run.sh --candidate-four-cpu

Host convenience command from backend/: `pnpm benchmark:reading-code`.
Only the explicit comparison overlay changes benchmark CPU allocation; it never
changes API/runtime resources. The default run atomically writes
`reading-code-benchmark.json`; the comparison writes
`reading-code-benchmark-four-cpu.json`. Both original runs remain separate.

The container has a read-only filesystem and benchmark-source mount, no network,
no elevated capabilities, no container log retention and no core dumps. It starts
no application/store and touches no production namespace, host credentials or
existing volume. Synthetic inputs and PHCs remain only in process memory/IPC,
not argv, reports, storage or telemetry. Project-scoped teardown completed; exact
project-filtered Docker container listings were empty afterward.

## Observed local profile and identity

- Host: Apple M5 Pro, 18 logical CPUs, 25769803776 bytes RAM; macOS 26.5.2 build
  25F84. AC power, fully charged; power mode 0 as observed, no power settings changed.
- Docker Desktop engine 29.8.0, aarch64, 18 visible CPUs, 8317267968 bytes available
  Docker memory. Other existing containers were nearly idle in the pre-run stats
  snapshot; ordinary desktop background workload was not controlled. No competing
  functional/load test was deliberately run during the measurement phases.
- Native process: Node v24.17.0, node-argon2 0.45.1, Linux/arm64 kernel
  7.0.12-linuxkit. Container CPU model is reported as unknown; host class above was
  obtained separately, not fabricated from that field.
- Baseline cgroup CPU: `200000 100000`; comparison: `400000 100000`.
  Both memory limits: `805306368` bytes. No silent resizing between profiles.
- Baseline runtime image:
  `sha256:bb1f716e6fc3af151eb26eb6e69393604795deff9ad3cac63a0c2bb44a64044b`.
- Comparison runtime image:
  `sha256:f1d8746676db5dd5d602ca69161ab8d34a45768122d8ddafbd59ae3a2f16ab0e`.
- Report file completion timestamps observed from filesystem metadata:
  baseline `2026-10-22T16:05:20.271307+00:00`; comparison
  `2026-10-22T16:08:38.323702+00:00`. These are report completion times, not claimed
  exact process-start timestamps.
- Source base: `9eb598b427bd5fc05381de3c90c99a73529f9171`, with uncommitted work.
  Benchmark implementation SHA-256 (unchanged across the two measurements):
  `83a97ff065163a9accf8cd82faef9301100520d1be5927dd8a22f627767f2be5`.
  Native caller-abandonment test coverage was added between runs; measurement
  implementation/inputs/workload were not changed. No commits were made.

## Method and sample limits

Argon2id v19, memoryCost 65536 KiB, timeCost 3, parallelism 4, independent random
16-byte salt and 32-byte output. Exactly two shared native permits, no application
queue. A permit survives a caller stopping its wait until underlying work settles.
This is an isolated harness, not proof of real HTTP disconnect handling or final
release guards; T6/T7/T8/T11 still own application integration.

Six input categories: six ASCII code points, secure generated twenty-character
alphanumeric, maximum 1024 UTF-8 bytes, six multibyte points, significant whitespace,
and normalization-sensitive Unicode. Reports contain categories/lengths only.
Hash/correct verification/incorrect verification are separate measurements.

For each input and operation, cold is one first-native-call sample in a fresh
process after module import; process startup/import time is excluded. Warm means
five same-process samples after the initial fixture hash, not independent
per-operation discarded warm-up. There are 18 cold samples and 90 warm samples.
Small calibration sets do not establish high-confidence tail bounds. Two-call
series use 20 samples per operation with two concurrent calls.

The open-loop phase offers ten calls/s: five hashes and five correct verifications,
using synthetic fixtures, a five-second warm-up, then thirty seconds measured.
There are 150 offered calls of each type. Refusals/errors never become successful
latency samples. A measured phase attains its local budget only if all offered
calls complete inside the window, without failures, with successful p95 <=2000 ms.
This is not T20's longer 64-KiB HTTPS/browser/store workload or a monthly
availability measurement. Single local runs cannot isolate all causes of jitter.

## Actual measured workload

| Profile | Completed | Capacity refusals | Completed ops/s | Hash p95 ms | Correct verify p95 ms | Native-work budget attained |
|---|---|---|---|---|---|---|
| 2 CPU baseline | 299/300 | 1 | 9.9667 | 43.26 | 42.25 | False |
| 4 CPU comparison (not adopted) | 300/300 | 0 | 10.0000 | 41.13 | 38.94 | True |

The baseline's capacity refusal remains recorded; four-CPU success does not repair
or replace it. Neither result is a production-host or full NFR-01 certificate.

## Baseline per-operation calibration

| Operation | Cold first-call min–max ms across inputs | Same-process warm p95 min–max ms | Two-call p95 ms | Two-call completed ops/s |
|---|---|---|---|---|
| hash | 26.44–57.21 | 72.18–84.53 | 185.86 | 14.49 |
| verify_correct | 29.41–61.74 | 68.53–73.68 | 182.95 | 15.40 |
| verify_incorrect | 28.11–57.45 | 70.82–75.00 | 176.59 | 16.48 |

Baseline main-process peak RSS: 185132 KiB
(180.79 MiB); reported cgroup memory peak:
155201536 bytes. RSS and cgroup accounting are
separate observations, not interchangeable memory guarantees. Workload event-loop
delay p95: 12.55 ms; maximum:
65.01 ms.

Both profiles' explicit three-simultaneous-call overload trial completed two calls,
refused one without queueing, and observed at most two admitted native operations.
Malformed/excessive PHCs are rejected before native admission. Exact whitespace,
case and normalization differences do not silently match. No plaintext verifier,
code value or share-link label is included in the artifacts.

## RED and quality gates

GOOD RED: the initial four AC-citing tests compiled/executed and failed the
assertion `the executable benchmark harness must exist`, false versus true,
before implementation. The implemented harness then passed all four. Added real
native caller-abandonment coverage brings the final suite to five tests, verified
on both two-CPU and four-CPU containers; no skip counts as a pass.

Verified commands: root invocation of backend ESLint with its existing config over
`scripts/benchmark/*.mjs`; Node syntax checks for both modules; shell syntax check;
five benchmark tests in the two-CPU runtime; and `sh backend/docker/check.sh`.
The full existing unit/lint/typecheck/build plus runtime-isolation/native/store/HTTP
wrapper exited 0, with its two expected missing-PostgreSQL probes failing correctly.
This is a structural/functional self-check, not independent whole-feature approval.

A focused read-only review found no confidentiality or permit-ownership bug, but
requested a reviewed baseline disposition, complete reproducibility context and a
precise warm-sample definition. Those are supplied above without altering the raw
failed baseline. Broader security, retention, browser, deployment and NFR validation
remain outstanding. T4 and the backend feature tasks may continue; T20 may not
claim attainment or launch readiness from this calibration.
