# Resumed backend verification — 2026-10-23

Scope: local synthetic-data verification of the existing T3–T11 backend, not production approval or frontend acceptance. Base revision: `ca1dba1248e9cdf60ad1a3ce82e98bce66618e52`.

## Actual execution

- `sh backend/docker/check.sh > /tmp/slp-resumed-backend-gates.log 2>&1` exited 0.
- Positive unit suite: 18 tests, zero failures.
- Positive integration suite: 38 tests, zero failures.
- ESLint, strict TypeScript check and compiled build passed within the wrapper.
- Runtime dependency/isolation checks: 2 tests, zero failures.
- Runtime process-fence check: 1 test, zero failures.
- Runtime native Argon2 check: 1 test, zero failures.
- Runtime store/HTTP smoke: 2 tests, zero failures.
- Build and runtime probes with deliberately unavailable PostgreSQL failed as required. Their failures are negative controls, not positive passing tests.
- Final wrapper output: `All gates passed; build and runtime missing-dependency smokes failed as required.`

Runtime image: `sha256:665c6bf023b3cd84a231acb41af3b2392b1af9ab81b8ce2b93f8738e830af929`; user `node`; default command `["node","build/bin/server.js"]`.

Owned Compose project: `slp-t3-test-85230`. Exact project-filtered container and network listings were empty after wrapper cleanup. Unrelated existing resources were not removed.

## Limits

This reruns the existing backend gates; it does not add a startup-PostgreSQL-outage catch-up scenario, certify the host's swap/snapshot controls, establish NFR-01 performance, or validate production/real phones. The newly accepted delayed-erasure disposition is recorded in ADR-0004 and the tracker, not inferred from this successful run.
