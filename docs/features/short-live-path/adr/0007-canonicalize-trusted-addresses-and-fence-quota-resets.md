---
status: Superseded by 0009
owner: "Tech Lead"
reviewers: ["Product Owner"]
updated_at: "2026-10-22"
feature_size: M
ticket: null
---

# 0007 — Canonicalize trusted addresses and fence quota resets

- **Status:** Superseded by 0009
- **Date:** 2026-10-22
- **Deciders:** Product Owner explicitly accepted ADR-0007 and ADR-0006 as starting values on 2026-10-22. Actual proxy addresses and runtime key material remain deployment inputs; no independent security review or executed fault-test approval is claimed.

Superseded by [ADR-0009](0009-keep-basic-limits-and-defer-exact-concurrent-quotas.md) on 2026-10-22. Original decision text below is historical: ADR-0009 inherits the non-quota controls and explicitly defers exact concurrent quota reservations.

## Context

DM-OQ-05 leaves proxy trust, address identity, HMAC custody and quota continuity unresolved. Office users intentionally share public addresses, so changing a header spelling, API process or HMAC key must not grant extra creation or wrong-code attempts. The deployment strategy already selects a single reverse proxy/API host and ephemeral Redis, excluding durable address records. This accepted policy separates address derivation from continuity recovery; T2 still owns executable clock, lease and generation-fencing protocols.

## Decision drivers

- Spec AC-07 and NFR-05: five failed verifications per rolling sixty-second link/address window and 25 successful creations per rolling sixty-second address window; shared NAT readers share those limits, not identities.
- SAD §§7/8: one HTTPS reverse proxy, one API process, private datastores; forwarded addresses are trusted only through an explicit proxy configuration.
- Spec NFR-04 and SAD §8: no raw IP logs/durable address records; keyed temporary pseudonyms, maximum five-minute retention and 10000 limiter-record cap.
- Data-model temporary admission state and T1: key rotation or Redis loss must not silently reset live quotas; no durable limiter backup may be introduced as a shortcut.

## Considered options

1. **Stable versioned HMAC labels plus a fenced quiet interval on continuity loss** — simple steady-state identity; disruptive recovery/rotation deliberately refuses traffic until old quota windows cannot overlap.
2. **Overlapping HMAC epochs with atomic checks against old and new labels** — can avoid rotation downtime, but duplicates temporary state, complicates the cardinality bound and still needs a recovery policy when Redis state is lost.
3. **Fresh process-local HMAC key with a mandatory fenced quiet interval on every API restart** — avoids persistent key custody, but pays the disruption on ordinary deploys even when Redis counters survived.

## Decision outcome

**Chosen:** Option 1, accepted as the initial implementation baseline. Keep one current HMAC key stable across ordinary API restarts; preserve surviving Redis quotas under the same label version. On unproven continuity, fence all previous mutation owners and wait out their possible sixty-second quota windows before reopening. A process-local timer alone is not proof that an old owner cannot still commit.

Accepted address boundary:

- Only the HTTPS reverse proxy may connect to the API listener. Pin the exact immediate peer address(es) in runtime configuration and enforce network reachability accordingly; do not trust an entire arbitrary private network or a user-controlled header. Actual Compose proxy addresses/network layout are NOT supplied, so deployment configuration remains a review blocker.
- The public proxy removes incoming `Forwarded`, `X-Forwarded-For`, `X-Real-IP` and equivalent identity headers, and overwrites a single `X-Forwarded-For` with its TCP peer's address. The API accepts exactly one literal address only from the pinned immediate proxy. Missing, multiple or malformed addresses, unexpected immediate peers, ports, zone identifiers and hostnames fail closed before allocating limiter state; never fall back to a supplied alternative header. Neutral health probes use a separate no-Secret path.
- No CDN, additional proxy or automatic hop-count trust is assumed. A future upstream proxy requires explicit topology/trust review; otherwise the public proxy's peer is the client network address by definition.
- Parse IPv4 into four binary octets, rejecting noncanonical textual IPv4 forms such as octal or integer shorthand. Map IPv4-mapped IPv6 to the same IPv4 identity; parse ordinary IPv6 into sixteen binary octets so compressed/expanded and letter-case spellings agree. Do not aggregate IPv6 subnets: one complete address is one identity. This preserves the approved per-address policy, with the explicit limitation that IPv6 address rotation can distribute attempts.
- Accepted label construction: `v1:` plus unpadded base64url of HMAC-SHA-256 over a domain-separated binary message: `slp/address/v1`, a zero delimiter, deployment namespace, a zero delimiter, family byte (4 or 6), then canonical address bytes. Validate the namespace as a nonempty restricted ASCII deployment identifier with no zero bytes. Creation keys and pair keys reuse the same address label; pair identity additionally uses the lifecycle UUID, never a raw link token.

Key custody and retention:

- Generate one independent CSPRNG 32-byte HMAC key per deployment; this is not the token digest algorithm, a Reading code or an encryption key. Supply it through a restricted read-only mounted runtime secret and typed configuration, not source code, image layers, command-line arguments or telemetry. The protected operator source may persist the key across API restarts but contains no client addresses/counters; key storage is not a backup of Redis or Secret payloads.
- Never print the key, pseudonyms, canonical addresses or address-bearing request headers in logs/traces. Raw addresses exist only transiently for connection handling/canonicalization. Limiter records remain ephemeral and subject to the existing five-minute bound and cardinality cap; HMAC labels are pseudonymous, not anonymous data.
- Rotation is explicit maintenance, not a timer that silently changes label identity. A lost key is a continuity-loss event even if Redis survives. No old/new label fallback may bypass limits.

