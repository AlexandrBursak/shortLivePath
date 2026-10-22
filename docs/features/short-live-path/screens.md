---
status: approved
feature_size: M
tool: code
updated_at: "2026-10-22"
---

# Screens — short-live-path

The canonical screen manifest for tasks, implement and review. Those stages consume this document, not separate visual files. Product Owner approved SCR-01 through SCR-05 individually, including minute-level lifetime selection. Approval covers UI behavior, not implementation readiness or unresolved security/timing algorithms.

## Source

- **Tool:** code. docs/design-system.md is absent, so there is no canon tool or component inventory to copy. Inline wireframes are the documented fallback, not an unavailable-MCP substitution.
- **File:** inline wireframes below. Wireframes specify information hierarchy and interactions, not a color, typography or component-library selection.
- **Inputs:** [ux-flows.md](./ux-flows.md) Screen inventory; [spec.md](./spec.md) §5; [sad.md](./sad.md) §6 S1–S7; [OpenAPI](./contracts/openapi.yaml); [API sync report](./contracts/api-sync-report.md); [events.md](./contracts/events.md).
- **Scope:** size M, route standard, interview depth medium, responsive web-frontend with backend-service. All five inventory IDs retained; no additional screen, account, history, recovery or management surface.
- **Component gap:** no existing primitive inventory is available to verify reuse against. Every proposed component is explicitly NEW and justified in New components; names denote proposed responsibilities, not existing imports. Establish docs/design-system.md before implementation, reconcile these against its primitives and register only the necessary additions. No library dependency or design token is assumed here.
- **Inherited blockers:** the API remains Draft under T2 DM-OQ-02/03/04 (successful-creation timestamps, clocks/recovery and executable admission/fencing). T1 DM-OQ-01/05 starting policy is Accepted and synchronized from ADR-0006/0007: code maximum 1024 UTF-8 bytes, body maximum 524288 wire bytes, uncompressed JSON, two concurrent hash calls/no queue and trusted-address/continuity refusal. T21 calibration and actual proxy/security verification remain pending; no safe-deadline algorithm is invented.

## Screens

### Shared presentation and interaction contract

- Use one readable column at 360 pixels and wider; desktop keeps a bounded readable form rather than spreading fields across the viewport. Labels remain above fields. Actions wrap or stack without horizontal page overflow; only exact-text/link blocks may scroll internally. Wireframes use short symbolic placeholders, never real Secret values.
- NEW: ScreenFrame supplies the neutral page title, heading and content structure. Never place Secret text, code or capability URL in titles, previews, announcements, diagnostics, analytics or logs. No sensitive SSR payloads; browser memory only, no localStorage, IndexedDB, automatic drafts or sensitive service-worker caches.
- NEW: ActionButton is keyboard-operable with a visible focus indication and disabled/busy states. No duplicate creation/disclosure submissions while pending. Use labels and state text, not color alone. NEW: Notice announces safe status text without submitted values; errors are announced and focus moves to the relevant field/error summary or destination heading as appropriate.
- NEW: TextField and NEW: ExactTextArea have persistent labels and associated help/error text. Preserve exact nonempty credential strings, spaces, Unicode and line breaks; reject malformed scalar text rather than silently replacing it. Check required non-whitespace credential separately without trimming the retained/submitted value. Secret content is inert text, never HTML, executable content, a redirect or an automatically fetched destination.
- NEW: RemainingLifetime shows HH:MM:SS, a readable remaining-duration label, and the authoritative expiration formatted with an explicit time zone. Do not announce every second to screen readers; make the value available on focus and announce the transition to expired. Derive eligibility conservatively from service_time/expires_at plus monotonic elapsed time and transit accounting, never from the device wall clock. Algorithm and browser/sleep discontinuity verification remain DM-OQ-03. A countdown is presentation, not permission to bypass service enforcement.
- Check eligibility before display/copy and after asynchronous work. Reject late, invalid or superseded responses. Hide disclosed text on background/pagehide/freeze/back-forward-cache transitions; invalidate pending disclosure/copy-feedback callbacks. A return stays concealed, performs neutral status revalidation and requires a fresh explicit Show. Offline/failure on return keeps SCR-03 concealed; it does not prove expiration. An active offline page still hides locally at its conservative deadline.
- NEW: ExactCopyField uses the original field string for clipboard submission without added labels, trimming, normalization or newline conversion. Show success only on resolved clipboard success while still active/eligible. On failure, offer manual selection only while eligible. Recheck before submission and after completion; a submitted clipboard operation or already acquired copy cannot be recalled. No callback may restore expired/concealed text.
- User-facing wording below is English to match the feature artifacts; the Ukrainian confirmation dialogue approved its meaning. No additional language selector/localization scope is introduced.

