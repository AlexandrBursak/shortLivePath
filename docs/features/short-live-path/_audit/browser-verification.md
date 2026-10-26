# T19 — browser verification (closed with explicit T23/T24 deferrals)

## Final Product Owner disposition — T19 closed

The user explicitly requested moving the entire remaining manual-verification list to [T24](../backlog/deferred-browser-verification.md) and closing T19. T24 preserves all ten checklist groups, the exact 46 manual/current-adapter-unsupported ledger cells, and additional complete keyboard/copy/console/minute-domain coverage. T23 separately retains the native clipboard Unicode finding. T19 is closed for the accepted executed scope; this decision supersedes historical open/blocked/no-deferral statements below. Unexecuted cases are not PASS, the original requirements and historical reports remain intact, and the previous intermittent Safari Show timeout is not claimed fixed. The T19 prerequisite for T20 is satisfied by this scope decision, not by fabricated coverage. T20 performance, infrastructure/production readiness and independent security approval remain separate obligations.

## Latest manual evidence — Safari offline concealment

Follow-up confirmation: the user explicitly confirms waiting for expiration while offline and then reconnecting, with no Secret reappearance. Mark **manual PASS, user-reported: concealment on disconnection, expiry while offline, and no redisclosure after reconnection**. The supplied screenshot was visually inspected: it shows “This Share link has expired”, no visible Secret plaintext, no recovery and the explanation that external passwords/keys and previously acquired copies are unaffected. The screenshot corroborates the final expired UI only; the preceding offline/reconnection sequence is user-observed evidence, not an automated or independently timed trace. Source screenshot: `/var/folders/_d/lpng1wrn5hsdycfzhpylpbwc0000gn/T/91E47063-C679-4AD3-9D42-8A752C4F7EC4-653-00000956B485914C/pasted-image-20261025-190105.png` (temporary local path). This supersedes the earlier unconfirmed offline-expiry/reconnection subcases below. First-compositor-frame behavior, eligible pre-expiry return/fresh Show and exact browser/version/viewport matrix remain outside this manual confirmation.

The user explicitly reports that, in Safari, disconnecting the network hid the displayed Secrets as expected. Record this narrowly as **manual PASS, user-reported: real network-disconnection concealment**; it supersedes the absence of manual Safari evidence for that subcase, not the historical automation outcomes. No independent agent observation, Safari version, viewport, timing measurement or recording was supplied for this manual run. Expiry while disconnected, behavior after reconnecting, fresh neutral revalidation/explicit Show and first-compositor-frame behavior were not explicitly confirmed and remain unverified by this report. This does not complete T19 or change the T23 deferral.

## Disposition and scope

**T19 is not accepted/complete across the approved matrix.** The bounded local verification is finished and ownership is returned. Safari, native host clipboard, actual BFCache, Chrome background/freeze and Firefox offline/freeze evidence remain open. Not every manifest branch was newly exercised through the real API on both widths; the reconciliation below makes those gaps explicit. No criterion is waived and no T20 execution is authorized by this report.

- New installed-browser HTTPS/API matrix: **35 named cases: 33 PASS, 0 FAIL, 2 capability BLOCKED** (Chrome 16/18 PASS, Firefox 17/17 PASS). Matrix exit **2**, deliberately not green acceptance.
- Separate installed-browser invalid-minute/accessibility matrix: **16/16 PASS**, zero monitored console/page/CSP errors.
- Isolated Linux native clipboard supplement: **22/22 assertions PASS**, zero console/page/CSP errors. This is bundled Chromium, not installed Chrome/Firefox/Safari proof.
- Existing controlled Chromium regressions through the actual HTTPS shell: **119/119 PASS, 38.7 s**. These mock API/time seams and are regressions, not the new real-API matrix.
- Frontend **24/24 unit**, lint, typecheck and fresh production build PASS; **1/1** additional Python harness-isolation test PASS after its recorded RED. No production application defect was established; **no frontend/src, backend, canon, contract or deployment source changed**.

Read inputs: full T19 brief, spec, screens, approved code canon and test plan; relevant SAD/API context, actual components/hooks/source-text adapters, Docker wiring and existing test interfaces. Loaded implement, RexSoft frontend, frontend-test-harness, computer-use, TDD and systematic-debugging skills. Project-specific anonymous/same-repository/same-origin rules override generic skill templates. No tracker/commit/push, NPM/remote-server/phone/production or T20 work. Parent-owned tracker edits were preserved. HEAD `b7f2e8bb089e5757f2b6932a35e0047cde79fe31`, branch `feat/short-live-path`.

## Reproducible profile

Observed **2026-10-23 UTC**, macOS **26.5.2 / 25F84**, aarch64 Mac17,8, **18 CPU / 25,769,803,776 memory bytes**. Docker **29.8.0**, aarch64 VM **18 CPU / 8,317,267,968 bytes**; API allocation **2 CPU / 805,306,368 bytes**. AC power, charged, power mode 0 observed; no power/clock/security settings changed. Ten unrelated containers remained running (snapshot aggregate CPU 11.3%); they were not stopped or pruned. No deliberate load ran concurrently. This is functional loopback testing, not NFR-01 performance attainment.

| Component | Exact observed version / interface |
|---|---|
| Installed Chrome | **156.0.8078.47**, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, headless owned profile via Playwright/CDP |
| Installed Firefox | **149.0.2**, `/Applications/Firefox.app/Contents/MacOS/firefox`, owned headless profile, native WebDriver BiDi; no patched Playwright Firefox substitute |
| Installed Safari | **26.5.2** from installed app metadata; native `/System/Cryptexes/App/usr/bin/safaridriver`; no application session created |
| Native clipboard supplement | Bundled Linux Chromium **156.0.8078.4**, isolated container clipboard |
| Tooling / app | Host/container Node **24.17.0**, Playwright **1.64.1**, pinned pnpm **11.5.2**; Next **16.4.2**, React build dependency **19.3.1**, Adonis core **7.6.0** |
| Stores / proxy | PostgreSQL binary **17.10**, Redis **7.4.9**, nginx **1.31.5** |

Fresh current-source standalone frontend `slp-t19-production`: `sha256:2aa5473dca7e1aef67a96d8e4bbfe81cc0e3143113e15a3c9cc487cfee83626e`. Final quality-gate image `slp-t19-tooling`: `sha256:181eff9665b0b8f2162e542282198beb162cfb4b13a1eef66a1aa4bb61dfbfe9`. Retained API runtime: `sha256:665c6bf023b3cd84a231acb41af3b2392b1af9ab81b8ce2b93f8738e830af929`; reused dependency/browser image: `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`. No clean dependency-install or fresh backend-build claim.

Owned Compose project `slp-t19`, namespace `t19synthetic`, free explicit subnets `10.219.19.0/24` and `10.219.20.0/24`, loopback HTTPS port **3449**. New synthetic app/store/key/TLS material only; no ambient credential file or existing project reused. Default TLS validation failed **60**, explicit generated CA validation returned **HTTP 200 / verification 0**. Browser certificate exceptions were disposable-context/session scoped; global verification/trust was not disabled. Real nginx → Next/API → new PostgreSQL/Redis, no remote target. No host wall-clock adjustment or whole-laptop sleep.

## Scenario-by-browser evidence

`PASS (seam)` is intentionally narrower than native OS clipboard proof. Safari's application column is blocked by the native-driver refusal, not replaced with WebKit. Core screen/keyboard checks use target viewports **360×800 and 1280×800**; narrower Firefox document captures can exclude its scrollbar. These are not phone checks.

