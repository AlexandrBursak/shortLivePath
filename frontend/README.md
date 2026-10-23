# Short-live-path frontend

Neutral bootstrap only; creation/status/disclosure arrive in later tasks. No sensitive server fetch, persistence or automatic disclosure. Same-repository service/contract exception: see docs/architecture.md.

Pinned Node 24.17.0 / pnpm 11.5.2. Canon: ../docs/design-system.md. Scripts use native Node test + tsx for rendered component contracts and Playwright Chromium for browser integration; not Vitest.

```sh
pnpm install --frozen-lockfile
docker compose -p slp-ui-check build web
docker compose -p slp-ui-check run --rm web sh -c 'pnpm test && pnpm lint && pnpm typecheck'
docker compose -p slp-ui-check up -d web
docker compose -p slp-ui-check --profile browser build browser
docker compose -p slp-ui-check run --rm browser
docker compose -p slp-ui-check down --volumes
```

`SLP_UI_PORT` overrides loopback port 3304. Browser tests use service-local port 3000; do not point them at arbitrary personal servers. No real values in screenshots/traces. The runtime Docker stage is standalone/non-root. Build/image checks are not a production security sign-off.

`ExactTextArea` is an inert, monospace presentation/editing primitive, NOT a source-of-truth exact-copy adapter. Native controls normalize line endings. Keep original scalar strings outside DOM, implement paste/edit/source adapters and test CRLF before feature acceptance (T13/T16); never copy from `textarea.value` as proof of original bytes. No exact-copy behavior is registered by T4.

Installed Chrome/Firefox/real Safari matrix is T19; Docker Chromium is not that matrix. Real iOS/Android, approved visual baselines and actual production launch controls remain outstanding.