### SCR-01 — Create Secret

Entry: initial creation visit or deliberate new creation from SCR-02/SCR-05. Exit: only received, validated, confirmed createSecret 201 reaches SCR-02. Sources: AC-01/02/04/05/06, NFR-05/06; S1/S2.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Initial form; 60 minutes, Reading code off; S1, AC-04 | NEW: ScreenFrame, TextField, ExactTextArea, LifetimeControl, ReadingCodeControl, ActionButton, Notice | WF-01-A |
| empty | No entered text; same form, no fabricated empty-list view; AC-02 | NEW: TextField, ExactTextArea, LifetimeControl | WF-01-A |
| validation | Required credential missing/whitespace-only, total text above 65536 UTF-8 bytes, invalid lifetime, enabled code below six Unicode code points or any code above 1024 UTF-8 bytes; createSecret 422 short_live_path.invalid_request; S1 | NEW: TextField, ExactTextArea, LifetimeControl, ReadingCodeControl, Notice | WF-01-B |
| loading | One explicit creation pending; retain current values, freeze submitted controls and disable resubmit; S1/S2 | NEW: ActionButton, Notice | WF-01-C |
| error.transport | createSecret 413 short_live_path.request_too_large or 415 short_live_path.unsupported_media_type; preserve exact form input, no link or automatic retry; Accepted ADR-0006 | NEW: Notice, ActionButton | WF-01-D |
| error.creation_limited | createSecret 429 short_live_path.creation_limited; retain text and explain waiting; NFR-05/S2 | NEW: Notice, ActionButton | WF-01-D |
| error.capacity_unavailable | createSecret 503 short_live_path.capacity_unavailable; preserve text, no link, no eviction promise as UI evidence; S2 | NEW: Notice, ActionButton | WF-01-D |
| error.service_unavailable | createSecret 503 short_live_path.service_unavailable; no confirmed outcome, preserve text; S2 | NEW: Notice, ActionButton | WF-01-D |
| error.uncertain | Lost/invalid response, timeout, or outcome not confirmed; no success claim or automatic resend; S2 | NEW: Notice, ActionButton | WF-01-D |
| success | Confirmed createSecret 201 with valid service timing/link; AC-01/S1 | NEW: ScreenFrame | Transition to WF-02-A, never show a speculative link |

#### WF-01-A — default / empty

```text
+------------------------------------------------+
| Create a Secret                                |
| Address (optional)                             |
| [                                            ] |
| Login (optional)                               |
| [                                            ] |
| Password or key                                |
| [ exact multiline text                       ] |
| [                                            ] |
| Secret text: [UTF-8 bytes used] / 65536 bytes    |
| Lifetime                                       |
| [o-----------------------------] 1 min..24 h    |
| Exact minutes [60]       Selected: 1 h          |
| [ ] Require a separate Reading code            |
| [ Create Secret ]                              |
| The service can read the temporary content.     |
| No recovery. Expiry does not revoke external    |
| credentials or erase copies already acquired.  |
+------------------------------------------------+
```

Lifetime interaction approved at this stage: a linear whole-minute domain 1–1440, starting at 60. Pointer/touch dragging assists whole-hour selection by choosing the nearest multiple of 60 within the range, plus the explicit minimum endpoint 1; ties choose the higher hour. The synchronized numeric input accepts every whole minute, without snap, clamp or silent rounding. Slider Left/Down and Right/Up decrement/increment one minute without snapping; Home/End choose 1/1440. Expose the exact minute value and readable duration to assistive technology. A numeric edit such as 61 stays 61 on blur and submit. Invalid/fractional/empty input is retained with an explanation and blocks creation, never silently coerced. On touch devices non-hour values remain reachable through the numeric field. Range and numeric control are synchronized representations of one lifetime, not two conflicting settings. Term starts at successful creation, not form entry. The hour-snapping OQ in spec §8 is resolved by this approved interaction; its historical pending note is superseded by this manifest.

When code protection is enabled, insert the following block before Create Secret:

```text
| [x] Require a separate Reading code            |
| Reading code [exact chosen/generated code    ] |
| [ Generate 20-character code ]                  |
| At least 6 Unicode code points; case and spaces |
| matter. A generated code is recommended.        |
| Send the code separately from the Share link.  |
```

Use unbiased cryptographically secure browser-local generation of twenty Latin letters/digits. No endpoint is needed. No complexity rule blocks an otherwise valid code; longer codes and any character composition are allowed up to 1024 UTF-8 bytes. Show the byte maximum in help/error text, validate before submission, retain exact input on rejection and never truncate. The HTTP body maximum is 524288 wire bytes, separate from the aggregate Secret size. Disabled protection omits reading_code rather than sending an empty string/null. Do not trim chosen codes. No sensitive form persistence or recovery.

#### WF-01-B — validation

```text
| Check the highlighted fields.                  |
| Password or key [retained exact input         ] |
| Error: Enter a password or key, not only spaces.|
| Secret text error: maximum 65536 UTF-8 bytes.    |
| Exact minutes [retained invalid value]          |
| Error: Enter a whole number from 1 to 1440.      |
| Reading code [retained exact input            ] |
| Error: Use at least 6 Unicode code points.      |
| [ Create Secret ]                              |
```

Show only applicable errors. Byte count sums address, login and credential, excluding code/packaging. API details is always []; do not invent server field-error entries or echo submitted values. Derive field-specific errors from local checks; otherwise show a safe form-level 422 explanation. Server validation remains authoritative. Explain code overflow as a 1024 UTF-8 byte maximum, never as a wrong code; transport 413/415 uses the safe Notice without echoing submitted values.

#### WF-01-C — loading

```text
| [current form values retained; controls busy]  |
| [ Creating... (disabled) ]                      |
```

#### WF-01-D — error / uncertain

```text
| [current exact form input remains editable]    |
| [safe notice for the applicable outcome]       |
| [ Create a new attempt ]                       |
| No automatic retry. A manual retry is new.      |
```

Notice variants: quota — “Creation is temporarily limited for your network address. Wait before trying again”; capacity — “Temporary capacity is unavailable”; unavailable/uncertain — “Creation is not confirmed. It may have occurred. A retry creates a new Secret.” Do not claim a failure proves no record exists. No invented Retry-After/countdown or deduplication/recovery guarantee. A possible earlier record retains its original expiration.

### SCR-02 — Share confirmation

Entry: confirmed SCR-01 success only; not a recoverable history route. Sources: AC-01/04/06/12, S1/S2/S6. Keep the optional plaintext code only from current-page creation state; the API never echoes it. Do not repeat address/login/credential here and clear obsolete creation content state.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Confirmed link, timing and optional separate in-memory code | NEW: ScreenFrame, RemainingLifetime, ExactCopyField, Notice, ActionButton | WF-02-A |
| loading | Individual clipboard operation pending, not another creation; UX US-01 | NEW: ExactCopyField | WF-02-B |
| success | Confirmed creation; successful eligible clipboard completion announces only the copied item; AC-01/S5 copy safety | NEW: Notice, ExactCopyField | WF-02-A / WF-02-B |
| error | Clipboard denied/failed: no false success; manual selection while eligible; UX US-01 | NEW: Notice, ExactCopyField | WF-02-B |
| expired | Conservative deadline reached; remove handover blocks and disable their copy, including code; AC-04/S6 | NEW: ScreenFrame | Transition to WF-05-B |
| N/A: empty | No confirmed link means remain at SCR-01, not an empty confirmation | NEW: ScreenFrame | WF-01-D |
| N/A: validation | No editing/submission on this screen | NEW: ScreenFrame | WF-02-A |

#### WF-02-A — confirmed / default

```text
+------------------------------------------------+
| Secret created                                 |
| Remaining [HH:MM:SS]                            |
| Expires [service expiration; explicit zone]     |
| Share link                                     |
| [confirmed HTTPS Share link; selectable]        |
| [ Copy link ]                                  |
| Reading code (only when enabled)                |
| [code from this page memory; selectable]        |
| [ Copy code ]                                  |
| Send the code separately, preferably through    |
| another channel. Link and code cannot be        |
| recovered. A crash may end availability early.  |
| Expiry does not revoke credentials/saved copies.|
| [ Create a new Secret ]                         |
+------------------------------------------------+
```