| Scenario / criterion | Installed Chrome | Installed Firefox | Installed Safari |
|---|---|---|---|
| SCR-01→02 create, labels, safe validation, generated 20-character code, separate handover; AC-01/02/06 | PASS both widths | PASS both widths | BLOCKED |
| Invalid retained minutes 0 / 1441 / 1.5 / empty; associated errors/focus/no POST; AC-05 | 8/8 PASS | 8/8 PASS | BLOCKED |
| Native Tab-only creation/generation/Show/copy, visible focus; NFR-06 | PASS both widths, 9 Tabs to Create | PASS both widths, 9 Tabs to Create | BLOCKED |
| Exact 61 preserved, actual PG expiration minus creation **3660 s**; every minute 1–1440 via native slider arrows; AC-04 | PASS (1440 independent UI assertions at 360) | PASS (1440 independent UI assertions at 360) | BLOCKED |
| Three-field multibyte/CRLF/lone-CR/LF/spaces/tabs/NFD/non-BMP/inert markup/long-line API roundtrip; AC-03/08 | PASS, controlled paste/copy seams | PASS, controlled beforeinput/copy seams | BLOCKED |
| Native host OS clipboard and native manual-copy byte roundtrip | **BLOCKED: no host clipboard permission** | **BLOCKED: no host clipboard permission** | BLOCKED |
| Neutral open, no automatic disclosure, explicit/repeat/concurrent readers, no consumption; AC-08 | PASS both widths | PASS both widths | BLOCKED |
| Five observed wrong codes, then correct attempt refused 429 with no plaintext; AC-07 | PASS at 360 | PASS at 360 | BLOCKED |
| Real one-minute lifetime; HTTP **200** released before expiry held 20 s after a 45 s wait; no transient plaintext frame; late clipboard completion; expired POST **410**; AC-10 | PASS, 68.023 s scenario | PASS, 67.716 s scenario; native BiDi response interception | BLOCKED |
| Offline concealment without synthetic offline dispatch | PASS, actual target network emulation | **BLOCKED: standard `emulation.setNetworkConditions` returns `unknown command`** | BLOCKED |
| Isolated page `Date.now` rollback 1 h: conceal, neutral recheck, fresh Show; AC-04/10 | PASS | PASS | BLOCKED |
| Actual tab background/return, observed `visibilityState=hidden`, fresh Show | **BLOCKED: remains visible in this headless configuration** | PASS, native activation of owned tab | BLOCKED |
| Actual page navigation/pagehide/history return, neutral gate then fresh Show | PASS | PASS | BLOCKED |
| Actual BFCache restoration | **NOT OBSERVED: no `pageshow.persisted=true`** | **NOT OBSERVED: no `pageshow.persisted=true`** | BLOCKED |
| Actual page freeze event / return | **BLOCKED: commands report success, no freeze/resume event or hidden state** | Not exercised by a proven native freeze mechanism; controlled listener regression only | BLOCKED |
| Genuine owned-process suspension/return | PASS: SIGSTOP/SIGCONT, **8 owned processes**, stopped state checked, **2300 ms** hold | PASS: **9 owned processes**, same bounded hold/check | BLOCKED |
| Unknown / known expired / targeted early payload-loss distinctions; safe focus, blank restart, UTC and external-copy limits; AC-09/11b/12 | PASS, both-width layouts | PASS, both-width layouts | BLOCKED |

Concurrent readers use explicit DOM Show activation to avoid WebDriver switching one reader's focus and legitimately triggering revalidation; trusted keyboard flows are separate. All 1440 values were UI assertions, **not 1440 API creations**. The new throttle scenario proves the sequential observed threshold, not deferred exact concurrent quotas, independent address pools or full rolling-window aging. Lifecycle fixtures are unprotected; protected code/reading and source-preservation fixtures are separate.

Late-response tests monitor added DOM nodes, assert `ever_plain=false`, observe the actual in-flight **200**, preserve the original service deadline, then verify **410** after expiry. Clipboard completion is controlled; an already submitted real OS write cannot be recalled. Native BiDi interception released an unchanged real response, not a synthesized API envelope. Genuine process suspension is **not** whole-device sleep. It verifies post-resume DOM concealment and the fresh-Show flow, **not zero compositor/first-frame exposure or suspension across expiration**; those broader cases remain unverified. No `dispatchEvent` was counted as BFCache, actual freeze or OS suspension.

**Console accounting:** Chrome recorded **0 app console / 0 page / 0 CSP errors**, but **6 raw browser resource-error console entries**: five HTTP403 and one HTTP429 from intentional throttling. Firefox reported **0/0/0** monitored native BiDi console/page and DOM CSP events; its DOM CSP listener is installed after navigation, with native error subscription active beforehand. The isolated clipboard and minute matrices reported zero errors. A literal all-browser-console-zero criterion is **not met** by the Chrome refusal scenario; no filter/waiver is silently assumed.

## Manifest reconciliation — not additional passing cases

The current saved manifest contains **47 state rows, 8 explicit N/A, 39 applicable**. Its historical self-check says 45; this report uses the parsed current source and does not edit the approved manifest. The following table prevents untested branches being hidden behind happy-flow success. Safari is blocked for every applicable row. “Regression support only” means the existing controlled Chromium suite, **not newly established installed-Firefox/API coverage**. All-state / all-browser acceptance therefore remains open.

| Screen | Manifest state | New installed-browser/API evidence |
|---|---|---|
| SCR-01 | `default` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-01 | `empty` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-01 | `validation` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-01 | `loading` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `error.transport` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `error.creation_limited` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `error.capacity_unavailable` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `error.service_unavailable` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `error.uncertain` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-01 | `success` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-02 | `default` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-02 | `loading` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-02 | `success` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-02 | `error` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-02 | `expired` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-02 | `N/A: empty` | N/A retained; no new surface invented |
| SCR-02 | `N/A: validation` | N/A retained; no new surface invented |
| SCR-03 | `default` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-03 | `loading.status` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-03 | `validation` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-03 | `loading.disclosure` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-03 | `error.code_incorrect` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-03 | `error.verification_limited` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-03 | `error.transport` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-03 | `error.invalid_request` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-03 | `error.temporary` | 360 unsafe-clock concealment only; other temporary outcomes remain regression-only |
| SCR-03 | `concealed` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-03 | `success` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-03 | `expired` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-03 | `unavailable` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-03 | `N/A: empty` | N/A retained; no new surface invented |
| SCR-04 | `default` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-04 | `loading` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-04 | `success` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-04 | `error.copy` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-04 | `error.response` | Not newly API-exercised on installed browsers; controlled regression support only |
| SCR-04 | `concealed` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-04 | `expired` | 360 lifecycle/failure fixture; not full dual-width branch coverage |
| SCR-04 | `N/A: empty` | N/A retained; no new surface invented |
| SCR-04 | `N/A: validation` | N/A retained; no new surface invented |
| SCR-05 | `default` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-05 | `empty` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-05 | `error.expired` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-05 | `error.early_unavailable` | Core state at 360 + 1280; copy completion/denial uses stated seams |
| SCR-05 | `N/A: loading` | N/A retained; no new surface invented |
| SCR-05 | `N/A: success` | N/A retained; no new surface invented |
| SCR-05 | `N/A: validation` | N/A retained; no new surface invented |

## Exact artifact and repeat commands

New verification only: `frontend/tests/e2e/t19-{environment.py,browser-matrix.py,drivers.mjs,hooks.mjs,real-api.mjs,container-copy.mjs,capabilities.mjs,safari-probe.py,regression.mjs,regression.config.mjs,gates.Dockerfile}`, `test_t19_environment.py`, and `frontend/tests/accessibility/t19-minute-validation.mjs`. The environment harness now discards ambient `SLP_*` overrides before using its own generated env file. Its AST-only poison test first failed with ambient `SLP_APP_KEY`/`SLP_PUBLIC_ORIGIN` retained, then passed after the one-line fence. Actual functional runs had **0 ambient SLP variables**, so their profile was unaffected. This is a harness correction, not an application defect.

Run from `/Users/obursak/Develop/experimental/shortLivePath`; retained image prerequisites above are intentional. Re-extracting tools and setup create only newly owned resources:

```sh
python3 frontend/tests/e2e/t19-environment.py setup
docker create --name slp-t19-tool-extract slp-resume-ui-browser
mkdir -p /tmp/slp-t19-tools
docker cp slp-t19-tool-extract:/home/node/app/node_modules /tmp/slp-t19-tools/node_modules
docker rm slp-t19-tool-extract
python3 frontend/tests/e2e/t19-browser-matrix.py # exit 2: known capability blocks
node frontend/tests/accessibility/t19-minute-validation.mjs
node frontend/tests/e2e/t19-capabilities.mjs
python3 frontend/tests/e2e/t19-safari-probe.py
python3 frontend/tests/e2e/test_t19_environment.py
docker build --network none -f frontend/tests/e2e/t19-gates.Dockerfile -t slp-t19-tooling frontend
```

Actual native clipboard supplement command (isolated Linux clipboard, separate HTTPS verifier at container-local 3452; application clipboard-read Permissions-Policy unchanged):

```sh
docker run --rm --name slp-t19-native-copy --network slp-t19_edge  -v "$PWD/frontend/tests/e2e/t19-container-copy.mjs:/verification.mjs:ro"  -v /tmp/slp-t19-synthetic/tls:/ca:ro -v /tmp/slp-t19-evidence:/evidence  slp-resume-ui-browser node /verification.mjs
```

Actual controlled regression command (no custom testMatch: include `primitives.spec.tsx`):

