# Reading-code calibration (T21)

Run from the repository root:

    sh scripts/benchmark/run.sh

Or from `backend/` on the host:

    pnpm benchmark:reading-code

The default benchmark profile is 2 CPU / 768 MiB. This is a separate read-only,
network-disabled container using the pinned runtime image and a read-only mount
of this directory. It starts no API, PostgreSQL or Redis; contains synthetic values
only; disables container log retention and core dumps; and never prints code,
PHC verifier or link values. Native Argon2 comes from the backend runtime, not a
host substitute. The runner needs Docker Compose and host Python 3 for JSON
validation. It does not read `.env`.

The native-work harness is benchmark-only. It is not the production validator,
Reading-code service, HTTP cancellation handler or final-disclosure implementation.
T6/T7/T8/T11 still need their own application integration and fault tests.

## Coverage

- Five AC-citing tests: two-call/no-queue admission; caller timeout ownership with
  controlled work; real native work after caller abandonment; exact scalar-code
  and byte boundaries; reviewed PHC rejection before admission.
- Fixed Argon2id v19, 65536 KiB, timeCost 3, parallelism 4, independent 16-byte salts
  and 32-byte outputs. No profile weakening or queue expansion.
- Six synthetic input categories: six ASCII code points, generated twenty-character
  alphanumeric, maximum UTF-8 bytes, six multibyte points, significant whitespace
  and normalization-sensitive Unicode. Labels contain no actual values.
- Hash, correct verify and incorrect verify separately. A cold sample is the first
  native operation after importing the library in a fresh process; module/process
  startup is excluded. Each input/operation has one cold sample and five warm
  samples. "Warm" means same-process samples after the initial fixture hash, not
  independently discarded warm-up calls for each operation. Cold samples and five
  warm samples are small calibration sets, not high-confidence tail estimates.
- Two-concurrent-call throughput/latency; simultaneous third-call refusal; peak
  process RSS and cgroup memory peak; event-loop delay during the measured workload.
- Open-loop 10 calls/s, half hashes and half correct verifications, with a five-second
  warm-up and thirty-second measurement. Refusals and errors are separate from
  successful latency. The completion rate and pass indicator never count refusals
  as successful operations. This is native-work calibration, not the full T20
  HTTPS/browser/store workload or monthly availability evidence.

## Reports and comparison

The baseline command atomically writes sanitized metrics to:

    docs/features/short-live-path/_audit/reading-code-benchmark.json

A separately labelled local candidate can be measured with:

    sh scripts/benchmark/run.sh --candidate-four-cpu

It overrides only the benchmark container to 4 CPU and writes a separate report:

    docs/features/short-live-path/_audit/reading-code-benchmark-four-cpu.json

It does not change API/runtime resources, cryptographic parameters, the two-call
bound or the no-queue policy. A successful candidate run is not approval to change
production resources, nor a reason to hide a failed baseline. Record the hardware,
background workload, image identity and disposition in the accompanying audit
markdown before accepting T21. Report `review_required_before_T20` is an honest
measurement result, not a native-code error; the runner preserves its JSON and
exits successfully after recording it. A test, native computation, worker or JSON
failure instead exits nonzero and does not replace the previous report.
