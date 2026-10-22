"""Derive the draft wire projection and field-origin report from reviewed source mappings.

Run with: uv run --with PyYAML python3 docs/features/short-live-path/_audit/generate-api.py
This is a reviewed projection, not a natural-language parser. Source changes require review
and reconcile of the mappings below. Never run over an existing contract: patch it instead.
"""
from pathlib import Path
import re
import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'contracts'


def field(kind, origin, confidence='high', **constraints):
    return {'type': kind, **constraints, 'x-origin': origin, 'x-origin-confidence': confidence}


def ref(name):
    return {'$ref': '#/components/schemas/' + name}


def obj(properties, required=None, **extra):
    return {'type': 'object', 'additionalProperties': False,
            'required': list(properties) if required is None else required,
            'properties': properties, **extra}


schemas = {}
schemas['Secret'] = obj({
    k: field('string', f'data-model.md §ephemeral_secret.{k}; spec AC-02/AC-03',
             description=('Exact UTF-8 text; no trimming, normalization or newline conversion. '
                          'Never interpret as HTML or automatically fetch/open an address.'))
    for k in ('address', 'login', 'credential')
})
schemas['Secret']['description'] = ('All three response fields are present; absent optional inputs become empty strings. '
    'credential is required and not whitespace-only. Sum of UTF-8 bytes of address, login and credential <= 65536. '
    'JSON Schema string length is NOT this aggregate byte limit. Revalidate stored records before release.')
schemas['Secret']['x-max-aggregate-utf8-bytes'] = 65536
schemas['Secret']['x-non-whitespace-fields'] = ['credential']
schemas['ReadingCode'] = field('string', 'spec AC-06/AC-07; data-model.md §ephemeral_secret.code_verifier input',
    'medium', description='Exact code, including Unicode, case and spaces. Never trim or normalize. '
    'Plaintext travels only in HTTPS request bodies and is never stored or echoed. The create-only minimum '
    'is six Unicode code points; disclosure accepts shorter guesses for normal verification accounting. '
    'Finite UTF-8/code/request bounds are unresolved under DM-OQ-01; omission of maxLength is NOT unlimited admission.',
    **{'x-unresolved': 'DM-OQ-01'})
schemas['CreateSecretRequest'] = obj({
    'address': {**schemas['Secret']['properties']['address'], 'default': ''},
    'login': {**schemas['Secret']['properties']['login'], 'default': ''},
    'credential': schemas['Secret']['properties']['credential'],
    'lifetime_minutes': field('integer', 'data-model.md §link_lifecycles.expires_at - created_at; spec AC-04/AC-05',
        minimum=1, maximum=1440, default=60),
    'reading_code': {'allOf': [ref('ReadingCode')], 'minLength': 6,
        'description': 'Omit to disable code protection; null and an empty string are invalid when provided. '
                       'At least six Unicode code points; no composition/complexity requirement.',
        'x-origin': 'spec AC-06; data-model.md §ephemeral_secret.code_verifier input',
        'x-origin-confidence': 'medium'},
}, required=['credential'])
schemas['CreateSecretRequest']['description'] = ('Same exact-text, required non-whitespace credential and aggregate '
    '65536 UTF-8 byte constraints as Secret. Omitted lifetime defaults to 60; never round or clamp. '
    'All inputs must be well-formed Unicode scalar text; reject lone surrogates instead of lossy conversion.')
schemas['CreateSecretRequest']['x-max-aggregate-utf8-bytes'] = 65536
schemas['CreateSecretRequest']['x-non-whitespace-fields'] = ['credential']
schemas['DiscloseSecretRequest'] = obj({'reading_code': ref('ReadingCode')}, required=[])
schemas['DiscloseSecretRequest']['description'] = ('Explicit Show only. Send {} for an unprotected link or when no code '
    'was entered; a protected link returns code_required. Supplying a code never enables protection on an unprotected '
    'link. A successful attempt grants only this response, not a session or future automatic disclosure.')
schemas['ServiceMeta'] = obj({'service_time': field('string',
    'sad.md S1/S3/S4/S6; spec AC-04/AC-10 service timing', 'medium', format='date-time',
    description='Authoritative service UTC instant sampled for this response, millisecond precision. '
    'Conservative monotonic client deadline must account for transit; do not use the device wall clock '
    'or assume the full expires_at minus service_time remains on arrival. Algorithm blocked by DM-OQ-03.')})
