# T3 — backend bootstrap evidence

## Result

Executable bootstrap and runtime-isolation gates PASS. The Product Owner selected
build/runtime separation as the dependency disposition. The vulnerable glob chain
is absent from the independently installed runtime; the build/tooling advisory
remains open and visible, not patched or suppressed. This resolves the T3 runtime
packaging blocker, not general security or production readiness. No Secret endpoint,
lifecycle implementation, migration or production deployment is claimed. No commit
or branch change was made. T21 and other application tasks were not implemented.

## TDD

Runner/package bootstrap preceded production source. Initial dependency setup failed
because pnpm required explicit native-build approval (`unrs-resolver`); this was a
harness/setup failure, not GOOD RED. Once the native-script allowlist was explicit:

```sh
cd backend
pnpm install --frozen-lockfile && pnpm test
```

GOOD RED: the runnable `AC-11: scaffold has an executable Adonis server and fail-closed
HTTP kernel` test failed at `tests/unit/bootstrap.test.mjs:6`:
`AssertionError: Adonis HTTP entrypoint must exist`, actual `false`, expected `true`.
The test compiled/executed and failed an assertion; no production entrypoint existed.
After implementation this exact test passes.

Native API discovery also found node-argon2 0.45.1 serializes PHC costs as `m,p,t`;
the test parses and checks the exact cost map rather than requiring an incorrect
serialization order. Salt/output lengths and correct/incorrect asynchronous verify
are checked separately. No verifier or code value is retained in this report.

## Verified commands and results

Canonical repeatable Docker command, from `backend/`:

```sh
sh docker/check.sh
```

Executed with exit 0 in test-owned project `slp-t3-test-25383`:

- `pnpm test`: 3 pass, 0 fail, 0 skipped, 0 cancelled. Native Argon2 profile,
  scaffold contract and layer-import proof all pass.
- Layer proof resolves BOTH an actual temporary relative model import and a
  package-alias model import from a virtual controller. Both must emit
  `import/no-restricted-paths`; a valid controller must produce zero errors. The
  temporary synthetic model is removed in `finally`.
- `pnpm lint`: exit 0, existing `eslint.layers.mjs` spread into active flat config,
  with `eslint-plugin-import` and `eslint-import-resolver-typescript` installed.
- `pnpm typecheck`: exit 0, strict TypeScript 6.0.3.
- `pnpm build`: exit 0, real `node ace.js build`, Adonis assembler 8.6.0.
- `pnpm smoke` / `pnpm test:integration`: 2 pass, 0 fail/skipped/cancelled.
  Real PostgreSQL query and Redis PING/config assertions pass. Compiled Adonis
  starts, liveness returns 200, readiness stays 503, and actual contract creation,
  status and disclosures paths return safe 503/no-store/no-referrer without logging
  the synthetic sensitive marker.
- Negative dependency probe, identical smoke with `PGHOST=unavailable.invalid`:
  intentionally exits 1 with `ENOTFOUND`; HTTP smoke still passes. The wrapper
  explicitly requires this failure, not a skip or fabricated availability result.
- Cleanup trap removed this invocation's stores/network. Earlier diagnostic project
  `slp-t3-bootstrap` was separately removed with project-scoped Compose down.
  No global prune, production store, host secret file or real input was used.

Initial Docker logging configuration used local logging with one retained file;
Docker 29.8 rejected that compression combination. Fixed to two bounded 1 MiB files
and reran the entire wrapper successfully. Initial server smoke correctly exposed
AdonisJS 7's required encryption driver config; supplied it with required external
APP_KEY, no committed fallback. Readiness remains intentionally closed regardless
of dependency health until T8 recovery/current-owner/time/cleanup work.

## Pins and local profile

- Node 24.17.0 bookworm-slim; pnpm 11.5.2; Adonis core 7.6.0;
  TypeScript 6.0.3 (compatible assembler peer range, not unsupported TS 7).
- argon2 0.45.1; package/native prebuild bytes are integrity-locked by pnpm-lock.yaml;
  native scripts are explicitly allowlisted. Async hash/verify exercised in Linux.
- Argon2id v19, 65536 KiB, timeCost 3, parallelism 4, 16-byte random salt,
  32-byte output. This is an API/build smoke, NOT T21 calibration.
- Container platform linux/arm64; api limits 2 CPUs and 768 MiB.
- Executed application image: `sha256:b0d0f4254198cd8f18d4747b78f983258e3f96d76ca7f8a670cbc1a4da23c0ca`.
- PostgreSQL 17.9-bookworm repository digest:
  `sha256:47f917f7409eacd22fc5dfb1dee634e1b55cf0c01d1a7eb701be2227a03e0641`.
- Redis 8.2.6-bookworm repository digest:
  `sha256:3055dc25265b0c19ec90a1756dad4e0faff6f79e2557a6ac3d1274e39ee906f6`.

