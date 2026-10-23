#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
project="slp-t21-benchmark-$$"
report="$root/docs/features/short-live-path/_audit/reading-code-benchmark.json"
candidate="${1:-baseline}"
case "$candidate" in
  baseline) ;;
  --candidate-four-cpu) report="$root/docs/features/short-live-path/_audit/reading-code-benchmark-four-cpu.json" ;;
  *) printf '%s\n' 'Usage: run.sh [--candidate-four-cpu]' >&2; exit 1 ;;
esac
compose() {
  if [ "$candidate" = '--candidate-four-cpu' ]; then
    docker compose --env-file /dev/null -f "$root/backend/compose.yml" -f "$root/scripts/benchmark/compose.four-cpu.yml" --profile benchmark -p "$project" "$@"
  else
    docker compose --env-file /dev/null -f "$root/backend/compose.yml" --profile benchmark -p "$project" "$@"
  fi
}
temporary="$(mktemp "$report.tmp.XXXXXX")"
trap 'rm -f "$temporary"; compose down --volumes --remove-orphans' EXIT HUP INT TERM
compose build benchmark
compose run --rm --no-deps -T benchmark node --test /benchmark/reading-code.test.mjs
# Only sanitized aggregate metrics are emitted; no code, PHC or link is serialized.
compose run --rm --no-deps -T benchmark node /benchmark/reading-code.mjs --run > "$temporary"
python3 -m json.tool "$temporary" > /dev/null
mv "$temporary" "$report"
printf '%s\n' "Benchmark metrics: $report"
