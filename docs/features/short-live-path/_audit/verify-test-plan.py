"""Check the test-plan document, not application behavior. Run with python3."""
from pathlib import Path
import json
import re

feature = Path(__file__).resolve().parents[1]
spec = (feature / "spec.md").read_text()
plan = (feature / "test-plan.md").read_text()
coverage = plan.split("## AC coverage\n", 1)[1].split("## Edge cases", 1)[0]
rows = [
    [cell.strip() for cell in line.strip().strip("|").split("|")]
    for line in coverage.splitlines()
    if re.match(r"\| AC-\d", line)
]
criteria = re.findall(r"^### (AC-\d+[a-z]?) \(", spec, re.M)
covered = {row[0] for row in rows}
error_acs = re.findall(
    r"^### (AC-\d+[a-z]?) \([^\n]+\) — (?:error|authorization)$", spec, re.M
)
levels = {
    "unit", "integration", "e2e", "contract", "load", "component",
    "visual-regression", "e2e-through-UI",
}
all_rows = [
    [cell.strip() for cell in line.strip().strip("|").split("|")]
    for line in plan.splitlines()
    if line.startswith("| ")
]
level_rows = [row for row in all_rows if len(row) == 4 and row[2] in levels or (
    len(row) == 4 and " + " in row[2]
)]
load = plan.split("## NFR validation (load)\n", 1)[1].split("## CI placement", 1)[0]
checks = {
    "all acceptance criteria have named coverage": covered == set(criteria)
        and all(len(row) == 4 and row[1] and row[3] for row in rows),
    "error and authorization criteria have dedicated rows": all(
        any(row[0] == ac for row in rows) for ac in error_acs
    ),
    "levels use the fixed vocabulary": bool(level_rows) and all(
        set(row[2].split(" + ")) <= levels for row in level_rows
    ) and all(set(row[2].split(" + ")) <= levels for row in rows),
    "no prescribed test tool or runner names": not re.search(
        r"\b(?:pytest|jest|vitest|playwright|cypress|selenium|storybook|"
        r"testcontainers|k6|locust|jmeter|mocha|japa|pact|chromatic|percy)\b",
        plan, re.I,
    ),
    "numeric NFR scenarios and non-load measurements are present": all(
        nfr in load for nfr in re.findall(r"\| (NFR-\d+) \|", spec)
    ) and all(token in load for token in (
        "10 operations/s", "120 s", "p95", "2 s", "60 s", "99.5%", "360 px",
    )),
    "size and route select the separate plan": (
        (feature / ".size").read_text().strip() == "M"
        and (feature / ".route").read_text().strip() == "standard"
        and "feature_size: M" in plan
        and "## Test plan" not in spec
    ),
}
print(json.dumps({
    "checks": checks,
    "passed": sum(checks.values()),
    "total": len(checks),
    "acceptance_criteria": len(criteria),
    "coverage_rows": len(rows),
    "dedicated_error_authorization_ids": error_acs,
    "uncovered": sorted(set(criteria) - covered),
    "scope": "Documentation only; no application, browser, security or load tests executed.",
}, indent=2))
raise SystemExit(0 if all(checks.values()) else 1)
