# T16 — exact recipient reading and distinct unavailability

## Scope and retained boundaries

T16 only: SCR-04/SCR-05 and their recipient composition at the existing `/s/[token]` route. Read the implementation/frontend/TDD skills and frontend reference sources (skill symlink containment errors were worked around by reading their canonical local targets), actual idea/spec/task/screens/OpenAPI/test plan/canon, source/tests and the full delegated static review `/Users/obursak/.hermes/cache/delegation/subagent-summary-1-20261023_120415_178493.txt`.

The approved same-repository, same-origin, anonymous/code-only-canon rules override generic skill template placeholders; no invented auth, cookies, analytics, API shapes or design system. No tracker/task-status edits, commit/push/branch operation, credentials, production-service access or T17 implementation. Preexisting dirty-tree changes were preserved.

The thin route already composes `SecretReader`; it retains the typed T15 `ReadingGate` notification/render boundary and concealed no-renderer fallback. No replacement hook, client, timing policy or parallel reader state was introduced. Static-review StrictMode and late-disclosure/original-budget findings were already fixed by T14/T15: the final full suite reran those regressions successfully; they are not claimed as new T16 fixes or unresolved bugs.

## Exact changes

- `frontend/src/view/components/ExactCopyField.tsx`: after an eligible denied/failed clipboard operation, focus the existing selectable field for manual fallback. Retain original strings, native keyboard focusability, StrictMode setup, pending guard and before/after eligibility checks.
- `frontend/src/view/components/UnavailableSecret.tsx`: the existing safe expiry status explicitly says “This Share link has expired.” as well as no further disclosure, making the transition available to assistive technology without turning countdown ticks into live announcements.
- `frontend/tests/e2e/read-t16.spec.ts` (new): **30** mounted production-route Chromium cases, described below. Optional evidence-directory screenshots contain synthetic values only.
- `docs/design-system.md`: register proven T16 recipient ExactCopyField, SecretReader/RemainingLifetime reuse and UnavailableSecret responsibility/states. Retain T14/T15 provenance and remaining platform/production limits.
- This audit (new).

No sender tests, typed gate callbacks/renderers, route implementation, DTO/client, countdown implementation or lifecycle hook were modified by this slice.

## Actual RED → GREEN

Evidence directory: `/tmp/slp-t16-evidence` (physical path `/private/tmp/slp-t16-evidence`). All fixtures are synthetic.

1. `exact-red.log`: **3 failed, 2 passed**. Each field reached its safe denied-copy notice, but `expect(field).toBeFocused()` received **inactive**. This was a product assertion failure, not a compile/harness failure. Added only eligible fallback-field focus. `exact-green.log`: **5 passed** on a freshly rebuilt optimized production app.
2. `expiry-red.log`: **1 failed**. Expected the live status to include `This Share link has expired.`, received only `No new disclosure is available through this link.` Heading focus/content removal already passed. Added explicit safe expiry wording to the existing status. `reading-green.log`: **27 passed** with this correction and the added rejection/stale-work/terminal regression vectors.
3. `deadline-copy-green.log`: **3 passed**. Additional regression proof exercises new button/manual-copy attempts after the deadline but before the next presentation tick, while the actual fields are still connected. This existing guard passed immediately; it is not fabricated RED evidence.
4. Final full run: **119 passed (26.4s)**, including **30 T16**, **37 T15** and **24 T14** cases, counted from executed result lines with Python. New regression vectors that passed existing implementation are recorded as such; production changes were made only after their specific failing assertions above.

An initial gate invocation mounted source read-only, causing the existing layer-lint negative test's temporary probe cleanup to fail with `EROFS` (23 pass/1 fail). This was an infrastructure error, not product RED. The corrected gate uses the fresh build image's disposable writable source layer and mounts current tests plus repository tsconfig; its probe can create/remove its container-only file. No host source write was permitted by that failed mount. Final unit/lint/typecheck is fully green.

## Executed recipient proof and acceptance mapping

The new tests use the real optimized route and mounted React DOM, not a replacement reader mock. API responses and clocks are controlled at the browser boundary.

- **AC-03 / AC-08 — all fields:** address, login and password/key each retain exact DOM `textContent`; leading/trailing spaces, tabs, CRLF, lone CR, LF, combining `é`, astral characters, HTML/script-looking text, URL-looking text and a long unbroken line. Each field passes a real browser Clipboard API write/read round trip; an additional instrumented write proves the original string passed to `writeText`. Keyboard Enter triggers independent per-field copy, and safe feedback contains only the item name, never its value.
- **Denied manual fallback:** all three fields receive denial, no false success, and focus moves to that field. Actual DOM Selection/Range whole-field and partial UTF-16 ranges feed synthetic browser copy events; `DataTransfer` receives the exact original whole string or selected substring, retaining raw line endings/Unicode. This proves the app's copy-event boundary, not every host OS native copy menu.
- **Optional/read-only/inert layout:** only `''` optionals are omitted; whitespace-only address/login remain exact. Three independent copy controls, no Copy all/download/editable fields. No injected links/images/scripts, no execution canary, no requests to the synthetic destination host. At **360px**, the page does not horizontally overflow; a focused exact block scrolls internally with ArrowRight. Remaining lifetime is keyboard-focusable and explicitly labelled, ticks without an aria-live/status/alert ancestor, and expiry has explicit UTC.
- **AC-09 / AC-10 — whole-response rejection:** valid-looking private address/login with numeric or whitespace-only credential, invalid scalar text, aggregate oversize, changed expiration or malformed service time yields a concealed safe recheck state, no copy or fragments. A mutation observer checks added nodes for even transient partial exact-field frames. One deliberate POST; original URL unchanged.
- **Local expiry without network:** a normally running visible reader with all API requests aborted removes all fields/copy controls at the original local deadline without requiring API success. Expired destination heading is focused, expiry timestamp preserved, and a safe status explicitly announces expiry. Actual browser-offline immediate concealment and neutral online recheck remain covered by the unchanged mounted `lifecycle.spec.ts` in the full run; network blocking here intentionally avoids conflating an offline event's earlier concealment with the visible deadline path.
- **Late clipboard work:** every field, both resolve and reject, after local expiry and after conceal → neutral recheck → fresh Show (**12 cases**). Old callbacks cannot restore feedback/text, steal the expired destination, or change the fresh screen's independently pending copy. New work can then complete successfully. Removed field references have no eligible manual-copy route. Three additional still-connected pre-tick cases prove the eligibility guard rejects both a new `writeText` attempt and manual copy before the presentation timer has removed the fields.
- **AC-09 / AC-11b / AC-12 — terminal destinations:** unknown, known expired and genuinely future-dated early loss have distinct focused headings at the original shared URL, no Secret/copy/recovery action, accurate cause uncertainty and external-password/key/saved-copy limits. Keyboard restart from each yields blank address/login/credential, code off/absent and 60-minute default, without automatic disclosure/creation.