```sh
docker run --rm --name slp-t19-regression --network slp-t19_edge  -v "$PWD/frontend/tests/e2e/t19-regression.mjs:/verification.mjs:ro"  -v "$PWD/frontend/tests/e2e/t19-regression.config.mjs:/home/node/app/t19.config.mjs:ro"  -v "$PWD/frontend/tests:/home/node/app/tests:ro"  -v "$PWD/frontend/src:/home/node/app/src:ro"  -v "$PWD/frontend/tsconfig.json:/home/node/app/tsconfig.json:ro"  slp-resume-ui-browser node /verification.mjs
python3 frontend/tests/e2e/t19-environment.py cleanup
```

Fresh `pnpm test && pnpm lint && pnpm typecheck && pnpm build` executed in the offline gate image. Current tests were also mounted read-only into an owned `--network none` gate container for unit/lint/typecheck; source remained container-writable for the deliberate negative layer-lint fixture. The initial CJS tooling lint failure was fixed by converting only new verification CLIs to ESM, **not by disabling lint**. An initial regression glob passed only118 because it excluded `.spec.tsx`; corrected discovery actually ran119. Other harness failures (CSS quoting, await expression wrapper, focus-return race, Firefox synthetic clipboard restrictions) are retained as harness history, not fabricated product RED. Firefox even-noop preload generated page errors; the final native run removed it and used native network events/interception instead.

## Evidence, cleanup and remaining input

Evidence directory: **`/tmp/slp-t19-evidence`**, restricted mode0700; checkpoint **`/tmp/slp-t19-checkpoint.md`**. Handles: `summary.json`, `{chrome,firefox}.json`, `matrix-process.json`, `minute-validation.json`, `container-native-copy.json`, `safari.json`, `capabilities.json`, `gates-final.log`, `gates-current-tests.log`, `regression.log`, `environment-{red,green}.log`, `background-workload.json`, `evidence-text-scan.json`, `cleanup.json`, `cleanup-readback.json`, `artifact-manifest.json`. The manifest hashes the final reports and **28 symbolic screenshots** (`{chrome,firefox}-SCR…-{360,1280}.png`). Representative narrow/desktop images were visually inspected; no approved pixel baseline/diff or actual screen-reader audio is claimed. No sensitive traces/videos/body dumps were enabled. Scanned retained text evidence had zero tested canary/full-link matches; that limited artifact scan is not a production confidentiality/security sign-off.

**Verified cleanup:** owned Compose containers/networks/volumes **0**, named CLI containers **0**, owned Firefox profiles/runner commands **0**, browser root PIDs gone, ports3449/3450 refused connections (errno61), synthetic key/env/TLS directory absent, extracted tooling removed. Only nonsensitive evidence/checkpoint and the stated T19 images/build cache remain intentionally. No foreign project was pruned, stopped or reset. Deleting this disposable metadata cohort is not a change to the product's indefinite metadata-retention policy.

Required next-owner/user decisions: (1) Safari native driver returned HTTP500 “You must enable 'Allow remote automation' in the Developer section of Safari Settings to control Safari via WebDriver.” **No setting was enabled.** User must approve/perform the setting change or provide manual measured coverage; any Safari local-TLS limitation must still be resolved without global certificate bypass. (2) Native installed-browser clipboard proof needs explicit approval to overwrite the host clipboard with synthetic values **without first reading/snapshotting existing contents**, or a genuinely isolated native clipboard facility. (3) Actual headful/manual Chrome lifecycle/BFCache and Firefox offline/freeze capability, plus remaining all-state/dual-width branches, need a bounded follow-up; do not weaken no-store/security settings to force a result. (4) Clarify whether expected HTTP403/429 resource diagnostics are exempt from the literal zero-console criterion; no exemption is assumed here.

T18 host swap/dump/snapshot/backup/custody/security-review launch gates, real iOS/Android checks and actual production-host verification remain unchanged and outside this task. No remote verification, performance attainment, monthly availability or T20 completion is claimed. **Ownership returned; stop after T19. Parent owns tracker/disposition and any further task dispatch.**


## Additive Safari / native HOST clipboard phase — 2026-10-24

See [the additive cohort audit](./safari-native-clipboard.md) for permissions, exact commands, scenario ledger, error-monitor limits and cleanup evidence. Installed Safari26.5.2 now creates an `acceptInsecureCerts:true` session (HTTP200, returned true) and reaches owned HTTPS without global trust changes. Full scoped native HOST run: Chrome **20 PASS/0 FAIL**, Firefox **8 PASS/12 FAIL**, Safari **6 PASS/14 FAIL**. Safari expiry/repeat/unknown-terminal flows passed in its initial run, but native paste emitted no event; a focused controlled-paste reproduction later observed the automation document **hidden**, so no full Safari/native-clipboard acceptance is claimed. Firefox trusted paste already LF-normalizes original line endings; labelled controlled-source supplement **10 PASS/10 FAIL** still fails host clipboard fidelity. Historical failures remain intact, no app-source bug was established, no app source/T20/tracker changed. **T19 still open; native Safari visible-window follow-up and Firefox fidelity disposition required.**

## Additive bounded follow-up — 2026-10-24 (T19 still BLOCKED)

This section supersedes only the specific earlier gaps addressed below; historical runs/counts above are unchanged. **No T19 completion, Safari pass, native host-clipboard pass, BFCache/freeze pass or T20 load/acceptance is claimed.** No application source or parent-owned T20 implementation was changed.

### Executed result and exact boundary

- Final `node frontend/tests/e2e/t19-followup.mjs chrome`: **30 PASS / 0 FAIL / 0 BLOCKED**, exit0, installed Chrome156.0.8078.47.
- Final same command with `firefox`: **20 PASS / 4 FAIL / 4 capability BLOCKED**, exit1, installed Firefox149.0.2. The four failed cases are create/disclose **422 request-body mutation** at each width: the harness did not reach its expected DOM outcome. Four blocked cases are create/disclose **413 body mutation** at each width: the observed response was not413. These are unresolved native BiDi request-body-seam results, **not established product defects, not passing HTTP-refusal evidence and not silently reclassified green**. No new framework or package install was used.
- Both final runs close owned browser roots (PID-gone readback true). 360×800 and1280×800 were independently exercised; no phone/headful coverage is implied.
- Fresh final offline frontend gate: **24/24 unit PASS**, lint/typecheck/production build PASS. Existing controlled HTTPS Chromium regressions **119/119 PASS (39.2s)**; still controlled API/time regressions, not installed-browser real-backend evidence. Harness environment fence **1/1 PASS** after a recorded RED for switching from the stale runtime name to the current compiled artifact.

### Additive manifest ledger (references are historical table line numbers71–105)

| Manifest branch | Chrome at360 +1280 | Firefox at360 +1280 | Mechanism / limit |
|---|---|---|---|
| SCR01 loading (71) | PASS | PASS | Hold unchanged actual201; submitted credential disabled, Creating disabled, one POST, retained input, no horizontal overflow |
| SCR01 error.transport (72) | PASS413 +415 | PASS415;413 BLOCKED | Mutated outgoing body/media type; HTTP comes from actual nginx/API, no invented response |
| SCR01 creation_limited (73) | PASS | PASS | Owned creation-counter seeded with25 timestamps; actual429. **Not25 new browser creations or a fresh quota-boundary proof** |
| SCR01 capacity_unavailable (74) | PASS | PASS | Owned payload registry temporarily filled to exactly1000 and continuity cardinality updated atomically; actual503. No1000-operation load or eviction claim |
| SCR01 service_unavailable (75) | PASS | PASS | Corrupt only owned creation-limiter record, actual503, restore record+expiry-index score and read back |
| SCR01 uncertainty (76) | PASS | PASS | Drop real confirmed201 after receipt; no handover link, retained form, no automatic retry over bounded400ms observation |
| SCR02 loading/error/recheck (79–81) | PASS | PASS | Controlled clipboard pending/resolved/denied; controlled pagehide concealment; actual status response dropped then unchanged200 held/released; handover stays hidden during failed/pending recheck. **Not native lifecycle/clipboard** |
| SCR02 expired (82) | NOT NEWLY RUN | NOT NEWLY RUN | Remains open for this installed-browser dual-width follow-up |
| SCR03 loading.status/disclosure (86,88) | PASS | PASS | Hold unchanged actual responses; disabled/no plaintext; both-width layout checks |
| SCR03 validation (87) | PASS omitted-code actual403, outgoing{} seam | NOT NEWLY ESTABLISHED | Firefox supplied empty guess correctly gets incorrect-code refusal; not omitted-code proof |
| SCR03 incorrect/limited (89–90) | PASS | PASS | Five observed wrong verifications then actual429, no plaintext; Firefox initial empty guess counts among five |
| SCR03 transport/invalid_request (91–92) | PASS413/415/422 | PASS415;413 BLOCKED;422 FAIL | Actual outgoing-request seams; Firefox body mutations unresolved |
| SCR03 temporary (93) | PASS corruption503 | PASS corruption503 | Corrupt one owned payload login without recomputing integrity; actual backend503, no partial render, restore/read back |
| SCR03/SCR04 concealment/expiry and SCR04 clipboard loading (94,96,100,104–105) | NOT NEWLY RUN | NOT NEWLY RUN | Prior evidence/regression support remains narrower; no new all-state closure |
| SCR04 error.response (103) | PASS controlled invalid200 envelope | NOT NEWLY RUN | Change login type in a **real200 response** after receipt; labelled controlled response mutation, **not real-backend invalid JSON evidence**. MutationObserver proves no transient pre block. Separate real store-corruption503 above runs both browsers |