Never combine code and link into one copy action/message/URL. No integrated delivery provider. New creation starts an empty SCR-01 and clears prior handover state; navigating away/reloading does not recover this confirmation/code. Background/resume must not restore stale sensitive values or extend expiration: conceal handover/code controls until safe neutral revalidation; failure leaves them concealed with safe retry guidance, expiration reaches SCR-05. A return does not fetch or recover the code from the server.

#### WF-02-B — copy feedback (same layout)

```text
| [ Copying link... (disabled) ]                 |
| Success: Link copied.                          |
| OR Error: Could not copy. Select the link       |
| manually while it remains eligible.            |
```

Apply independently to link/code with item-specific feedback, never announcing the value. Only one applicable status appears per operation; no late feedback restores hidden controls.

### SCR-03 — Neutral reading gate

Entry: initial/repeat /s/{token} visit or return after concealment; never auto-disclose. Sources: AC-04/06/07/08/09/10/11b, S3/S4/S6.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | getSecretStatus 200 state available, reading_code_required false or true | NEW: ScreenFrame, RemainingLifetime, TextField, ActionButton, Notice | WF-03-A |
| loading.status | Initial or return neutral lifecycle check; Show disabled, no Secret | NEW: Notice, ActionButton | WF-03-B |
| validation | Required code omitted; local explanation or discloseSecret 403 short_live_path.code_required | NEW: TextField, Notice | WF-03-C |
| loading.disclosure | Explicit Show pending; no content, disable repeated submission, no automatic retry | NEW: ActionButton, Notice | WF-03-B |
| error.code_incorrect | discloseSecret 403 short_live_path.code_incorrect; no fragments or permanent consumption | NEW: TextField, Notice, ActionButton | WF-03-C |
| error.verification_limited | discloseSecret 429 short_live_path.verification_limited; shared link/address slots occupied | NEW: Notice, ActionButton | WF-03-C |
| error.transport | discloseSecret 413 short_live_path.request_too_large or 415 short_live_path.unsupported_media_type; keep gate concealed and exact current code, explain safe refusal, no failure-count claim or automatic retry | NEW: Notice, ActionButton | WF-03-C |
| error.invalid_request | discloseSecret 422 short_live_path.invalid_request; safe request explanation, no fabricated field details | NEW: Notice, ActionButton | WF-03-C |
| error.temporary | Status/disclosure 503 short_live_path.service_unavailable or short_live_path.capacity_unavailable; network/offline/invalid response; never claim wrong code, expiry or unknown from a timeout | NEW: Notice, ActionButton | WF-03-D |
| concealed | Background/resume/discontinuity: no old content/copy; recheck status then require fresh Show; S6 | NEW: Notice, ActionButton | WF-03-B / WF-03-D |
| success | Eligible discloseSecret 200, valid active request and safe deadline before display | NEW: ScreenFrame | Transition to WF-04-A |
| expired | Status state expired, discloseSecret 410 short_live_path.link_expired, local deadline or late eligible response; AC-10 | NEW: ScreenFrame | Transition to WF-05-B |
| unavailable | Status state unknown/early_unavailable, or discloseSecret 409 short_live_path.link_unavailable | NEW: ScreenFrame | Transition to WF-05-A / WF-05-C; 409 uses a neutral recheck to distinguish, without auto-disclosure |
| N/A: empty | No collection; unknown/malformed token is an unavailable state, not an empty reader | NEW: ScreenFrame | WF-05-A |

#### WF-03-A — default, available with/without code

```text
+------------------------------------------------+
| A Secret was shared with you                   |
| Remaining [HH:MM:SS]                            |
| Expires [service expiration; explicit zone]     |
| Reading code [                              ]  |
| (field only when reading_code_required = true)  |
| [ Show Secret ]                                |
| Opening this page does not reveal the content.  |
| Repeated reading is allowed while available     |
| before expiry. No account is required.          |
+------------------------------------------------+
```

No address, login, credential or code verifier in the neutral response, HTML, title or preview. An available status is not a reservation or guarantee of later availability. Code entry preserves exact case/spaces; no create-only six-code-point minimum applies to disclosure guesses, but the 1024 UTF-8 byte maximum still applies, including to explicitly supplied empty guesses. Send {} for unprotected disclosure; do not start verification on field edits or page open. Code success grants no identity/session/future automatic access.

#### WF-03-B — status / disclosure loading / concealed

```text
| A Secret was shared with you                   |
| Checking availability...                       |
| [ Show Secret (disabled) ]                     |
| No Secret content or enabled copy action.      |
```

