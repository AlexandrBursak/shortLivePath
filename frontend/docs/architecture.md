---
stack_profile: frontend-nextjs
language: "typescript"
package_manager: "pnpm"
build_cmd: "pnpm build"
test_cmd: "pnpm test"
lint_cmd: "pnpm lint"
frontend: "next.js app router"
migration_tool: ""        # N/A — the frontend owns no database
---

# Architecture — <project>

> **Authored, not generated.** SDD's `survey` reads this file (`docs/architecture.md`) as an
> authoritative input and reconciles its scan against it — it never overwrites it. The generated
> `docs/architecture-map.md` is survey's own output and records what *this* project does
> differently; the rules below are the RexSoft frontend baseline and are not re-derived per project.
>
> Canonical detail lives in the `$rexsoft-frontend` skill references — this file states the rules
> a feature must match and cites them; it does not restate the whole standard.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, pnpm
- **Backend:** AdonisJS 7 in a **separate repository**, reached over HTTP
- **Cross-repository contract:** the backend's OpenAPI specification
- **Infra:** Docker Compose; local dev runs the `web` service

The backend is not in this repository. Point the app at it via `API_URL` (server side) and
`NEXT_PUBLIC_API_URL` (browser), from `.env` with an `.env.example` committed. Backend secrets
must never reach a `NEXT_PUBLIC_*` variable.

## Source root

All frontend source lives under `src/`:

```text
src/
  app/                  # Next.js route layer — thin; composes data, metadata, layouts, widgets, forms
  data/                 # API access, DTOs, mappers, data hooks
  entities/             # domain types, enums, constants
  providers/            # application provider composition
  shared/               # reusable UI, hooks, lib, utilities, assets, styles
  view/                 # application UI blocks
    components/         # feature-level reusable UI components
    forms/              # form modules
    widgets/            # composed feature blocks
```

## Layer dependency rules — the invariant

Imports flow from higher layers to lower. **A lower layer must not know about a higher one.**

| Layer | May import from |
|---|---|
| `shared/` | no application layers |
| `entities/` | no application layers |
| `data/` | `entities/`, `shared/` |
| `providers/` | `data/`, `shared/` |
| `view/` | `data/`, `entities/`, `shared/` |
| `app/` | all layers |

Stated as prohibitions, because these are what a review looks for:

- `shared/` must not import `entities/`, `data/`, `view/`, `providers/` or `app/`.
- `entities/` must not import React, Next.js, API clients or UI modules — it is framework-free.
- `data/` must not import `view/`, `providers/` or `app/`.
- `view/` must not import `app/`.
- `providers/` must not import `view/` or `app/`.
- A component that needs a domain type belongs in `view/components/`, never `shared/ui/`.

This invariant is the one worth enforcing mechanically — see *Enforcement* below.

## Core principles

- Server Components by default. Client Components only for browser APIs, event handlers, local
  interactive state, forms, or client-side data hooks.
- Route files in `app/` stay thin.
- API calls, DTOs and mappers live in `data/` — never directly in UI components.
- Business/domain models live in `entities/`; business logic never lives in a React component.
- Design-system-like primitives live in `shared/`; product-specific UI blocks in `view/`.
- Prefer clarity over rigid structure when a small, explained exception makes the code easier
  to read.

## Enforcement

The table above is encoded in `eslint.layers.mjs`, installed from the baseline alongside this
document. Spread it into `eslint.config.mjs`:

```js
import layers from "./eslint.layers.mjs";
export default [ ...nextCoreWebVitals, ...nextTypeScript, ...layers ];
```

Required dev dependencies: `eslint-plugin-import` **and `eslint-import-resolver-typescript`**.

> The resolver is not optional. Without it the rule cannot resolve `../view/w` to a file, skips
> silently, and the lint is green while the invariant is unguarded — verified while building this
> preset, on TypeScript sources that violated four rules and reported nothing.

The table and the preset are one rule in two places — change them together.

## What this project does differently

<!-- FILL: the deltas only. If a rule above does not hold here, say so and why — an accepted
     exception with a reason is fine; a silent one is drift. Leave empty if there are none. -->

## Project specifics

<!-- FILL: domain modules, the design source, deployment notes, anything survey should treat as
     given rather than discover. -->
