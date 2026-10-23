# Backend bootstrap (T3)

Build/test tooling and runtime are separate Docker stages. The runtime is installed
fresh with `--prod --no-optional` and starts compiled JavaScript directly as a
non-root user, without pnpm, source files, tests or the assembler/glob toolchain.
GHSA-vfj7-8cjw-p6xm (`braces@3.0.3`) remains visible in the build dependency audit;
no suppression, patched-version claim or general production approval is recorded.
The runtime's actual installed package inventory is audited separately without
advisory exclusions. See `../docs/features/short-live-path/_audit/bootstrap-backend.md`.

AdonisJS 7.6.0 / Node 24.17.0 / TypeScript 6.0.3 / pnpm 11.5.2.
Run from `backend/`:

```sh
sh docker/check.sh
```

This builds both locked images, starts test-owned tmpfs PostgreSQL/Redis, then runs
`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm smoke` in the build
stage. It starts the runtime's default CMD and waits for liveness, then injects
runtime checks through stdin (without shipping test files): absence of build tools,
complete installed-package npm advisory audit, native Argon2 hash/verification,
and the same real-store/HTTP smoke. Audit network/registry errors fail the check;
they never count as a clean result. This audit covers application npm packages,
not OS packages or the base image's global npm installation.
The deliberately invalid relative and package-alias controller/model imports must
produce `import/no-restricted-paths` diagnostics. A second smoke run deliberately
uses an unavailable PostgreSQL host and must fail. No skipped gate counts as passing.
The trap removes only this invocation's Compose resources. No production stores,
host database ports, external networks, `.env` files or backups are used. Credentials
in Compose are disposable synthetic fixtures, never deployment defaults.

`pnpm install --frozen-lockfile` runs inside the Docker build. Native Argon2 0.45.1
and SWC/resolver install scripts are explicitly allowed; versions and native artifact
integrity are fixed by the lockfile. All other native script approval is denied.
`pnpm start` is the build/test convenience command. The final `runtime` Docker target
uses `node build/bin/server.js` directly, with fresh production-only dependencies;
it never inherits the toolchain's pnpm installation or full node_modules tree.
The Compose `api` service explicitly targets `build`; `runtime` (profile `runtime`)
explicitly targets the independent final image. The default Dockerfile target is
`runtime`. Do not deploy the `build` target as the API runtime. Retest required native
and optional runtime integrations before adding dependencies: `--no-optional` is an
intentional boundary, not permission to drop a required integration silently.
T5 adds the metadata-only Lucid migration/model; no seeds. In an isolated test project use `node ace.js migration:run --force`. Do not execute rollback against real metadata without explicit authorization and a metadata-only backup. Staged SQL is preserved; preexisting unmanaged tables fail promotion. Evidence: `../docs/features/short-live-path/_audit/lifecycle-migration.md`.

Only internal `/health/live` and `/health/ready` routes exist; no Secret route is
installed. Without both `SLP_NAMESPACE` and a restricted 32-byte binary key file at
`SLP_ADDRESS_KEY_FILE`, readiness remains503. Test fixtures provision synthetic
files only; no real deployment key or proxy configuration has been supplied.
With configured maintenance, readiness opens only after dedicated PostgreSQL
advisory ownership, current-run Redis fencing, safe fresh time and cleanup. Lost
continuity requires a fresh >=60-second quiet interval. The500ms internal tick
has headroom under the unchanged1000ms eligibility-sample limit and bounded
indexed cleanup; PG outage continues deletion-only cleanup. Reconnect uses a
new dedicated connection and preserves the in-process clock trajectory.

The runtime entrypoint uses Linux `flock --no-fork` on `/run/slp-owner/api.lock`.
Every API start/replacement MUST share the same host-backed lock volume; the
Compose runtime service does so. Exit75 means another process still holds it,
including during SIGSTOP or abandoned native work. PG session loss alone does
not prove that native work has terminated. Do not bypass this wrapper, start
replicas with separate volumes, or deploy the build/test image. The benchmark
is not an API and uses its own ephemeral lock directory under its read-only
profile; hash parameters/resources and benchmark results are unchanged.

After lost/dirty registries or a changed kernel boot identity, bounded cursor
recovery discards uncertain payloads (early unavailability, never reconstruction)
and preserves surviving counter history until a fully fenced continuous quiet
window has elapsed. Clean same-key restarts and planned key rotation retain
surviving payloads and their immutable original expiry. Invalid marker schemas
or index types remain fail-closed; operational repair approval/evidence is not
implied by these implemented recovery cases. No metadata is deleted.

HTTP headers remain no-store/no-referrer. Request logging/exception serialization
remain disabled. Runtime security, full retention fault matrix, same-origin/TLS
wiring and production/mobile/performance approval are not implied by health200.

The Compose file is test-only. Redis uses no persistence, tmpfs, 256 MiB and
noeviction; PostgreSQL is tmpfs for isolation despite its future metadata-only
role. T17 owns the hardened deployment, proxy, TLS and host persistence exclusions.
Observability is deliberately deferred: future events must be aggregate allowlisted
fields, never request paths, addresses, bodies, verifiers, codes or Share links.
See `docs/architecture.md` for approved baseline exceptions.
