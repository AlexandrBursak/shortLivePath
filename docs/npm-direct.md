# NPM-direct deployment (opt-in, not a live cutover)

The standalone `compose.yml` and `docker/nginx.conf` remain unchanged. Add
`compose.npm-direct.yml` **after** the base file to replace the active path:

```
browser HTTPS → Nginx Proxy Manager → private HTTP API:3333 / Next:3000
```

NPM owns TLS. Both app upstreams use **HTTP**, not HTTPS. The browser continues to
use the same exact public HTTPS origin and relative `/api/v1/...` routes; Next does
not relay the API. No monitoring stack is deployed by either definition.

## Release blockers — resolve BEFORE publishing ports

1. Inventory the existing server deployment, Compose project, images, volumes,
   env/key directories and complete ordered Compose file list. Preserve existing
   untracked `compose.npm.yml` / `docker/nginx.npm.conf`; do not overwrite them.
   User-confirmed hosts: app `192.168.10.233`, NPM `192.168.10.190`.
   Default NPM upstreams are `http://192.168.10.233:3000` and
   `http://192.168.10.233:3333`. The NPM host address is **not proof** of the
   immediate API socket peer after Docker NAT. `/var/www/shortLivePath` and project
   `slp-test` are prior staging context, not remotely inventoried in this change.
2. Install and independently test **Docker-aware NPM-only ACLs** on the new API/web
   published ports before starting them. Bind to an explicitly selected private
   host interface. Ordinary UFW rules alone may not filter Docker DNAT/published
   ports; use the platform's verified forwarding/DOCKER-USER/nftables or upstream
   network control. Test allowed NPM traffic AND refused other private/public
   sources. Private IP does not itself authorize a client.
3. Discover the **actual socket source IP seen by the API** for traffic originating
   from this NPM deployment and crossing these published ports. Use a separately
   isolated nonsecret listener or narrowly scoped packet metadata capture (no
   real application request payloads/URLs), and document the observation. Do not
   infer the source from NPM's container IP, browser IP, host IP or Docker NAT.
   `SLP_NPM_PEER` must equal that single observed peer. No trust CIDR/wildcard and
   no application trust relaxation. ACLs remain necessary even with peer pinning.
4. Inspect the **actual deployed NPM version/image digest and generated config**,
   not a GitHub `develop` template. The Advanced integration below is conditional
   on its generator omitting its default `location /` when a full default location
   is supplied. Duplicate locations or hidden regex routes fail the release.
5. **Logging is an unresolved live release gate.** NPM normally generates a
   server-level `error_log /data/logs/proxy-host-ID_error.log warn` before Advanced.
   An additional `error_log /dev/null` does NOT cancel earlier same-level sinks.
   Each snippet location suppresses inherited runtime error logging, but malformed
   requests can fail before location selection and retain a full Share URL in the
   generated server log. An operator must remove/replace that generated sink using
   a supported, version-specific persistent NPM template/config mechanism, inspect
   effective `nginx -T`, and prove it survives regeneration/restart. Also disable
   generated access logs/analytics and collectors at every hop. **Do not cut over
   if that cannot be demonstrated.** Advanced alone is not a zero-logging solution.

No `.env` credential dump, remote mutation or NPM UI certification was performed.
Local fixture evidence: [audit](features/short-live-path/_audit/npm-direct.md).
Architecture decision: [ADR-0010](features/short-live-path/adr/0010-route-staging-directly-through-nginx-proxy-manager.md).

## Nonsecret settings and rendering

Reuse the **same existing** project, env file, public origin, namespace, application
key, PostgreSQL password, address-key directory, `metadata` and `api-owner` volumes.
Do not rerun `docker/synthetic.py` on staging: it is test-only, not provisioning.
Add these nonsecret settings to that existing deployment configuration:

| Variable | Meaning |
|---|---|
| `SLP_BIND_IP` | explicit private host interface reachable only from NPM |
| `SLP_NPM_PEER` | exact observed immediate source IP at API socket |
| `SLP_NPM_API_PORT` | published API port (default `3333`) |
| `SLP_NPM_WEB_PORT` | published frontend port (default `3000`) |

Keep the old `SLP_PROXY_IP`, edge/store subnets and TLS settings: base interpolation
and rollback still need them. PostgreSQL and Redis have no published ports and no
changed service configuration. The overlay only adds app ports, pins the API peer
and puts the old proxy behind profile `internal-proxy`. Profiles do not stop an
already running proxy.

