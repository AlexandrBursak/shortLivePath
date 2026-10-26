# T4 — frontend bootstrap evidence

Strict TDD, sequential single writer; no commits/pushes. GOOD RED: native component test failed `generic primitives must be implemented`; after minimal implementation it passed. Next GOOD RED `neutral route must exist: src/app/page.tsx`, then shells passed. Packaging regression GOOD RED required final `FROM runtime AS production`, then passed.

Pinned registry-inspected Next 16.4.2 / React 19.3.1 / TypeScript 6.0.3 / pnpm 11.5.2 / Node 24.17.0 / Playwright 1.64.1. Specific dependency builds approved, frozen install verified. ESLint 9.39.5 is deprecated upstream; inherited backend-compatible lint major retained, not an advisory waiver. Removed duplicate framework/plugin registration and fixed configuration warnings, without disabling layer rules.

Final executed in `frontend/`:
- `docker compose -p slp-t4-check --profile runtime --profile browser build web runtime browser` — exit 0; production Next build generated `/` and `/s/[token]`. Build log `/tmp/slp-t4-final-build.log` (ephemeral local log, no canaries).
- `docker compose -p slp-t4-check run --rm web sh -c 'pnpm test && pnpm lint && pnpm typecheck'` — 4/4 unit/component/architecture tests; lint zero warnings/errors; typecheck exit 0. Deliberate shared→app import rejected by `import/no-restricted-paths`, fixture removed in finally.
- `docker compose -p slp-t4-check --profile runtime up -d --wait web runtime` — standalone runtime healthy.
- `docker compose -p slp-t4-check run --rm browser` — 3/3 Playwright Chromium tests, 360×800; both neutral routes, zero API requests, zero app page/console errors; isolated primitive labels/Tab focus/visible outline/busy disabling/long-text overflow.
- Standalone runtime exact read-back: status 200 at synthetic `/s/…`, neutral guidance present, uid 1000, no Playwright package. Default Docker artifact is the production alias, not browser/tooling.
- `docker compose -p slp-t4-check --profile runtime down --volumes` — only test-owned resources removed.

Registered generic primitives: ScreenFrame, ActionButton, Notice, TextField, ExactTextArea. ExactTextArea is inert monospace presentation/editing, NOT a byte-exact clipboard/source adapter: native textarea normalizes CRLF. Original source preservation/paste/edit/copy tests remain T13/T16. No claim of code newline handling yet. No SSR data access, capability metadata, analytics/persistence or disclosure on navigation. Same-repository/neutral-SEO exceptions documented.

T4 establishes bootstrap only. Creation, service safety readiness, typed clients, hydration under final restrictive CSP, complete screen matrix, installed Chrome/Firefox/real Safari T19, real phones, approved visual baselines, security review, actual production infrastructure and NFR targets remain unverified. Docker Chromium 156.0.8078.4 is not the installed desktop matrix or real mobile Safari. T21 user-reviewed 2CPU/768MiB and unchanged NFR-01 gap are preserved.

## Installed-Chrome favicon regression

Parent read-only installed Chrome155 found an automatic favicon404 absent from bundled Chromium navigation. GOOD RED `safe favicon route must exist`, then neutral SVG favicon route implemented. Rebuilt Docker web/runtime/browser: unit5/5, lint/typecheck clean, browser3/3 with explicit favicon200 + app console-error/pageerror capture; standalone exact favicon read-back200. Log `/tmp/slp-t4-favicon-build.log`. Parent subsequently reported rebuilt installed Chrome route checks passed; full T19 matrix still unrun and not claimed.
