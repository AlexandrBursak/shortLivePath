# T12 — browser client and lifecycle guards

## Status

T12 done after T13 reconciled the obsolete neutral-shell test and the complete browser suite passed. Final combined baseline: 24 unit tests, lint/typecheck/production build and 28 Chromium browser tests pass. Parent independently reran unit/lint/typecheck and all 28 browser tests against the built T13 image; its owned container was removed. See [T13 evidence](t13-creation-form.md). Historical intermediate failure below is retained, not a current blocker. No commit or production acceptance.

## Scope

Typed clients now reject aborted requests even if transport ignores cancellation, including cancellation while reading the response body. Error codes must match both operation and HTTP status, so malformed evidence cannot establish expiry or an incorrect code. Response size/shape, canonical same-origin capabilities, exact strings and no POST retries are covered.

Deadline guards invalidate non-finite/unsafe clock samples and accumulated drift; tolerated wall corrections cannot restore consumed lifetime. Offline transitions conceal content; online/resume transitions conceal before neutral revalidation. Pending creation is fenced across lifecycle transitions, preserving the exact draft and reporting uncertainty rather than confirming a stale response. Clipboard callbacks retain their existing eligibility fencing.

## Verification

- Parent independently executed `pnpm test && pnpm lint && pnpm typecheck`: 22 tests passed, lint/typecheck passed.
- T12 implementation agent executed Docker frontend build and the same unit/lint/typecheck gates successfully. Build log: `/tmp/slp-t12-build.log`.
- Full controlled Docker Chromium suite: 12 passed, 1 failed; all four new T12 browser cases passed.
- Remaining failure: `frontend/tests/e2e/neutral.spec.ts` expects the original bootstrap disabled Show button for a malformed token. Current reader correctly classifies malformed token as unknown, without a lookup or Show button. Preserve the no-API/no-disclosure/no-console-error requirements when reconciling this stale test; do not skip it.
- Parent `git diff --check` passed.

Agent source changes: client.ts, dto.ts, useCreateSecret.ts, eligible_deadline.ts and observe_lifecycle.ts, plus client/lifecycle unit tests and lifecycle browser tests. The implementation report contains RED-to-GREEN observations for abort-insensitive transport, error/status mismatch, cumulative drift, wall correction, offline concealment and creation confirming after pagehide/return.

## Limits

Synthetic browser lifecycle events are not proof of real OS suspension or BFCache. Actual same-origin HTTPS/store-backed browser behavior belongs to T17/T19. Installed desktop-browser and real-phone matrices remain unverified here. Docker default address pools were exhausted; the agent used its isolated web container's loopback network namespace rather than pruning unrelated resources. Task-owned Docker resources were reported removed; parent cleanup verification is recorded separately when performed.
