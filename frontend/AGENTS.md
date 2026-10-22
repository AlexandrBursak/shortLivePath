# AGENTS.md

## Project Instructions

This repository is the frontend. The backend lives in a separate repository and is
reached through `API_URL` or `NEXT_PUBLIC_API_URL` as appropriate.

- Frontend: Next.js App Router
- Language: TypeScript
- Infrastructure: Docker Compose
- Package manager: pnpm
- Stack profile: `frontend-nextjs`

The architecture this repository must match is `docs/architecture.md` — the source root, the
layer dependency table, and the core principles. It is authored, not generated: SDD's `survey`
reads it as an authoritative input and reconciles its scan against it, never overwriting it, and
`design` then works from the generated `docs/architecture-map.md`. Record a deviation in
`docs/architecture.md` with its reason; a silent one is drift.

Tests cite the acceptance criterion they cover in the case name — `it('AC-02: …', …)`; a citation on an enclosing `describe(` covers every case nested inside it. SDD's traceability gate (`validate_artifacts.py`) reads these names to link each criterion to the test that proves it.

Use `$rexsoft-frontend` for frontend implementation, review, debugging, architecture,
API integration, Docker, responsive UI, and visual verification tasks. Its references
are under `.agents/skills/rexsoft-frontend/references/`.

Before changing code, inspect the repository README, package scripts, design source,
and existing component patterns. Use Server Components by default. Keep API access in
typed client modules and do not expose backend secrets or server-only session data to
the client bundle.

Do not invent missing product requirements, API shapes, content, or design tokens.

<!-- FILL: project-specific rules, links, commands, and deployment notes. -->