All other applicable manifest obligations remain as previously stated. Refusal notices preserve input; safe notices do not echo fields. Layout/label assertions are executed where the named scenario calls them, not a claim of comprehensive visual/assistive-tech acceptance. No new screenshots or sensitive traces/body dumps were retained.

### Console criterion correction, not a waiver

The actual brief `tasks/browser-lifecycle-e2e.md:261` requires **zero app console errors**, not zero browser-generated resource diagnostics. Earlier audit line60/decision4 overstated that criterion. Final Chrome: **38 raw error-console entries**, **0 app /0 page /0 CSP**, classified38 expected /0 unexpected: HTTP403×12,413×4,415×4,422×4,429×4,503×6 plus4 intentionally dropped-response network diagnostics. Firefox native monitoring: **0 console /0 page /0 CSP**. Raw counts are retained. The driver now requires the standard browser-resource diagnostic format **and the owned API URL as console source**; the follow-up correlates classified status counts against actual intercepted HTTP responses and network counts against actual deliberate drops. Unexpected entries, app errors, page errors or CSP errors fail. No normal intentional refusal needs a criterion waiver. DOM CSP monitoring in Firefox retains the earlier post-navigation limitation.

### Current-code identity, reproduction and retained evidence

HEAD remains `b7f2e8bb089e5757f2b6932a35e0047cde79fe31` with dirty T20 sources preserved. Offline compile explicitly COPYs **current backend including T20 metrics**, rather than silently calling the prior runtime current. New build recipe `frontend/tests/e2e/t19-current-api.Dockerfile` uses retained `slp-t20-parent-gates` tooling, `pnpm build`, then prior runtime dependencies only. Environment defaults to `slp-t19-followup-api`; its AST fence test was updated accordingly.

Exact tested images:
- API `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`.
- Fresh standalone frontend `sha256:804402f33455f46ed68992735eeed682acbaff45a9ca2ee61f5628b6c6cfd2ec`.
- Final frontend gate `sha256:5ffe418ccf505fa90d3f99d279d9c59ab3ecf3cd96febd17046fdc133bebbf19`.

`/tmp/slp-t19-evidence/followup-identity.json` records exact per-file SHA256 manifests (excluding dependencies/generated build directories), aggregate backend109-file fingerprint `0f2e8b5ff4fc73e7e7447c4790c7b95b77ea57828c175bf148a2b430e31971c2`, frontend82-file fingerprint `d6f843ce5048c7d1f89072c035163e3cc8ee1dd1c71dff390ca7d4a12cdf4b2a`, UTC and image identities. These fingerprints describe the tested dirty source, not a clean commit or clean install.

Repeat after the existing scoped setup/tool-extraction recipe: build API with `docker build --network none -f frontend/tests/e2e/t19-current-api.Dockerfile -t slp-t19-followup-api backend`, then setup; run new `.mjs` with chrome then firefox; use existing regression/gate commands. Creation counters in this disposable namespace are reset between independent scenarios to avoid cross-case quota pollution; not a threshold-aging/concurrency test. Store fault seams are local-only and make no production-security assertion.

Evidence: `followup-{chrome,firefox}.json/.log`, `followup-summary.json`, `followup-identity.json`, `followup-api-build.log`, `followup-gates.log`, `followup-regression.log`, `followup-environment-green.log`, `followup-cleanup-readback.json`, `followup-artifact-scan.json`. Historical initial failures retained separately: stale index restoration, overfilled capacity setup, wrong expected copy notice/empty-guess semantics, and BiDi URL-pattern/body-seam issues. Those harness failures are not application RED. Final artifact scan16 follow-up text files:0 full capability URLs /0 tested source-credential literal matches. No production confidentiality sign-off implied.

### Cleanup and permission handoff

Verified owned Compose containers/networks/volumes **0**, named slp-t19 CLI containers **0**, synthetic env/key/TLS directory absent, extracted tooling absent, owned Firefox profiles absent, final browser roots gone and loopback3449/3450 closed. Only non-sensitive evidence/checkpoint and owned test images/cache retained. No foreign Docker project/global tool was changed; no tracker/commit/push/NPM/remote server/real phone/T20 load ran.

**New explicit authorization received during this phase:** user reports Safari Developer→Allow remote automation enabled by them and permits temporary native system clipboard overwrite with synthetic memory-only values. **Do not read/snapshot existing clipboard or promise restoration.** No other OS setting or global TLS/trust change is approved. This phase deliberately did not expand to Safari/host clipboard. A fresh bounded owner must verify Safari capability and resolve TLS per session or legitimate isolated certificate without global bypass, then test native clipboard. Prior permission blocker is therefore historical, but **coverage remains unverified**. Actual BFCache/freeze, unsupported Firefox offline, first-compositor-frame/suspension-across-expiry, confirmation dual-width expiry and remaining state branches still need explicit evidence; native/headful capability may require separate scoped approval. **Ownership released; stop after this T19 slice.**

## Additive authorized foreground checkpoint — 2026-10-24

Current disposition: after this checkpoint, the Product Owner explicitly moved the native clipboard Unicode/line-ending fidelity finding to [T23 — future fix](../backlog/native-clipboard-unicode-fidelity.md). This narrow known exception no longer blocks T19 acceptance; it does not turn historical failures into passes, change AC-02/03/06, establish an application-code regression, or waive any unrelated lifecycle/manifest coverage. The historical no-waiver/open statements below describe their execution-time status. T19 is not declared complete by this deferral.

User authorized owned Firefox/Safari foreground; manual success remains user-reported only. Sequential headful output probes: Firefox API+DOM exact, host8/15 exact and7/15 NFC-composed (line endings preserved); Safari API+DOM exact, host15/15 exact. Visible Safari core3 PASS/1 FAIL; paste-only0 PASS/1 FAIL proves trusted input NFC composition, not original; actual narrow sample360×868 only. No app regression/fix or acceptance waiver. Detailed executed evidence, limits and verified owned cleanup appended to `firefox-native-output.md` and `safari-native-clipboard.md`; raw evidence `foreground-summary.json` and `foreground-cleanup.json` under `/tmp/slp-t19-evidence`. All historical results remain; T19 blocked/open and T20 load not run. Tracker untouched.


## Additive remaining-tests execution — 2026-10-24 20:54–21:22 UTC (NOT complete)

Only T23's native Unicode/line-ending fidelity finding is deferred. No other lifecycle, viewport or manifest requirement was waived. No application source, backend/T20 source, parent tracker, contract or security setting changed. No load, remote/phone work, commit or push.

### Newly executed evidence

Programmatically aggregated final slices (`remaining-summary.json`):

| Installed browser | PASS | FAIL | BLOCKED | Exact scope |
|---|---:|---:|---:|---|
| Chrome156.0.8078.47 foreground |12|0|6|360×800 +1280×800, except interrupted-run console-final snapshot noted below |
| Firefox149.0.2 foreground native BiDi |14|0|4|360×800 +1280×800 |
| Safari26.5.2 visible native W3C |2|4|12|History return/fresh Show passes at actual1920×1148 only; four target-width assertions fail at harness/viewport boundary, not app defects |

Chrome and Firefox both newly PASS at **each width**: real one-minute protected sender confirmation expires, removes separate link/code, focuses expired heading and ignores pending controlled clipboard completion; actual unchanged status200 held across its original expiry never enables Show; actual unchanged disclosure200 held beyond expiry produces no transient pre block (MutationObserver), with later actual410; reader-only Date.now rollback1h hides and requires neutral recheck/fresh Show; genuine navigation/history return stays neutral before explicit Show. Chrome additionally PASS real CDP offline (`navigator.onLine=false`) concealment through expiry + stale controlled clipboard completion +410. Firefox additionally PASS genuine **owned PID-tree SIGSTOP/SIGCONT across actual expiry**, stopped state checked and all PIDs resumed in finally, no restored text/copy-success and actual410. This does **not** prove the first compositor frame. Firefox actual tab visibility becomes hidden, old text disappears, return records at least two status requests and requires fresh Show, both widths.

