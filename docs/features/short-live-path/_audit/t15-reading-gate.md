# T15 — neutral reading gate and explicit Show

## Scope and ownership

T15/SCR-03 only. Read the implementation/frontend/TDD skills, original idea source, task, spec, screens, SAD, OpenAPI, test plan, canon, existing source/tests and both delegated static reviews. Same-repository/same-origin/code-only canon exceptions apply; baseline template placeholders do not introduce auth, analytics or new design requirements. No dependency, tracker/task-status, branch, commit, push, credential, production-service or T17+ changes. Existing unrelated working-tree changes were preserved. T16 is **not** certified complete.

Files changed in this slice:

- `frontend/src/view/widgets/SecretReader.tsx`
- `frontend/src/data/short_live_path/useSecretReader.ts`
- `frontend/tests/e2e/gate-t15.spec.ts` (new)
- `frontend/tests/e2e/gate-matrix-t15.spec.ts` (new)
- `frontend/tests/e2e/t15-mounted.ts` (new, test-only mounted development bundle)
- `docs/design-system.md` (T15-only registration)
- this audit

## Concrete changes

`ReadingGate` is exported from the existing widget module rather than introducing a framework or parallel reader state. Its typed `onDisclosure` and `onTerminal` notifications are separate from optional typed content/terminal renderers. Notifications are guarded against repeated delivery of the same current transition. Without renderers it stays a neutral concealed screen with no Secret text or copy controls, including after successful explicit Show. The existing `SecretReader` composition supplies the already-existing read/unavailable renderers; its route and T16 widgets were not replaced or certified.

Applicable local/code-required/code-incorrect errors use the source-preserving code field's existing error, `aria-invalid`, description and alert association. Focus moves to that field, preserving native tab order; safe generic errors get a focused summary. A repeated attempt has an attempt revision even when its error text is unchanged. A code refusal following unprotected status has a safe focused summary rather than silently disappearing because no code field exists. Exact values remain intact for recoverable request errors. Explicit empty and short guesses still issue a protected POST; unprotected POST bodies remain `{}`.

The disclosure catch now consults original local deadline evidence before classifying a generic late-response rejection as temporary. Proven expiry produces expired with the original timestamp and no content; unsafe-clock uncertainty does not fabricate expiry. A fresh disclosure deadline may shorten but cannot restart the original gate budget. These minimal hook changes overlap T16's late-response/deadline concerns and are reported for its owner; they do not complete T16's exact-copy, all-field display, accessibility or terminal restart matrix. Client parsing, lifecycle observers and the previously fixed ExactCopyField StrictMode implementation were not changed.

## Executed RED → GREEN

Evidence directory: `/tmp/slp-t15-evidence` (physical macOS path `/private/tmp/slp-t15-evidence`). Synthetic fixtures only.

- `red-focus.log`: **2 failed**, real assertion failures: Reading-code field remained inactive after incorrect-code and local multibyte overflow. `green-focus.log`: **2 passed** after focus/error association changes.
- `red-boundary-valid.log`: **4 failed**, mounted existing widget produced no parent disclosure/terminal events (`[]` instead of the expected event). `green-boundary.log`: **4 passed** with the typed boundary and concealed fallback. The earlier `red-boundary.log` was an invalid harness run (`process is not defined` from bundled Next dependencies); it is retained as infrastructure evidence, **not** counted as a product RED. The harness now defines the development environment explicitly and imports the actual ReadingGate export.
- `matrix-before.log`: **24 passed, 1 failed**. The missing expired heading after a held response completed beyond the original deadline, before the next 250-ms interval, reproduced the static late-classification issue. Existing matrix branches passed immediately and are regression evidence, not invented new REDs.
- `red-original-deadline.log`: **1 failed**, immediate DOM assertion received `Remaining 00:00:06`, expected `00:00:04`, after two seconds had already been consumed. Earlier polling assertions falsely passed by waiting for the restarted countdown to catch up; strengthened to a non-polling post-transition read before production correction.
- `red-tab-order.log`: **1 failed**, field `tabIndex` was -1 instead of native 0 after focus. Only headings now receive programmatic -1; code fields retain keyboard navigation.
- `red-unprotected-summary.log`: **1 failed**, expected focused summary was absent for code-required after unprotected neutral status. Association is now conditional on an existing code field.
- The final whole-suite GREEN below includes all these regressions on the final source/build, not just targeted runs.

## Mounted coverage

**37 added T15 Chromium cases**: 30 matrix cases plus 7 gate/boundary cases. They exercise:

