# T19 Firefox validation contract correction

## Disposition

Only `firefox|360|SCR-03|validation` and `firefox|1280|SCR-03|validation` changed from FAIL to PASS in `t19-automatic-ledger.json`. This is a **harness defect**, not an application/API/spec regression. The parent alone owns the tracker. No app, API or specification changes; no T20/T23 execution, remote operation, commit or push.

Contract pins: spec.md AC-07 explicitly allows supplied empty guesses within 1024 UTF-8 bytes; screens.md:180 permits a missing-field `403 short_live_path.code_required`; gate-matrix-t15.spec.ts:33–35 requires exact empty-guess transmission. `useSecretReader.ts:31–51` locally rejects oversized guesses, transmits explicit empty guesses and safely handles both refusal codes.

## RED → GREEN

New isolated `t19-firefox-validation.test.mjs` first produced **2/2 failing tests** (`/tmp/slp-t19-evidence/firefox-validation-red.tap`): the existing tail did not distinguish empty from omitted, and the transparent seam lacked observed allowlisted refusal-code metadata. These are expected harness-contract REDs. The two previous browser reports `tail-firefox-validation.json` and `tail-firefox-validation-final.json` each retain their two failures unchanged under `/tmp/slp-t19-evidence/historical-bad-red/`; classification manifest records hashes and **historical BAD-RED, not product bug**. Originals remain available.

Minimal correction: replace the wrong empty/noPOST tail assertion; reuse the existing scoped native-fetch wrapper and pre-module Firefox JS hold/release loader. The wrapper clones only actual disclosure403 responses and retains only allowlisted `code_required`/`code_incorrect` codes alongside operation/status; it returns the original native Response unchanged. Importing the shared loader does not execute its unrelated concurrency cohort. No response synthesis is used by the browser refusal cases. The isolated unit test alone supplies a test Response to prove identity/body-consumption and metadata filtering.

## Focused installed-browser execution

Command: `T19_TAIL_FILTER='AC-07 validation' T19_TAIL_RUN='-validation-contract' node frontend/tests/e2e/t19-automatic-tail.mjs firefox`.

Evidence: `/tmp/slp-t19-evidence/tail-firefox-validation-contract.json`, installed Firefox **149.0.2**, actual visible widths **360** and **1280**, height800. **2 browser test executions PASS, covering exactly 2 ledger cells**, with three boundary vectors in each execution:

| Boundary | POST count per vector | Actual API / UI result |
|---|---:|---|
| Oversized guess | 0 | Local explanation, code focused, no Secret |
| Explicitly supplied empty guess after Show | 1 | Native HTTP403 `short_live_path.code_incorrect`, safe code focus |
| Genuinely absent `reading_code` via outgoing `{}` seam after Show | 1 | Native HTTP403 `short_live_path.code_required`, safe code focus |

Four actual disclosure POSTs across the two executions. Wrapper counts and native BiDi counts agree at2 per execution; no POST before explicit Show or automatic retry afterward. Transient-plaintext observer remained false, DOM contained no Secret, and code focus was safe. Outgoing omitted-field transformation is a test-only transport seam, **not** an assertion that the UI locally blocks an empty guess. Native response status/code metadata is observed rather than inferred from UI. No plaintext, input values or capability URLs are emitted in the reports.

Browser report: page/console/CSP errors each0. Syntax checks passed for both modified runners. Focused Node selftests **7/7 PASS** (validation2, existing HTTP seam3, lifecycle2); Python harness/environment/manifest selftests **9/9 PASS**. Production images reused unchanged: frontend `sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4`, API `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74`. Fresh owned HTTPS/API/store stack reached healthy state; fixture HTTPS creation used the generated CA. No full119 suite, broad matrix, production rebuild or new application gate is claimed.

## Ledger and teardown

354 cells: PRIOR PASS122, PASS136, N/A48, OPEN38, BLOCKED6, PARTIAL2, manual PASS with viewport unrecorded2, FAIL0. Remaining **AUTOMATABLE_NEXT0**, **UNSUPPORTED_CURRENT_ADAPTER_OR_MANUAL46**; zero automatable is not whole-T19 acceptance.

The46 remain existing adapter/manual obligations: native BFCache, freeze/resume, suspend/first-frame, relevant background/conceal/offline cases and Safari request/response/loading seams. Their individual rows are unchanged; previously attributed manual evidence is not duplicated across widths.

`/tmp/slp-t19-evidence/firefox-validation-cleanup.json` verifies owned containers/networks/volumes0, Firefox PID60160 gone, temporary profile gone, all generated keys/TLS/env and disposable stores removed, port3449 closed and no network descriptors for the owned browser PID. Six selected evidence artifacts scanned: capability URLs0 and synthetic-content hits0. Checkpoint: `/tmp/slp-t19-firefox-validation-checkpoint.md`. Ownership released to parent; tracker untouched.