**Still open / blocked:** Chrome activation did not yield hidden document, even headful; native BFCache `pageshow.persisted=true` was not observed in any browser; native document freeze remains unproved (initial isolated Chrome freeze probe lost its target; retained cascade failures are harness history, no product RED). Firefox actual offline mechanism remains unsupported/unresolved. Safari precise unchanged-response hold/failure adapter and safely owned process suspension are unavailable in this adapter; no shared Safari process was stopped. All-browser first-compositor-frame proof remains unverified. Native clipboard cancellation is not claimed: all newly late-completion promises use the explicitly controlled clipboard seam, no T23 retest.

Safari's requested widths were **not** silently accepted: initial and post-navigation rect retries both failed actual `innerWidth` assertions,1920 instead of360/1280. A final independent owned-session diagnostic returned `/window/rect` itself still1920×1200 at x−832/y0 for both requests; actual inner1920×1148, visible. Evidence `remaining-safari-viewport-probe.json`. This is a viewport/harness capability blocker, not application responsiveness failure. No OS full-screen/window setting was changed. Safari confirmation expiry cases stop at the failing width assertion and are **not** counted as expiry passes.

Firefox413/422 outgoing-body interception remains an **unresolved harness seam**, not an app bug or passing refusal coverage; no new supported body-rewrite mechanism was established in this bounded slice. Concurrent protected-reader expansion, Safari full SCR01–05/keyboard/all-minute matrix and remaining exact state branches were not newly executed. Existing prior unprotected concurrent readers and controlled119 regressions remain narrower evidence.

### Exact denominator, gates and identity

Before launch, parsed current47 manifest rows (8 explicit N/A) plus12 lifecycle obligations per browser/width: **354 ledger entries**. Exact before/after browser×width×case ledger is retained in `/tmp/slp-t19-evidence/remaining-ledger-{before,after}.json` (before also `.md`). After aggregation:126 historical PRIOR PASS,46 scoped PASS,48 N/A,132 OPEN,2 PARTIAL; these ledger cells are **not** test counts or a completion percentage. Historical transport Firefox415-only limits remain explicit. T23 only is excluded.

New harness `frontend/tests/e2e/t19-remaining.mjs` reuses existing installed-browser adapters/hooks; no package/framework/refactor. Syntax PASS; environment fence1/1 PASS; offline frontend unit24/24 PASS, lint PASS, typecheck PASS, production build PASS via existing gate Dockerfile. Full controlled HTTPS regressions **119/119 PASS,40.0s**, still not real-API/browser evidence. Commands:

```sh
python3 frontend/tests/e2e/t19-environment.py setup
# Existing tool extraction recipe above.
T19_WIDTH=360 T19_RUN_ID=360 node frontend/tests/e2e/t19-remaining.mjs firefox
T19_WIDTH=1280 T19_RUN_ID=1280 node frontend/tests/e2e/t19-remaining.mjs firefox
node frontend/tests/e2e/t19-remaining.mjs chrome
T19_WIDTH=1280 T19_REMAIN_FILTER='late actual' T19_RUN_ID=1280-offline node frontend/tests/e2e/t19-remaining.mjs chrome
T19_WIDTH=1280 T19_REMAIN_FILTER='actual successful' T19_RUN_ID=1280-disclosure node frontend/tests/e2e/t19-remaining.mjs chrome
T19_RUN_ID=viewport-fixed node frontend/tests/e2e/t19-remaining.mjs safari
node --check frontend/tests/e2e/t19-remaining.mjs
python3 frontend/tests/e2e/test_t19_environment.py
docker build --network none -f frontend/tests/e2e/t19-gates.Dockerfile -t slp-t19-tooling frontend
# Existing full regression docker-run recipe above, unchanged.
python3 frontend/tests/e2e/t19-environment.py cleanup
```

Avoid the unfiltered Chrome command under a420s foreground-tool ceiling: it ran out during the second-width expiry cohort. Its first14 primary log lines plus2 separate BFCache rows persisted before timeout; missing last two were completed in isolated filtered reruns. Root PID44579 verified absent. Initial probe results remain `remaining-chrome-initial.json`; final aggregation deliberately excludes them. Width filtering bounds a full four-minute timed cohort under330s.

Current API image remains `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`; all109 historical backend manifest files identical to prior fingerprint0f2e8b5ff4fc73e7e7447c4790c7b95b77ea57828c175bf148a2b430e31971c2. Fresh current frontend image `sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4`; comparison against old frontend manifest differs only in preexisting t19-drivers.mjs, not app source. Identity evidence `remaining-identity.json`; new harness hash retained by artifact manifest. Same local OS/profile/resource allocations as preceding cohort; no representative mobile-network or performance claim.

Console: Firefox final slices each0 native console/page/CSP. Chrome filtered final slices each0 raw console /0 app /0 page /0 CSP errors; their HTTP410 check used the independent HTTPS client, not a browser refusal. Interrupted long Chrome run lacks final counter snapshot, so **do not claim a complete zero-console acceptance result**. Safari native W3C console stream remains unmonitored, post-load counters insufficient. No synthetic lifecycle dispatch was used for a native pass.

### Artifacts, teardown and next owner

Retained nonsensitive `/tmp/slp-t19-evidence/remaining-*` reports/logs, exact ledgers, gate/regression logs, identity, summary, artifact scan and cleanup. Scan24 text artifacts:0 full capability URLs /0 tested synthetic field literal matches; limited artifact check, not confidentiality sign-off. No new screenshots/traces/body dumps. Checkpoint `/tmp/slp-t19-remaining-checkpoint.md`.

Readback after teardown: owned Compose containers/networks/volumes0, named slp-t19 CLI containers0, synthetic env/key/TLS directory absent, extracted tools absent, owned Firefox profiles0, all eight recorded browser/driver root PIDs gone, loopback3449/3450 both refused (errno61). Nonsensitive artifacts and test images/cache intentionally retained. No foreign resources pruned.

**Ownership returned; T19 remains open.** Minimal next slice: establish a genuinely resizable owned visible Safari window (actual innerWidth360) and bounded request/response adapter, then Safari remaining manifest; separately close native Chrome background, actual BFCache/freeze and first-frame observations or explicitly disposition capability blockers. Firefox body-seam/offline, protected concurrent readers and unexecuted ledger cells remain open. Parent alone updates tracker/independently verifies; T20 load remains gated.

## Additive targeted HTTP/concurrent-reader slice — 2026-10-24T21:38:04.416193+00:00 (T19 still open)

No application/shared harness/backend/T20/tracker changes; no remote, load, commit, push, Safari, native clipboard, OS settings, offline/BFCache/freeze/first-frame research. Sole writing lane was two new isolated test files. Ownership returned to parent after cleanup.

### Executed results and mechanisms

Installed **headless Chrome156.0.8078.47:10 PASS/0 FAIL**; installed **headless Firefox149.0.2 native BiDi:12 PASS/0 FAIL**, each at actual360×800 and1280×800 with no horizontal overflow. Final reports `/tmp/slp-t19-evidence/http-concurrency-{chrome,firefox}.json`.

- Each browser/width: create and protected-disclosure **actual HTTP413 and422** through a deliberately scoped outgoing-body seam. The wrapper transforms the request body only, then calls real native fetch against the owned API and returns its original Response. No fabricated refusal JSON/status; this is not user-form-validation evidence. Native status, preserved input/code, one explicit POST, no Secret pre/content and no issued capability anchor are asserted. Existing followup415 native header-interception evidence is unchanged; no415 rerun claimed.
- Firefox avoids unsupported BiDi body replacement and faulty preload: context-scoped interception holds owned Next.js scripts on the new SSR document; post-document/pre-module evaluation installs the scoped wrapper; every script request is released unchanged and interception removed. Actual React form hydration is awaited before beforeinput. No app change for this harness limitation.
- Each browser/width: **two independent browser processes/profiles/contexts** navigate the same genuinely protected real link, stay neutral with0 automatic POST, send exact safe ASCII code and explicit DOM Show in Promise.all, both display real200 content before the original deadline. Both navigate afresh, remain neutral again, and both explicit Shows succeed again. Four correct disclosures per case; no link consumption. Separate actual status200 has required-code metadata and no secret. DOM click/beforeinput activation is labelled, not trusted-keyboard/native-paste proof. Historical unprotected simultaneous-reader passes at each same width were read back from original chrome.json/firefox.json; combined ledger concurrency cells now close protected+unprotected expansion.
- Firefox each width: hold an **actual native200** disclosure before delivery, confirm no plaintext while held, then deliberately mutate login to number42 in that response envelope. Whole response is rejected, no partial Secret/pre at any observed DOM mutation (MutationObserver). This is controlled malformed-envelope evidence, **not real-backend invalid data**, and not exhaustive malformed-shape coverage.