- Disclosure 409 followed by neutral **early_unavailable, expired, unknown, available, 503 and network failure**. Exactly one POST until another deliberate Show; available never auto-discloses, uncertainty never invents terminal loss. Original URL remains.
- Safe code-required/incorrect 403, shared-address 429 explanation, 422, 413 and 415, exact retained guesses, associated code errors or safe focused summaries, no returned-message leakage or automatic POST retries.
- Disclosure capacity/service 503, network failure, malformed whole response and mismatched HTTP/error-code evidence. Retry is a GET-only availability check, then Show is required again. Initial neutral service/capacity/network/malformed failures also remain concealed.
- Protected explicit empty, one-character, exactly 1024 UTF-8 bytes, raw spaces/combining/astral Unicode/CRLF/bare-CR guesses; multibyte overflow refused locally without POST or truncation.
- Protected and unprotected request bodies; pending form-submit duplicates; successful initial and second fresh Show after concealment/neutral return, with cleared old code and fresh verification/body.
- Callback delivery to a mounted parent, distinct typed terminal variants, neutral no-renderer fallback, no copy controls or fragments.
- Held late disclosure classification and non-restarted original conservative deadline. Existing full lifecycle/offline/clock and reader tests also ran as regressions.

## Full gates and reproducible rerun

All final gates were executed after the last production/test change:

```sh
docker build --network none --target build \
  -f /tmp/slp-t15-evidence/Dockerfile -t slp-t15-web frontend
docker build --network none --target production \
  -f /tmp/slp-t15-evidence/Dockerfile -t slp-t15-production frontend
docker run --rm --name slp-t15-owned-gates --network none \
  -v "$PWD/frontend/tsconfig.json:/home/node/app/tsconfig.json:ro" \
  slp-t15-web sh -c 'pnpm test && pnpm lint && pnpm typecheck'
docker run -d --name slp-t15-owned-web --network none slp-t15-production
# Check readiness with an in-container HTTP fetch; actual result was 200.
docker exec slp-t15-owned-web node -e \
  "fetch('http://127.0.0.1:3000').then(r=>console.log(r.status))"
docker run --rm --name slp-t15-owned-browser \
  --network container:slp-t15-owned-web -e BASE_URL=http://127.0.0.1:3000 \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  -v "$PWD/frontend/src:/home/node/app/src:ro" \
  slp-resume-ui-browser pnpm test:integration
docker rm -f slp-t15-owned-web
```

- `build-final.log`: fresh optimized `next build --webpack` successful; **4/4** static pages generated, exit **0**. `build-production.log`: standalone non-root production runtime build, exit **0**.
- `gates-final.log`: **24/24 unit tests pass, 0 fail/skip**, clean full `eslint .` and `tsc --noEmit`, exit **0**. Repository tsconfig was mounted explicitly for these gates; Next's suggested image-local config normalization did not modify the working tree.
- `chromium-full-final.log`: **89 passed (20.1s)**, one worker, exit **0**, against the freshly built minimal production runtime. Current tests **and source** mounted read-only, preventing stale baked browser-image tests or harness source. Programmatic log counting confirmed 89 total cases and 37 T15 additions.
- `git diff --check`: clean. Branch remained `feat/short-live-path`.

Retained images:

- `slp-t15-web:latest`: `sha256:647edc57a5249267a44f184ff16597408b3ad34ac4a863c954b886186bd79003`
- `slp-t15-production:latest`: `sha256:335e46b93f14b9a156628183e0d5ac9930cd904a243a8c4f29f4208c36d27591`
- reused `slp-resume-ui-browser:latest`: `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`

## Isolation, limits and cleanup

Docker address pools were already exhausted; no new network or prune was attempted. Used only owned `slp-t15-owned-*` resources: web on `--network none`, browser in that container's namespace on loopback, no host listener or named volume. Runtime readback confirmed user `node`, network `none`, port bindings `{}`. Gate/browser containers used `--rm`; owned web was explicitly removed. Subsequent container/network/volume name-filter readbacks returned **no T15 resources**. Images, logs and Dockerfile intentionally remain for parent rerun; frontend/resource ownership is released.

The already-installed T14 toolchain was reused because the parent documented offline dependency-install DNS failure. The retained Dockerfile copies current frontend source and performs a fresh build; no fresh install or dependency change is claimed. An initial readiness fetch raced startup and returned ECONNREFUSED; all final readiness checks returned 200. These are infrastructure observations, not product failures.

No real backend integration, installed Chrome/Firefox/Safari matrix, actual screen-reader audio, phones, approved pixel baseline, production/privacy/security certification or T16 completion is claimed. API, failure and clock fixtures are synthetic. T16 must still independently complete its scoped exact display/copy/manual-fallback, expiry/accessibility and blank-restart proof. Tracker disposition and independent review belong to the parent.
