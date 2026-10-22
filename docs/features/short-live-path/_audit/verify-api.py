"""Structural checks only; not application tests.
Run: uv run --with PyYAML --with openapi-spec-validator --with jsonschema python3 docs/features/short-live-path/_audit/verify-api.py
"""
from pathlib import Path
import base64
import importlib.util
import re
import sys
from typing import Any

sys.dont_write_bytecode = True

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / 'contracts/openapi.yaml'
api = yaml.safe_load(CONTRACT.read_text())
validate(api)
checks = ['OpenAPI 3.1 specification validation: PASS']
schemas = api['components']['schemas']
operations = []
examples = 0


def resolve(node: Any) -> Any:
    if isinstance(node, list):
        return [resolve(x) for x in node]
    if not isinstance(node, dict):
        return node
    if '$ref' in node:
        assert node['$ref'].startswith('#/'), node['$ref']
        target = api
        for key in node['$ref'][2:].split('/'):
            target = target[key.replace('~1', '/').replace('~0', '~')]
        return resolve({**target, **{k: v for k, v in node.items() if k != '$ref'}})
    return {k: resolve(v) for k, v in node.items()}


resolve(api)  # Assert every reference resolves, including headers.
for name, schema in schemas.items():
    Draft202012Validator.check_schema(resolve(schema))


def validate_example(schema, value):
    Draft202012Validator(resolve(schema), format_checker=FormatChecker()).validate(value)


for path, item in api['paths'].items():
    for method, op in item.items():
        if method == 'parameters':
            continue
        operations.append(op)
        assert op['security'] == []
        assert op['x-user-stories'] and op['x-acceptance-criteria'] and op['x-sequences']
        assert 'description' in op and 'summary' in op
        for param in item.get('parameters', []):
            validate_example(param['schema'], param['example'])
            examples += 1
        for media in op.get('requestBody', {}).get('content', {}).values():
            assert media['examples']
            for example in media['examples'].values():
                validate_example(media['schema'], example['value'])
                examples += 1
        errors = 0
        for status, response in op['responses'].items():
            assert set(response['headers']) == {'Cache-Control', 'Referrer-Policy'}
            for media in response['content'].values():
                assert media['examples']
                for example in media['examples'].values():
                    value = example['value']
                    validate_example(media['schema'], value)
                    examples += 1
                    if status.startswith(('4', '5')):
                        assert set(value) == {'error'}
                        assert value['error']['details'] == []
                        assert value['error']['code'] in response['x-error-codes']
                        errors += 1
        assert errors
assert len(operations) == 3
assert len({op['operationId'] for op in operations}) == 3
checks.append(f'All local refs and {len(schemas)} component schemas: PASS')
checks.append(f'All {examples} operation parameter/request/response examples: PASS')

spec = (ROOT / 'spec.md').read_text()
stories = set(re.findall(r'^### (US-\d+):', spec, re.M))
acs = set(re.findall(r'^### (AC-\d+b?) ', spec, re.M))
covered_stories = set().union(*(set(op['x-user-stories']) for op in operations))
covered_acs = set().union(*(set(op['x-acceptance-criteria']) for op in operations))
assert stories == covered_stories
assert acs == covered_acs
report = (ROOT / 'contracts/api-sync-report.md').read_text()
for source in stories | acs:
    assert re.search(r'^\| ' + source + r' \|', report, re.M), source
checks.append(f'Bidirectional story/AC IDs: {len(stories)} stories and {len(acs)} criteria: PASS')

# Reconstruct exactly the operation/field origin projection from the reviewed generator mappings.
spec_module = importlib.util.spec_from_file_location('api_projection', ROOT / '_audit/generate-api.py')
assert spec_module is not None and spec_module.loader is not None
projection = importlib.util.module_from_spec(spec_module)
spec_module.loader.exec_module(projection)
assert projection.contract == api, 'Generator mappings drifted from the authored contract'
origin_rows = set(re.findall(r'^\| `([^`]+)` \| (.*?) \| (high|medium|low) \|$', report, re.M))
assert origin_rows == set(projection.rows)
assert all(confidence != 'low' for _, _, confidence in origin_rows)
checks.append(f'Exact operation-field origin table: {len(origin_rows)} rows: PASS')

# All proposed errors are both enumerated and exercised in operation examples.
used_codes = set()
for op in operations:
    for response in op['responses'].values():
        used_codes.update(response.get('x-error-codes', []))
