---
id: "T24"
title: "Complete deferred manual and adapter-limited browser verification"
layer: "tests"
deps: []
blocks: []
acs: ["AC-01", "AC-02", "AC-03", "AC-04", "AC-05", "AC-06", "AC-07", "AC-08", "AC-09", "AC-10", "AC-11b", "AC-12"]
files_hint: ["frontend/tests/e2e/", "frontend/tests/accessibility/", "docs/features/short-live-path/_audit/"]
owner: "Product Owner + coding agent"
estimate: "TBD; split into bounded sessions on activation"
status: "todo"
---

# T24 — Complete deferred manual and adapter-limited browser verification

## Disposition and sequence

The Product Owner explicitly requested moving the entire remaining manual-check list to T24 and closing T19. T19 is therefore closed with documented deferred verification, NOT with a claim of a fully passing original browser matrix. This backlog item is outside `tasks.json`, has no active dependency edges and does not block T19 closure or the T19 prerequisite of T20. Do not auto-dispatch it. Closing T19 does not establish production readiness, independent security approval or T20 performance attainment.

T23 separately owns native clipboard Unicode/line-ending fidelity; do not merge or silently close that issue here. Preserve the current specification as the verification target. Deferred obligations remain unverified, not N/A or PASS. Historical failed/blocked evidence remains intact, including the earlier Safari initial-Show timeout that passed a focused rerun but whose cause is unknown.

## Scope transferred from the manual checklist

Use synthetic data and installed Chrome, Firefox and Safari. Unless explicitly noted otherwise, verify actual layout widths 360px and 1280px. The following ten groups preserve the full user-facing checklist:

1. **Chrome genuine background concealment.** Open a disclosed Secret, activate another tab or minimize the window, return, and confirm concealment, neutral revalidation and a fresh explicit Show. Also cover the neutral gate before Show. Record actual visibility events rather than treating a successful activation command as proof.
2. **Firefox offline concealment, expiry and reconnect.** Disconnect networking for the test browser after disclosure; wait through expiration; reconnect. Plaintext must disappear and never return after expiry. User-confirmed Safari offline/expiry/reconnect already PASS manually, but its version/viewport were not recorded; do not require repeating that accepted sequence merely because automation was unavailable.
3. **All-browser suspend/return and first compositor frame.** Return after expiry and prove there is no momentary stale-text frame. Firefox owned-process suspension was previously exercised; first-frame proof is still missing. Use a scoped screen recording/frame observation with synthetic text; an eventual hidden DOM or a single late screenshot is insufficient. Never suspend the user's computer or an unowned/shared browser process without separate authorization.
4. **Safari complete keyboard route.** Complete create, code enable/generation, lifetime editing, Show, copy/fallback and restart without a mouse. Check visible focus, labels, safe error announcements, heading/error focus and no keyboard trap. Existing isolated native-key passes do not establish the full route.
5. **Safari complete Console coverage.** Use Web Inspector or a supported equivalent during scenarios. Check application errors, unhandled exceptions and CSP violations, including bootstrap. Preserve expected HTTP-refusal resource diagnostics separately. Current W3C-native console coverage is UNMONITORED, not zero.
6. **All-browser genuine BFCache.** Navigate away and Back; verify `pageshow.persisted === true` before claiming BFCache restoration. Confirm concealed return and fresh Show. If current no-store/security policy prevents BFCache, retain the measured reason and obtain an explicit capability disposition; never weaken security/cache policy to force a pass.
7. **All-browser genuine freeze/resume.** Verify actual freeze/resume behavior/events with a supported method, not merely a successful automation command or minimized window. Confirm concealed return, availability recheck and explicit Show. Distinguish browser document freeze from owned-process suspension.
8. **Safari delayed real responses and loading states.** Hold actual creation, status and disclosure responses. Check pending UI, retained input, disabled duplicate submission and absent Secret. Hold status/disclosure past their original server-established expiration; late completion must not enable Show or reveal even transient plaintext. Requires a scoped response-hold adapter or prepared test environment, not an invented backend response.
9. **Safari transport, invalid-request and uncertain-creation errors.** Exercise real create/disclose 413/415, disclose 422 and lost confirmation after actual creation. Check safe notices, no automatic retry, no speculative Share link and unchanged user input. These cases require prepared request/transport seams, not ordinary clicks alone.
10. **Safari malformed disclosure envelope.** Transparently receive an actual response and apply an explicitly labelled controlled envelope mutation. Reject the entire response without partial/transient plaintext. Do not call mutated data a genuine backend-invalid response.

## Additional dimensions transferred with the list

