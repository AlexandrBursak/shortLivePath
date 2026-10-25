# T19 installed Safari / native HOST clipboard — 2026-10-24 bounded cohort

**T19 remains open.** These results add to, never replace, historical core/follow-up failures. No production application defect has been established and no application source was changed.

## Permission and isolation receipt

The delegating user explicitly confirmed Safari Developer→Allow remote automation was enabled by them and authorized overwriting the HOST system clipboard with synthetic values, with readback only after our own write. The runner never reads/snapshots previous contents and promises no restoration. Every read is guarded by an earlier own `pbcopy`; synthetic sentinels precede application-copy checks. The host clipboard now contains synthetic data; original contents were not restored. No OS/browser permission/security/certificate dialog was clicked. No global trust, system settings, production/remote/phone target, T20 load, tracker, commit or push was touched.

Owned stack: existing `slp-t19` synthetic nginx→Next/API→new PostgreSQL/Redis at `https://localhost:3449`, new generated TLS and keys. Installed browsers, not bundled substitutes: Chrome156.0.8078.47 and Firefox149.0.2 in new **headful** owned profiles; Safari26.5.2 via native safaridriver. Existing optional driver parameters retain historical headless/default controlled hooks; this cohort explicitly disables Chrome clipboard hooks. Safari `acceptInsecureCerts:true` returned HTTP200 and **true**, and actual application HTTPS navigation succeeded. This is session-only; the historical default-false HTTP200 capability probe remains separate from the older HTTP500 remote-automation refusal.

## Executed ledger (not a full manifest denominator)

Each complete native run attempts20 named cases: baseline host-write receipt, nine cases per requested width, one real-expiry case. Failed dependent cases remain FAIL in raw evidence; do not treat them as independent product defects. Initial native results:

| Scenario | Chrome | Firefox | Safari |
|---|---|---|---|
| Entire scoped native run | **20 PASS /0 FAIL** | **8 PASS /12 FAIL** | **6 PASS /14 FAIL** |
| Own synthetic pbcopy→pbpaste receipt | PASS | PASS | PASS (host tool, not browser clipboard proof) |
| Native paste→SCR01 exact creation minute61/protection/generation→SCR02, both widths | PASS | Creation PASS; original CRLF fidelity fails later | FAIL: no trusted paste event from Safari W3C Cmd+V |
| SCR02 actual copy code/link→host | PASS,2 roundtrips per width | FAIL on code; grouped case stops before link | Not reached (dependent failure) |
| SCR03 neutral/protected Show→SCR04 original three fields | PASS | FAIL exact-original comparison; trusted paste already LF-normalized | Not reached |
| Three automatic field copies→host | PASS,3 per width | FAIL | Not reached |
| Controlled automatic-copy denial→native manual Cmd+C, whole/partial three fields | PASS,6 host roundtrips per width | FAIL on first whole-field comparison; remainder not reached | Not reached |
| Unprotected initial+repeat explicit Show | PASS both widths | PASS both widths | PASS initial native run, both requested outer-window widths |
| SCR05 unknown safe terminal, keyboard restart blank | PASS both widths | PASS both widths | PASS initial native run |
| Real one-minute expiry: local plaintext removed; POST410; explicit expired page | PASS,62s wait | PASS,62s wait | PASS initial native run,62s wait |

Chrome/Firefox use actual360×800 and1280×800 viewport interfaces. Safari W3C changes **outer-window rectangle**, not a proved360px layout viewport; do not count its requested width as narrow-layout acceptance. DOM focus/selection is explicitly set, activation/copy/paste uses native WebDriver keyboard. This is not a Tab-only accessibility matrix. Native clipboard Chrome source contains leading/trailing spaces,tabs,NFD,non-BMP,CRLF,lone CR,LF,inert markup and long text. Manual partial range uses raw UTF-16 boundaries2…60. All values are synthetic; reports retain classifications, not plaintext/full links.

