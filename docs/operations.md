# Same-origin operations (T17)

For staging with an existing external Nginx Proxy Manager, use the separate
[NPM-direct runbook](npm-direct.md) and `compose.npm-direct.yml` to route directly
to API/frontend without the inner proxy. The standalone topology below remains
supported. NPM-direct is locally verified, not deployed: actual peer/ACL, generated
logging and Access List checks are mandatory before live cutover (ADR-0010).

## Boundary and launch gates

This is deployment wiring, **not production approval**. One non-root HTTPS nginx
proxy routes `/api/` unchanged directly to one compiled Adonis runtime, and other
paths to a standalone production Next runtime. There is no Next API relay. Only
loopback HTTPS is published by default; public health routes return 404. Stores
have no published ports and join only the internal store network. The API also
joins the proxy network. Do not attach unrelated workloads to either network.

Before real launch, the operator must independently verify and record: actual
TLS/domain/certificate lifecycle; exact trusted proxy peer and routing; key custody
and restricted mounting; host **and VM** swap disabled or approved non-retaining
controls; host/container/VM core dumps disabled; memory-inclusive snapshots,
suspend images, hibernation and backups excluded; no external request/URL/body
collection or platform logs; metadata-only PostgreSQL backup scope and restore;
base-image/OS and application dependency review; independent security review.
Local tmpfs, `core=0`, logging disabled and synthetic TLS do not certify these.
Do not expose this loopback fixture publicly or treat a successful build as approval.

## Isolated synthetic start

Requires Docker Compose, Python and OpenSSL. No host Node/PostgreSQL/Redis or global
trust-store change is needed. Inspect existing networks and choose non-overlapping
subnets before starting; the generator's `10.217.17.0/24`, `10.217.18.0/24`, proxy
`10.217.17.254`, port `3447` are **synthetic examples**, not deployment identity.
The generator refuses an existing directory and emits only newly generated values.

```sh
python3 docker/synthetic.py /tmp/slp-t17-synthetic
# Normal locked builds (requires registry access):
sh docker/t17-compose.sh build
sh docker/t17-compose.sh up -d --no-build --wait --wait-timeout 200
curl --cacert /tmp/slp-t17-synthetic/tls/cert.pem https://localhost:3447/
```

For the locally retained, actually tested artifacts:

```sh
export SLP_API_IMAGE=slp-t3-test-85230-runtime
export SLP_WEB_IMAGE=slp-t17-production
sh docker/t17-compose.sh up -d --no-build --wait --wait-timeout 200
```

The runtime API retains its kernel `flock` wrapper and shared `api-owner` volume;
never bypass it, scale replicas or give a replacement a separate owner volume.
The `migrate` one-shot uses the same production image at its compiled `build/`
working directory; successful migration precedes API admission. It has no web
owner and does not mount the address key. Migration failure blocks normal start.
The backend, not nginx, enforces the exact 524288-byte identity-only JSON wire
boundary so contracted 413/415 envelopes are preserved. nginx streams without disk
buffers or upstream retry; timeouts bound receive/connect/send/read waits. No
access logs are collected; nginx errors go to `/dev/null`; all six services use
Docker logging `none`. This intentionally sacrifices request diagnostics.

## Configuration and restart rules

Use an explicitly provided protected environment file; never read/copy an existing
credential file for this fixture. All required Compose variables use `:?` failure
checks. `docker/t17-compose.sh` fixes the disposable project name and an explicit
synthetic env file; do not use it against real deployments. The public origin must
be the **exact HTTPS origin**, including port and with no trailing slash. The
trusted proxy must be one literal immediate-peer IP. nginx overwrites XFF with the
socket address and clears `Forwarded`; do not append, trust a subnet, or enable broad
framework proxy trust instead. Keep the static proxy IP outside normal allocations.

