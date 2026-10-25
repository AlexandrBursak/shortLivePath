# Private metrics configuration — not installed/accepted

JSON files are YAML-compatible configuration artifacts, not running collectors.
`otel.json` defines ONLY a Prometheus receiver → metrics exporter pipeline: no OTLP
request ingestion, request/SQL/Redis auto-instrumentation, log or trace pipeline.
`prometheus.json` consumes the private collector, keeps only `slp_*`, and both hops
allow ONLY metric name, operation, outcome and histogram `le` labels. No target/job
address labels survive ingestion. `grafana.json` is an importable dashboard skeleton.
No monitoring ports may be publicly published; no root Compose topology is changed.
A pinned collector/Prometheus/Grafana overlay and real configuration/alert-engine
validation are still required. Static JSON contract tests are NOT alert smoke tests.

The API's `/health/metrics` is private by the existing nginx `^~ /health` 404 rule
and absence of published API ports. Scrapes perform no store queries. Current source
exports only fixed operation/outcome counts and successful-handler latency histogram,
readiness/hash concurrency, cleanup/exhaustion/recovery and bounded store samples.
These handler observations do not determine fixture eligibility or end-to-end NFR
attainment. All aggregate state is process-local, fixed-cardinality and resets on
restart; readiness-instance cleanup/recovery counters also reset on replacement.

Sampling: every 10 seconds, at most one in flight; no sample queue. At most 128
oldest due payload registry handles are checked inside Redis; identifiers never
leave the query, no payload fields are read. Registry debt is NOT payload presence.
`expired_present_sample` is a lower bound of actively present sampled records,
NOT a total expired count, physical-deletion-latency distribution, or RAM-erasure
proof. TTL can remove a payload while its registry member remains. No clean sample
can prove all unindexed/corrupt paths safe. `expired_oldest_seconds` applies to the
observed present sample only. Healthy breach requires the entire observed overdue
interval to be within a continuous healthy readiness run. Samples during closed
readiness are unavailable/stale, never healthy compliance; outage backlog counts
and catch-up timing still need the real retention measurement harness.

Memory sampling exports only used/max bytes and the noeviction boolean. Metadata
sampling uses a single relation's estimated row count and total relation bytes,
not COUNT(*) or row/digest exports; SQL client timeout 1s. Failed/inflight samples
leave freshness visible and `sample_ok=0`; prior values must not be read as fresh.
No indefinite metadata deletion/retention change is introduced.

Alerts cover readiness/absent series, sample freshness (30s), cleanup last-success
age (45s EARLY WARNING, below the unchanged 60s bound), exhaustion, observed healthy
breach, 90% cardinality/memory and metadata bytes/projected growth. Metadata 1 GiB
and seven-day forecast are initial operator warning values, NOT approved capacity
or retention targets. All thresholds/config syntax and notification routing require
real smoke testing; the 45s warning additionally requires under-load validation.
