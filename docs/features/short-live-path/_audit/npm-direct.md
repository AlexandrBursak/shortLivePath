# NPM-direct local verification audit

Scope: opt-in overlay + nonsecret renderer + migration runbook. Base standalone
Compose/nginx and all application source remain unchanged. No SSH, live NPM/server
writes, commit/push, new NPM image build/pull, store resets or foreign cleanup.
Parent owns ADR-0010/SAD edits separately.

## Tests and real execution

- Scoped RED: `python3 -m unittest docker/tests/test_npm_direct.py` failed because
  the renderer/overlay were absent. GREEN implemented only those deploy boundaries.
- Follow-up RED: the original-socket XFF assertion failed against `$remote_addr`;
  switched both forwarded identities to `$realip_remote_addr` after independently
  reading NPM v2.16.0 global realip config. Cache/store-off assertions likewise
  failed before adding explicit server-scope `proxy_cache off; proxy_store off;`.
- `python3 -m unittest docker/tests/test_wiring.py docker/tests/test_npm_direct.py`:
  **9 passed** (all 4 existing wiring tests + 5 new renderer/overlay tests).
- `git diff --check`: passed (parent's concurrent SAD edits included in check).
- `python3 docker/tests/npm_direct_smoke.py`: first isolated run
  `slp-npm-direct-56883` completed real TLS/nginx/API/store checks, exit0;
  enhanced run `slp-npm-direct-62579` completed 34 checks plus 3 cleanup checks,
  exit0. Included force-recreated API/web, retained metadata/owner mounts and
  unchanged PostgreSQL/Redis container IDs; real nginx `-t`/`-T`; real HTTPS
  create/status/wrong-code/disclose, health404, nonce matching HTML, no-store /
  no-referrer, exact-peer trust and direct/published socket spoof refusal;
  Chromium hydrated and explicitly disclosed with zero console/page/CSP errors;
  frontend outage received deny-all CSP503 while API creation still returned201.
- Final `python3 docker/tests/npm_direct_smoke.py`, project
  `slp-npm-direct-68037`: **exit0, 39 total checks** (36 runtime/structural checks
  plus 3 cleanup checks). Effective `nginx -T` includes explicit cache/store-off
  and original-socket XFF. With inherited private-source `X-Real-IP` realip trust
  enabled, rotating forged X-Real-IP/XFF values produced the same captured original
  socket identity; five wrong verifications stayed403 and the next stayed429
  despite rotating spoofed identities. Real Chromium hydration/disclosure and all
  earlier TLS/API/privacy/store preservation checks passed again.
  Final readback confirmed zero project containers/networks/volumes, removed
  synthetic keys/env/cert directory and published listeners, and all previously
  running foreign containers preserved. Newly generated `docker/tests/__pycache__`
  was removed; the preexisting frontend test cache was preserved.

A preflight attempt (`slp-npm-direct-61712`) failed on a Docker network's null
IPAM Config before generating credentials or creating resources. Fixed to accept
null config lists, then exercised the full enhanced smoke successfully. The first
realip extension attempt (`slp-npm-direct-65861`) reached its echo capture before
that auxiliary listener was ready; its owned cleanup passed. Added a bounded
listener-ready probe and the final realip/quota run passed. The host
background shell prints unrelated gitstatus initialization warnings; successful
script exit codes and saved checks are the result, not shell cosmetics.

## Sanitized structural and provenance evidence

Compose was actually merged using a generated synthetic env in memory; raw merged
config was never printed or persisted. Assertions proved only active API/web
loopback publishers, exact NPM peer, byte-equivalent PostgreSQL/Redis service
models, and unchanged volume declarations. The fixture starts only its own stores;
this is not authorization to start/reset existing staging stores.

Retained image IDs (no pulls/builds):

| Role/tag | Image ID |
|---|---|
| API `slp-t19-followup-api:latest` | `sha256:4c959e9a855cc7a7ac6996bec6fcf22273b03c1878a1328ae7b5b0e11209aa74` |
| web `slp-t19-production:latest` | `sha256:246848edfef3aae6d1f564d0f2c6d8dcda23f5204f83123a4f493d32c81ef7c4` |
| nginx `nginx:alpine` | `sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3` |
| browser `slp-resume-ui-browser:latest` | `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5` |
| backend source/build `slp-prepush-backend-gates:latest` | `sha256:0a69e0930a956d42fee60b9ed8206132fd7aeaf6e31c1a07e43302e7d1744c67` |
| frontend source `slp-t19-followup-tooling:latest` | `sha256:5ffe418ccf505fa90d3f99d279d9c59ab3ecf3cd96febd17046fdc133bebbf19` |

Verified **47 current backend TypeScript source files** match the retained tooling
image; all **48 compiled backend JS files** match that tooling build and the
retained runtime. Current frontend `src/proxy.ts` matches retained frontend tooling
SHA256 `abee0c8b68feac3c8ccb36573c883eb130be32f109560321623b192be6c3c9c6`.
The complete frontend artifact was not rebuilt/reproducibility-certified; its real
production artifact was exercised with matching critical nonce-proxy source.
Source checkout at execution: `719aaf6da0f76f71248188570969e085e2659430` plus
uncommitted deployment changes described here. Full image/source hashes are in
`provenance.json`; no claim that a mutable image tag itself certifies provenance.

Nonsensitive retained evidence:

- `/var/folders/_d/lpng1wrn5hsdycfzhpylpbwc0000gn/T/slp-npm-direct-56883-evidence-gdu3tpfw`
- `/var/folders/_d/lpng1wrn5hsdycfzhpylpbwc0000gn/T/slp-npm-direct-62579-evidence-v9ytuj3i`
- **Final:** `/var/folders/_d/lpng1wrn5hsdycfzhpylpbwc0000gn/T/slp-npm-direct-68037-evidence-k9zheoqz`

Each successful run stores checks, rendered Advanced/config inspection, image /
source provenance and cleanup readback. Enhanced evidence includes `browser.txt`.
Synthetic env, address key, certificate private key and certificate directory are
removed; artifacts contain no credentials, payload responses or Share tokens.
Checkpoint: `/tmp/slp-npm-direct-checkpoint.md`.

## Boundary and live blockers

This is a **real nginx external-NPM-like HTTPS boundary contract smoke, not an
actual NPM UI/generator/certificate certification**. Fixture API/web have separate
private container IPs; only the frontend upstream IP is adapted from the production
single-host renderer output. The structural assertions independently validate the
production overlay and published ports; direct published-API spoof refusal is also
exercised. The fixture is publicly accessible within its owned isolated network,
not a proof of any unknown existing NPM Access List/Basic Auth behavior.

Actual NPM version/image/generated config must be inspected and `nginx -t` tested;
verify default-location suppression and no regex/custom bypass; preserve any
existing Access List; verify Force SSL and nonce policy. NPM's generated
server-level error log cannot be erased by adding another same-level sink; actual
persistent template/config correction and prelocation malformed-request canary
checks remain mandatory. No full Share URL logging exception is accepted.

User-confirmed app host `192.168.10.233`, NPM host `192.168.10.190` are not evidence
of the API socket's NAT-translated peer. Observe exact peer, install/test
Docker-aware NPM-only port ACLs **before publication**, preserve project/key/env/
namespace/owner/metadata, then validate public HTTPS synthetic create/status /
disclosure, UI and logging before explicitly stopping/removing only the old proxy.
No live cutover has been performed or approved by local test success.