## Boundary isolation / retained failed experiments

- Safari W3C Cmd+V emits **no paste event**, including capture installed immediately before the shortcut; editable display stays empty. No application source change can be justified from that alone. No OS permission UI was clicked. A controlled `beforeinput` supplement successfully supplied display text, but creation/reading later timed out. Focused reproduction recorded **`document.visibilityState='hidden'`**, safe creation-abandonment UI (`Create a new attempt`) and **0 observed post-load page/CSP errors**. This is consistent with the intentional lifecycle gate; it does not establish a source bug or grant permission to bypass it. The full controlled attempt remains **1 PASS/19 FAIL**, and focused create-only repetition **0 PASS/2 FAIL**, not new native passes.
- Firefox capture proves trusted paste events (`isTrusted=true`) deliver **LF-normalized**, not original CRLF/lone-CR strings. A separate labelled controlled-beforeinput supplement supplies the original source after the native probe: **10 PASS/10 FAIL**, including exact three-field display PASS at both widths, but native automatic and first manual whole-copy host comparisons still fail. Original length203 vs host202 was observed for fields, code15 vs14; reports do not assert the exact output transformation. No frontend fix was made on the assumption that a browser clipboard conversion is an app bug. Full native input/output exactness remains **FAIL/open**, not silently reclassified green.
- These failures do not erase Chrome's full native result or previous Firefox controlled-seam evidence. No BFCache, freeze, actual offline Safari/Firefox, concurrent readers, late-response/clipboard completion, first compositor frame, all1440 minute values or full-state closure was newly established here.

**Precise next user action for Safari:** bring the isolated Safari **automation** window to the foreground and keep it visible during a bounded native-copy/paste run; if Safari presents an OS/browser paste/clipboard permission UI, the user must inspect and explicitly approve that prompt themselves. Do not change global certificate trust or disable security. The agent has not clicked any such prompt. A fresh owner should first check `visibilityState`, then use an API-seeded unprotected original-string fixture to isolate native output from unsupported Cmd+V before expanding coverage. Safari native app clipboard remains blocked/unproven, not a pass.

## Errors, source and reproduction

Chrome: raw console errors0, app0,page0,resource0. Firefox: native BiDi monitored console0,page0; CSP is post-navigation only. Safari has **no native W3C console stream in this adapter**: raw/resource/app console counts **UNMONITORED**, not zero. Its initial/focused post-load page0/CSP0 counters do not cover initial module errors. Application Permissions-Policy/CSP was not weakened. Chrome native run adds a post-load CSP listener; pre-navigation CSP coverage is not newly proven by its legacy adapter's counter.

No `frontend/src` or backend changes. Harness-only changes: minimal headless/nativeClipboard options in `t19-drivers.mjs`; new reused-native-interface runner `t19-safari-native.mjs`. Current retained API image remains the prior follow-up T20-inclusive build; setup freshly rebuilt the unchanged frontend. Fresh current-test offline gate `pnpm test && pnpm lint && pnpm typecheck` passed (24 unit tests). Prior production build was exercised again by setup; source unchanged. No fresh controlled119-regression claim is made in this cohort.

Commands from repository root, after existing setup/tool extraction recipe:

```sh
python3 frontend/tests/e2e/t19-environment.py setup
node frontend/tests/e2e/t19-safari-native.mjs safari
node frontend/tests/e2e/t19-safari-native.mjs chrome
node frontend/tests/e2e/t19-safari-native.mjs firefox
T19_CONTROLLED_PASTE=1 node frontend/tests/e2e/t19-safari-native.mjs safari
T19_CONTROLLED_PASTE=1 node frontend/tests/e2e/t19-safari-native.mjs firefox
T19_CONTROLLED_PASTE=1 T19_NATIVE_FILTER=SCR01 node frontend/tests/e2e/t19-safari-native.mjs safari
# Do not run cohorts concurrently: clipboard is shared HOST state.
# Filtered runs overwrite their same-mode report: archive first, as this cohort did.
python3 frontend/tests/e2e/t19-environment.py cleanup
```

