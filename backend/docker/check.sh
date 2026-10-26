#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
project="slp-t3-test-$$"
compose() { docker compose --env-file /dev/null --profile runtime -p "$project" "$@"; }
trap 'compose down --volumes --remove-orphans' EXIT HUP INT TERM
compose build api runtime
compose up -d --wait postgres redis
compose run --rm api sh -c 'pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm smoke'
# Start the actual runtime CMD, then inject checks without shipping test files.
compose up -d --wait runtime
compose exec -T runtime node --input-type=module < tests/runtime/dependencies.test.mjs
compose exec -T runtime node --input-type=module < tests/runtime/process_fence.test.mjs
compose exec -T runtime node --input-type=module < tests/unit/argon2.test.mjs
compose exec -T runtime node --input-type=module < tests/integration/smoke.test.mjs
# Missing dependency must actually fail, not skip or return healthy.
if compose run --rm -e PGHOST=unavailable.invalid api pnpm smoke; then
  printf '%s\n' 'ERROR: missing-dependency smoke unexpectedly passed' >&2
  exit 1
fi
if compose exec -T -e PGHOST=unavailable.invalid runtime node --input-type=module < tests/integration/smoke.test.mjs; then
  printf '%s\n' 'ERROR: runtime missing-dependency smoke unexpectedly passed' >&2
  exit 1
fi
printf '%s\n' 'All gates passed; build and runtime missing-dependency smokes failed as required.'
