#!/bin/sh
# Only disposable synthetic T17 project; never reads the repository .env.
set -eu
cd "$(dirname "$0")/.."
: "${SLP_SYNTHETIC_DIRECTORY:=/tmp/slp-t17-synthetic}"
exec docker compose --env-file "$SLP_SYNTHETIC_DIRECTORY/synthetic.env" -p slp-t17 "$@"