## Initial dependency blocker and remaining build/tooling advisory

`pnpm audit --prod --json` exits 1: one HIGH, GHSA-vfj7-8cjw-p6xm /
CVE-2026-93687, `braces@3.0.3` recursive walker stack exhaustion. `pnpm why braces`
confirms the path through Adonis core/application -> assembler 8.6.0 ->
fast-glob 3.3.3 -> micromatch 4.0.8 -> braces 3.0.3. It is not dismissed because
pnpm labels the chain optional. The package is actually installed for build tooling.

Registry/advisory checks executed:

```sh
npm view braces dist-tags --json
npm view braces@3.0.4 version
curl -fsSL https://registry.npmjs.org/braces/latest
curl -fsSL https://api.github.com/advisories/GHSA-vfj7-8cjw-p6xm
```

Registry latest is 3.0.3; requesting 3.0.4 returns E404. Although npm audit suggests
`>=3.0.4`, GitHub's reviewed advisory reports `first_patched_version: null`.
No compatible published patched resolution exists in the registry at this check.
No nonexistent override, audit suppression, fabricated patch or silent dependency
removal was added. Current scaffold exposes no caller-controlled glob processing,
so the observed attack surface is build/tooling rather than a demonstrated HTTP
exploit; this does not constitute an approved risk acceptance for later deployment.

Initially this blocked T3 pending a reviewed disposition. The Product Owner then
explicitly chose build/runtime dependency separation, verified below. The build
advisory remains unpatched and is still reported by the original audit command.
No profile measurement or NFR attainment was fabricated.

## Verified build/runtime separation

The final Dockerfile target is `runtime`, based independently on the pinned Node
image, not on the build stage. `build` retains full development dependencies and
quality gates. `runtime-dependencies` performs a fresh locked
`pnpm install --prod --no-optional --frozen-lockfile`; the final stage copies only
these installed application dependencies, package metadata and compiled output.
There is no deletion-based hiding of a package from an earlier runtime layer.
Adonis core/application declare assembler as an optional peer; its build-time
resolution is not required to start the compiled HTTP application in this profile.

The final image runs `node build/bin/server.js` as `node` (uid 1000), with
NODE_ENV=production. It contains no pnpm, original app/start source, test directory,
TypeScript configuration, assembler, compiler, eslint, SWC or vulnerable
fast-glob/micromatch/braces chain. Compose explicitly selects `build` for test-only
`api` and `runtime` for the separately profiled runtime service. Deploying the
build target would invalidate this mitigation.

New regression tests in `backend/tests/runtime/dependencies.test.mjs` were first
run against the original single-stage image. GOOD RED: `@adonisjs+assembler must
not be installed in runtime`, actual true versus expected false. The full
installed-package bulk advisory test also failed on braces/GHSA-vfj7-8cjw-p6xm.
The same tests passed against the isolated runtime: 169 installed application npm
package names audited with zero returned advisories, no exclusions or severity
filter. The inventory comes from actual package manifests throughout the pnpm
virtual store, not just root dependencies or a filtered lockfile. Missing required
runtime packages or registry/network failure causes failure, not a clean result.

The reproducible `sh backend/docker/check.sh` wrapper now builds both targets,
runs all original build-stage gates, starts the actual default runtime command
and waits for liveness, then injects test scripts over stdin without shipping them.
Runtime checks also execute real native Argon2id hash/correct-and-incorrect verify
and the real PostgreSQL/Redis plus safe-HTTP smoke in production mode. Readiness
and Secret routes stay closed. Both build and runtime negative smoke probes with
an unavailable PostgreSQL host must fail; the wrapper itself succeeds only when
that expected failure occurs. Teardown remains test-project-scoped.

Runtime isolation final proving run: `sh backend/docker/check.sh` exited 0 in
`slp-t3-test-7326`. Build: 3 unit tests, lint, typecheck, build and 2 integration
smokes passed. Runtime: 2 isolation/advisory tests, 1 native Argon2 test and
2 integration smokes passed. Both missing-PostgreSQL probes failed as required.
The actual default runtime command reached healthy liveness before the checks.
Image inspected after execution:
`sha256:cf2b10f108cbb31d288c44816d54e434a267572039d8f5470c74dcd258d36930`,
user `node`, command `["node","build/bin/server.js"]`. Project-filtered container
and network listings were empty after teardown. A focused read-only review found
no concrete dependency-isolation issues; it did not certify the entire feature.

Scope: this verifies application npm dependency packaging and currently known
registry advisories, not all OS/global-base-image packages or all possible
vulnerabilities. The build advisory remains a tracked follow-up; no blanket risk
waiver, production approval, supply-chain certification, T21 calibration or full
feature security acceptance is implied. Future dependency additions must rerun the
runtime/native integration tests before omitting optional packages.
