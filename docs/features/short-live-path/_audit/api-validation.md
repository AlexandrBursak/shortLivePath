# API validation — short-live-path

## Results

- OpenAPI 3.1 specification validation: PASS
- All local refs and 17 component schemas: PASS
- All 27 operation parameter/request/response examples: PASS
- Bidirectional story/AC IDs: 5 stories and 13 criteria: PASS
- Exact operation-field origin table: 81 rows: PASS
- Proposed error code registry coverage: 9 codes: PASS (no runtime registry yet)
- JSON Schema boundary/negative cases: 25: PASS
- Canonical token padding-bit/32-byte encoding checks: PASS (256 encodings, all 64 tail symbols)
- Declared semantic constraints, five inherited blockers and twelve S7 maintenance branches: PASS

## Reproduce

uv run --with PyYAML --with openapi-spec-validator --with jsonschema python3 docs/features/short-live-path/_audit/verify-api.py

## Limits

OpenAPI/spec/schema validation and synthetic documentation examples only. No application exists;
no tests of running HTTP handlers, byte/whitespace/Unicode validators, body admission, PostgreSQL,
Redis, clocks, cleanup latency, browser clipboard/countdown, proxy behavior, backups, logging,
security or performance have been executed. Semantic requirements not expressible in JSON Schema
remain service/browser/infra tests. DM-OQ-01 through DM-OQ-05 still block finalization.

Independent review delegation was attempted but failed with provider HTTP 429 usage limit;
no independent review approval is claimed. This verifier is the author-side structural check.
Spectral is not installed/wired as a repository check target because no package/check target
exists. openapi-spec-validator and jsonschema ran in an isolated uv environment without adding
application dependencies or a manifest. No source specification or migration was edited.