Evidence `/tmp/slp-t19-evidence/safari-native-{chrome,firefox,safari}.json/.log`, controlled-paste JSON/logs, `safari-native-safari-controlled-paste-initial.json`, focused Safari log, `safari-clipboard-capability.json`, `safari-native-gates.log`, generated `safari-native-summary.json`, cleanup/identity readback. The existing historical `safari.json` was not overwritten. Early/final checkpoint `/tmp/slp-t19-safari-clipboard-checkpoint.md`. No new screenshots were retained; existing symbolic screenshots remain intact.

**Cleanup verified by final readback:** owned containers/networks/volumes0; named CLI containers0; Safari/Chrome/Firefox recorded roots gone; owned Firefox profiles0; Playwright Chrome temporary profiles0; ports3449/3450 closed(errno61); synthetic env/key/TLS directory and extracted tools absent. Test images/cache and nonsensitive evidence are intentionally retained. `safari-native-identity-scan.json` compares109 prior backend files unchanged and82 prior frontend files with only the harness driver changed;15 cohort evidence files scan0 full capability URLs/0 tested raw-source literals. Exact frontend image `sha256:d58299c09ef60ea7e0096f199e03f939dd243431516a9d8515bb64d6ada05578`; API unchanged `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`. **Ownership returned.** Remaining obligations include Safari visible native clipboard/actual narrow viewport/core exact creation, Firefox native CRLF fidelity disposition, historical Firefox request-body mutation failures and all earlier unclosed lifecycle/manifest criteria. Parent owns tracker and any next dispatch; this phase does not authorize T20 load.

## Additive explicitly authorized foreground slice — 2026-10-24

The user explicitly authorized raising owned Firefox/Safari test windows and keeping them visible, and reported their own manual test worked. **That manual success is user-reported evidence only, not automated acceptance or proof of exact Unicode/CRLF.** No permission/security/certificate dialog was clicked; no settings/global trust change, app/spec change, tracker change, T20 load, remote/phone, commit or push. Historical failures above remain unchanged. Sole-writer ownership returned after cleanup.

Source identity rechecked:109 backend manifest files unchanged;82 prior frontend files differ only in the already-existing driver harness. Same exact retained API4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74 and frontend d58299c09ef60ea7e0096f199e03f939dd243431516a9d8515bb64d6ada05578 reused. Fresh owned slp-t19 HTTPS/API/PostgreSQL/Redis healthy. Host clipboard cohorts ran serially. Reads followed our own synthetic writes only; sentinel verified before each output measurement; no old-content snapshot/restoration.

### Firefox149.0.2 — decisive HEADFUL output

Executed `node frontend/tests/e2e/t19-firefox-output.mjs` (headful, owned profile, native BiDi context activation).18 measured entries, no blocked/fatal entries: receipt, API, DOM,15 host output checks. These are not18 acceptance passes. Correct `data.secret.credential` assertion actually executed: creation201/disclosure200 exact original. Actual viewport1280×800, visible. DOM and transparently delegated writeText/setData arguments exact original203 UTF-16/208 UTF-8; CRLF1/loneCR1/loneLF1/combining acute1, NFD true/NFC false.

**Host8 exact /7 mismatches of15 output checks.** Both app automatic/manual whole host outputs equal **original.normalize('NFC')**, not original:202 UTF-16/207 UTF-8, combining acute0, NFC true/NFD false; **CRLF1/loneCR1/loneLF1 unchanged**. Plain DOM original automatic/setData/default-selection and isolated NFD automatic/setData reproduce the same NFC composition. Separate ASCII CRLF/CR/LF and independent synthetic link automatic/manual controls all exact (8 checks). Therefore the historical203→202 output discrepancy is now classified as NFC composition downstream of exact JS payload, not LF or CR-only conversion. The browser/OS/flavor/readback boundary is not uniquely localized. No app-code regression is established, no normalization workaround/spec waiver applied. Host bridge now works; headless sentinel-only historical evidence is preserved. Firefox console/page counters0; CSP coverage remains post-navigation/incomplete.

