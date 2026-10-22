---
status: Superseded by 0003
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0002 — Use a neutral Next.js server shell with browser-only Secret processing

- **Status:** Superseded by 0003
- **Date:** 2026-10-22
- **Deciders:** Product Owner during the design dialogue; coding agent documents acceptance. Independent security review is pending.

## Supersession

Product Owner explicitly withdrew operator-blind browser encryption and confirmed server-readable processing with an optional server-verified Reading code. ADR-0003 replaces this decision. The following text records the original decision, not current requirements; neutral shells and nonpersistent browser state are retained by ADR-0003.

## Context

ADR-0001 declares a responsive web frontend and backend service. The prescribed Next.js App Router baseline prefers Server Components, but spec NFR-04 prohibits transmitting plaintext Secrets, Reading codes or content-decryption keys to servers. Neutral page delivery must not silently become sensitive server rendering.

## Decision drivers

- Spec NFR-04 and §6.1 confidentiality boundary.
- AC-08 and ux-flows SCR-03 require explicit Show on a neutral page.
- NFR-06 requires mobile and keyboard access without a native client.
- Frontend architecture baseline permits Client Components for browser APIs, forms and interactive state.

## Considered options

1. **Neutral Next.js server shell with browser-only sensitive processing** — recommended and selected; Server Components contain no sensitive user input or keys.
2. **Static Next.js web client calling the API directly** — offered as a viable alternative without a production Next.js server; would require static-hosting route and configuration decisions.

Edit and defer were dialogue actions, not additional technical architectures.

## Decision outcome

**Chosen:** Option 1. Use Next.js for nonsensitive server-rendered shells and browser-only modules/Client Components for Secret entry, code entry, cryptography and copying. No plaintext Secret, Reading code or content-decryption key enters Server Actions, SSR, server-side API clients, request URLs or telemetry. Client API modules send only encrypted payloads and explicitly permitted metadata.

Sensitive application state remains in page memory. Do not persist drafts or sensitive state to localStorage, IndexedDB or service-worker caches. Reload loses unsaved input; repeat visits start at the neutral gate. HTTP caching and browser lifecycle handling require explicit implementation and verification; React state alone is not a complete retention control.

Gate: multi-module impact and legitimate hybrid/static alternatives; changing the browser/server boundary later affects security and integration tests.

## Consequences

**Positive**
- Matches existing Next.js conventions without exposing Secret processing to server rendering.
- Explicit browser boundary supports confidentiality and neutral initial/repeat reading.

**Negative**
- A production Next.js runtime remains an additional deployment unit compared with static hosting.
- Unsaved input is lost on reload; no automatic recovery or drafts.
- Server/client serialization, cache and telemetry boundaries must be tested for canary leakage.

**Neutral**
- Does not select a cryptographic suite, fragment format, storage engine or API endpoint contract.
- A malicious operator can still change delivered JavaScript; compromised devices and acquired copies remain outside guarantees.

## Links

- Spec: [spec.md](../spec.md), AC-08, NFR-04 and §6.1.
- SAD: [sad.md](../sad.md), §§2 and 4.
- Related ADR: [0001](0001-build-responsive-web-frontend-and-backend-service.md).
