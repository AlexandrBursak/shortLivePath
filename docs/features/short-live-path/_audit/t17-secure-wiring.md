# T17 — Secure same-origin wiring: local evidence

## Verdict / ownership

**T17 COMPLETE FOR LOCAL SCOPE after renewed cleanup authorization and parent verification.**

Parent closure supersedes the historical cleanup-blocked handoff below. User explicitly authorized removal of only T17 test resources. Parent independently reran all 119 Chromium cases through the actual HTTPS proxy (119 passed; `/tmp/slp-parent-t17-browser-final.log`), plus 4 packaging tests, 24 unit tests, lint/typecheck and diff checks. The first parent browser run exposed a test-only race: the lifetime test edited fields after request capture but before refusal completed. It now waits for the retry control to become enabled; all original lifetime assertions are preserved. First run: 118 pass/1 fail, `/tmp/slp-parent-t17-browser.log`; final full run: 119 pass. No application code was changed for this harness correction.

Authorized cleanup removed the six Compose containers, separate regression-web container, exactly two project volumes and two project networks. The edge network was removed after its last owned regression container detached; inspection confirmed project `slp-t17` and zero endpoints. Exact project/name-filter readbacks returned no containers, volumes or networks. `/tmp/slp-t17-synthetic` and the two generated config snapshots containing synthetic env values were removed; code, images, nonsensitive evidence and other projects were preserved. Loopback port 3447 no longer accepts connections. T18 is newly authorized as a separate task; T19/T20 remain excluded. This closure is not production/host security approval.

### Historical handoff before renewed authorization
The cleanup tool call was explicitly denied. It did not run. No alternative deletion
was attempted. Required final cleanup/absence verification therefore remains open;
**do not mark T17 done or infer production approval**. Ownership returns to the
parent at T17; this agent did not start T18/T19/T20, change the tracker, commit,
push, switch branches, read ambient credentials, prune Docker or access production.

Read-only verification after denial found six `slp-t17` Compose containers (five
running/healthy plus migration exited0), `slp-t17-regression-web` running, volumes
`slp-t17_api-owner` and `slp-t17_metadata`, networks `slp-t17_edge` and
`slp-t17_store`, generated `/tmp/slp-t17-synthetic` still present, and loopback HTTPS
3447 still answering200. Cleanup requires renewed authorization, not a disguised
retry. Test-only keys/certificate/env are still there; do not use them for launch.

## Scope and files

- New `compose.yml`: one loopback HTTPS proxy, production standalone Next, one
  compiled/fenced API, one migration gate, private PostgreSQL and dedicated Redis;
  explicit subnets/static immediate peer; shared owner lock; core0, no-new-privileges,
  disabled Docker logs. PostgreSQL needs narrowly restored entrypoint ownership/
  privilege-drop capabilities; Redis runs as999 with owned tmpfs.
- New `docker/nginx.conf`: direct `/api/` routing, overwritten XFF, cleared Forwarded,
  public health404, TLS1.2/1.3, no request-bearing logs, no disk request/response
  buffering or retry, bounded timeouts, no-store/no-referrer on errors, nonce CSP
  forwarding with deny-all fallback for generated proxy errors.
- New `docker/redis.conf`:256MiB/noeviction, no AOF/RDB/shutdown saving, no slowlog or
  latency collection. `/data` is tmpfs; no persistent Redis volume.
- New `docker/synthetic.py`, `docker/t17-compose.sh`, `docker/tests/test_wiring.py`,
  `docker/tests/https-smoke.mjs`, `docker/tests/browser-runner.cjs`,
  `docker/tests/operations.py`, `docker/tests/startup.py`; new `docs/operations.md`.
- New `frontend/src/proxy.ts`: per-request nonce/strict-dynamic self-hosted CSP,
  forwarded to Next renderer and response. `frontend/src/app/layout.tsx`: dynamic
  rendering so a cached nonce-less shell cannot bypass hydration policy.
- Two **test-harness-only** changes to existing uncommitted frontend work, preserving
  surrounding changes/assertions: `frontend/tests/e2e/lifecycle.spec.ts` no longer
  manually duplicates real connectivity events emitted by `setOffline`;
  `frontend/tests/e2e/gate-matrix-t15.spec.ts` freezes the fake clock during TLS/SSR
  navigation and uses a fixed mocked service-time sample for its1120ms boundary.
  The1000+130ms late-response expiry assertions remain, without timing relaxation.
- No backend application source, API contract, lifecycle policy, scheduler, schema,
  UI feature or production Dockerfile was changed. An unused draft startup script
  was removed before final verification.

## RED → GREEN and real execution