### Harness RED history, gates, confidentiality and identities

Initial Firefox report retained as `http-concurrency-firefox-initial-harness-red.json`:8 PASS/4 create timeouts. Second retained `http-concurrency-firefox-second-harness-red.json`:8 PASS/4 create timeouts after correcting the create Notice expectation. These were BAD RED harness synchronization/selector failures: SSR buttons existed before React native input listeners; waiting readyState complete + hydrated form onSubmit fixed the missing submitted input. No production GOOD RED or app fix. Final Firefox12/12 and Chrome10/10 are not substitutes for those historical failures. Added isolated seam selftests **3/3 PASS** (actual refusal Response identity/native delegation; foreign-origin/non-API pass-through; held actual200 controlled mutation). These were added as regression selftests after the harness correction, not claimed as test-first application RED.

Syntax PASS and environment poison fence1/1 PASS. Only isolated new harness files changed, no shared harness/config/dependency/app modifications; no full119 rerun or frontend unit/lint/typecheck/build rerun in this slice (previous24-unit/gates/119 evidence remains historical). Node24.17.0. Frontend/backend source comparison read109/82 historical entries: backend109 unchanged; only preexisting frontend t19-drivers.mjs differs, no application drift. Exact API image `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`; frontend `sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4`, reused after fingerprint check. Backend aggregate historical fingerprint0f2e8b5ff4fc73e7e7447c4790c7b95b77ea57828c175bf148a2b430e31971c2 remains valid. New file hashes: runner `5eaeeb48c7bfa1ba1c463f6c5edc66dcb4766b6fcd96439fd9d8fe5e259bf04c`; selftests `509fd8f00c63424d62f651c1c25c191c6a5dd667d7ecbdedd4bf5d76f370ca3a`.

Firefox both processes0 console/page/CSP. Chrome main8 raw console resource errors exactly4×413+4×422 intentional actual refusals,0 appConsole/page/CSP; second process0. No zero-raw-console claim. No new screenshots/traces/body/URL dumps. Artifact scan8 then-existing scoped JSON/logs:0 capability URLs/0 tested synthetic literal occurrences; limited artifact check, not a whole-system confidentiality signoff.

### Ledger and exact remaining scope

New additive ledger `http-concurrency-ledger-after.json` retains **354 cells**: **122 PRIOR PASS,58 PASS,48 N/A,124 OPEN,2 PARTIAL**. Twelve cells gain/supersede narrow evidence:4 SCR01 transport cells,2 Firefox SCR03 invalid-request,2 Firefox SCR04 response-envelope,4 concurrency. Eight formerly OPEN cells close;4 historical-pass transport cells gain current413/422 evidence. Prior ledger and failures untouched. This is not a completion percentage. `http-concurrency-summary.json` records every changed cell and exact counts.

Exact unexecuted obligations remain the124 OPEN+2 PARTIAL rows in this new ledger: Safari all remaining target-width/all-state cases, Firefox missing-code validation and actual offline, Chrome true hidden-document return, native BFCache/freeze and first-compositor-frame, wider wallclock confirmation/gate/reader combination and remaining exact manifest cells. Native Unicode/line-ending clipboard T23 remains deferred only; no broadened waiver. No new415, exhaustive malformed-envelope permutations, trusted keyboard/copy, lifecycle or full browser acceptance run. T19 is **not complete**; T20 load remains gated.

### Reproduction and teardown

Reused owned-stack setup is existing `docker/synthetic.py /tmp/slp-t19-synthetic`, same t19 namespace/3449/isolated-subnet replacements as t19-environment.py, ambient SLP_* removed, explicit retained SLP_WEB_IMAGE/SLP_API_IMAGE, then `docker compose --env-file /tmp/slp-t19-synthetic/synthetic.env -p slp-t19 up -d --no-build --wait --wait-timeout 210`. Tool extraction recipe above unchanged. Commands actually executed:

```sh
node --check frontend/tests/e2e/t19-http-concurrency.mjs
python3 frontend/tests/e2e/test_t19_environment.py
node frontend/tests/e2e/t19-http-concurrency.mjs firefox
node frontend/tests/e2e/t19-http-concurrency.mjs chrome
node --test frontend/tests/e2e/t19-http-concurrency.test.mjs
python3 frontend/tests/e2e/t19-environment.py cleanup
```

`http-concurrency-cleanup.json` + exact Docker readback: owned containers/networks/volumes0, generated synthetic env/keys/TLS absent, extracted tools absent, all8 recorded browser roots from initial/final runs gone,6 Firefox profiles absent,3449/3450 refused errno61. No foreign resources stopped/pruned. Nonsensitive images/evidence retained. Checkpoint `/tmp/slp-t19-http-concurrency-checkpoint.md`. Parent owns tracker and remaining acceptance disposition.

## Additive Safari actual application retry — 2026-10-25T16:18:18Z (T19 remains open)

Native installed Safari26.5.2 now exercised the existing real-HTTPS application matrix, in order360 then1280. **12 case executions:11 PASS,1 FAIL,0 BLOCKED.** At actual360×848:6/6 PASS. At actual1280×848:5 PASS/1 FAIL. Each width retained the **same native session from its successful dual-width preflight through all application cases**; no separate proof-session substitution. All51 narrow and47 desktop recorded application viewport samples were visible, exact target innerWidth, without horizontal overflow. The harness reasserts these after each explicit application navigation and at button/heading boundaries; no zoom/spoof, manual resize or browser/OS setting change.

Passed at both widths: SCR01 validation/labels/focus, native minute61 plus database3660-second lifetime, generated-code shape, protected correct/incorrect-code flow, repeated explicit neutral Show, unprotected keyboard creation/repeat reads, unknown and owned early-payload-loss terminal states with keyboard blank restart, and genuine protected sender-confirmation one-minute expiry. Narrow protected reader one-minute expiry also PASS. Successful real waits61.11s/61.12s at360 and61.20s confirmation at1280 verified content removal, expired heading focus and actual disclosure410, followed by expired navigation.

**Desktop reader expiry remains FAIL/unverified:** its initial Show timed out waiting for the Secret heading after10.08s, before the61-second wait. This is a real failed execution with insufficient state instrumentation to attribute cause; neither a proven app defect nor a passing expiry observation. No retry, speculative app patch or reclassification. All other lifecycle/manifest obligations not explicitly exercised here remain open, including native BFCache/freeze/offline/first-frame, delayed-response branches, all-minute expansion and remaining complete keyboard/state coverage. T23 stays deferred; no clipboard research performed.

Only harness initialization changed: the neutral data document now exactly matches the parent's successful probe, including initial-scale=1/title/body. Existing fourth viewport selftest pins that exact markup: observed RED before the change, then all4 viewport selftests PASS; syntax and environment-isolation1/1 PASS. This does not establish the missing scale token caused prior1920 failures. Parent probe and matrix otherwise use the same installed ephemeral safaridriver, acceptInsecureCerts session capability and x100/y100/height900 native rectangle sequence; unlike the standalone probe, matrix keeps its browser handle for app work. No app/backend/T20/tracker changes; no fresh frontend gate/full119-regression claim.

Retained identities verified before startup: frontend sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4, API sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74. Historical backend manifest unchanged; frontend historical comparison differs only in preexisting tests/e2e/t19-drivers.mjs, not app source. Used owned generated synthetic stack and retained images, no rebuild or T20 load.

Executed from repository root: `python3 /tmp/slp-t19-safari-retry.py` orchestrated syntax/selftests, source/image comparison, `python3 docker/synthetic.py /tmp/slp-t19-synthetic`, existing retained-image setup `/tmp/slp-t19-safari-setup.py`, then `python3 frontend/tests/e2e/t19-safari-matrix.py 360` (exit0), same1280 (exit1), and existing environment cleanup (exit0). The previously denied finalization script was not executed.

Evidence: `/tmp/slp-t19-evidence/safari-matrix-{360,1280}.json`, `safari-retry-{360,1280}.log`, `safari-retry-summary.json`, checkpoint `/tmp/slp-t19-safari-matrix-checkpoint.md`. Before overwriting, prior matrix reports/identity/checkpoint archived under `safari-retry-archive-20261025T161818Z`. Native console **UNMONITORED**; post-navigation counters all0 page/appConsole/CSP but omit bootstrap and do not prove native zero-console acceptance. No secrets/codes/full links intentionally recorded.