Provision the address key as exactly **32 raw bytes**, regular file, UID1000-readable,
mode0600 (directory0700); it is not a hex string or environment variable. Synthetic
Docker Desktop mounts were verified as owner1000/readable by runtime UID1000.
Verify ownership explicitly on Linux before startup. Keep keys stable across normal
restarts; key/continuity loss requires the implemented >=60-second quiet recovery.
Do not turn missing readiness into a successful maintenance response or regenerate
keys to bypass recovery.

Changing a bind-mounted config file atomically can leave Docker Desktop reading
an old inode. Recreate the affected container and run `nginx -t`, rather than
assuming reload picked up a host edit. Preserve the API owner mount throughout.

## Internal health and retention

```sh
sh docker/t17-compose.sh exec -T api node -e "fetch('http://127.0.0.1:3333/health/ready').then(r=>console.log(r.status))"
sh docker/t17-compose.sh exec -T proxy nginx -t -e stderr
sh docker/t17-compose.sh exec -T redis redis-cli CONFIG GET maxmemory maxmemory-policy save appendonly shutdown-on-sigterm
```

Readiness is private. Start/recovery must establish ownership, dependencies, safe
PostgreSQL time and **all expired backlog cleanup before traffic**. A health200 alone
is not a functional or production sign-off; run the HTTPS smoke. Missing required
configuration/dependencies denies Secret traffic. Expired data is never released.
Physical erasure can be delayed during runtime/dependency outages or suspension
(ADR0004); do not claim a Redis-alone outage deletion deadline. Metadata persists
indefinitely. Redis has no persistent volume, AOF, RDB, shutdown save, slowlog or
latency collection; `/data` is tmpfs and `256mb/noeviction`. Never back it up, attach
a volume, enable snapshots, use MONITOR, or reconstruct payloads from metadata.

## Executable local checks

`docker/tests/test_wiring.py` checks packaging invariants. `operations.py` is a
**destructive synthetic-only smoke for project slp-t17**: it stops dependencies,
waits for one-minute expiration and checks recovery/headers/persistence. Do not run
it against other projects. It writes `/tmp/slp-t17-evidence/operations.json` after
each check and uses the retained test images above. `https-smoke.mjs` uses a
caller-specified `CA_FILE`, checks wire/HTTP outcomes, and optionally launches
Chromium (`BROWSER=1`). `browser-runner.cjs` supplies a test-only TCP tunnel from
browser-local localhost3447 to proxy8443, preserving actual end-to-end TLS and exact
origin without a global trust change. Node/curl validate the generated certificate;
Chromium's certificate exception is scoped to its disposable browser context.

See `_audit/t17-secure-wiring.md` under the feature for exact retained commands,
counts, image identity and initial failed attempts. These are T17 smoke checks,
not T18's comprehensive fault/canary work, T19's platform matrix, or T20 performance.

## Disposable cleanup only

```sh
sh docker/t17-compose.sh down --volumes --remove-orphans
# Remove only generated synthetic materials once no longer needed.
# Do not prune Docker networks/volumes/images or touch other projects.
```

For real metadata, never use `down --volumes`. Keep the owner lock shared across
replacement processes; read-only metadata backups must exclude sensitive data by
schema and verified contents, not just by convention. Synthetic evidence/images
can remain for independent verification; test keys/certificates must not become
real deployment material.


## T20 private aggregate instrumentation (implementation only)

See [monitoring configuration](../docker/monitoring/README.md) and
[isolated implementation/probe handles](../scripts/load/README.md).
The private `/health/metrics` endpoint is covered by the existing public health
exclusion; do not publish API/collector/Prometheus/Grafana ports or enable automatic
request/query/command logging/tracing. Metrics contain fixed aggregate enums/numbers
only. Configuration and deterministic unit checks are not installed alerting,
end-to-end throughput, deletion timing or monthly availability evidence. T19 is
closed by the Product Owner with explicit T23/T24 deferrals; T20 runtime/load
acceptance remains incomplete. Actual-host launch controls above remain.