Accepted continuity policy for T2 to make executable:

| Observation | Required behavior |
|---|---|
| API restart with same key/version and proven uninterrupted Redis state | Close readiness; fence old API work, run cleanup and reconcile reservations. Reuse existing counters; restart does not clear timestamps or grant fresh windows. Reopen only after T2 proves safe ownership/accounting. |
| Redis restart/reset, missing/corrupt safety registry, uncertain identity/continuity, lost key or planned rotation | Close Secret traffic, including creation and disclosure, and invalidate old mutation ownership. Continue executable cleanup. Do not treat empty counters as permission. |
| Continuity-loss recovery | Establish a verified fence after which no old request/native completion/connection can mutate accounting or publish payloads. Only then begin a continuous interval of at least 60 seconds with no admitted creation or verification. Repeated recovery/discontinuity restarts the interval. Reopen only after the interval AND cleanup/reconciliation/dependency/time checks pass. |
| Old-owner termination/fence or safe elapsed time cannot be established | Stay unavailable. Do not replace proof with a fixed sleep or free reservations merely because a lease expired. |
| Planned key rotation after safe quiet interval | Switch key version and retire obsolete limiter state through bounded cleanup. Retain unexpired payloads if Redis survived; key rotation is not permission to flush Secrets or durable metadata. |

The quiet interval starts after the last possible old quota mutation, not detection of failure or process launch. Requests rejected during it do not extend failure timestamps or secretly run hash work. If Redis lost payloads, PostgreSQL metadata still yields early-unavailable/expired states only after safe readiness returns; recovery does not reconstruct payloads. Retained address/pair state must still be removed within five minutes of last relevant activity. When cleanup can run during closed readiness, it continues; this decision does not weaken active-record deletion requirements.

Gate: affects proxy, middleware, Redis admission, cleanup/recovery and operations; multiple modules plus legitimate continuity alternatives meet the ADR threshold. Existing ADRs deliberately leave address policy open; no Accepted ADR is superseded.

Implementation/deployment verification obligations (not prerequisites for Accepted status):

- Pin actual proxy software/configuration, peer allowlist and private network reachability; inspect installed AdonisJS address/header APIs rather than assuming framework defaults. Exercise forged public headers, direct API attempts, malformed/multiple header values and proxy reconnects with synthetic addresses and no raw-address logging.
- AC-07/NFR-05 address vectors: equivalent IPv6 spellings and mapped IPv4 share one label; distinct complete addresses do not; one NAT shares quota; namespace/family separation is unambiguous; invalid inputs allocate no state. HMAC known-answer tests use disposable test keys only.
- AC-07/NFR-05 continuity vectors: same-key restart retains failures/successes; reset/lost key/rotation with recent failures stays closed through a safely fenced full window; old delayed hash/Redis completions cannot mutate the new generation; repeated reconnect/clock interruption restarts recovery. Verify exact window boundaries and five-minute retention without evicting active safety records at cap.
- Demonstrate that rotation with surviving Redis does not delete unexpired payloads, and Redis-loss recovery never restores them. Confirm aggregate metrics and proxy/API logs contain no test addresses, pseudonyms, codes or full links.
- T2 must provide actual generation storage, stale-owner mutation checks, authoritative/monotonic interval timing and missing-registry detection. Pin these transitions before executable feature tasks and run deterministic fault tests before launch; this ADR alone does not close DM-OQ-03/04 or prove deployment configuration.
- Product Owner accepted maintenance downtime, full-address IPv6 semantics and key custody as starting choices. T1 source-contract synchronization is complete; actual proxy configuration and security/fault verification remain implementation/deployment obligations. Address policy is accepted, not runtime-verified; no vector above has run.

## Consequences

**Positive**
- A client cannot choose a cheaper quota identity through forwarded header spoofing or equivalent address spellings.
- Stable keys preserve counter identities across normal API restarts without durable address/counter storage.
- Explicit fail-closed recovery avoids pretending missing Redis state means no recent failures or successes.

**Negative**
- Continuity loss and key rotation introduce at least a full quiet-window outage plus cleanup/fencing time, affecting the availability target and requiring product review.
- Key custody, proxy reachability and safe owner fencing become operational obligations; a wrong configuration blocks legitimate users.
- Shared NAT users still share limits; full-address IPv6 limits do not prevent address-rotation/distributed guessing.

**Neutral**
- HMAC is a privacy measure for transient limiter keys, not authentication, recipient identity or protection from live operator access.
- The quiet interval only addresses quota-window continuity; it does not prove reservation safety, expiration correctness or the cleanup bound without T2's protocol.
- No metadata schema, HTTP authentication scheme, durable limiter table, Redis backup or extra deployable is introduced.

## Links

- Spec: [spec.md](../spec.md), AC-07 and §6 NFR-04/NFR-05.
- SAD: [sad.md](../sad.md), §§4/6 S2 and S4/7/8/11.
- Model: [data-model.md](../data-model.md), DM-OQ-05 and temporary admission state.
- Task: [T1](../tasks/resolve-verifier-address-policy.md); dependency: [T2](../tasks/resolve-time-admission-protocol.md).
- Related ADRs: [0003](0003-use-server-readable-ephemeral-secrets-with-optional-reading-code.md), [0004](0004-scope-ephemeral-deletion-and-gate-recovery-before-serving.md), [0006](0006-bound-argon2id-reading-code-work-and-input.md).
