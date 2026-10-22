# AGENTS.md

## Project Instructions

This repository is the backend. The frontend lives in a separate repository.

- Backend: AdonisJS 7
- Database: PostgreSQL
- Cache and queues: Redis
- Observability: OpenTelemetry, Prometheus, and Grafana
- Infrastructure: Docker Compose
- Package manager: pnpm
- Stack profile: `backend-adonisjs`

The architecture this repository must match is `docs/architecture.md` — the root structure, the
Controller → Service → Lucid Model flow, the database rules and the API contract envelope. It is
authored, not generated: SDD's `survey` reads it as an authoritative input and reconciles its scan
against it, never overwriting it, and `design` then works from the generated
`docs/architecture-map.md`. Record a deviation in `docs/architecture.md` with its reason; a silent
one is drift.

Tests cite the acceptance criterion they cover in the case name — `it('AC-02: …', …)`; a citation on an enclosing `describe(` covers every case nested inside it. SDD's traceability gate (`validate_artifacts.py`) reads these names to link each criterion to the test that proves it.

Use `$rexsoft-backend` for backend implementation, review, debugging, architecture,
database, API, Docker, and observability tasks. Its references are under
`.agents/skills/rexsoft-backend/references/`.

Before changing code, inspect the repository README and existing package scripts.
Use Docker Compose as the canonical development environment. Keep the backend OpenAPI
specification synchronized with validators and DTOs, and preserve the response envelope
documented by the skill.

Never hardcode secrets or perform destructive database or Git operations without an
explicit recovery plan and user authorization.

<!-- FILL: project-specific rules, links, commands, and deployment notes. -->