After installing the committed files on the server (a future reviewed commit/pull
or explicit file transfer; this local working tree is not yet installed there),
render with nonsecret CLI arguments, using the **same bind IP and ports** as Compose:

```sh
python3 docker/npm-direct.py --upstream-ip "$SLP_BIND_IP" \
  --api-port "${SLP_NPM_API_PORT:-3333}" \
  --web-port "${SLP_NPM_WEB_PORT:-3000}" > /tmp/slp-npm-advanced.conf
```

The CLI reads no environment/config/credentials. It rejects hostnames, whitespace,
newlines, semicolons, scoped addresses, wildcard/public/link-local IPs, invalid or
identical ports. It supports RFC1918/ULA and explicit loopback (only for co-hosted
NPM with verified reachability). Use IPv4 unless the exact IPv6 published/trust path
has been verified. Compose itself only checks required interpolation, not private
address semantics: run this validator **before** `up`; do not bypass it.

## Migration: retain stores and old proxy until route validation

Define two shell functions with the **existing** project/env path and file order.
The following is an outline: resolve variables from inventoried deployment state,
not a new synthetic env or guessed project. `OLD_FILES` below means the exact
previous `-f` argument list, including the existing old NPM overlay if used; adapt
these functions explicitly rather than treating it as a literal shell array.

```sh
# Example function form; replace /existing/... with inventoried paths.
old() { docker compose --env-file /existing/deployment.env -p EXISTING_PROJECT \
  -f compose.yml -f /existing/compose.npm.yml "$@"; }
direct() { docker compose --env-file /existing/deployment.env -p EXISTING_PROJECT \
  -f compose.yml -f compose.npm-direct.yml "$@"; }
```

Do not include the old NPM overlay in `direct` unless its exact merge has been
reviewed; it may re-enable/mutate the old proxy. Do not change project directory
or project name (both affect resource identities). Inventory exact store container
IDs and volume names/mounts before proceeding, without printing credentials.
Use `docker compose ... config --format json` only inside a redacting assertion
script; raw config prints secrets. Check active publishers are only API/web on the
validated IP/ports, trust peer is exact, store models/volumes match the old stack,
and the old proxy's config remains available for rollback.

```sh
direct build api web
# Existing deployment, no schema change: reuse completed migration container.
# DO NOT start/recreate migrate or stores merely because an overlay is new.
direct up -d --no-deps --wait api web
```

The API's first start can require the existing recovery quiet interval. Inspect
health without exposing request-bearing logs. `--no-deps` deliberately preserves
PostgreSQL/Redis and does not run migrations. A genuinely fresh installation needs
an intentional initial migration and key provisioning under a separate runbook;
it is not this migration. If the release changes the database schema, use the
approved migration/backup plan; the overlay alone does not require another run.
Read back store IDs, metadata/api-owner mounts and key/namespace continuity after
app replacement. Never reset/clean, `down -v`, remove volumes, prune, or use
`--remove-orphans`. No Redis restart: its data is intentionally volatile.

Keep the old proxy **running**. The API now trusts NPM, not the old inner proxy,
so old-path API requests can temporarily fail closed; schedule a maintenance
window. Record old NPM route and TLS settings for rollback before changing them.

In the existing NPM Proxy Host:

- Keep the exact domain, certificate and HTTPS/Force SSL behavior.
- Set default upstream to `http`, validated private host IP and web published port.
- Delete/disable **all Custom Locations** for this host; paste the **whole**
  rendered file in Advanced (it supplies `/`, `^~ /api/`, `^~ /health`, named error
  fallback). No trailing slash in API `proxy_pass`: `/api/` must not be stripped.
- Disable NPM Cache Assets, Block Common Exploits, WebSocket support and any
  optional feature generating regex/location or additional forwarding rules.
  Review HSTS/security header includes to avoid duplicate CSP or conflicting headers.
- **Access List gate:** this complete default location can suppress NPM's generated
  `_access.conf` / Access List and Basic Auth directives. Inventory the current
  host's Access List before saving. The local fixture is Publicly Accessible only;
  it does not certify an existing staging allowlist/Basic Auth policy. Do not change
  a protected host to Publicly Accessible to make this snippet work. Preserve and
  verify the exact policy in every explicit location using the deployed version's
  supported mechanism, including API, health and fallback paths, or block cutover.
  Anonymous application behavior does not prove that staging's outer access list
  is absent. Treat generated asset/exploit/HSTS features similarly; verify effective
  TLS redirect/HSTS behavior rather than assuming UI flags still apply.