assert used_codes == set(schemas['Error']['properties']['code']['enum'])
checks.append(f'Proposed error code registry coverage: {len(used_codes)} codes: PASS (no runtime registry yet)')

boundary_count = 0

def boundary(name, value, valid):
    global boundary_count
    errors = list(Draft202012Validator(resolve(schemas[name])).iter_errors(value))
    assert bool(errors) != valid, (name, value, errors)
    boundary_count += 1


for minutes in (1, 60, 1440):
    boundary('CreateSecretRequest', {'credential': 'test', 'lifetime_minutes': minutes}, True)
for minutes in (0, 1441, 1.5, '60', None, True):
    boundary('CreateSecretRequest', {'credential': 'test', 'lifetime_minutes': minutes}, False)
boundary('CreateSecretRequest', {'credential': 'test'}, True)
boundary('CreateSecretRequest', {}, False)
boundary('CreateSecretRequest', {'credential': None}, False)
boundary('CreateSecretRequest', {'credential': 'test', 'address': None}, False)
boundary('CreateSecretRequest', {'credential': 'test', 'reading_code': '😀' * 6}, True)
boundary('CreateSecretRequest', {'credential': 'test', 'reading_code': '😀' * 5}, False)
boundary('CreateSecretRequest', {'credential': 'test', 'reading_code': ''}, False)
boundary('CreateSecretRequest', {'credential': 'test', 'reading_code': None}, False)
boundary('CreateSecretRequest', {'credential': 'test', 'extra': 'no'}, False)
boundary('DiscloseSecretRequest', {}, True)
boundary('DiscloseSecretRequest', {'reading_code': 'x'}, True)
boundary('DiscloseSecretRequest', {'reading_code': None}, False)
boundary('NeutralGate', {'state': 'unknown', 'credential': 'fragment'}, False)
boundary('NeutralGate', {'state': 'available', 'expires_at': projection.X}, False)
boundary('ErrorResponse', {'error': {'code': 'short_live_path.code_incorrect', 'message': 'test',
                                   'details': []}, 'data': {'credential': 'fragment'}}, False)
boundary('ErrorResponse', {'error': {'code': 'short_live_path.code_incorrect', 'message': 'test',
                                   'details': [{'credential': 'fragment'}]}}, False)
checks.append(f'JSON Schema boundary/negative cases: {boundary_count}: PASS')

pattern = re.compile(projection.param['schema']['pattern'])
# Deterministic synthetic encodings prove all canonical tail classes and reject noncanonical tail bits.
for last in range(256):
    token = base64.urlsafe_b64encode(bytes(31) + bytes([last])).decode().rstrip('=')
    assert pattern.fullmatch(token)
for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-':
    token = 'A' * 42 + char
    decoded = base64.urlsafe_b64decode(token + '=')
    canonical = base64.urlsafe_b64encode(decoded).decode().rstrip('=') == token
    assert bool(pattern.fullmatch(token)) == canonical
checks.append('Canonical token padding-bit/32-byte encoding checks: PASS (256 encodings, all 64 tail symbols)')

# These are required declarative constraints, NOT claims of runtime validation.
assert schemas['CreateSecretRequest']['x-max-aggregate-utf8-bytes'] == 65536
assert schemas['CreateSecretRequest']['x-non-whitespace-fields'] == ['credential']
assert schemas['CreateSecretRequest']['properties']['lifetime_minutes']['default'] == 60
assert set(api['x-unresolved']) == {f'DM-OQ-0{i}' for i in range(1, 6)}
assert not api['security'] and 'securitySchemes' not in api['components']
assert 'Idempotency-Key' not in str([op.get('parameters', []) for op in operations])
events = (ROOT / 'contracts/events.md').read_text()
event_rows = re.findall(r'^\| (.*?) \| (.*?) \|$', events, re.M)[1:]
assert len(event_rows) == 12
assert 'no published domain events' in events
assert 'N,' in events and 'unresolved' in events
checks.append('Declared semantic constraints, five inherited blockers and twelve S7 maintenance branches: PASS')

summary = '# API validation — short-live-path\n\n'
summary += '## Results\n\n' + '\n'.join('- ' + check for check in checks) + '\n\n'
summary += '''## Reproduce

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
'''
(ROOT / '_audit/api-validation.md').write_text(summary)
print('\n'.join(checks))
print('Overall: PASS (structural checks only; draft finalization blockers remain).')
