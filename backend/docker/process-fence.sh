#!/bin/sh
set -eu
# All API starts on this host MUST share this mounted directory. The kernel
# releases the inherited lock only when the old process (and native work) dies;
# losing a PostgreSQL session alone is not proof of old-process termination.
# No payload, address, token, verifier or key is stored in this lock file.
directory=${SLP_LOCK_DIRECTORY:-/run/slp-owner}
exec flock --exclusive --nonblock --conflict-exit-code 75 --no-fork "$directory/api.lock" "$@"