For explicit disclosure replace the status line with “Opening...” and keep the verified gate layout/code entry busy. Return checking discards old disclosure and does not reveal it under a spinner. If the deadline is reached while pending, go to SCR-05 and ignore late responses.

#### WF-03-C — validation / safe request errors

```text
| [gate and safe countdown remain, if trusted]   |
| Reading code [exact current entry           ]  |
| [applicable error below; no submitted values]   |
| [ Show Secret ]                               |
```

Variants: “Enter the separate Reading code”; “The Reading code is incorrect. The link has not been consumed”; “Verification is temporarily limited. Wait before trying again. People sharing a public network address share this limit for this link”; or “The request could not be accepted. Check the input and try deliberately.” Five failures per rolling sixty seconds/link/address pair is service policy, not a client-side remaining-attempt counter. In-flight reservations can also limit a correct attempt. No permanent/link-wide lockout, invented exact unlock time or auto-retry. A refusal does not extend failure timestamps.

#### WF-03-D — temporary error / offline return

```text
| Content remains hidden.                        |
| Availability could not be checked right now.   |
| [ Check availability again ]                   |
| This does not establish that the link expired. |
```

Manual retry here is neutral status only and never sends the code or runs disclosure. On available return, show WF-03-A and require Show; on a proven terminal state, SCR-05. If a disclosure 409 needs classification and status fails, remain safely concealed with this temporary error rather than inventing unknown/early loss. If neutral status is unexpectedly available after a 409, stay at the gate and require a new Show, never automatically retry disclosure.

### SCR-04 — Read Secret

Entry: explicit eligible disclosure and pre-display checks only. Sources: AC-03/04/08/10/12, S5/S6. No second reveal click or password mask after the explicit Show already succeeded.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Valid exact Secret, active page and strictly eligible deadline | NEW: ScreenFrame, RemainingLifetime, ExactCopyField, Notice | WF-04-A |
| loading | Individual exact-field clipboard operation pending; guard before submission and after completion | NEW: ExactCopyField | WF-04-B |
| success | Readable exact text or clipboard success while eligible; announce copied item only | NEW: ExactCopyField, Notice | WF-04-A / WF-04-B |
| error.copy | Clipboard denied/failed; manual selection only while eligible | NEW: ExactCopyField, Notice | WF-04-B |
| error.response | Invalid/inconsistent/superseded disclosure: discard without partial rendering; S5 | NEW: ScreenFrame, Notice | Return to safe SCR-03 WF-03-D, preserving no Secret fragments |
| concealed | Background/freeze/return: hide and invalidate prior work, no content-copy; S6 | NEW: ScreenFrame, Notice | Transition to SCR-03 WF-03-B / WF-03-D |
| expired | Local offline deadline or late response/completion; discard content, disable copy; AC-10 | NEW: ScreenFrame | Transition to WF-05-B |
| N/A: empty | Required credential must exist; empty optional address/login are omitted, not a separate empty screen | NEW: ExactCopyField | WF-04-A |
| N/A: validation | Read-only screen, no credential editing or submission | NEW: ScreenFrame | WF-04-A |

#### WF-04-A — exact readable content

```text
+------------------------------------------------+
| Secret                                         |
| Remaining [HH:MM:SS]                            |
| Expires [service expiration; explicit zone]     |
| Address (only if nonempty)                      |
| [exact inert text]              [ Copy address ]|
| Login (only if nonempty)                        |
| [exact inert text]              [ Copy login ]  |
| Password or key                                |
| [exact text                                   ]|
| [  line breaks and spaces preserved           ]|
| [long lines scroll inside the block           ]|
| [ Copy password or key ]                       |
| Expiry stops access through this service, not   |
| external credentials or copies already saved.   |
+------------------------------------------------+
```

Do not linkify addresses or fetch previews. Per-field copying uses the original string with no prefixes, combined payload formatting or “Copy all” feature. Use selectable preformatted text with internal horizontal scroll for long lines, accessible by keyboard. Exact strings are not visually reformatted into altered credentials. Read/copy does not consume a link or affect other readers. No countdown reset on reading. If a background operation expires while copying, stay hidden; already submitted clipboard bytes cannot be recalled.

#### WF-04-B — copy busy / success / failure (same field layout)

```text
| [ Copying password or key... (disabled) ]      |
| Success: Password or key copied.               |
| OR Error: Could not copy. Select the exact     |
| text manually while it remains available.     |
```

