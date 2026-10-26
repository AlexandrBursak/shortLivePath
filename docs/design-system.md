---
status: Living
tool: code
figma_file: ""
pen_file: ""
updated_at: "2026-10-22"
---

# Design system — short-live-path

## Approval and scope

The Product Owner approved a code-only canon based on the existing screen wireframes during implementation: a simple responsive interface without a UI component library, system typography, neutral colors, contrasting actions and visible keyboard focus. This approves the foundation, not unimplemented components, pixel baselines, accessibility results or security readiness. SCR-01–SCR-05 remain the behavioral contract in `docs/features/short-live-path/screens.md:21`.

## Platform posture

- Posture: responsive-both. One readable column works from 360 px through desktop; desktop does not spread confidential fields across the viewport.
- Device classes: minimum 360 px and bounded desktop form, as specified in `docs/features/short-live-path/screens.md:25`. Real-phone testing remains a pre-launch gate.

## Design tool

- Tool: code. The canonical wireframes are in `docs/features/short-live-path/screens.md`.
- Library location: in-repository generic primitives under `frontend/src/shared/ui/`, once implemented. No Figma/Pencil document or external UI library is assumed.

## Token source

Implemented token source: `frontend/src/shared/styles/tokens.css`, consumed through `frontend/src/app/layout.tsx` and `globals.css`. Colors, spacing, control/column sizing, radius and system font families are centralized there. T4 proof: `docs/features/short-live-path/_audit/bootstrap-frontend.md`.

Foundation direction: system sans-serif for interface text, system monospace for exact credentials, neutral page/surface/text colors, a contrasting primary action and explicit focus ring. Individual color/spacing values are implementation choices within this approved direction, not copied from a preexisting brand system. Tokens must remain centralized; feature components must not invent parallel palettes.

## Component inventory

Five generic primitives are implemented in `frontend/src/shared/ui/index.tsx` and registered after T4 gates. ExactTextArea remains an inert monospace primitive, not an exact-copy adapter. T13 registers the creation-only SourceTextArea adapter, LifetimeControl and ReadingCodeControl below after its gates. T14 registers the guarded confirmation, countdown and handover-copy composites below after its gates. T15 registers the neutral ReadingGate after its scoped gates. T16 registers recipient reading/unavailability and extends ExactCopyField/RemainingLifetime acceptance below after its scoped gates; no deployment certification is implied.

| Component | Design source | Required states | Registration |
|---|---|---|---|
| ScreenFrame | `docs/features/short-live-path/screens.md:26` | neutral heading and bounded content | implemented, T4 (bootstrap evidence) |
| ActionButton | `docs/features/short-live-path/screens.md:27` | default, focus, disabled, busy | implemented, T4 (bootstrap evidence) |
| Notice | `docs/features/short-live-path/screens.md:27` | safe status and error announcements | implemented, T4 (bootstrap evidence) |
| TextField | `docs/features/short-live-path/screens.md:28` | persistent label, help, error, disabled | implemented, T4 (bootstrap evidence) |
| ExactTextArea | `docs/features/short-live-path/screens.md:28` | inert monospace text, label, help, error, disabled; no source/copy guarantee | implemented, T4 (bootstrap evidence) |
| SourceTextArea (creation adapter) | `screens.md:88–104` | exact source paste/edit/undo, retained validation/refusal/loading values | implemented, T13; `_audit/t13-creation-form.md`; no T16 copy claim |
| LifetimeControl | `screens.md:75` | default 60, synchronized exact 1–1440 minutes, pointer/touch hour assistance, native keyboard, retained invalid input | implemented, T13; `_audit/t13-creation-form.md` |
| ReadingCodeControl | `screens.md:77–88` | optional exact code, six-code-point/1024-byte bounds, unbiased local generation, disabled omission | implemented, T13; `_audit/t13-creation-form.md` |
| ShareConfirmation | `screens.md:125–170` | confirmed-only separate handover, no credential repetition, concealed neutral recheck, terminal local expiry/focus/announcement, empty new creation | implemented, T14; `frontend/src/view/widgets/ShareConfirmation.tsx`; `_audit/t14-share-confirmation.md` |
| RemainingLifetime | `screens.md:143–144,369` | service-derived HH:MM:SS, explicit UTC expiration, non-live ticks; display only, not authorization | implemented, T14; `frontend/src/view/components/RemainingLifetime.tsx`; `_audit/t14-share-confirmation.md` |
| ExactCopyField (handover scope) | `screens.md:161–170,370` | independent link/code pending/success/denial, exact source copy/manual fallback, guarded late callbacks, StrictMode replay | implemented, T14 handover only; `frontend/src/view/components/ExactCopyField.tsx`; `_audit/t14-share-confirmation.md`; no T16 recipient acceptance claim |
| ReadingGate | `screens.md:175–242` | neutral status/loading/concealment, explicit Show, exact bounded guesses, associated/focused safe errors, typed disclosure/terminal callbacks and concealed no-renderer fallback | implemented, T15; `frontend/src/view/widgets/SecretReader.tsx` (`ReadingGate` export); `_audit/t15-reading-gate.md`; existing reader composition preserved, no T16 completion claim |
| ExactCopyField (recipient scope) | `screens.md:244–292,370` | all three original strings, inert selectable display, separate exact clipboard submission, denied whole/partial manual fallback and field focus, pending/stale work, deadline guard, internal keyboard scroll at 360px | implemented, T16; `frontend/src/view/components/ExactCopyField.tsx`; `_audit/t16-read-unavailable.md`; extends T14 handover without replacing it |
| SecretReader (recipient composition) | `screens.md:244–292` | typed ReadingGate render boundary, explicit reading, empty-optionals-only omission, whole-response rejection, concealed return/fresh Show, local network-independent expiry, non-live focused countdown | implemented, T16; `frontend/src/view/widgets/SecretReader.tsx`; `_audit/t16-read-unavailable.md`; RemainingLifetime recipient reuse proven |
| UnavailableSecret | `screens.md:294–353` | distinct unknown/expired/future early loss, focused destination, safe expiry announcement, known timestamp, external-copy limits, blank new creation | implemented, T16; `frontend/src/view/components/UnavailableSecret.tsx`; `_audit/t16-read-unavailable.md` |

