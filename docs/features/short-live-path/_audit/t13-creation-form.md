# T13 — exact creation form evidence

Scope: T13 only, plus the separately requested stale neutral-shell test compatibility correction. No commits, push, credentials, production changes or tracker edits. Existing T12 changes were retained.

## RED → GREEN

Added `frontend/tests/e2e/create-t13.spec.ts` before production changes. Ran 422 invalid_request, 413 request_too_large and 415 unsupported_media_type against the pre-change built application. All three failed with `Expected: visible / element(s) not found` for their fixed safe notices (`/tmp/slp-t13-evidence/red.log`). The hook incorrectly classified these known refusals as uncertain creation.

Changed only the refusal mapping in `useCreateSecret.ts`: fixed local validation/size/format notices, never server message interpolation. Retained quota/capacity/uncertainty, exact draft, single pending request and T12 cancellation/lifecycle behavior.

Existing lifetime/scalar/size/generator implementations needed no changes. Extended their regression coverage rather than rewriting existing paste/edit/undo tests. New unit vectors passed unchanged implementation. Native pointer test setup was corrected to scroll into view, account for range padding/border/Chromium thumb geometry, and enable touch emulation with a substantial drag before short adjustments; these were test-delivery issues, not production fixes. Exact midpoint input vectors additionally prove higher-hour tie handling.

## Verified coverage

- Mounted 422/413/415/429/capacity/service refusal, malformed 201, network failure and 30-second timeout; retained address/login/credential/code/minutes, editable retry, no speculative confirmation/link, server canary absent, one additional POST only on manual retry.
- Held pending request: every form input/textarea/button disabled, values retained; repeated submit events and Enter do not create extra POSTs.
- Default 60; native mouse/touch drags; mounted exact 1/61/90/1440 vectors; native arrows ±1 and Home/End; synchronized numeric/range; 61 retained through blur/submission; empty/0/1441/fraction blocked and retained with focused summary.
- All 1440 valid whole-minute values checked at domain level.
- Empty/whitespace credential, 65536/65537 aggregate UTF-8 boundaries with multibyte content; exact spaces/tab/non-BMP/combining/CRLF; malformed scalars in each Secret field; code excluded from aggregate. Mounted overflow retention, malformed-scalar paste rejection and focused validation summary.
- Five versus six non-BMP code points, six spaces and predictable six-character code accepted, exact 1024-byte code accepted, overflow and malformed code rejected, disabled invalid code omitted.
- Injected generator bytes 247/248/255/0 produce exactly `9A` repeated ten times in two batches: rejects bias-introducing 248/255 rather than merely checking alphabet shape.
- Existing mounted raw CRLF paste/edit/undo and chosen-code source preservation coverage remains intact.
- Valid confirmed creation transitions out of the form; no additional T14 expiration claims.

## Separate compatibility correction

`frontend/tests/e2e/neutral.spec.ts` no longer expects the obsolete disabled bootstrap Show button for `/s/synthetic-neutral-token`. It asserts the authoritative unknown-state heading, no Show, no copy controls and no textarea. Existing no-API, neutral title, console/page-error, guidance and 360px overflow assertions are unchanged.

## Actual full gates

Canonical Docker build: `docker build --target build -t slp-t13-web -f docker/Dockerfile .` from `frontend/` — passed, including `pnpm build`.

`docker run --rm --network none slp-t13-web sh -c 'pnpm test && pnpm lint && pnpm typecheck'` — 24 tests passed, zero failures/skips; ESLint and TypeScript passed. An earlier read-only source bind prevented the layer-lint test from writing its disposable probe; the final gate ran from the writable built image, without weakening that test.

Full `pnpm test:integration` using existing Chromium browser image and final built web image, separate owned web container with `--network none`, browser `--network container:slp-t13-final-web`, BASE_URL loopback — **28 passed (6.8s)**, zero failures/skips. Fifteen added mounted T13 tests; original thirteen mounted tests retained (including the corrected compatibility test). Browser tests were mounted read-only from current checkout; application source came from the final Docker build. No default-pool network allocation or pruning.

`git diff --check` — passed.

## Output handles

- `/tmp/slp-t13-evidence/red.log`
- `/tmp/slp-t13-evidence/gates.log`
- `/tmp/slp-t13-evidence/build.log`
- `/tmp/slp-t13-evidence/chromium.log`
- `/tmp/slp-t13-evidence/chromium-first.log` (intermediate run, not final proof)
- `/tmp/slp-t13-evidence/images.txt`
- `/tmp/slp-t13-evidence/cleanup.log`
- `/tmp/slp-t13-evidence/t13-360.png` and `t13-desktop.png` (synthetic empty creation form, exact minutes 61 and protection enabled; 360px image visually inspected, controls/labels fit; not approved visual baselines).
- Application image: `slp-t13-web:latest`, `sha256:ce0e8569410aad81e9bb3154d5cbd5963d58e33f4564a262876718c03c33391f`.
- Reused browser image: `slp-resume-ui-browser:latest`, `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`.

Cleanup: removed all eleven named T13 web/browser/visual containers; filtered `docker ps -a --filter name=slp-t13` returned empty. No T13 networks or volumes were created. Images and local evidence retained; no unrelated containers/images/networks pruned.

Limits: synthetic browser API routes, not backend integration; Docker Chromium/touch emulation is not installed-browser or real-phone proof. No T14 confirmation-expiry remediation or T15/T16 work performed; existing whole-suite passes do not certify those tasks. Tracker remains the parent's responsibility. Creation-only canon registration does not register recipient copy behavior or completion of other tasks.
