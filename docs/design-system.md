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

Five generic primitives are implemented in `frontend/src/shared/ui/index.tsx` and registered after T4 gates. ExactTextArea means inert monospace presentation/editing, not a CRLF-preserving source/copy adapter; that requires T13/T16 proof. Feature-specific additions remain unimplemented under `frontend/src/view/`.

| Component | Design source | Required states | Registration |
|---|---|---|---|
| ScreenFrame | `docs/features/short-live-path/screens.md:26` | neutral heading and bounded content | implemented, T4 (bootstrap evidence) |
| ActionButton | `docs/features/short-live-path/screens.md:27` | default, focus, disabled, busy | implemented, T4 (bootstrap evidence) |
| Notice | `docs/features/short-live-path/screens.md:27` | safe status and error announcements | implemented, T4 (bootstrap evidence) |
| TextField | `docs/features/short-live-path/screens.md:28` | persistent label, help, error, disabled | implemented, T4 (bootstrap evidence) |
| ExactTextArea | `docs/features/short-live-path/screens.md:28` | inert monospace text, label, help, error, disabled; no source/copy guarantee | implemented, T4 (bootstrap evidence) |

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

The foundation was approved in conversation. T4 generic component, neutral-route, Docker build/lint/typecheck/unit and 360px Chromium keyboard/label/focus/busy checks passed; see the bootstrap audit. Full feature interactions, exact paste/copy, approved visual baselines, installed-browser lifecycle matrix, real phones and production verification remain pending.