- Safari's complete 1..1440 minute domain, including non-hour choices and 61 minutes. This should be automated where practical; do not manually enumerate every value. Preserve actual UI/serialization evidence rather than only a pure numeric-domain test.
- Complete trusted-keyboard, automatic/manual whole/partial-copy and selection permutations while eligible, plus inaccessible/late copy feedback. The Unicode transformation defect itself remains T23. Class-level state PASS does not establish all these permutations.
- Width attribution for existing manual evidence remains honest: a manual test at an unrecorded width is not two independently measured viewport passes.

## Exact inherited ledger snapshot

The source [354-cell ledger](../_audit/t19-automatic-ledger.json) retains execution-time statuses. Exactly 46 remaining cells (38 OPEN, 6 BLOCKED, 2 PARTIAL) are transferred below. This is coverage-cell accounting, not 46 separate manual test executions. Manual Safari offline evidence is accepted separately and is not duplicated as narrow/desktop proof. The extra keyboard/console/minute/copy dimensions above are outside that ledger denominator.

| Browser | Screen | Deferred case | Actual target widths |
|---|---|---|---|
| chrome | SCR-03 | concealed | 360, 1280 |
| chrome | SCR-04 | concealed | 360, 1280 |
| chrome | lifecycle | genuine background-return fresh status + Show | 360, 1280 |
| chrome | lifecycle | native BFCache persisted true | 360, 1280 |
| chrome | lifecycle | native freeze/resume event | 360, 1280 |
| chrome | lifecycle | owned process suspend across expiry + first-frame | 360, 1280 |
| firefox | lifecycle | native BFCache persisted true | 360, 1280 |
| firefox | lifecycle | native freeze/resume event | 360, 1280 |
| firefox | lifecycle | owned process suspend across expiry + first-frame | 360, 1280 |
| firefox | lifecycle | offline active concealment + expiry | 360, 1280 |
| safari | SCR-01 | loading | 360, 1280 |
| safari | SCR-01 | error.transport | 360, 1280 |
| safari | SCR-01 | error.uncertain | 360, 1280 |
| safari | SCR-03 | loading.status | 360, 1280 |
| safari | SCR-03 | loading.disclosure | 360, 1280 |
| safari | SCR-03 | error.transport | 360, 1280 |
| safari | SCR-03 | error.invalid_request | 360, 1280 |
| safari | SCR-04 | error.response | 360, 1280 |
| safari | lifecycle | native BFCache persisted true | 360, 1280 |
| safari | lifecycle | native freeze/resume event | 360, 1280 |
| safari | lifecycle | owned process suspend across expiry + first-frame | 360, 1280 |
| safari | lifecycle | actual disclosure held across expiry + observer | 360, 1280 |
| safari | lifecycle | actual status held across expiry | 360, 1280 |

## Evidence and safety

- Read the current [browser audit](../_audit/browser-verification.md), [validation contract audit](../_audit/firefox-validation-contract.md), [Firefox native-output audit](../_audit/firefox-native-output.md) and [Safari native-clipboard audit](../_audit/safari-native-clipboard.md) before activation. Local `/tmp/slp-t19-evidence/` artifacts are supplementary and may not survive reboot.
- Reconcile existing executed coverage before adding tests; do not rerun successful cohorts solely to inflate counts. Keep automated, controlled-seam, manual/user-reported and unsupported observations distinct.
- Use only owned synthetic environments, browsers/profiles and keys. No real Secrets, codes or full Share links in retained screenshots, logs or traces. Foreground activation and host clipboard overwrite require appropriate user authorization; never snapshot previous clipboard contents.
- Do not click permission/security/certificate dialogs or change global OS trust, networking, sleep or browser security settings automatically. The active Safari automation guard prevents manual window interaction; stopping that session invalidates its ID. Preserve a successfully sized fresh session through app scenarios and assert actual `innerWidth`/visibility.
- No DB/API change is authorized by this backlog record. A discovered app regression needs a failing test before a minimal fix, then relevant gates. Capability limitations are not app defects.

## Completion criteria

- [ ] Every inherited row and additional dimension has executed evidence at the required browser/viewport or a separately reviewed explicit capability/product disposition.
- [ ] Document commands/manual steps, browser versions, actual viewport, observed transitions, expected/actual outcome and sanitised console/error classes.
- [ ] Distinguish original HTTP responses from controlled mutations and API controls from browser-observed statuses.
- [ ] No hidden/expired/transient Secret disclosure; no automatic disclosure/retry, deadline extension, link consumption or false copy-success feedback.
- [ ] Preserve T23 and all historical findings; do not convert deferred cases to passes without execution.
- [ ] Verify relevant tests/gates and cleanup of owned resources; update the current disposition without rewriting historical reports.