expiry = field('string', 'data-model.md §link_lifecycles.expires_at; §ephemeral_secret.expires_at_ms',
    format='date-time', description='Original authoritative UTC expiration, millisecond precision. Never extended by reads or retries.')
schemas['ShareLink'] = obj({
    'share_url': field('string', 'data-model.md §Token and digest representation; sad.md S1; spec AC-01/AC-06',
        'medium', format='uri', description='Absolute HTTPS URL on the configured public web origin: /s/{token}. '
        'token is 32 CSPRNG bytes in canonical unpadded base64url (43 characters). No code, Secret or UUID in URL. '
        'Treat the entire URL as a credential; never log it.'),
    'expires_at': expiry,
})
schemas['GateAvailable'] = obj({
    'state': field('string', 'sad.md S3 eligible gate; data-model.md §Lifecycle and failure semantics',
        'medium', const='available'),
    'reading_code_required': field('boolean', 'data-model.md §ephemeral_secret.code_verifier presence; sad.md S3'),
    'expires_at': expiry,
})
for name, state, origin in [
    ('GateExpired', 'expired', 'data-model.md §link_lifecycles.expires_at; sad.md S3'),
    ('GateEarlyUnavailable', 'early_unavailable', 'data-model.md §Lifecycle and failure semantics missing unexpired payload; sad.md S3'),
    ('GateUnknown', 'unknown', 'data-model.md §Token and digest representation and unknown lookup; sad.md S3'),
]:
    props = {'state': field('string', origin, 'medium', const=state)}
    if state != 'unknown':
        props['expires_at'] = expiry
    schemas[name] = obj(props)
schemas['NeutralGate'] = {'oneOf': [ref(n) for n in (
    'GateAvailable', 'GateExpired', 'GateEarlyUnavailable', 'GateUnknown')],
    'discriminator': {'propertyName': 'state', 'mapping': {
        'available': '#/components/schemas/GateAvailable', 'expired': '#/components/schemas/GateExpired',
        'early_unavailable': '#/components/schemas/GateEarlyUnavailable', 'unknown': '#/components/schemas/GateUnknown'}},
    'description': 'No Secret, verifier, internal UUID or digest. Terminal states remain HTTP 200 for neutral status; '
                   'the original web URL renders an explicit state, not a missing page. Invalid/corrupt records and '
                   'dependency uncertainty fail closed with 503, not guessed early loss or wrong code.'}
schemas['Disclosure'] = obj({'secret': ref('Secret'), 'expires_at': expiry})
for name, data in [('CreateSecretResponse', 'ShareLink'), ('NeutralGateResponse', 'NeutralGate'),
                   ('DiscloseSecretResponse', 'Disclosure')]:
    schemas[name] = obj({'data': ref(data), 'meta': ref('ServiceMeta')})

codes = {
    'short_live_path.invalid_request': 'Request shape, exact-text or lifetime/code constraints are invalid.',
    'short_live_path.creation_limited': 'Creation quota or in-flight address slots are occupied. Wait before trying manually.',
    'short_live_path.capacity_unavailable': 'Temporary storage, limiter or bounded work capacity is unavailable.',
    'short_live_path.service_unavailable': 'Service cannot safely complete the operation. No outcome is confirmed.',
    'short_live_path.code_required': 'Enter the separate Reading code.',
    'short_live_path.code_incorrect': 'Reading code is incorrect. The link has not been consumed.',
    'short_live_path.verification_limited': 'Verification slots for this link and address are temporarily occupied. Wait.',
    'short_live_path.link_unavailable': 'Secret is unavailable. Request a new Share link from the Sender; recovery is not available.',
    'short_live_path.link_expired': 'Share link has expired. External credentials and saved copies are not revoked.',
}
schemas['Error'] = obj({
    'code': field('string', 'API wire projection of sad.md S1-S4/S7 refusal branches', 'medium',
                  pattern=r'^[a-z_]+\.[a-z_]+$', enum=list(codes)),
    'message': field('string', 'spec AC-02/AC-05/AC-07/AC-09/AC-11b; sad.md safe refusal branches', 'medium'),
    'details': field('array', 'backend/docs/architecture.md §The API contract; sad.md §2/§8 error envelope',
                     'medium', items={'type': 'object', 'additionalProperties': False}, maxItems=0,
                     description='Always [] in v1. No submitted values, tokens, codes, fragments or internal diagnostics.'),
})
schemas['ErrorResponse'] = obj({'error': ref('Error')})
schemas['ErrorResponse']['description'] = ('Project envelope explicitly retained by Product Owner at the api stage, '
    'overriding the flat generic skill template. No success data/meta or sensitive details on any error.')

