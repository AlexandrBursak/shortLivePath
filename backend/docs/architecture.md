---
stack_profile: backend-adonisjs
language: "typescript"
package_manager: "pnpm"
build_cmd: "pnpm build"
test_cmd: "pnpm test"
lint_cmd: "pnpm lint"
migration_tool: "adonis lucid (node ace make:migration)"
frontend: ""              # N/A — the frontend is a separate repository
---

# Architecture — <project>

> **Authored, not generated.** SDD's `survey` reads this file (`docs/architecture.md`) as an
> authoritative input and reconciles its scan against it — it never overwrites it. The generated
> `docs/architecture-map.md` is survey's own output and records what *this* project does
> differently; the rules below are the RexSoft backend baseline and are not re-derived per project.
>
> Canonical detail lives in the `$rexsoft-backend` skill references — this file states the rules a
> feature must match and cites them; it does not restate the whole standard.

## Stack

- **Backend:** AdonisJS 7, TypeScript, pnpm — the repository root **is** the backend
- **Database:** PostgreSQL via Lucid ORM — the source of truth
- **Cache / queue:** Redis — cache and queue only, never a source of truth
- **Infra:** Docker Compose (api + postgres + redis + observability)
- **Docs:** Swagger / OpenAPI — authoritative, and the cross-repository contract
- **Monitoring:** OpenTelemetry + Prometheus / Grafana
- **Frontend:** Next.js in a **separate repository**, reached over HTTP

Local development runs in Docker Compose, the same model as the server deployment. Do not rely on
a locally installed Node, PostgreSQL or Redis for normal operation.

## Root structure

```text
./app            # controllers, services, models, validators, middleware
./config
./database       # migrations, seeders
./docker         # Dockerfiles, entrypoints, service configs
./compose.yml    # api + postgres + redis + observability
./.env           # local only; commit .env.example instead
```

## Layer flow — the invariant

```text
Controller  →  Service  →  Lucid Model
```

Service Layer pattern. Stated as prohibitions, because these are what a review looks for:

- **Controllers** validate the request, call a service, return the response. They must not contain
  business logic, SQL, Redis operations, or third-party integrations.
- **Services** own business logic, coordinate database and Redis work, call external APIs, and
  manage transactions.
- **Models** define relationships, scopes and serialization. They must not contain business
  workflows, call external APIs, or orchestrate.
- **Controller → Model directly** and **Controller → raw SQL** are both violations.
- **No Repository pattern by default** — services use Lucid directly. Introduce repositories only
  for multiple data sources, genuinely complex query abstraction, or to isolate domain logic from
  persistence, and record the reason.

### Mapping to SDD task layers

`tasks` uses a generic layer vocabulary; on this stack it resolves as:

| SDD layer | Here |
|---|---|
| `migration` | `database/migrations/` — paired up/down |
| `domain` | services: business rules, invariants, transactions |
| `infra` | Lucid models, Redis access, external API clients |
| `app` | controllers, validators, middleware, routes |
| `ports` | the OpenAPI surface and external integration boundaries |

There is no `ui` layer in this repository.

## Database rules

All schema change goes through a migration; rollback is always considered. `data-model` stages
paired `*.up.sql` / `*.down.sql` under the feature folder and `implement` promotes them into
`database/migrations/` — that staging step is SDD's, the conventions below are ours.

- Additive first, then backfill, then cleanup. **Never drop a column or table in the same
  deployment where code may still use it.**
- Back up before a destructive change; weigh lock time and table size on large tables.
- UUIDs for public identifiers; timestamps consistently; foreign keys for relational integrity
  unless there is a strong stated reason.
- Index what is frequently filtered, joined or sorted; unique constraints where the business rule
  requires uniqueness; avoid nullable columns unless null carries a clear meaning.
- Numeric for money-like values; `jsonb` only when the structure is genuinely flexible; prefer a
  normalized schema otherwise.
- No N+1; paginate large lists; transactions for multi-step writes; parameterized queries for raw SQL.

## The API contract

The public API is the **only** integration surface for the frontend, it is versioned, and the
OpenAPI spec is authoritative. `api` authors `docs/features/<slug>/contracts/openapi.yaml` on this
stack (a frontend repository consumes it instead).

Response envelope — fixed, not a per-project choice:

```json
{ "data": {}, "meta": {} }
```

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": [] } }
```

Every public endpoint is documented: params, query, body, responses, auth requirements, validation
errors, pagination. Reusable schemas for common entities; internal-only fields stay out of public
schemas; the spec stays in sync with validators and DTOs.

> **Where codes belong.** `VALIDATION_ERROR` and friends live in the contract, never in a spec's
> acceptance criteria — SDD's `specify` forbids status codes and error-code strings in AC text, and
> that rule and this envelope agree: the AC names the business-observable outcome, the contract
> names its wire form.

## Principles

- Monolith first; microservices only when justified.
- Domain-driven module separation.
- The backend stays **stateless**.
- PostgreSQL is the source of truth; Redis is cache and queue only.
- External integrations go through the service layer.
- Public APIs are versioned.
- Every business operation is traceable.
- Event-driven architecture preferred for async processing.
- Test business logic at the service level; keep controller tests minimal.

## Enforcement

The flow above is encoded in `eslint.layers.mjs`, installed from the baseline alongside this
document. Spread it into `eslint.config.mjs`:

```js
import layers from "./eslint.layers.mjs";
export default [ ...yourBaseConfig, ...layers ];
```

It enforces what is checkable from imports: a controller may not reach a Lucid model directly, a
model may not import a service, a controller, or middleware, and a controller may not import the
database, Redis or an HTTP client — those belong in a service.

Required dev dependencies: `eslint-plugin-import` **and `eslint-import-resolver-typescript`**.

> The resolver is not optional. Without it the path rule resolves nothing and passes silently, so
> the lint is green while the invariant is unguarded.

What imports cannot see — raw SQL written inline, an orchestration that lives in a model — stays a
review concern. The flow and the preset are one rule in two places; change them together.

## What this project does differently

<!-- FILL: the deltas only. If a rule above does not hold here, say so and why — an accepted
     exception with a reason is fine; a silent one is drift. Leave empty if there are none. -->

## Project specifics

<!-- FILL: domain modules, integrations, deployment notes, anything survey should treat as given
     rather than discover. -->
