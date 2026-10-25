---
id: "T23"
title: "Resolve native clipboard Unicode fidelity in Firefox and Safari"
layer: "tests"
deps: []
blocks: []
acs: ["AC-02", "AC-03", "AC-06"]
files_hint: ["frontend/src/shared/", "frontend/src/view/components/ExactCopyField.tsx", "frontend/tests/e2e/", "docs/features/short-live-path/_audit/"]
owner: "Product Owner + coding agent"
estimate: "TBD after platform investigation"
status: "todo"
---

# T23 — Resolve native clipboard Unicode fidelity in Firefox and Safari

## Disposition

Explicitly deferred to the future backlog by the Product Owner after reviewing the T19 finding. Outside `tasks.json`, with no active dependency edges. This specific Unicode clipboard finding no longer blocks T19 acceptance; this is a recorded known exception, not a passing fidelity test, a fix, or completion of T19's other obligations. Do not auto-dispatch this item. The original exactness requirements remain the target for the future fix.

## Problem and impact

Browser-native clipboard transport can change a decomposed Unicode sequence (NFD) into its canonically composed NFC form. Text can look identical while its code-point sequence and UTF-8 bytes differ. This can affect Secrets, keys and manually chosen Reading codes; visual equality does not establish exact password/code equality. Ordinary manual workflows can succeed despite this edge case. The user's successful manual test is user-reported evidence, not proof of all Unicode cases.

No application-code regression has been established: API/DOM originals and the observed values passed to native clipboard methods were exact. Do not introduce app-side normalization or weaken exact comparison as a presumed fix.

## Executed evidence

- Firefox 149, headful 1280×800: API and application DOM exact; `writeText` and manual `setData` receive originals. Of 15 native host-output measurements, eight were exact and seven showed NFC composition. Both application copy paths showed 203→202 UTF-16 units for the decomposed fixture, with CRLF/lone CR/lone LF preserved. Minimal non-application NFD controls reproduced composition; ASCII, newline and link controls were exact.
- Safari 26.5.2, visible 1280×868: API/DOM exact and all 15 native host-output measurements exact. Trusted native paste delivered NFC-composed input before application handling; the original own host clipboard write/read was exact beforehand. Paste-only reproduction failed the exactness assertion without submitting creation.
- Earlier Firefox trusted-paste evidence separately showed LF normalization before application handling. This input behavior remains part of the deferred native-transport investigation; do not conflate it with the NFC-only output measurements above or claim all line-ending paths pass.
- Historical failed and blocked runs remain evidence. Headless Firefox's missing host clipboard bridge is a harness/capability limitation, not a fidelity pass or application regression.

Durable evidence: [Firefox output audit](../_audit/firefox-native-output.md), [Safari/native clipboard audit](../_audit/safari-native-clipboard.md), [T19 browser audit](../_audit/browser-verification.md). Local detailed artifacts are under `/tmp/slp-t19-evidence/` (`foreground-summary.json`, headful Firefox output and Safari visible/paste reports); temporary artifacts may not survive cleanup/reboot, so retain the durable audits.

## Source requirements

`spec.md` §5 AC-02 requires nonempty password/key text to be preserved verbatim, without trimming or normalization. AC-03 requires copied multiline-key characters, spaces and line breaks to be unaltered. AC-06 requires exact chosen-code comparison without normalization. These requirements are not rewritten by this deferral. See [specification](../spec.md).

## Future investigation and implementation

- Reproduce with installed, visible Firefox and Safari and isolated API-seeded originals; separate paste input from copy output.
- Probe native text flavors and browser-only controls using independent ASCII, NFD, CRLF, lone CR and LF fixtures. Record only counts/classifications, not Secrets, codes or full capability links.
- Determine whether a safe browser-compatible workaround can preserve original code points/bytes. No workaround or new transfer format is preselected; any UX/API change requires review.
- Pin any proposed fix with a genuine failing native test before changing application behavior. Preserve backend exactness and lifecycle/privacy controls.

## Data and API delta

No DB or API changes are authorized by this backlog entry. No global OS/browser trust, clipboard permissions or security settings may be changed automatically. Native tests must obtain permission before overwriting the host clipboard, never read/snapshot its previous contents, and read back only after their own synthetic write.

## Completion criteria

- [ ] Installed-browser input/output reproductions distinguish app-boundary data from browser/OS transformations.
- [ ] A reviewed solution preserves original code points and bytes end-to-end for the affected fixtures, or a separately approved product decision explicitly defines a supported alternative.
- [ ] Automatic copy, manual whole/partial selection, paste, chosen-code equality and unchanged line endings are covered with independent assertions; one failing case must not skip unrelated checks silently.
- [ ] Existing exact backend, privacy, lifecycle and expiry regressions pass; original failing evidence is retained and superseded only by executed results.
- [ ] Update the linked T19 exception and audits only after actual verification; remove the exception only when its completion criteria are met.