T = '2026-01-01T12:00:00.000Z'
X = '2026-01-01T13:00:00.000Z'
TOKEN = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
secret = {'address': 'server.example.test', 'login': 'test-user', 'credential': 'TEST KEY\n  synthetic line\n'}

def success(data):
    return {'data': data, 'meta': {'service_time': T}}


headers = {
    'Cache-Control': {'description': 'Required on every response, including refusals.',
                      'schema': {'type': 'string', 'const': 'no-store'}, 'example': 'no-store'},
    'Referrer-Policy': {'description': 'Never forward credential-bearing URLs as referrers.',
                       'schema': {'type': 'string', 'const': 'no-referrer'}, 'example': 'no-referrer'},
}


def response(name, description, examples):
    return {'description': description,
            'headers': {k: {'$ref': '#/components/headers/' + k} for k in headers},
            'content': {'application/json': {'schema': ref(name),
                        'examples': {k: {'value': v} for k, v in examples.items()}}}}


def failure(description, names):
    r = response('ErrorResponse', description, {n.rsplit('.', 1)[1]: {
        'error': {'code': n, 'message': codes[n], 'details': []}} for n in names})
    r['x-error-codes'] = names
    return r


def err(description, *names):
    return failure(description, ['short_live_path.' + n for n in names])


common503 = err('Temporary no-content refusal: unsafe readiness/clock, failed or uncertain store/accounting, '
    'corrupt metadata/payload/verifier, or bounded work exhaustion. Never claim unknown/expired/incorrect code '
    'from a timeout. Creation may have occurred: preserve input, never automatically retry or return a link.',
    'service_unavailable', 'capacity_unavailable')
param = {'name': 'token', 'in': 'path', 'required': True,
    'description': 'Share-link capability. Exactly 43 canonical unpadded base64url characters encoding 32 bytes. '
    'Decode and re-encode to enforce canonical padding bits before lookup. Never log raw URL/path/token, '
    'bind it to a person, or accept an internal lifecycle UUID. Malformed tokens are safe unknown states '
    'on neutral status, and link_unavailable on disclosure; stop before digest/store lookup.',
    'schema': field('string', 'data-model.md §Token and digest representation', minLength=43, maxLength=43,
                    pattern=r'^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$'), 'example': TOKEN}