Verified teardown: both owned sessions deleted, both owned driver processes exited and driver ports closed; Compose containers/networks/volumes0, generated key/env/TLS directory absent, ports3449/3450 closed. Personal Safari processes left alone. Nonsensitive evidence and retained images/cache remain. **Ownership returned; parent owns tracker and remaining disposition.** Minimal follow-up: instrument only safe initial-Show state/status for the desktop reader case before assigning cause or changing app code.

## 2026-10-25 — narrow Safari desktop initial-Show follow-up (run 20261025T162657Z)

**Executed: 1 PASS / 0 FAIL / 0 BLOCKED / 0 N/A; exactly one case**, `AC-04/10 SCR03 SCR04 SCR05 actual one-minute protected reader expiry`, actual installed Safari26.5.2. Exact command: `T19_RUN_ID=20261025T162657Z python3 frontend/tests/e2e/t19-safari-matrix.py 1280 --case 'AC-04/10 SCR03 SCR04 SCR05 actual one-minute protected reader expiry'`, orchestrated by `/tmp/slp-t19-safari-show-run.py`. No six-case or360 app cohort rerun. The successful initialization document/session/native rectangles are unchanged; both preflight widths succeeded, and all6 app viewport samples were **1280x848, visible, no overflow**. First correct Show succeeded without retry, displayed the reading heading with required h1 focus; actual61.2-second wait reached focused expiry, removed plaintext, and revisiting stayed expired. Whole runner62.88s, case61.82s.

Added only a minimal optional exact-name filter and isolated selftest, plus sanitized observations in `frontend/tests/e2e/t19-safari-matrix.py` and `test_t19_safari_matrix.py`. No application/shared/runtime source was changed and no guessed race fix was applied. Syntax PASS; existing4 viewport selftests + new1 filter selftest + existing1 environment-isolation selftest = **6/6 PASS**, `git diff --check` PASS. Frontend application gates and full119 regressions were not rerun (no app/shared changes). Retained frontend/API image IDs exactly match the previous entry; owned fresh generated HTTPS/API/PostgreSQL/Redis stack, no rebuild/load/remote/clipboard/OS settings/tracker/commit/push work.

At code-input and preShow: active ID recipient-code, visible, exact-code-match **true**, document complete, React input props present, Show enabled, pending false, no code/reader error. After Show: reading classification, visible, pending false, code control gone (match false), required heading focus assertion PASS. Resource Timing showed **one completed status entry before Show, one completed status plus one completed disclosure after Show**; Safari did **not** expose positive responseStatus, so recorded statuses are null/unavailable. No HTTP200 is invented. Independent owned Python HTTPS **API controls**, not Safari traffic: create201, post-expiry disclosure410. No post-load fetch replacement (SecretClient already captures fetch at module load), no proxy or interception. Bounded event classes/IDs only: observed one form submit and element focus/blur; no recorded window-focus/visibility-return event establishes a race. Postload counters2 samples each page/appConsole/CSP0; native console remains **UNMONITORED**, bootstrap excluded.

**Cause remains undetermined, not reproduced.** The historical initial-Show FAIL is retained, not overwritten as a PASS or fixed defect. A single instrumented pass neither proves absence of an intermittent failure nor proves hydration/focus-return causation; added observation round trips may affect timing. No GOOD RED for a harness/app bug exists, therefore no app fix is justified. This closes this focused execution's expiry observation only. Full T19 native console, lifecycle/first-frame/BFCache/offline/freeze and other ledger obligations remain open; parent owns acceptance/disposition.

Evidence: `/tmp/slp-t19-evidence/safari-show-20261025T162657Z.json`, `.log`, `safari-show-summary-20261025T162657Z.json`, `safari-show-verification-20261025T162657Z.json`; checkpoint `/tmp/slp-t19-safari-show-checkpoint.md`. Prior reports/identity/checkpoint copied before run into `/tmp/slp-t19-evidence/safari-show-archive-20261025T162657Z`. New report/log/summary scan:3 files, full Share URLs0, exact code literals0, exact synthetic Secret literals0. No response/error-body strings collected.

Cleanup read back: owned session deleted, driver84886 gone, driver port closed; Compose container/network/volume counts0, generated env/key/TLS directory absent,3449/3450 closed. Shared Safari/personal windows were not targeted. Nonsensitive evidence and preexisting retained images/cache remain. **Writer/environment ownership returned; no resources left owned.**


## Additive automatic T19 slice — 2026-10-25T17:12:55Z (ownership returned; NOT complete)

Reconciled the latest additive Safari actual360 six PASS, archived actual1280 five PASS and focused desktop reader-expiry PASS **before execution**. The historical desktop initial-Show timeout remains UNKNOWN/not reproduced, not fixed or erased. Included user-reported Safari offline concealment→expiry→reconnect PASS; its viewport/version/timing were unrecorded. The two corresponding width rows carry shared manual attribution, **not two width-verified automated passes**, and offline was not repeated. T23 Unicode/line-ending fidelity remains the sole deferred exception, not a pass.

### Exact newly executed cases

|Browser|Actual innerWidth asserted|Case|Result|
|---|---:|---|---|
|safari 26.5.2|360|AC-01 SCR01 creation limited actual API429 owned quota fixture|PASS|
|safari 26.5.2|360|AC-01 SCR01 service unavailable actual API503 restored fixture|PASS|
|safari 26.5.2|360|AC-07 SCR03 five incorrect then correct temporarily limited no content|PASS|
|safari 26.5.2|360|AC-08 SCR03 real status503 safe failed retry restore neutral fresh Show|PASS|
|safari 26.5.2|360|AC-09/11b SCR03 real409 reclassifies early unavailable no automatic retry|PASS|
|safari 26.5.2|1280|AC-01 SCR01 creation limited actual API429 owned quota fixture|PASS|
|safari 26.5.2|1280|AC-01 SCR01 service unavailable actual API503 restored fixture|PASS|
|safari 26.5.2|1280|AC-07 SCR03 five incorrect then correct temporarily limited no content|PASS|
|safari 26.5.2|1280|AC-08 SCR03 real status503 safe failed retry restore neutral fresh Show|PASS|
|safari 26.5.2|1280|AC-09/11b SCR03 real409 reclassifies early unavailable no automatic retry|PASS|
|chrome 156.0.8078.47|360|AC-10 genuine same-window hidden return status fresh Show|BLOCKED|
|chrome 156.0.8078.47|360|AC-10 native BFCache persisted return status fresh Show|BLOCKED|
|chrome 156.0.8078.47|360|AC-10 native document freeze resume concealed fresh Show|BLOCKED|
|chrome 156.0.8078.47|1280|AC-10 genuine same-window hidden return status fresh Show|BLOCKED|
|chrome 156.0.8078.47|1280|AC-10 native BFCache persisted return status fresh Show|BLOCKED|
|chrome 156.0.8078.47|1280|AC-10 native document freeze resume concealed fresh Show|BLOCKED|

Safari **10 PASS/0 FAIL/0 BLOCKED**, same native W3C session retained from exact successful dual-width initialization through both application cohorts. All recorded viewport samples visible, exact360 or1280, no horizontal overflow. Original HTTPS API/database/Redis stack and original response bodies: no fabricated response status/JSON, request/body interception, framework or proxy rewrite. Owned creation-state quota/corruption fixtures restore original JSON, absolute TTL **and expiry-index score** in finally, with GET readback. The payload-corruption fixture restores its original hash field before neutral retry; deliberate early-loss fixture deletes only its own synthetic payload. No production state/side effect.

Actual independent HTTPS controls observed create429/503, status503, protected disclosure429 and disclosure409; Safari UI then exercised corresponding refusals. **Those numeric controls are not intercepted Safari application-response statuses.** Safari ResourceTiming lacks positive responseStatus in this configuration; application evidence is native rendered notice/state and exact resource-operation counts against the same controlled original server fixture. Five genuine wrong UI Shows followed by a correct-but-limited Show:6 browser disclosure resources. Failed status retry sent0 disclosures; restored neutral checks still sent0; one fresh explicit Show then succeeded. 409 caused one neutral recheck (two status resources total), reached early-unavailable, no automatic retry. No partial/plaintext in safe refusal states. Full Safari native console remains **UNMONITORED**, never zero.