- No `map` belongs in Advanced's server scope. The web response keeps the exact
  upstream nonce CSP at response time; proxy errors get a deny-all fallback.
- All routes overwrite XFF with one **original socket** `$realip_remote_addr` and
  clear Forwarded and X-Forwarded-Host; never append `$proxy_add_x_forwarded_for`.
  NPM v2.16.0's global realip settings trust private/CDN sources and can replace
  `$remote_addr` from incoming `X-Real-IP`; therefore `$remote_addr` is NOT safe
  for this direct-edge contract. Verify the deployed nginx has the realip module
  and that the original socket variable remains stable under forged X-Real-IP/XFF.
  If NPM is behind another CDN/load balancer, this snippet identifies that immediate
  client-facing socket instead: a separate explicit, verified identity design is
  required; do not start trusting arbitrary client headers.
  Reference: [NPM v2.16.0 global config](https://github.com/NginxProxyManager/nginx-proxy-manager/blob/v2.16.0/docker/rootfs/etc/nginx/nginx.conf).

### Mandatory actual-NPM acceptance gates

Before treating the edited host as accepted: run `nginx -t` **inside the actual NPM
container** using its real runtime config and inspect `nginx -T` locally (the full
config may contain unrelated sensitive hosts; do not upload/dump it). Confirm one
default location, no bypass regex/custom routes, no URI rewrite, expected upstreams,
exact single-XFF overwrite, nonce-preserving headers, buffering/temp files disabled,
and **no effective request-bearing server/prelocation or location log sinks**.
Record NPM image/version/digest and configuration mechanism. If save/reload fails,
restore the old route immediately. A generic nginx success does not certify NPM.

Use only synthetic canaries through the **real public HTTPS hostname**, verifying:
create201 → status available → wrong code403 → explicit disclosure200; `/health`,
`/health/ready` and encoded variants404; no-store/no-referrer; matching HTML/CSP
nonce with hydrated UI and no CSP errors; no double/multi-hop XFF trust; direct
untrusted socket spoof503; oversized/malformed headers and URLs; absent-upstream
errors; no buffering/temp artifacts. Search canary token/full synthetic Share URL
in every NPM generated access/error log, rotated logs, Docker logs and collectors
without printing those logs. Include prelocation parser failures and regenerate /
restart NPM, then repeat config and canary checks. Any full Share URL retention is
a blocker, not an accepted exception. Prove NPM-only ACL denial from a second source.
These gates require the operator's actual deployment access and peer observation.

Only **after** these checks and user acceptance, remove just the old proxy using
its **old Compose command** (not the profile-disabled direct command):

```sh
old stop proxy
old rm -f proxy
```

Read back that only the old proxy is gone and stores/owner volume are unchanged.
Do not remove the retained old config or TLS materials needed for rollback.

## Rollback without any store reset

In a maintenance window, restore old app trust and wiring using the old Compose
files/project/env (original `SLP_PROXY_IP`), preserving all keys and mounts:

```sh
old up -d --no-deps --wait api web
old up -d --no-deps proxy
```

Restore the recorded NPM route to the **old inner proxy's observed HTTP/HTTPS
scheme and port**, not an assumed TLS port; restore prior reviewed Advanced
configuration. Verify real HTTPS synthetic create/status/disclosure through that
path. Do not run migrate unless independently required by a schema rollback plan;
do not restart stores or delete volumes. Retain app images/config for reversal.

## Local verification

```sh
python3 -m unittest docker/tests/test_wiring.py docker/tests/test_npm_direct.py
python3 docker/tests/npm_direct_smoke.py
```

The smoke uses only retained images named in the script and a unique owned project,
synthetic keys/certificate/data, loopback ports 3369/3069/3469, and isolated subnets
10.219.71.0/24 + 10.219.72.0/24. Ensure these are free first. It reads no ambient
credential file, saves only nonsecret evidence and removes its exact owned
containers/networks/volumes/material. It tests a real external-NPM-like HTTPS nginx
boundary, adapting only the web upstream IP for separate fixture containers.
It is **not** actual NPM UI/generator/certificate or production ACL certification.