## Interaction and writing conventions

- Errors: inline safe notices, associated field help/errors and a focused error summary or relevant field. Never announce submitted content, codes or capability URLs.
- Empty states: plain-language guidance, never fabricated collections or recoverable history.
- Loading: explicit busy text and disabled duplicate actions. No automatic creation/disclosure retries.
- Validation: preserve exact entered values; use local validation for field-specific guidance, generic safe explanations for API errors with empty details.
- Copy: preserve original strings, offer eligible manual fallback when clipboard permission is denied, and never claim success from a pending or stale callback.
- Layout: labels above controls, actions wrap/stack, exact-text blocks scroll internally, no horizontal page overflow at 360 px.
- Focus: visible keyboard focus on every primary action; use native controls and explicit accessible names. Status and errors do not rely on color alone.
- Microcopy: English, matching approved wireframes; direct, neutral, and explicit about no recovery, server-readable processing and the limits of expiration.
- Confidentiality: neutral titles and metadata; no sensitive SSR, browser persistence, analytics, automatic destination fetching or rendered HTML from entered text.
- Eligibility: countdown is presentation, not authorization. Conceal sensitive content on lifecycle transitions and require neutral revalidation plus explicit Show before reading again.

## Verification status

The foundation was approved in conversation. T4 generic component, neutral-route, Docker build/lint/typecheck/unit and 360px Chromium keyboard/label/focus/busy checks passed; see the bootstrap audit. T13 creation interactions and source-preserving paste/edit/undo passed Docker Chromium checks; see `docs/features/short-live-path/_audit/t13-creation-form.md`. T14 guarded sender handover, exact link/code clipboard/manual fallback, mounted rechecks, local expiry announcement/focus and StrictMode replay passed full Docker Chromium checks; see `docs/features/short-live-path/_audit/t14-share-confirmation.md`. T15 neutral gate, typed callbacks/concealed fallback, exact bounded guesses, focused safe errors, 409 classification and fresh repeat Show passed scoped and full Docker Chromium gates; see `docs/features/short-live-path/_audit/t15-reading-gate.md`. T16 recipient exact field/clipboard/manual-selection and deadline guards, whole-response rejection, stale clipboard isolation, distinct focused unavailable states and blank restart passed Docker Chromium checks; see `docs/features/short-live-path/_audit/t16-read-unavailable.md`. Approved visual baselines, installed-browser lifecycle matrix, real phones and production verification remain pending.
