---
status: Accepted
owner: "Tech Lead"
reviewers: ["Product Owner"]
updated_at: "2026-10-26"
feature_size: M
ticket: null
---

# 0010 — Route staging directly through the existing Nginx Proxy Manager

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Product Owner explicitly approved simplifying staging by removing the inner nginx hop. This records the topology decision, not independent security review or a completed live migration.

## Context

Staging already terminates public HTTPS in an external Nginx Proxy Manager (NPM), then forwards to an application-owned nginx which splits API and frontend traffic. The second proxy is useful for self-contained local deployment but is not intrinsically required when the operator already manages NPM. Removing it must preserve the existing single-origin and single-trusted-peer contracts rather than silently relaxing forwarding-header, confidentiality or logging rules.

## Decision drivers

- Product Owner preference for fewer operational components and no unnecessary datastore restarts during application updates.
- Spec NFR-04: public HTTPS, no logged full Share links, no Secret/code persistence or request-bearing observability.
- ADR-0009: exactly one trusted immediate proxy supplies one sanitized literal client address; no public-spoofable forwarding context.
- SAD §§5/7/8: direct same-origin API routing, neutral Next renderer, private stores and private health/metrics.

## Considered options

1. **Keep NPM → inner nginx → API/frontend everywhere.** Self-contained routing/security configuration and one application ingress port, but duplicates the managed proxy hop on staging.
2. **Use NPM → API/frontend on staging; retain the standalone nginx variant.** Removes the redundant staging hop while keeping existing local tests and self-contained deployment usable; requires explicit NPM configuration and private upstream access controls.

## Decision outcome

**Chosen:** Option 2. Introduce a separate NPM-direct Compose overlay and scoped NPM routing configuration. Keep the existing standalone Compose/nginx path unchanged as an alternative, not a required hop in NPM-managed staging.

Public traffic remains `https://snap-link.rexsoftproduction.com`: `/api/` reaches the compiled Adonis runtime without stripping the prefix; other frontend paths reach the production Next runtime. Public `/health` routes, including metrics, remain unavailable. API and frontend upstream ports are bound only to an explicitly chosen private interface and must be restricted to NPM by Docker-aware network controls before publication. PostgreSQL, Redis and their volumes remain private and unchanged.

Pin the immediate peer actually observed by the API, accounting for the real network/NAT topology. NPM must replace client forwarding context with one canonical client address; preserve the existing backend's rejection of untrusted peers and malformed/multiple-address values. Do not infer the NPM peer from a hostname, application-host address or broad subnet, and do not change application identity policy to accommodate an unsafe default proxy configuration.

Move required routing, request/response buffering, retry/cache/referrer/header and confidentiality controls to NPM. Preserve Next's per-request nonce CSP instead of replacing it with a static policy that breaks hydration. Verify the active generated NPM configuration, not merely pasted UI settings. NPM may declare request-bearing log sinks outside custom locations: app/location log suppression is not proof that all host-level logs are safe. Disable or safely sink every relevant active log path and perform canary/error-path checks before live cutover; if that cannot be established, retain the existing route and report the blocker.

Use the existing Compose project name, metadata and API-owner volumes, address key, database password and namespace. Ordinary deployment rebuilds/recreates API/frontend with `--no-deps`; migrations are an explicit separate action when needed. Do not restart Redis or PostgreSQL, rotate keys, remove volumes, run a new material generator or remove unrelated/orphan services as a shortcut. Stop only the old inner proxy after the NPM-direct route is validated; retain a rollback route without resetting stores.

## Consequences

**NPM real-IP inheritance constraint.** For NPM acting as the direct edge, derive the forwarded client identity from the original socket address (`$realip_remote_addr`), not an inherited `$remote_addr` that global real-IP rules may already have rewritten from client-supplied `X-Real-IP`. Verify forged XFF/X-Real-IP/Forwarded inputs cannot change identity. If a CDN or other load balancer precedes NPM, review that explicit trusted chain separately; neither silently trust arbitrary headers nor claim the socket peer is necessarily the end user. No application trust relaxation is introduced.

**Positive**
- One fewer active proxy container in the NPM staging path.
- NPM owns public TLS and application routing in one place.
- Standalone local HTTPS verification remains available without external NPM.

**Negative**
- Two private upstream ports need verified NPM-only access controls; a private bind alone is not a complete firewall policy.
- Security configuration becomes dependent on the deployed NPM templates/version, host-level logging and managed settings; a local nginx fixture cannot certify those remotely.
- Directly publishing API upstream access makes `/health` and metrics private only if network restrictions and NPM public-route exclusions are both enforced.

**Neutral**
- No user-facing API/schema, application trust relaxation, datastore retention, code-hashing, cleanup or monitoring-attainment change is approved.
- The deployment transition is reversible; the original standalone proxy remains supported.
- The actual NPM source IP, network access restrictions, generated configuration and live browser behavior remain deployment inputs and verification gates. No remote deployment is performed by recording this ADR.

## Links

- Spec: [spec.md](../spec.md), AC-07/AC-08/AC-10/AC-11 and NFR-04.
- SAD: [sad.md](../sad.md), §§5/7/8/9.
- Related ADR: [0009](0009-keep-basic-limits-and-defer-exact-concurrent-quotas.md), retained trusted-address contract.
- Existing operations: [docs/operations.md](../../../operations.md).