### Visible Safari26.5.2 — API original first, native output/core/paste

Executed the same bounded output runner with `--safari`, importing only the existing adapter (main cohort guarded; no blind full run). Native WebDriver session uses `acceptInsecureCerts:true`; selects its own session handle before foreground Safari activation. Initial, pre-Show, and pre-copy checks visible. Actual output viewport1280×868 (not requested800).18 measured entries, **15/15 host output comparisons exact**, including app automatic/manual whole, original/default-selection controls, ASCII CRLF/CR/LF/NFD/link. API201/200 and app DOM exact. This is scoped output success, not full Safari acceptance or confirmation-link UI coverage. Native W3C console stream UNMONITORED, not zero.

Executed `node frontend/tests/e2e/t19-safari-visible-core.mjs`:3 PASS/1 FAIL. API original exact and initial+repeat neutral→fresh explicit Show exact pass. Real `innerWidth=360,innerHeight=868`, visible/no horizontal page overflow, measured after W3C rect; this is a narrow viewport capability/layout sample only, **not all narrow flows acceptance**. Desktop stages1280×868 visible. Safari native Cmd+V now emits a **trusted paste event** (unlike hidden historical runs), but original exactness fails before submit. A single bounded `--paste-only` diagnostic (0 PASS/1 FAIL; no seed) retained separately confirms event raw **NFC-equal**, exact false/LF false,28 UTF-16, combining acute0, CRLF1/loneCR1/loneLF1; editable display27. Our own pbcopy→pbpaste original equality passed before each native paste. Thus Safari input has a real composition discrepancy upstream of app handling; create/confirmation was deliberately not reached after the exactness assertion. No fake beforeinput injection/bypass or source fix. All recorded transition checks visible. No claim of full lifecycle, expiry, protected code, partial-selection, all fields, all1440 minutes, first-frame, BFCache/freeze or real-phone coverage.

### Artifacts / gates / cleanup / next gate

Evidence `/tmp/slp-t19-evidence/{firefox-output-headful,safari-output-headful,safari-visible-core,safari-visible-paste,foreground-identity,foreground-summary,foreground-cleanup}.json`; checkpoint `/tmp/slp-t19-foreground-checkpoint.md`. Output JSON stores counts/booleans, not raw Secret/full generated link. Harness edits: shared output headful/Safari option, exported Safari adapter with owned-handle activation/main guard; new bounded visible-core runner. `node --check` on all three changed harnesses and existing Python environment unittest pass; `git diff --check` clean. No app source/config change, hence no new full frontend build/gate claim. The core diagnostic originally returned shell0 despite retained FAIL; final harness now sets nonzero on FAIL (syntax checked, no additional browser rerun for this exit-only change).

Cleanup readback: owned Firefox root96118 gone/profile absent; owned Safari drivers96512/97606/98738 gone; slp-t19 containers/networks/volumes0; ports3449/3450 closed(errno61); generated synthetic TLS/keys/env and setup script absent; extracted tools absent. Safari sessions explicitly DELETEd; no arbitrary personal windows closed. Retained test images/nonsensitive evidence only. Host clipboard ends in our synthetic paste fixture (no restoration). All unrelated dirty work preserved.

**T19 stays open.** Next action is a reviewed browser/platform-fidelity disposition or a narrower flavor-level native clipboard investigation: Firefox NFC output and Safari NFC input are acceptance failures without established app regression. Do not normalize expected strings, weaken exact ACs, silently substitute manual success, or start T20 load. Historical lifecycle/manifest and protected/create/confirmation/narrow matrix gaps remain due; parent owns tracker.