paths = {
 '/api/v1/secrets': {'post': {
    'operationId': 'createSecret', 'tags': ['Secrets'], 'security': [],
    'summary': 'Create a temporary Share link anonymously',
    'description': 'Explicit creation only. Confirm 201 only after metadata, expiring payload and quota accounting '
    'are confirmed and readiness/deadline remain safe (S1/S2). No automatic retries, deduplication, history or '
    'Idempotency-Key guarantee. A manual retry is a new attempt with a fresh token/UUID and its own quota gates; '
    'possible earlier records retain original expiry. No code-generation endpoint: generation is browser-local '
    '(twenty unbiased CSPRNG Latin letters/digits). Successful-creation timestamp publication remains DM-OQ-02.',
    'x-user-stories': ['US-01', 'US-02', 'US-03'],
    'x-acceptance-criteria': ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05', 'AC-06', 'AC-11'],
    'x-sequences': ['S1', 'S2', 'S7'],
    'requestBody': {'required': True, 'content': {'application/json': {'schema': ref('CreateSecretRequest'),
      'examples': {'unprotected': {'value': secret},
                   'withCode': {'value': {**secret, 'lifetime_minutes': 60, 'reading_code': 'Test code 123'}}}}}},
    'responses': {
      '201': response('CreateSecretResponse', 'Confirmed creation only; code and payload are not echoed.',
           {'created': success({'share_url': 'https://example.test/s/' + TOKEN, 'expires_at': X})}),
      '422': err('Malformed JSON/schema, missing or whitespace-only credential, aggregate text over 65536 UTF-8 bytes, '
                 'invalid integer lifetime or enabled code shorter than six code points. No link.', 'invalid_request'),
      '429': err('25 successes per rolling 60 seconds/address, or reserved in-flight slots occupy allowance. '
                 'Preserve current form input; wait and retry only deliberately.', 'creation_limited'),
      '503': common503,
    },
 }},
 '/api/v1/secrets/{token}/status': {'parameters': [param], 'get': {
    'operationId': 'getSecretStatus', 'tags': ['Secrets'], 'security': [],
    'summary': 'Inspect a neutral gate without disclosing or consuming a Secret',
    'description': 'Safe repeat visits and resume checks (S3/S6). No request body or Reading code; example request '
    'GET /api/v1/secrets/' + TOKEN + '/status. Validate token before lookup. Malformed/unknown returns state unknown '
    'without fragments. Known expiration is recognized from retained metadata without reading payloads, while '
    'global readiness remains mandatory. Recheck deadline before classifying missing payload or releasing gate. '
    'Never verify codes, modify deadlines, promise later readability or embed Secret in neutral HTML/preview.',
    'x-user-stories': ['US-02', 'US-04', 'US-05'],
    'x-acceptance-criteria': ['AC-04', 'AC-08', 'AC-09', 'AC-10', 'AC-11', 'AC-11b', 'AC-12'],
    'x-sequences': ['S3', 'S6', 'S7'],
    'responses': {
      '200': response('NeutralGateResponse', 'Neutral gate or explicit unavailable lifecycle state; never Secret fields.', {
        'available': success({'state': 'available', 'reading_code_required': True, 'expires_at': X}),
        'withoutCode': success({'state': 'available', 'reading_code_required': False, 'expires_at': X}),
        'expired': {'data': {'state': 'expired', 'expires_at': T}, 'meta': {'service_time': X}},
        'unknown': success({'state': 'unknown'}),
        'earlyLoss': success({'state': 'early_unavailable', 'expires_at': X}),
      }), '503': common503,
    },
 }},
 '/api/v1/secrets/{token}/disclosures': {'parameters': [param], 'post': {
    'operationId': 'discloseSecret', 'tags': ['Secrets'], 'security': [],
    'summary': 'Explicitly show exact Secret text before expiration',
    'description': 'Only explicit Show triggers this request. No session, identity, consumption or view count; repeat '
    'and concurrent reading is permitted. Revalidate stored shape and authoritative lifecycle, reserve bounded '
    'pair/global hash-work admission before verification, and recheck payload/readiness/time after asynchronous '
    'work immediately before bounded nonstreaming release. Missing code is not a failed hash attempt. Wrong code '
    'returns only after failure accounting is confirmed; success releases only its slot, not previous failures. '
    'Check conservative monotonic deadline before display/copy; discard late or superseded responses, hide offline '
    'at expiry, conceal on background and require neutral recheck plus fresh Show on return. No automatic retries '
    '(they could spend verification allowance). Never claim remote erasure or external credential revocation.',
    'x-user-stories': ['US-03', 'US-04', 'US-05'],
    'x-acceptance-criteria': ['AC-03', 'AC-04', 'AC-06', 'AC-07', 'AC-08', 'AC-09', 'AC-10', 'AC-11', 'AC-11b', 'AC-12'],
    'x-sequences': ['S4', 'S5', 'S6', 'S7'],
    'requestBody': {'required': True, 'content': {'application/json': {'schema': ref('DiscloseSecretRequest'),
        'examples': {'withoutCode': {'value': {}}, 'withCode': {'value': {'reading_code': 'Test code 123'}}}}}},
    'responses': {
       '200': response('DiscloseSecretResponse', 'Eligible exact text; original expiration is unchanged.',
                       {'disclosed': success({'secret': secret, 'expires_at': X})}),
       '403': err('Missing required code, or incorrect code with confirmed failure accounting. No fragments or '
                  'permanent consumption.', 'code_required', 'code_incorrect'),
       '409': err('Malformed/unknown token or known unexpired missing payload. No recovery; request a new link. '
                  'Frontend uses neutral status to distinguish unknown from early loss; never auto-disclose.', 'link_unavailable'),
       '410': err('Known expiration at any check, including final pre-release check after correct verification. '
                  'Original web URL still renders explicit expiration, not a missing page.', 'link_expired'),
       '422': err('Malformed JSON, unknown fields, null/non-string code or invalid request shape.', 'invalid_request'),
       '429': err('Five failures per rolling 60 seconds/link/address, or reservations occupy remaining slots. '
                  'No hash, new failure timestamp, window extension, link-wide lockout or prior-failure reset.', 'verification_limited'),
       '503': common503,
    },
 }},
}

