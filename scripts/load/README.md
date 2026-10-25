# T20 implementation handles — NOT acceptance

T19 is BLOCKED. Do not execute probes, load, native benchmarks, browser/fault suites,
or stand up monitoring/fixture services until the parent explicitly releases that stage.
The artifact here is intentionally not a completed workload runner.

Safe implementation checks (from repository root):

```sh
python3 -m unittest discover -s scripts/load -p 'test_*.py'
docker build --network none -f scripts/load/gates.Dockerfile -t slp-t20-gates backend
git diff --check
```

The gate image reuses the existing local `slp-resume-http-api` dependency/toolchain
image and copies current backend source before build/test/lint/typecheck. It is NOT
an independently installed or deployable runtime image. No new dependencies.

## Future live handles — DO NOT RUN while T19 is blocked

- `python3 scripts/load/identity_fixture.py` prints an isolated nginx template.
  Substitute `${RUNNER_IP}` with a validated literal fixed runner address before nginx
  validation. The original public 8443 listener still overwrites XFF from the socket.
  Only the additional 9443 TLS listener selects from the closed indices 0–99; missing
  or unknown selections fail closed. Its address ACL is runner-only. Never publish
  9443 or mount this template into ordinary deployment. Only the fixed fixture proxy
  is trusted by the unchanged application. Generation is not proof of 100 identities.
- `python3 scripts/load/availability.py --probe-origin https://localhost:PORT --ca OWNED_CA --minutes 2`
  waits for UTC minute boundaries and emits only `{minute,available}` rows. A start
  over five seconds late is left missing; no retries/backfill. Redirects are disabled,
  TLS verification is required and this handle intentionally rejects non-loopback
  targets. Links/code/text exist only in memory. Exceptions become unavailable, not
  exception text. Missing starts are not successful samples.
- `python3 scripts/load/availability.py --month YYYY-MM --samples SANITIZED_JSONL`
  computes the full UTC calendar-month denominator (including leap years). Missing
  samples, failures and duplicates remain explicit; a month cannot certify before
  its end, with gaps/duplicates, or below 99.5%. Maintenance and required-dependency
  failures are unavailable. The observed rate is not the calendar lower bound.
  An external production scheduler/installation and a complete month remain absent.

## Exact remaining workload (unchanged)

Two separate phases: unprotected and protected. EACH has 30 s warm-up, quiesce/reset
only test-owned state/measurements, then 120 s open-loop measurement: five creates
and five disclosures per second, 65,536 aggregate text bytes, 60-minute lifetimes,
100 evenly distributed trusted identities, unique link/address disclosure pairs and
valid exact codes. Prepare a small eligible seed pool outside the measured window.
600 creates + 600 disclosures per measured phase; no automatic retries. Keep API
2 CPU / 768 MiB, hash concurrency two/no queue, Redis 256 MiB/noeviction, payload
cap 1000 and limiter cap 10000. Do not silently tune or weaken any requirement.

The future runner MUST separately report scheduled/offered, dispatched, intended
eligible, completed-within-window, capacity/quota refusals, dependency/transport and
invalid-response failures, skipped starts, scheduler lag, pending-at-end and drain
outcomes. A valid eligible request refused for capacity remains failed attainment.
Refusal latency is never successful latency. Report creation/disclosure success p95
and achieved eligible rate separately; matched real browser completion probes and
their additional identity/fixture budget are also still required.

Next phase needs a new isolated Compose project/material/env/namespace/subnets and
loopback port, one fenced API owner, current runtime builds, tmpfs runner state,
closed 100-identity validation, malformed selection/public-XFF tests, reset/seed and
project-only cleanup. No fixture lifecycle or load execution exists in this phase.