Chrome **0 PASS/0 FAIL/6 capability BLOCKED**, actual headed installed156.0.8078.47 and actual360/1280 assertions. Inspected installed Playwright1.64.1 default args: includes `--disable-back-forward-cache`; existing unmodified `t19-drivers.mjs` already excludes exactly that flag. Live owned Chrome ps arguments prove headed/no BFCache-disable flag; no app no-store/security header was removed or weakened. New explicit Target.createTarget(newWindow:false) tabs had equal native window IDs, but activating them left the source document visible with no hidden event. Native freeze/active commands succeeded but no actual document freeze/resume events were observed, so no freeze pass. Actual back return never produced pageshow.persisted=true. Retained1280 native not-restored reasons: `MainResourceHasCacheControlNoStore`, `JsNetworkRequestReceivedCacheControlNoStoreResource`, `BrowsingInstanceNotSwapped`. Do not remove app no-store to obtain a pass. Each capability got at most two width attempts; no further loop. Chrome raw console/appConsole/page/CSP all0 for this complete cohort only. No compositor-frame evidence collected or claimed.

### Gates, RED history and current identities

Only four isolated test files were added: `t19-chrome-lifecycle.mjs`, `t19-chrome-lifecycle.test.mjs`, `t19-safari-refusals.py`, `test_t19_safari_refusals.py`. No application/shared driver/backend/T20/config/tracker source edited. Harness selftests written first: initial missing Chrome module was harness BAD RED; meaningful baseline assertions then failed2/2 (new-window request and command-vs-event proof), Safari fixture baseline failed2/2 (foreign scope and missing finally restoration). Implemented helpers pass. These are harness REDs, **not application GOOD RED or fixed production defects**. Browser.getBrowserCommandLine prerequisite was unavailable; one preserved harness prerequisite report, then actual owned ps args used. No masking retries.

Executed final gates: Node syntax PASS; Python py_compile PASS; new Chrome2 + new Safari2 + prior Safari5 + environment-isolation1 = **10/10 selftests PASS**; git diff --check PASS. Existing frontend24-unit/lint/typecheck/build/119-regression results remain historical, not rerun or claimed fresh (no app/shared/config changes).

Current source manifest: backend109 entries unchanged; frontend82 historical entries differ only in preexisting tests/e2e/t19-drivers.mjs, no app drift. Exact retained images frontend `sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4`, API `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`. Historical-manifest comparison, current aggregate fingerprints and image readback in `automatic-identity.json`; original full manifest in `followup-identity.json`; new harness SHA256 in `automatic-summary.json`. Dirty T20 instrumentation preserved; no clean-commit/build-all-source assertion.

### Reconciled ledger and exact remaining ownership

Durable exact ledger: [t19-automatic-ledger.json](./t19-automatic-ledger.json), **354 cells**. Before this slice after reconciliation:122 PRIOR PASS,98 PASS,48 N/A,82 OPEN,2 PARTIAL,2 shared viewport-unrecorded manual PASS. After10 new executions: **122 PRIOR PASS,106 PASS,48 N/A,68 OPEN,6 BLOCKED,2 PARTIAL,2 shared manual PASS**. Eight previously open cells close; 409 adds narrower new evidence to already covered unavailability states. Test executions are not coverage-cell totals or completion percentages.

Remaining76 obligation cells classify as **30 AUTOMATABLE_NEXT** (some require a small owned-tab adapter or existing controlled clipboard seam, not additional permission) and **46 unsupported-current-adapter/manual**. This classification is bounded to the class ledger, not an assertion that all minute/keyboard/copy permutations are covered. Safari all1440 native-minute expansion and complete per-screen keyboard/focus/copy coverage remain additional acceptance dimensions not encoded by a default-state PASS. No request to repeat passed offline/T23 or permission questions is needed.

#### AUTOMATABLE_NEXT

- chrome lifecycle `wall-clock jump confirmation/gate/reader`: 360,1280px.
- firefox SCR-03 `validation`: 360,1280px.
- firefox lifecycle `wall-clock jump confirmation/gate/reader`: 360,1280px.
- safari SCR-01 `error.capacity_unavailable`: 360,1280px.
- safari SCR-02 `loading`: 360,1280px.
- safari SCR-02 `success`: 360,1280px.
- safari SCR-02 `error`: 360,1280px.
- safari SCR-03 `concealed`: 360,1280px.
- safari SCR-04 `loading`: 360,1280px.
- safari SCR-04 `error.copy`: 360,1280px.
- safari SCR-04 `concealed`: 360,1280px.
- safari lifecycle `genuine background-return fresh status + Show`: 360,1280px.
- safari lifecycle `clipboard completion across expiry`: 360,1280px.
- safari lifecycle `wall-clock jump confirmation/gate/reader`: 360,1280px.
- safari lifecycle `concurrent protected/unprotected readers`: 360,1280px.

#### UNSUPPORTED_CURRENT_ADAPTER_OR_MANUAL

- chrome SCR-03 `concealed`: 360,1280px.
- chrome SCR-04 `concealed`: 360,1280px.
- chrome lifecycle `genuine background-return fresh status + Show`: 360,1280px.
- chrome lifecycle `native BFCache persisted true`: 360,1280px.
- chrome lifecycle `native freeze/resume event`: 360,1280px.
- chrome lifecycle `owned process suspend across expiry + first-frame`: 360,1280px.
- firefox lifecycle `native BFCache persisted true`: 360,1280px.
- firefox lifecycle `native freeze/resume event`: 360,1280px.
- firefox lifecycle `owned process suspend across expiry + first-frame`: 360,1280px.
- firefox lifecycle `offline active concealment + expiry`: 360,1280px.
- safari SCR-01 `loading`: 360,1280px.
- safari SCR-01 `error.transport`: 360,1280px.
- safari SCR-01 `error.uncertain`: 360,1280px.
- safari SCR-03 `loading.status`: 360,1280px.
- safari SCR-03 `loading.disclosure`: 360,1280px.
- safari SCR-03 `error.transport`: 360,1280px.
- safari SCR-03 `error.invalid_request`: 360,1280px.
- safari SCR-04 `error.response`: 360,1280px.
- safari lifecycle `native BFCache persisted true`: 360,1280px.
- safari lifecycle `native freeze/resume event`: 360,1280px.
- safari lifecycle `owned process suspend across expiry + first-frame`: 360,1280px.
- safari lifecycle `actual disclosure held across expiry + observer`: 360,1280px.
- safari lifecycle `actual status held across expiry`: 360,1280px.

First-compositor-frame observations remain explicitly MANUAL/unsupported for all browsers; a clean final DOM or MutationObserver does not prove a compositor frame. Firefox prior genuine owned process suspension is retained separately, not repeated merely to satisfy the combined first-frame row. Firefox native offline unsupported; Safari native console full-stream unsupported; genuine BFCache/freeze and current Chrome hidden behavior require an honestly supported capability or manual evidence, not successful command results. Safari W3C pre-module scoped request/unchanged-response holds remain unimplemented/unsupported in this adapter, not impossible for every conceivable harness. Do not spend another broad cohort on those without a small new supported prerequisite.

### Reproduction, artifacts and verified teardown

Commands: retained-image setup via existing docker/synthetic.py + `/tmp/slp-t19-safari-setup.py` (source/image checked), existing tool extraction from slp-resume-ui-browser, `node frontend/tests/e2e/t19-chrome-lifecycle.mjs`, `python3 frontend/tests/e2e/t19-safari-refusals.py`; final syntax/selftests above, then `python3 frontend/tests/e2e/t19-environment.py cleanup`. Checkpoints10/20/30/final `/tmp/slp-t19-automatic-checkpoint.md`. Evidence `/tmp/slp-t19-evidence/automatic-*`: per-case reports, before/after ledger, identity, selftest REDs, preserved initial Chrome prerequisite failure, summary, artifact scan and cleanup.

Post-cleanup exact readback: Compose containers/networks/volumes0, all named slp-t19 containers0; owned Chrome roots26351/26805 and Safari driver29057 gone; Chrome disposable profile absent; Safari session deleted and native driver port closed. Synthetic env/key/TLS directory absent, extracted tools absent,3449/3450 refused. No Firefox spawned. Shared personal Safari processes were never stopped. Scan9 then-existing scoped JSON/log files:0 full capability URLs and0 tested synthetic literal hits (limited artifact scan, not global confidentiality sign-off). Retained images/cache and nonsensitive evidence intentionally remain.

**Exclusive writer/environment ownership released. T19 remains open; parent alone owns tracker/acceptance.** No T20 load, remote/production/phone work, host clipboard access, OS trust/security/permissions changes, commit or push. Minimal productive next slice: Safari capacity + controlled ASCII clipboard loading/success/fallback + broader wall-clock combinations, then Firefox missing-code validation; use the exact automatable ledger instead of the stale124 OPEN count.