contract = {
 'openapi': '3.1.0',
 'info': {'title': 'short-live-path API', 'version': '0.1.0',
          'description': 'Anonymous, text-only credential sharing through temporary Share links, with repeated '
          'explicit reading before service-established expiration and an optional separate Reading code. '
          'No accounts, history, recovery, early removal, files or external credential revocation. Server-readable '
          'ephemeral Secrets are accepted; minimal lifecycle metadata remains durable. '
          'DRAFT: finite request/code resource limits, timestamp publication, clocks, admission/recovery and proxy '
          'continuity remain blocked by data-model DM-OQ-01 through DM-OQ-05; this is not an executable or finalized '
          'security contract. Sources: data-model.md; sad.md S1-S7; spec.md US-01-US-05 and AC-01-AC-12 (including AC-11b).',
          'x-status': 'Draft'},
 'servers': [{'url': '/', 'description': 'Same-origin API through the HTTPS reverse proxy; no production host invented.'}],
 'security': [],
 'tags': [{'name': 'Secrets', 'description': 'Public capability-based sharing, no account or Bearer/JWT authentication.'}],
 'x-source-documents': ['../data-model.md', '../sad.md', '../spec.md', '../CONTEXT.md'],
 'x-project-decisions': {
    'error-envelope': 'Product Owner retained {error:{code,message,details}} during api stage.',
    'authentication': 'ADR-0003/0005 and SAD §8: public capability token plus optional code; no BearerAuth.',
    'idempotency': 'S2/DM lifecycle semantics: no automatic retry, deduplication or HTTP Idempotency-Key. '
                   'S7 internal run identity does not add HTTP idempotency.',
 },
 'x-unresolved': ['DM-OQ-01', 'DM-OQ-02', 'DM-OQ-03', 'DM-OQ-04', 'DM-OQ-05'],
 'paths': paths,
 'components': {'headers': headers, 'schemas': schemas},
}

# Report every operation's reachable leaf fields, including each neutral-state variant.
def leaves(node, prefix, active=()):
    if '$ref' in node:
        name = node['$ref'].rsplit('/', 1)[1]
        if name not in active:
            yield from leaves(schemas[name], prefix, (*active, name))
    for keyword in ('oneOf', 'allOf', 'anyOf'):
        for i, branch in enumerate(node.get(keyword, [])):
            yield from leaves(branch, f'{prefix}.{keyword}[{i}]', active)
    if node.get('type') == 'object':
        for name, child in node.get('properties', {}).items():
            yield from leaves(child, prefix + '.' + name, active)
    elif 'type' in node:
        yield prefix, node.get('x-origin', 'API transport convention'), node.get('x-origin-confidence', 'medium')


rows = []
for path, item in paths.items():
    for method, op in item.items():
        if method == 'parameters':
            continue
        oid = op['operationId']
        for p in item.get('parameters', []):
            rows.extend(leaves(p['schema'], oid + '.path.' + p['name']))
        for media in op.get('requestBody', {}).get('content', {}).values():
            rows.extend(leaves(media['schema'], oid + '.request'))
        for status, r in op['responses'].items():
            for media in r.get('content', {}).values():
                rows.extend(leaves(media['schema'], oid + '.response.' + status))
            for header in r['headers']:
                rows.append((f'{oid}.response.{status}.header.{header}', 'sad.md §8 cache/browser headers', 'high'))
rows = sorted(set(rows))

