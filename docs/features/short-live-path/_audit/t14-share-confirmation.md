# T14 — guarded confirmed share handover

## Scope and ownership

Only T14/SCR-02 sender handover was implemented and registered. Required implement, rexsoft-frontend and TDD skills, task/spec/screens/SAD/canon and existing implementation were read. The existing same-repository/same-origin/code-only-canon exceptions override the baseline skill's unfilled auth/design/business placeholders. No tracker/task-status edits, commits, branch changes, pushes, credentials, production services, T15 reading gate or T16 reader implementation changes were made. Existing unrelated working-tree changes were preserved.

Changed files in this slice:

- `frontend/src/data/short_live_path/useConfirmation.ts`
- `frontend/src/view/widgets/ShareConfirmation.tsx`
- `frontend/src/view/components/ExactCopyField.tsx` (shared composite replay fix only)
- `frontend/src/shared/ui/index.tsx` (optional destination-heading ref/focusability)
- `frontend/tests/e2e/share-t14.spec.ts` (new)
- `frontend/tests/e2e/t14-mounted.ts` (new test-only development-React harness)
- `docs/design-system.md` (T14-only registration, preserves T13 inventory)
- this audit

## Reproduced defects and implementation

1. After an active page went offline/concealed, `visible.current=false` prevented the timer from ever reaching the known original local expiration. The timer now recognizes proven expiry even while concealed, cancels/fences outstanding status work and enters a terminal state. Lifecycle return cannot demote terminal expiry into a retryable concealed handover. Unsafe clock evidence still conceals; it does **not** prove expiration.
2. Expiry previously changed an unfocused non-live heading and announced only generic no-disclosure guidance. Confirmation expiry now has an expiration-specific status announcement, focuses its heading and retains the known expiration instant with an explicit UTC zone. Countdown ticks remain outside live/status regions.
3. Mounted development StrictMode replay reproduced **two** guards stuck inactive: `ExactCopyField` cleanup set `active=false` without resetting setup; confirmation cleanup permanently set `visible=false`. Copy setup now restores its mounted flag. Confirmation cleanup still clears currentness/cancels/fences requests and removes observers/timers, without destroying the display-state ref needed by immediate replay. Normal unmount remains ineligible through `current=false` and the copy component's inactive guard.

No new disclosure or automatic create/retry path was introduced. Sender controls remain concealed until fresh neutral revalidation succeeds with exactly the original expiration. Failed or changed-expiration responses leave safe retry guidance, not handover permission.

## Actual RED → GREEN evidence

Evidence directory: `/tmp/slp-t14-evidence` (macOS physical path `/private/tmp/slp-t14-evidence`). All values/canaries are synthetic.

Common production-browser invocation, from repository root:

```sh
docker run --rm --name slp-t14-owned-browser \
  --network container:slp-t14-owned-web \
  -e BASE_URL=http://127.0.0.1:3000 \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  -v "$PWD/frontend/src:/home/node/app/src:ro" \
  slp-resume-ui-browser pnpm exec playwright test tests/e2e/share-t14.spec.ts
```

The first expiry RED/GREEN runs predated the StrictMode harness and omitted the unnecessary `src` mount.

- `red-expiry.log`: command above before implementation against retained T13 build `slp-t13-web`, with the single concealed-expiry test then present. Exit **1**: `1 failed`; expected heading `This Share link has expired` was not found after ordinary fake-clock timer ticks. This was an assertion RED, not a compile failure. The same test also required expiry-specific status and destination focus. After the scoped timer/heading/announcement changes, `green-expiry.log`: exit **0**, `1 passed (803ms)`.
- `red-strict.log`: command with `--grep StrictMode`, current source mounted for the test-only development bundle before either replay correction. Exit **1**, `2 failed`; `Standalone copied.` and `Share link copied.` statuses were absent after attempted mounted copies. After both guard fixes, identical command produced `green-strict.log`: exit **0**, `2 passed (894ms)`.
- `red-expiration-instant.log`: `--grep 'visible expiry'` after adding the known-expiration assertion, before adding the expired timestamp markup. Exit **1**, `1 failed`; `locator('time')` was absent. The final full GREEN includes this assertion and explicit UTC output.

Additional coverage exercised existing behavior and needed no invented implementation: these regression tests passed rather than being falsely labeled new REDs.

## Mounted regression coverage

`share-t14.spec.ts` contributes **24** mounted Chromium cases; the whole suite contains **52**. Coverage includes:

- Held neutral recheck: handover absent while checking; successful unchanged-original-expiration recheck restores only sender handover with consumed lifetime, never disclosure. Transport failure and changed expiration stay concealed; a superseded/aborted held response cannot restore controls.
- Independent original-string link/code clipboard submissions and item-specific safe feedback. Code fixture includes spaces, Unicode, CRLF and bare CR. Synthetic clipboard denial removes old success, gives eligible manual guidance and full manual selection copies the original string through the mounted copy handler.
- Twelve delayed clipboard combinations: link/code × resolve/reject × expiry/conceal/new empty creation. Pending actions are disabled; completion cannot revive handover or success/manual-failure feedback. New creation has empty credential and disabled code.
- Delayed create confirmation consumes original lifetime; visible HH:MM:SS ticks, explicit UTC/dateTime and no live countdown region. Code-disabled confirmation has no code section/action; credential is not repeated; 360px page does not overflow.
- Visible and concealed ordinary local expiry, expiry announcement/focus, retained expiration time, terminal lifecycle-return behavior and separate unsafe-clock concealment without an expiry claim.
- Real development React root StrictMode effect replay for both shared copy and mounted confirmation. Harness bundles actual source with the existing pinned tsx/esbuild toolchain; it is intercepted test HTML, not a shipped route or production-only stand-in.

## Full gates and retained artifacts

All final gates were actually run; targeted RED/GREEN runs were not used as substitutes.

```sh
docker build --network none --target build \
  -f /tmp/slp-t14-evidence/Dockerfile -t slp-t14-web frontend
docker build --network none --target production \
  -f /tmp/slp-t14-evidence/Dockerfile -t slp-t14-production frontend
docker run --rm --name slp-t14-owned-gates --network none \
  -v "$PWD/frontend/tsconfig.json:/home/node/app/tsconfig.json:ro" \
  slp-t14-web sh -c 'pnpm test && pnpm lint && pnpm typecheck'
docker run -d --name slp-t14-owned-web --network none slp-t14-production
# Readiness was checked by an in-container HTTP fetch: 200.
# Common browser command above, replacing its final command with:
# pnpm test:integration
```

Results:

- `build-final.log`: fresh `pnpm build` / `next build --webpack`, optimized compilation successful; all 4 static pages generated; exit **0**. `build-production.log`: minimal standalone non-root runtime built, exit **0**.
- `gates-final.log`: **24 tests, 24 pass, 0 fail, 0 skipped**, followed by clean full `eslint .` and `tsc --noEmit`; exit **0**. `gates-final-repo-config.log`: same full gates repeated using the repository's exact tsconfig instead of Next's image-local normalized config, exit **0**, no lint warnings.
- `chromium-full-final.log`: **52 passed (14.0s)**, one Chromium worker; exit **0** against `slp-t14-production`. Current tests and source mounted read-only so the retained browser image cannot silently run its older baked tests/source. All existing reader/gate tests ran, but this is regression evidence, not T15/T16 acceptance.
- `git diff --check`: clean. Branch remained `feat/short-live-path`.

Retained images for parent rerun:

- `slp-t14-web:latest` — `sha256:a91bcb23287bdded4ddc1cb49b187232fbdc5d305ac492d9cbbc04b665fb3b75` (built app plus source/tooling, full-gate target).
- `slp-t14-production:latest` — `sha256:d54f9751a7ffdaa636bc0d0d68ed974440bccb516fc5f73f5f677c258f2335a7` (tested minimal standalone runtime).
- Existing reused `slp-resume-ui-browser:latest` — `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`.

## Isolation, encountered limits and cleanup

Docker default address pools were known exhausted: no new network, prune, host listener or shared-service modification was attempted. Owned web ran `--network none`; owned browser joined only that container namespace and used loopback. Runtime inspection returned user `node`, network `none`, port bindings `{}`. No owned named volume was created. Browser and gate containers used `--rm`; the final owned web was explicitly removed. Readback via `docker ps -a --filter name=slp-t14-owned`, network and volume filters returned no resources. Images/logs/Dockerfile intentionally remain for parent verification.

Initial infrastructure attempts are not hidden as product REDs: a tooling-stage image's default `node` command exited instead of starting Next, corrected to explicit `pnpm start`; an attempted canonical Dockerfile build with `--network none` could not install pnpm (`EAI_AGAIN`). The retained, already dependency-installed T13 image was therefore used as the build base, copying the complete current frontend and executing a fresh production build; dependencies/manifests were not changed. The retained `/tmp` Dockerfile records that exact adaptation. Initial read-only source-mounted unit execution blocked its deliberate layer-lint probe (`EROFS`); final gates ran on writable isolated image source. One test-only lint warning was corrected before all final gates. Next's suggested tsconfig rewrites occurred only inside images, not the working tree.

Limits: no fresh dependency installation, real backend integration, installed Chrome/Firefox/Safari, actual screen-reader audio, real phones, approved pixel baselines, real OS clipboard-denial dialog or production/security certification is claimed. Browser events, denial and clock transitions are deterministic synthetic tests; the original existing confirmation test also uses real browser clipboard read/write. A clipboard write already submitted before concealment/expiry cannot reliably be canceled at the OS boundary; tests guarantee no late UI feedback/restoration, not revocation of acquired copies. Canon registrations are sender T14 scope only. Tracker disposition and independent review belong to the parent.