Only applicable status is shown. Focus/manual selection never resurrects hidden content. An invalid response never produces a partial SCR-04, even if some fields look usable.

### SCR-05 — Unavailable Secret

Entry: unknown/malformed, explicit expiry, known early loss, or eligible local expiry transition from SCR-02/03/04. Sources: AC-09/10/11b/12, S3/S4/S6. Keep the original Share URL for a known expired link; no missing-page/404 experience or recovery action.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Unknown/malformed token, status state unknown; safe no-content unavailable message | NEW: ScreenFrame, Notice, ActionButton | WF-05-A |
| empty | No retrievable known Secret for unknown link; same safe default, no fragments | NEW: ScreenFrame, Notice, ActionButton | WF-05-A |
| error.expired | status state expired, disclosure 410 short_live_path.link_expired or conservative local deadline reached | NEW: ScreenFrame, Notice, ActionButton | WF-05-B |
| error.early_unavailable | status state early_unavailable (including 409 followed by that neutral classification); AC-11b | NEW: ScreenFrame, Notice, ActionButton | WF-05-C |
| N/A: loading | No disclosure/recovery request here; any unresolved check remains concealed at SCR-03 | NEW: ScreenFrame | WF-03-B / WF-03-D |
| N/A: success | Terminal unavailability is not a successful disclosure or physical-erasure receipt | NEW: ScreenFrame | WF-05-A / WF-05-B / WF-05-C |
| N/A: validation | No editable form; Create a new Secret starts empty SCR-01 | NEW: ActionButton | WF-01-A |

#### WF-05-A — unknown / default / empty

```text
+------------------------------------------------+
| The Secret at this link is unavailable          |
| Recovery is not available. Ask the Sender to    |
| create and share a new link.                    |
| This does not change external passwords or     |
| server keys, or erase copies already acquired.  |
| [ Create a new Secret ]                         |
+------------------------------------------------+
```

No claim it previously existed, expired or was deleted. No Secret fragments, code, active countdown, old handover blocks or content/code/link-copy actions.

#### WF-05-B — expired

```text
+------------------------------------------------+
| This Share link has expired                    |
| Expired [known service expiration; zone]        |
| No new disclosure is available through it.      |
| Recovery is not available. Ask the Sender for   |
| a newly created link.                          |
| External passwords/keys and previously saved   |
| copies are not revoked or erased.              |
| [ Create a new Secret ]                         |
+------------------------------------------------+
```

Show the expiration instant only if known. Local expiry is enough to stop display without waiting for the network; no API success is needed to hide content. Do not claim “physically erased” or use a UI checkmark as proof of cleanup/log/backup compliance.

#### WF-05-C — early unavailability

```text
+------------------------------------------------+
| The Secret became unavailable before expiry    |
| Temporary content may be lost after a crash.    |
| The cause is not confirmed here. No recovery.   |
| Ask the Sender to create and share a new link.  |
| External passwords/keys and previously saved   |
| copies are not revoked or erased.              |
| [ Create a new Secret ]                         |
+------------------------------------------------+
```

Do not label early loss as expiration or definitively blame a crash. No automatic Sender contact, old-content prefill, recovery endpoint or history. Temporary dependencies, corrupt records/verifiers and network uncertainty map to SCR-03 temporary failure under the current Draft API's 503 policy, not terminal loss. This respects the API refinement of older generic safe-unavailable SAD branches.

## New components

All are proposals pending reconciliation with a future design-system inventory; no implementation/registration is claimed. With no inventory, even basic primitives cannot honestly be claimed as reused. Composite responsibilities below must first be implemented by composing that eventual canon, not installing parallel bespoke primitives by default.

| Component | Why no existing primitive fits | Registered in design-system |
|---|---|---|
| ScreenFrame | No canon or existing layout inventory exists; needs shared neutral metadata, bounded responsive content and destination focus | pending — canon absent |
| TextField | No text-input primitive inventory exists; needs labels, exact-value handling, help/error association and busy state | pending — canon absent |
| ExactTextArea | No multiline primitive inventory exists; needs verbatim credential entry and accessible validation without trimming | pending — canon absent |
| ActionButton | No button primitive inventory exists; needs keyboard, focus, disabled and asynchronous busy states | pending — canon absent |
| Notice | No status/error primitive inventory exists; needs safe announcements without sensitive values or color-only meaning | pending — canon absent |
| LifetimeControl | No slider/numeric composite exists; must synchronize hour-snapped pointer control with all-minute keyboard/numeric choices | pending — canon absent |
| ReadingCodeControl | No optional-code composite exists; needs exact chosen code, browser-local 20-character generator and nonblocking weak-code guidance | pending — canon absent |
| RemainingLifetime | No service-time countdown primitive exists; needs accessible remaining time, explicit zone and guarded terminal transition | pending — canon absent |
| ExactCopyField | No selectable exact-text/copy primitive exists; needs safe asynchronous feedback, manual fallback and expiry/concealment guards | pending — canon absent |

