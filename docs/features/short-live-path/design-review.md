---
status: ReviewedWithDeferrals
updated_at: "2026-10-22"
feature_size: M
route: standard
interview_depth: medium
---

# Design review — short-live-path

## Scope and readiness

Documentation-only design pass. The Product Owner resolved §§1–11 and the glossary follows CONTEXT.md. The SAD intentionally remains Draft: the owned technical decisions in §11 must be resolved before implementation begins; browser/network measurement profile precedes plan-tests and slider interaction precedes screens approval. No installed application, successful runtime/security test, production deployment or independent security approval is claimed. No Git commits or pushes were requested or made.

## Verified structural checks

- All twelve Arc42 sections contain content; no authoring placeholders remain.
- Four Mermaid diagrams (C4Context, C4Container and two runtime sequence seeds) parsed and rendered successfully with mermaid-cli and installed Google Chrome. All four generated SVGs were parsed as XML/SVG.
- Renderer execution: `PUPPETEER_SKIP_DOWNLOAD=true npx --yes --package @mermaid-js/mermaid-cli mmdc -i docs/features/short-live-path/sad.md -o /tmp/short-live-path-sad-check.md -p /tmp/short-live-path-mermaid-puppeteer.json` returned exit code 0 and reported four successful charts. Temporary output is not part of the repository.
- Five ADR files match the §9 index exactly: four Accepted, one explicitly Superseded by 0003. ADR-0004 amends retention; ADR-0005 amends durable metadata scope.
- All six current NFR target cells are quoted verbatim in §10, including the final creation limit of 25 successful creations per rolling sixty seconds per network address.
- Five explicitly accepted deferrals have matching §11 rows with owner responsibilities and due-stage triggers.
- JSON edit/spawn logs parse; local SAD links resolve; `git diff --check` passes.

Validation execution: `python3 /tmp/validate-short-live-path-design.py` returned PASS for twelve sections, four rendered diagrams, five ADR files, six verbatim NFR targets and five owned/logged deferrals. This is a documentation self-check, not proof of application behavior.

## Independent critic

A clean-context read-only critic completed review of the SAD, current spec/glossary/UX, all ADRs, edit/spawn logs and baseline architecture documents. Result: `NO_CONTESTED_DECISIONS` (zero findings). No finding required an amendment, revert or Product Owner override. The design-stage coherence/structural gate passes; this is not independent security approval or evidence of runtime correctness. The SAD remains Draft with five accepted owned deferrals, and implementation must not begin with their technical parameters guessed.

## Deliberate requirement revisions

- Server-readable processing over HTTPS replaces operator-blind browser encryption; optional Reading code remains. Link possession supports multiple readers with no recipient identification.
- Active-record deletion within sixty seconds applies while cleanup can execute. There is no physical RAM-erasure deadline during process/VM suspension or hang; expired records must be cleared before Secret traffic resumes.
- PostgreSQL keeps only minimal link lifecycle metadata indefinitely for now; Secret payload/code verifiers remain exclusively ephemeral in Redis. A known expired URL remains recognizably expired and the UI displays remaining lifetime.
- Creation quota is 25 successes per rolling sixty seconds/address, superseding earlier ten/one-hundred proposals. Other approved limits remain as recorded in SAD §§4/8.

## Next stage

`sequences short-live-path` on route standard: multiple actors and multi-step flows mean the sequence stage is applicable, not skipped. Expand the seed diagrams to full AC coverage and make the technical deferrals explicit inputs rather than guessed implementation decisions. No implementation handoff is authorized by this review alone.
