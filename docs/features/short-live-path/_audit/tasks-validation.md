# Tasks validation — short-live-path

## Scope and result

PASS for the structural documentation checks below. Size M, route standard. This does not make the package executable: DM-OQ-01…05 remain unresolved in the unchanged upstream model and Draft contract. T1/T2 are review/decision sessions; T3…T20 are blocked and transitively require both gates, followed by a refreshed task breakdown. No implementation, security approval or production action occurred.

## Verified checks

- 20 unique tasks and existing distinct markdown pointers; JSON matches frontmatter ID/title/layer/deps/acs/files_hint and named DoD text.
- All 13 spec ACs covered, including AC-11b. Every task includes its exact source Given/When/Then and a verbatim US block, with provenance signatures. Nine template sections are present and nonempty.
- Dependency DAG acyclic; blocks is the exact inverse; real independent backend/frontend scaffold branches exist. Shared source/route/canon overlaps are explicitly serialized lanes.
- All tasks estimated at <=8h, totaling 150h (18.75 person-days). Estimates and <=~500-LOC scopes require revalidation after security protocols/scaffolds are concrete; they are not delivery guarantees.
- Context budgets measured from Why through Acceptance criteria, including all nonempty lines. T16 has 143 lines and T19 has 134 lines; both explicitly justify L because exact screen/AC verification contracts must remain together. Other tasks are M (<=120 lines), with full task-local slices supplied so no mandatory upstream rediscovery is assumed.
- All quote chunks have source/section/identifier/verbatim-or-abridged signatures; fallback links resolve. Future planned source paths are labeled planned, not existing imports. Staged migration hints name the actual up/down pair; promotion is through installed Lucid, not raw SQL guessing.
- Mermaid structural lint matches every declared node/edge to tasks.json. Real mermaid-cli parse/render also succeeded: `Found 1 mermaid charts in Markdown input`, SVG generated successfully via `npx --yes --package @mermaid-js/mermaid-cli mmdc -i docs/features/short-live-path/tasks/_epic.md -o /tmp/short-live-path-tasks-mermaid.md` (exit 0). Throwaway outputs are not committed artifacts.
- All three endpoint methods/paths, response statuses, error literals and shared envelopes were compared with the saved OpenAPI, not invented. Internal maintenance has no public endpoint or worker/broker.
- git diff --check passes for tracked state. Because new files are untracked, the task validator separately checks trailing whitespace/final newlines on all generated task artifacts.

## Reproduce

    python3 docs/features/short-live-path/_audit/verify-tasks.py
    git diff --check

Mermaid command above needs Node/npm and browser support. The stdlib validator has no external Python dependency.

## Readiness and next gate

Resolve DM-OQ-01…05 with the recorded reviews described in T1/T2 and refresh this breakdown; do not dispatch implementation against current Draft snapshots. The browser/version/network/hardware measurement profile is still required before plan-tests (spec §8 / SAD §11). Establish the canon in T4 before feature UI. Standard-route forward handoff remains plan-tests, with an optional direct implementation skip only AFTER the decision/profile prerequisites and refreshed task tests are accepted. The user has not authorized tracker export, commit, push or deployment; none was performed.

## Artifact inventory

- tasks.json: machine DAG and task-body pointers.
- tasks/_epic.md and tasks/tracker.md: scope, readiness gate, graph and status.
- tasks/*.md: twenty self-contained task bodies.
- _audit/verify-tasks.py: reproducible structural validator.
- _audit/tasks-validation.md: this report.

Existing untracked API artifacts and screens.md were used as inputs and left unchanged; source spec/SAD/ADRs/model/migrations and application baselines were not modified.