Initial command `python3 -m unittest discover -s docker/tests -v` ran **4 tests,
4 expected missing-artifact errors**: `compose.yml`, `docker/nginx.conf`,
`docker/redis.conf`, `frontend/src/proxy.ts` did not exist. This was unimplemented
artifact RED, not a dependency/install failure. Final packaging run: **4/4 PASS**
(`/tmp/slp-t17-evidence/packaging.log`).

Application source was freshly copied and built using the retained installed
`slp-t16-web` toolchain (not represented as a fresh dependency installation):

```sh
docker build -f /tmp/slp-t17-evidence/Dockerfile -t slp-t17-production frontend
docker build -f /tmp/slp-t17-evidence/Dockerfile --target build -t slp-t17-tooling frontend
docker run --rm --network none \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  slp-t17-tooling sh -c 'pnpm test && pnpm lint && pnpm typecheck'
```

Initial and final fresh-source builds passed **24 unit tests, ESLint, TypeScript and
optimized Next production build**. Final mounted-test quality run also passed24,
lint and typecheck (`final-quality.log`; `frontend-final-build.log`). Backend was
unchanged; this task reused the parent's already-gated runtime rather than claiming
a new backend build or dependency audit.

Actual startup (after generating only new synthetic materials):

```sh
python3 docker/synthetic.py /tmp/slp-t17-synthetic
export SLP_API_IMAGE=slp-t3-test-85230-runtime
export SLP_WEB_IMAGE=slp-t17-production
sh docker/t17-compose.sh up -d --no-build --wait --wait-timeout 200
```

Final digest-pinned Compose startup passed (`pinned-up.log`); migration exited0,
API/web/stores healthy, nginx actual `-t` passed. Runtime inspection verified
UID1000 reads its owner1000 **32 raw bytes, mode0600** key. No key bytes are in this
report. Curl without CA failed60 (self-signed), while curl/Node with the generated
CA succeeded: no global trust modification.

Actual TLS + browser smoke:

```sh
docker run --rm --network slp-t17_edge -e BROWSER=1 -e CA_FILE=/ca/cert.pem \
  -v "$PWD/docker/tests:/smoke:ro" \
  -v /tmp/slp-t17-synthetic/tls:/ca:ro \
  -v /tmp/slp-t17-evidence:/evidence \
  slp-resume-ui-browser node /smoke/browser-runner.cjs
```

Final result: **22 response/header checks PASS**; create201 with exact configured
HTTPS share origin, neutral status, explicit disclosure, protected403, invalid422,
identity-only415, exact524288-byte chunked body accepted and overflow413, invalid
UTF-8/scalars rejected, backend unknown safe503, frontend404, proxy-rejected oversized
header400, public health404 (including encoded path), and forged/list/duplicate XFF
plus Forwarded overwritten successfully. Browser opened an actual created link:
neutral HTML/DOM contained no credential, **zero automatic disclosure POSTs**;
explicit Show produced one POST and exact synthetic credential. Hydration worked
with **0 console errors,0 page errors,0 CSP violations,0 external requests**.
Evidence: `https-final.log`, visually inspected `https-reading.png`.

Operational smoke:

```sh
python3 docker/tests/operations.py
python3 docker/tests/startup.py
```

Final **33/33 operational checks PASS** (`operations-final.log`, `operations.json`):
only proxy publishes loopback TLS; one API/shared lock (second owner exits75);
private stores; actual Redis config/mount inspection and no persistent files;
create succeeds while Next is stopped (direct routing proof); unavailable Next
returns proxy504 with confidentiality headers; direct untrusted peer denied503;
metadata-only schema; missing key prevents startup; PostgreSQL-down startup keeps
ready503 and creation/disclosure503; **positive expired index backlog observed
before PostgreSQL recovery, all due debt cleared before readiness reopened**;
expired410/status expired, unknown409, five wrong attempts then429; Redis-down
refusal, clean Redis restart loses synthetic marker, ordinary recovery; all six
Docker log collectors disabled. No assertion of physical erasure during outage.
Additional **4/4 startup checks PASS** (`startup-extra.log/.json`): missing mandatory
Compose inputs fail before startup, non-HTTPS origin prevents runtime startup,
Redis unavailable at API startup keeps ready503, normal recovery reopens without
fence/quiet-window bypass. Core0/read-only/image/port/log inspection is retained in
`runtime-manifest.txt` (no environment secrets).

**Full existing Chromium regression through final actual HTTPS proxy:119/119 PASS,
41.0s**, `chromium-https-verified.log`. Also119/119 passed against the same production
artifact over browser-local localhost HTTP (`chromium-final.log`). HTTPS invocation:

```sh
docker run --rm --network slp-t17_edge -e REGRESSION=1 \
  -v "$PWD/docker/tests:/smoke:ro" \
  -v "$PWD/frontend/tests:/home/node/app/tests:ro" \
  -v "$PWD/frontend/src:/home/node/app/src:ro" \
  -v "$PWD/frontend/tsconfig.json:/home/node/app/tsconfig.json:ro" \
  -v "$PWD/frontend/playwright.config.ts:/home/node/app/playwright.config.ts:ro" \
  -v /tmp/slp-t17-evidence/t17.config.ts:/home/node/app/t17.config.ts:ro \
  slp-resume-ui-browser node /smoke/browser-runner.cjs
```

The tiny retained config imports the normal Playwright config and sets only
baseURL `https://localhost:3447` and disposable-context `ignoreHTTPSErrors:true`.
The TCP tunnel preserves end-to-end TLS; independent Node/curl verify the cert.

## Retained artifact/evidence handles

All evidence below is local, synthetic and retained, **not committed**:
`/tmp/slp-t17-evidence/` contains the build Dockerfile, final logs above, screenshot,
Playwright overrides and runtime manifest. `/tmp/slp-t17-checkpoint.md` is the durable
handoff checkpoint. `compose.json`/`compose-final.json` still contain **generated
synthetic** env values because deletion was denied; no ambient credentials were
read. Treat those and `/tmp/slp-t17-synthetic` as pending cleanup material.

- `slp-t17-production`: `sha256:aaacc3f03f02e5bb33661afbb5229627d81c553c05d1cab3139e8fff2a442f2a`
- `slp-t17-tooling`: `sha256:051f357d5de33d9574494a3eb8b0ba228531f64cd599b03075082c4250fd2c95`
- `slp-t3-test-85230-runtime`: `sha256:665c6bf023b3cd84a231acb41af3b2392b1af9ab81b8ce2b93f8738e830af929`
- `slp-resume-ui-browser`: `sha256:ab8388869ab26eb3553518276d1ae1c11d4c30d95c1ef1008208997a920de1b5`
- nginx pinned `sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3`
- Redis pinned `sha256:9de71018be8413f419688ac34e19dbac432d1c6d9593d2ded99a82eebefeb18f`
- PostgreSQL pinned `sha256:979c4379dd698aba0b890599a6104e082035f98ef31d9b9291ec22f2b13059ca`

## Honest failures and corrections

- Dockerfile directly under shared `/tmp` hit an unrelated unreadable directory
  during Dockerfile transfer; moving the test Dockerfile into its own evidence
  directory fixed this. No permission bypass was attempted.
- Initial unquoted comma-containing tmpfs YAML split options into invalid mounts;
  quoted strings fixed it. Dropping all PostgreSQL entrypoint capabilities and
  unowned Redis tmpfs prevented startup; the explicit minimal controls above fixed it.
- Migration needed compiled `build/` cwd and no address-key config in its nonweb
  process; nginx needed all temp paths in writable tmpfs. Initial proxy IP .2
  collided with an automatically assigned web IP; .254 is now the literal peer.
- A Docker Desktop stale single-file bind inode made nginx reload read old/truncated
  config. Recreating proxy and actual `nginx -t` verified final config.
- Initial smoke harness expected unknown backend404 (actual safe503), proxy502
  (actual504), looked for button `Show` (actual `Show Secret`) and an unavailable
  pnpm-transitive package path. Corrected harness expectations to actual existing
  definitions, not app behavior.
- Initial browser regression setup used insecure `http://web` and stale mounted
  sources, producing clipboard/bundle harness failures. Correct localhost/fresh
  mounts fixed this. HTTPS exposed two pre-existing test nondeterminisms described
  above; final119 pass was after deterministic harness corrections, not skipped tests.
- Read-only source mount prevented a unit lint-probe file; writable fresh-source
  tooling build and tests-only mount passed all24 and both static gates.
- Intentional PG-down startup initially used Compose `start api`, which restarted
  its dependencies. Exact `docker start` plus actual dependency/readiness inspection
  made the corrected test genuinely exercise startup with PG/Redis down.
- **Final cleanup was denied**, not passed or silently skipped.

## Remaining limits / next owner

No host/VM swap, dump, snapshot, backup, production TLS/domain/key custody or
independent production security approval is certified; `docs/operations.md` lists
these launch gates. This is scoped T17 smoke, not comprehensive T18 fault/canary
verification, T19 installed browser/mobile matrix or T20 performance. Existing
unrelated user/frontend/docs changes remain in place. The parent owns tracker,
renewed cleanup authorization, final absence verification and any separate T18
handoff. This agent returns ownership and stops at T17.