### Reused prerequisite proof (not duplicated or skipped)

The final full run includes T15's `gate-matrix-t15.spec.ts` and `gate-t15.spec.ts`: valid 410 with original expiry, 409 → unknown/future early loss/expired/available/503/network, malformed/mismatched error evidence, concealed typed no-renderer boundary, original URL, GET-only recheck/new deliberate Show, no automatic POST retry, late response before interval classification, non-restarted original deadline and safe errors. It also includes unchanged lifecycle freeze/resume/offline/stale-response cases and all **24 T14 sender cases**, including ExactCopyField StrictMode replay. These are part of the T16 composition evidence, not a claim that T16 reimplemented prerequisites.

## Final gates and rerun

Installed T15 toolchain reused without dependency changes because the parent documented dependency DNS failure. Dockerfile copies current frontend and performs a fresh optimized build, not a stale app-image test. No fresh dependency-install claim is made.

```sh
docker build --network none --target build \
  -f /tmp/slp-t16-evidence/Dockerfile -t slp-t16-web frontend
docker build --network none --target production \
  -f /tmp/slp-t16-evidence/Dockerfile -t slp-t16-production frontend
docker run --rm --name slp-t16-owned-gates --network none \
  -v "$PWD/frontend/tsconfig.json:/home/node/app/tsconfig.json:ro" \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  slp-t16-web sh -c 'pnpm test && pnpm lint && pnpm typecheck'
docker run -d --name slp-t16-owned-web --network none slp-t16-production
docker exec slp-t16-owned-web node -e \
  "fetch('http://127.0.0.1:3000').then(r=>console.log(r.status))"
docker run --rm --name slp-t16-owned-browser \
  --network container:slp-t16-owned-web -e BASE_URL=http://127.0.0.1:3000 \
  -e T16_EVIDENCE_DIR=/evidence -v /tmp/slp-t16-evidence:/evidence \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  -v "$PWD/frontend/src:/home/node/app/src:ro" \
  slp-resume-ui-browser pnpm test:integration
docker rm -f slp-t16-owned-web
```

- `build-final-all-tests.log`: optimized `next build --webpack` compiled successfully; **4/4** static pages, exit **0**. `production-final-all-tests.log`: minimal standalone runtime image, exit **0**. Suggested Next tsconfig normalization is image-local; gates explicitly use the repository config. Final copy-round-trip assertion strengthening was test-only and is mounted into both final gate invocations.
- `gates-final-all-tests.log`: **24/24 unit**, **0 fail/skip**; full `eslint .` and `tsc --noEmit`, exit **0**.
- `chromium-full-final-all-tests.log`: **119/119 Chromium**, one worker, **26.4s**, exit **0**; current tests **and source** mounted read-only into the browser harness, against the current freshly built app. Readiness returned **200**.
- `git diff --check`: clean.

Retained image handles:

- `slp-t16-web:latest` — `sha256:280066585586c6d83bb794b25a1c34a31d3c45f1dc6ea472ac52842830127db5`
- `slp-t16-production:latest` — `sha256:fb89f88f5b9daa849a136da8bfb060bff11f040cd9bd41c1e6c16302c88621e9`
- reused `slp-resume-ui-browser:latest` — `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`

Retained screenshots, visually inspected for readable bounded layout/actions and distinct safe states: `/tmp/slp-t16-evidence/{reading,expired,unknown,early_unavailable}-360.png`. These are synthetic fixtures, not an approved pixel baseline.

## Cleanup and limits

Used only `slp-t16-owned-*` containers. Web runtime readback: user `node`, network `none`, port bindings `{}`; browser shared its loopback namespace. No new Docker network, volume, host listener or pruning. Gate/browser containers were `--rm`; web explicitly removed. Post-cleanup container/network/volume name-filter reads returned **no T16-owned resources**. Images, Dockerfile, logs and four screenshots intentionally remain for the parent. Frontend/resource ownership is released.

No real backend/restart integration, installed Chrome/Firefox/Safari matrix, actual screen-reader audio, native host clipboard/menu matrix, real phones, approved visual baseline, production security/privacy/retention certification or T17 implementation is claimed. API/failure/lifecycle fixtures are synthetic and application guards cannot revoke already acquired copies. No reproduced T16 defect remains in the executed scope; independent parent review and tracker disposition remain with the parent.
