# API validation — short-live-path

## Results

- OpenAPI 3.1 specification validation: PASS
- All local refs and 17 component schemas: PASS
- All 31 operation parameter/request/response examples: PASS
- Bidirectional story/AC IDs: 5 stories and 13 criteria: PASS
- Exact operation-field origin table: 101 rows: PASS
- Proposed error code registry coverage: 11 codes: PASS (no runtime registry yet)
- JSON Schema plus declared UTF-8-extension boundary cases: 36: PASS
- Canonical token padding-bit/32-byte encoding checks: PASS (256 encodings, all 64 tail symbols)
- Accepted T1 resource/refusal metadata and escaped JSON fit (399443 bytes): PASS
- Declared semantic constraints, three T2 blockers and twelve S7 maintenance branches: PASS

## Reproduce

uv run --with PyYAML --with openapi-spec-validator --with jsonschema python3 docs/features/short-live-path/_audit/verify-api.py

## Limits

OpenAPI/spec/schema validation and synthetic documentation examples only. No application exists;
no tests of running HTTP handlers, byte/whitespace/Unicode validators, body admission, PostgreSQL,
Redis, clocks, cleanup latency, browser clipboard/countdown, proxy behavior, backups, logging,
security or performance have been executed. Semantic requirements not expressible in JSON Schema
remain service/browser/infra tests. T1 initial policy is synchronized. DM-OQ-02/03/04 still block finalization; T21 calibration and T17/T18 proxy/security verification remain mandatory.

This verifier is the author-side structural check, not independent security approval.
Spectral is not installed/wired as a repository check target because no package/check target
exists. openapi-spec-validator and jsonschema ran in an isolated uv environment without adding
application dependencies or a manifest. The source spec was synchronized to Accepted ADR-0006/0007; migrations are unchanged.
