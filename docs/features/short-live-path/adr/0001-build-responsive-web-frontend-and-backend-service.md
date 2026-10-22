---
status: Accepted
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0001 — Build a responsive web frontend and backend service

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner during the design dialogue; coding agent documents the decision. No independent security approval is implied.

## Context

Sender and Recipient require an anonymous browser experience on mobile and desktop. Browser interaction is separate from service-owned release deadlines and abuse controls; the server-readable confidentiality boundary is defined by ADR-0003. The repository prescribes Next.js and AdonisJS and the Product Owner approved keeping both applications in this checkout.

## Decision drivers

- Spec US-01 through US-05 and ux-flows.md SCR-01 through SCR-05.
- Revised NFR-04: HTTPS; server processing permitted, no sensitive logs/analytics/backups or persistent Secret copies. See ADR-0003 for the approved boundary change.
- NFR-03: service-controlled expiration independent of the Recipient wall clock.
- NFR-06: usable from 360 pixels wide, keyboard-operable primary actions.

## Considered options

1. **Declare web-frontend and backend-service** — one responsive browser interface and the supporting service; accepted by Product Owner.
2. **Revise the surface set before committing to it** — offered, but no concrete alternative set was requested or approved. This was a dialogue action, not a claim that an unspecified technical architecture was evaluated.
3. **Defer or reject the proposed set** — offered as dialogue actions and not selected. No additional architectural alternatives or rejected technologies are invented here.

## Decision outcome

**Chosen:** web-frontend and backend-service. Set these exact values in sad.md target_surfaces. Mobile browsers use the responsive web interface. No separate mobile-app, desktop-app, CLI, SDK or worker surface is introduced. Deployment topology, UI rendering strategy, cryptography and storage require separate decisions; this acceptance does not settle them.

Gate: multi-module impact and expensive rework of client/service responsibilities. The surface set follows upstream product requirements rather than an invented comparison with incompatible products.

## Consequences

**Positive**
- Browser interaction and server-side access/expiration enforcement have explicit responsibilities.
- One responsive interface covers the confirmed mobile and desktop flows.

**Negative**
- Two applications require a maintained API contract and coordinated checks/deployment.
- Confidentiality still depends on delivered client code and Recipient device security within the documented threat boundary.

**Neutral**
- A repository boundary is not a runtime or trust boundary. Both applications remain in one repository.
- Additional native clients would require separate scope and security review.

## Links

- Spec: [spec.md](../spec.md), §§4–6.1.
- UX evidence: [ux-flows.md](../ux-flows.md).
- SAD: [sad.md](../sad.md), §4 and target_surfaces frontmatter.
- Related ADR: [0003](0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md); supersedes the operator-blind boundary originally referenced here.
