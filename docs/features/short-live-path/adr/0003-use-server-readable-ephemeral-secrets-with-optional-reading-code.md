---
status: Accepted
owner: "Tech Lead"
reviewers: []
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0003 — Use server-readable ephemeral Secrets with an optional Reading code

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly confirmed the simplified model and retention of the optional Reading code; coding agent documents it. Independent security review is not implied.
- **Supersedes:** ADR-0002; revises the original spec confidentiality boundary by explicit Product Owner decision.

## Context

The earlier design required browser encryption and keys hidden from the server. Product Owner clarified that the server may access retained content and that the same Share link can be sent to several people, then confirmed the proposed simpler model with the optional Reading code retained. The spec and UX prose are amended to match; expiration, exact text and no-sensitive-log/backup rules remain mandatory.

## Decision drivers

- Accepted product simplification and overnight implementation preference, without waiving expiration/erasure verification.
- US-01 through US-05: anonymous creation, repeated/concurrent reading and optional separate code.
- Revised NFR-04: HTTPS, no sensitive logs/analytics/backups or persistent Secret copies.
- NFR-03: immediate pre-release expiration check and scoped erasure as amended by ADR-0004: sixty seconds while Redis can execute cleanup, expired-record cleanup before serving after suspension/hang, no physical RAM-erasure deadline during suspension/hang.

## Considered options

1. **Operator-blind browser encryption with link-carried key material** — previously pursued; Product Owner rejected the need to hide retained content from the server.
2. **Server-readable ephemeral data, HTTPS and optional server-verified code** — proposed as the simpler model and explicitly confirmed.

These alternatives were viable before the Product Owner changed the confidentiality requirement. Removing the optional code was not approved.

## Decision outcome

**Chosen:** Option 2. AdonisJS may process Secret text and Reading codes over HTTPS. Use Redis as the ephemeral Secret store with persistence and Secret backups disabled; no Secret rows in PostgreSQL. The link has an unguessable random identifier, no recipient identity or list, and no client decryption key is needed. The same link/code may be given to multiple people; no read consumes it. The exact identifier format and verifier are resolved by subsequent design decisions.

Keep a neutral Next.js shell, browser forms/clipboard handling and typed API modules. Do not embed Secret content in server-rendered pages or cache it. Do not retain drafts in localStorage/IndexedDB/service-worker caches. Browser-only content cryptography and fragment-carried key material are not required.

The optional code is checked server-side before disclosure; no code means possession of the link suffices. The exact verifier, bounded request handling and temporary attempt controls remain unresolved. Check service time immediately before release and independently enforce the normal application's expiry-before-display/local-hide behavior.

Gate: changes contracts across frontend/backend, storage and security tests; reverses a previous security boundary with legitimate alternatives.

## Consequences

**Positive**
- Removes browser key distribution and code-derived content-encryption machinery.
- Lets the server validate the 64 KiB UTF-8 content limit and exact field requirements directly.
- Redis restart may safely lose unexpired Secrets; no recovery is promised.

**Negative**
- Server operators and an attacker with live server/Redis memory access can read retained content. This is explicitly accepted, not end-to-end encryption.
- No Redis TTL or persistence setting alone proves erasure through a suspended process/VM, swap, crash dumps, snapshots or outages. Infrastructure controls and failure tests remain design-approval blockers.
- Earlier availability loss is permitted; the deployment must not restore old Secret data.

**Neutral**
- Link and optional code are still credentials; HTTPS does not protect against the service itself.
- Captured Recipient copies cannot be revoked; external passwords and keys are unchanged.
- Redis-as-primary is an explicit feature exception to the baseline cache-only rule, not a project-wide change.

## Links

- Spec: [spec.md](../spec.md), §§1–2, AC-11, NFR-03/NFR-04 and §6.1.
- SAD: [sad.md](../sad.md), §§1–4.
- Related ADR: [0001](0001-build-responsive-web-frontend-and-backend-service.md).
- Superseded ADR: [0002](0002-use-neutral-nextjs-shell-with-browser-only-secret-processing.md).