report = '''# API sync report — short-live-path

## Scope and verdict

Size M, route standard (read from .size/.route). HTTP/REST backend-service is declared alongside
web-frontend in SAD frontmatter. data-model.md, sad.md and spec.md are present. No application,
manifest, live error registry, existing contract or check target exists in this repo.

DRAFT — wire projection is source-aligned subject to the explicitly inherited DM-OQ blockers below.
No implementation, security, performance, retention or runtime correctness is claimed by contract linting.
Source documents and migrations are unchanged. No commit is made.

## Resolved conventions

- Product Owner explicitly chose the existing project error envelope {error:{code,message,details}}
  instead of the skill's flat template. Success stays {data,meta}; details is always [] in v1.
- ADR-0003/0005 and SAD §8 prohibit account/JWT authentication. All three operations explicitly use
  security: []; no fictitious BearerAuth scheme or identity requirement is introduced.
- S2 and data-model lifecycle semantics explicitly exclude automatic retries/deduplication. No HTTP
  Idempotency-Key or fabricated TTL is added. S7's internal run identity is not a client idempotency API.
- URL versioning /api/v1 is the stage convention. /s/{token} is the neutral browser Share link route;
  reverse-proxy API requests go directly to AdonisJS. Never use internal lifecycle UUIDs as capabilities.
- No list/history, pagination, management/delete, recovery, generator, external-destination, readiness
  or public maintenance endpoint is justified by these stories. Such surfaces are not invented.
- No central error registry found: neutral short_live_path.* codes are contract proposals. Reconcile
  with the future backend registry and validators; this is not evidence of existing runtime constants.
- Async S7 maintenance is documented in events.md as internal triggers, not an external integration,
  message bus, persistent queue or fourth deployment surface.

## A. Field origins

Transport wrappers (data/meta/error), discriminator state and error code/message/details are explicit
API projections of cited source outcomes/conventions, not new stored columns. Reading code is an
input whose stored origin is its verifier; plaintext never becomes a model column. service_time is
computed, not created_at. High means direct matching model/convention; medium means derived wire
projection. No low-confidence field is silently assumed. Internal id, digest, schema version,
verifier, reservations, address labels and created_at stay off the public interface.

| schema_path | origin | confidence |
|---|---|---|
'''
report += ''.join(f'| `{p}` | {o} | {c} |\n' for p, o, c in rows)
report += '''
## B. Bidirectional drift checklist

1. ✓ Endpoint ↔ model (core): create writes LinkLifecycle plus ephemeral_secret/admission;
   status resolves lifecycle and inspects ephemeral availability/verifier presence; disclosure reads
   lifecycle/payload and updates only temporary verification admission. Permanent metadata is not
   removed on expiration. Browser-local copy/generation and internal cleanup need no new HTTP endpoint.
2. ✓ Error code ↔ repo (core, greenfield exception): no runtime registry exists; all proposed codes
   are enumerated in Error and used in response examples. Implement the same registry and reconcile.
3. ✓ Validation ↔ constraints (core, draft): integer lifetime 1–1440/default 60; canonical 32-byte token;
   aggregate text <=65536 UTF-8 bytes; credential not whitespace-only; create code minimum six Unicode
   code points; exact Unicode/spaces/newlines; millisecond UTC timestamps. Aggregate bytes, canonical
   decoding, stored-record consistency and clocks need service validators, not a misleading maxLength.
   The finite code/body limit is unresolved, not invented. No per-field byte or arbitrary URL/login
   format rule restricts valid Secret text. Null is not an alias for omitted optional text/code.
4. ✓ OpenAPI ↔ sequences (supporting): HTTP methods/statuses/field names are derived here; sequences
   intentionally use semantic messages. Mapping below covers service outcomes and distinguishes
   no-response/network loss and browser/internal branches from representable HTTP responses.

### User stories and acceptance coverage

| Source | Operations / outcomes | Non-HTTP responsibility |
|---|---|---|
| US-01 | createSecret 201/422/429/503 | Copy confirmed Share link; retain current form on refusal |
| US-02 | createSecret 201/422; getSecretStatus 200; discloseSecret 200/410 | Every minute choice, hour snapping, countdown |
| US-03 | createSecret 201/422; discloseSecret 403/429/503 | Local twenty-character secure generator; separate code handover |
| US-04 | getSecretStatus 200/503; discloseSecret 200/403/409/410/429/503 | Explicit Show; repeat/concurrent exact copy |
| US-05 | getSecretStatus 200/503; discloseSecret 200/410/503 | Expiry explanations; S7 deletion/recovery |
| AC-01 | createSecret 201; 422/429/503 issue no confirmed link | Copy only confirmed success |
| AC-02 | createSecret 422; CreateSecretRequest aggregate-byte/non-whitespace rules | Preserve entered valid text |
| AC-03 | createSecret 201; discloseSecret 200 Secret fields | S5 exact inert rendering and clipboard, no newline rewriting |
| AC-04 | createSecret 201/default 60; status/disclosure service_time + expires_at | S6 conservative monotonic timing; minute-level slider |
| AC-05 | createSecret 422; integer lifetime bounds | Explain bounds without clamping |
| AC-06 | createSecret 201/422; discloseSecret 200/403 | Local generator; nonblocking weak-code advice; no code in URL |
| AC-07 | discloseSecret 403/429/503 | Pair reservations and salted verifier; no consuming/rebinding link |
| AC-08 | getSecretStatus 200; discloseSecret 200 | Initial/repeat neutral page; no automatic Show or consumption |
| AC-09 | getSecretStatus 200 unknown/expired/early_unavailable; discloseSecret 409/410 | Original browser URL shows state, never a missing-page experience |
| AC-10 | discloseSecret 410/503 final check; status revalidation | S5/S6 late-response discard, offline hide, concealed resume |
| AC-11 | createSecret 503 uncertain outcomes; status/disclosure 503 recovery gate | S2 orphan expiry; S7 cleanup; infrastructure/log/backup canary audit |
| AC-11b | getSecretStatus early_unavailable; discloseSecret 409 | No recovery; ask Sender for new link |
| AC-12 | status expired; discloseSecret 410 | S6 guidance: no external revocation or recipient-copy erasure |

Every operation names at least one story and AC using x-user-stories/x-acceptance-criteria.
API responses support but do not themselves prove browser-only or infrastructure acceptance criteria.

### Sequence branch mapping (forward and back-feed)

| Source branches | HTTP mapping / explicit non-HTTP boundary |
|---|---|
| S1 code disabled/chosen/generated | optional reading_code; local generator, no generator endpoint |
| S1 content/lifetime/code invalid | createSecret 422 invalid_request |
| S1/S2 ready/clock/dependency unsafe | createSecret 503 service_unavailable |
| S1/S2 address quota/reservations occupied | createSecret 429 creation_limited |
| S2 payload/limiter/memory/work capacity | createSecret 503 capacity_unavailable |
| S1/S2 admission/preparation/metadata/payload/accounting failure or uncertainty | createSecret 503 service_unavailable; no link, no automatic retry |
| S1/S2 final eligibility unsafe | createSecret 503; no confirmed link even if orphan exists |
| S1/S2 confirmation eligible/received | createSecret 201 with Share link and service timing |
| S2 lost response or ended connection | No fabricated HTTP result; client outcome unconfirmed; manual retry is new attempt |
| S3 malformed token/unknown digest | getSecretStatus 200 state unknown; malformed stops before lookup |
| S3/S4 unsafe readiness/clock, failed dependency, invalid metadata | 503 service_unavailable, not wrong code or known loss |
| S3/S4 known expired, including after lookup or work | status 200 expired; disclosure 410 link_expired |
| S3/S4 missing unexpired payload | status 200 early_unavailable; disclosure 409 link_unavailable |
| S3/S4 corrupt/inconsistent payload/verifier | 503 service_unavailable; safe no-content failure, never code-disabled |
| S3 eligible gate | 200 available + reading_code_required + unchanged expires_at, no Secret |
| S3 late arrival, repeat visit | UI discards expired gate; starts neutral, never auto-discloses |
| S4 invalid body/request bounds | 422 invalid_request; concrete resource upper bound awaits DM-OQ-01 |
| S4 malformed/unknown token | 409 link_unavailable; malformed stops before lookup |
| S4 no required code | authorize only current request; final checks still mandatory |
| S4 required code absent/incorrect with confirmed accounting | 403 code_required / code_incorrect, no payload |
| S4 pair failures or in-flight slots occupy allowance | 429 verification_limited, no hash/window extension |
| S4 limiter/hash-work capacity exhausted | 503 capacity_unavailable, no expensive work or protection bypass |
| S4 reservation uncertainty, verifier internal error, accounting/completion failure | 503 service_unavailable, no fabricated wrong-code result |
| S4 correct code and confirmed completion | recheck payload/readiness/clock then 200/409/410/503, no durable authorization |
| S4 final eligible bounded nonstreaming release | 200 exact Secret + original expires_at + service timing |
| S5 invalid/stale/concealed/late response | UI discards, not another HTTP endpoint/status |
| S5 eligible display, copy/manual-copy success/failure and async feedback | UI-only guarded rendering/clipboard; no copy telemetry API |
| S5 leave/reload/concurrent readers | status + new explicit disclosure; no consumption or identity binding |
| S6 late/active offline expiry/background/bfcache/resume | local conceal/discard and neutral recheck; failed recheck stays concealed |
| S6 external-credential/copy/no-recovery explanation | UI content; no remote-revocation endpoint |
| S7 duplicate/current run, health failure, bounded batch/retry/dead-letter/recovery checks | internal events.md, serving gate exposes only 503 until ready |
| S7 early payload loss/metadata-only restoration | status early_unavailable before expiry, expired after; no payload recovery |

No new missing-AC or missing-sequence branch was found. Mapping of safe invalid-record refusal to
503 is the technical temporary-failure class in data-model.md §Lifecycle and failure semantics;
it does not label corruption as a proven incorrect code. Status terminal states intentionally use
200, while explicit disclosure refusals use the error envelope. A 410 API response must not become
an HTTP 404 web page. Intermediaries must apply the same noncacheable/sanitized refusal rules.

## Inherited open decisions — finalization gate

These are existing source obligations, not newly accepted defaults or waivers. No source was edited.

| ID | Contract impact | Owner / due |
|---|---|---|
| DM-OQ-01 | Concrete finite UTF-8/code/body budget, hash suite/cost and global queue/concurrency. Until resolved, lack of maxLength does not authorize unbounded input; proxy limits must not silently shrink valid 65536-byte text after JSON escaping. Decide any body-size status/schema branches together. | Backend/security (data-model/design), before contract finalization and executable tasks |
| DM-OQ-02 | Successful-creation anchor and final timestamps across PostgreSQL then Redis. Matching DTO timestamps alone cannot prove exact lifetime from successful creation. | Backend with Product Owner (data-model/design), before contract finalization and executable tasks |
| DM-OQ-03 | Safe authoritative/monotonic timing, transit-aware client deadline, discontinuity detection, cleanup batches/retry budgets and current-run fencing. | Backend/frontend (design/sequences), before contract finalization and executable tasks |
| DM-OQ-04 | Admission leases/fencing, bounded uncertain/OOM accounting and recovery; no late commit after releasing slots. | Backend (data-model/design), before contract finalization and executable tasks |
| DM-OQ-05 | Trusted proxies, address canonicalization, HMAC custody/rotation/restart continuity; no arbitrary forwarded-header trust or quota reset. | Backend/security (design), before contract finalization and executable tasks |

Browser/network test profile remains due before plan-tests and UI language/slider behavior before
screens approval, as already recorded in SAD §11/spec §8. These do not justify fabricated API fields.

## Verification

Run `_audit/verify-api.py` with PyYAML, openapi-spec-validator and jsonschema in an isolated uv
environment. It validates OpenAPI 3.1, resolves local refs, checks every request/response example,
source story/AC coverage and exact field-origin table projection, exercises schema boundaries and
checks the maintenance branch table. Read `_audit/api-validation.md` for actual execution results.
This is structural documentation verification, not an application/security/performance test.

Proposed commit (not executed): `api: short-live-path contract`.
Next: `screens short-live-path` after review; no no-UI skip applies to declared web-frontend.
'''

if __name__ == '__main__':
    for source in ('data-model.md', 'sad.md', 'spec.md', '.size', '.route'):
        assert (ROOT / source).is_file(), source
    assert (ROOT / '.size').read_text().strip() == 'M'
    assert (ROOT / '.route').read_text().strip() == 'standard'
    OUT.mkdir(exist_ok=True)
    assert not (OUT / 'openapi.yaml').exists(), 'Existing contract: reconcile with a targeted patch instead.'
    (OUT / 'openapi.yaml').write_text(yaml.safe_dump(contract, sort_keys=False, allow_unicode=True, width=100))
    (OUT / 'api-sync-report.md').write_text(report)
    print(f'Created draft contract: {len(paths)} paths; {len(rows)} unique operation-field origin rows.')
