#!/bin/sh
# Only dedicated synthetic T18 fault stores; explicit subnet avoids exhausted pool.
set -eu
cd "$(dirname "$0")/../.."
project=slp-t18-fault
cleanup() {
  docker rm -f "$project-runner" "$project-pg" "$project-redis" >/dev/null 2>&1 || true
  docker network rm "$project" >/dev/null
  test -z "$(docker ps -aq --filter label=com.docker.compose.project=$project)"
  test -z "$(docker network ls -q --filter label=com.docker.compose.project=$project)"
}
# Refuse collisions rather than reusing or deleting previous/other environments.
test -z "$(docker ps -aq --filter label=com.docker.compose.project=$project)"
test -z "$(docker network ls -q --filter name=^$project\$)"
docker network create --internal --subnet 10.218.20.0/24 --label com.docker.compose.project=$project "$project" >/dev/null
trap cleanup EXIT HUP INT TERM
docker run -d --name "$project-pg" --label com.docker.compose.project=$project --network "$project" --network-alias postgres --log-driver none --tmpfs /var/lib/postgresql/data -e POSTGRES_USER=synthetic -e POSTGRES_PASSWORD=synthetic-t18 -e POSTGRES_DB=synthetic postgres:17-alpine@sha256:979c4379dd698aba0b890599a6104e082035f98ef31d9b9291ec22f2b13059ca >/dev/null
docker run -d --name "$project-redis" --label com.docker.compose.project=$project --network "$project" --network-alias redis --log-driver none --tmpfs /data -v "$PWD/docker/redis.conf:/etc/redis.conf:ro" redis:7-alpine@sha256:9de71018be8413f419688ac34e19dbac432d1c6d9593d2ded99a82eebefeb18f redis-server /etc/redis.conf >/dev/null
# Poll actual dependency readiness, never use a blind startup sleep.
i=0
until docker exec "$project-pg" pg_isready -U synthetic >/dev/null && docker exec "$project-redis" redis-cli ping >/dev/null; do
 i=$((i+1)); test "$i" -lt 60; sleep 1
done
docker run --rm --name "$project-runner" --label com.docker.compose.project=$project --network "$project" --memory 768m --cpus 2 --ulimit core=0 --log-driver none \
 -e NODE_ENV=test -e HOST=0.0.0.0 -e PORT=3333 -e APP_KEY=synthetic-test-only-not-for-deployment \
 -e PGHOST=postgres -e PGUSER=synthetic -e PGPASSWORD=synthetic-t18 -e PGDATABASE=synthetic -e REDIS_URL=redis://redis:6379 \
 -v "$PWD/backend/tests:/home/node/app/tests:ro" slp-t18-tooling sh -c 'node ace.js migration:run --force && pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm test:integration && node --test --test-concurrency=1 tests/security/*.test.mjs tests/faults/*.test.mjs'
printf '%s\n' 'T18 backend gates and scoped fault suites passed; owned fault resources cleaned by trap.'