## Traceability and confirmation

| Source | Manifest coverage |
|---|---|
| AC-01 | SCR-01 confirmed-only transition; SCR-02 link and expiration |
| AC-02 | SCR-01 validation, exact UTF-8 accounting and preserved input |
| AC-03 | SCR-04 inert exact text, original-string clipboard/manual selection |
| AC-04 | SCR-01 full minute range/default and approved snapping; SCR-02/03/04 service-derived countdown |
| AC-05 | SCR-01 lifetime validation without silent coercion |
| AC-06 | SCR-01 optional exact code/generator; SCR-02 separate handover; SCR-03 no create-only guess minimum |
| AC-07 | SCR-03 required/wrong code and temporary shared-pair limit; no fragments/permanent consumption |
| AC-08 | SCR-03 explicit initial/repeat Show; SCR-04 repeat/concurrent read with no view count |
| AC-09 | SCR-03 status mapping; SCR-05 unknown versus explicit known expiry at original URL |
| AC-10 | Shared timing/lifecycle guards, SCR-03/04 concealed/late states, SCR-05 local/offline expiry |
| AC-11 | No UI proves storage cleanup; SCR-05 avoids erasure receipts. S7, events.md and security/service tests must verify deletion, recovery gating and log/backup exclusions |
| AC-11b | SCR-05 early_unavailable and no recovery; failed dependency checks are not mislabeled loss |
| AC-12 | SCR-01/02/04/05 explain no external credential/copy revocation |
| NFR-05 | SCR-01 retained form and deliberate manual retry after shared-address limit |
| NFR-06 | Shared 360-pixel layout, keyboard controls, numeric minute alternative and accessible safe announcements |
| S7 | No extra maintenance/erasure-proof screen; closed readiness/corruption maps to temporary 503 at SCR-01/03 |

All nine OpenAPI error literals are mapped in the state tables: short_live_path.invalid_request, short_live_path.creation_limited, short_live_path.capacity_unavailable, short_live_path.service_unavailable, short_live_path.code_required, short_live_path.code_incorrect, short_live_path.verification_limited, short_live_path.link_unavailable and short_live_path.link_expired. Status variants available/expired/unknown/early_unavailable are covered explicitly. Error details remains []; do not invent field-level diagnostics, unlock deadlines or remaining-attempt response fields.

- SCR-01: Product Owner accepted option 1; form, all states and pointer-hour/keyboard-minute/numeric-minute lifetime interaction approved.
- SCR-02: Product Owner accepted option 1; separate copy actions, no credential repetition, clipboard fallback and expired handover removal approved.
- SCR-03: Product Owner accepted option 1; neutral check, explicit Show, safe failures, return revalidation and no automatic disclosure approved.
- SCR-04: Product Owner accepted option 1; immediately readable exact fields, per-field copy/manual fallback, concealment and local expiry approved.
- SCR-05: Product Owner accepted option 1; distinct unknown/expired/early-unavailable messaging, no recovery or erasure claims, and new empty creation approved.

## Validation

Self-check: 4/4 pass on 2026-10-22, verified by a Python documentation check reading the saved manifest and source files: (1) all five inventory screens covered; (2) 45 state rows with default plus error/empty and explicit N/A coverage of all state classes; (3) all nine referenced proposed components justified in New components; (4) all state source references resolve to fifteen inline wireframes. Supplementary checks passed for all nine API error codes and all thirteen acceptance criteria; git diff --check passed for tracked changes. The first verifier attempt undercounted component names in comma-separated cells; the corrected verifier checks every cell entry, not only the first NEW prefix. This is documentation validation only, not a running UI, accessibility, security, browser lifecycle or performance test. Inherited DM-OQ blockers remain; recommend design-system before UI implementation. No commit is made; proposed commit: screens: short-live-path manifest.
