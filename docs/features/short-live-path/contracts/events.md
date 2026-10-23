---
status: Draft
owner: "Backend Lead"
reviewers: []
feature_size: M
---

# Events — short-live-path

## Scope

Source: sad.md §6 S7 and §8 Events/workers; data-model.md Temporary admission state;
spec AC-10/AC-11/AC-11b and ADR-0004/0005/0008/0009.

There are no published domain events, broker channels, external consumers, event registry,
webhooks, payload-bearing queues or separate worker deployables. The only asynchronous flow
is the API's own maintenance loop. This document records that internal contract instead of
inventing a public event envelope with event_id/version/occurred_at fields absent from sources.

## Internal trigger: scheduled cleanup

Producer: the single Secret API process's five-second scheduler.
Consumer: that same process's bounded cleanup/reconciliation handler.
Payload schema: no message body (empty internal trigger); the handler selects due lifecycle
UUID handles and deadline scores from the approved Redis expiration indexes. No Secret text,
Reading code, verifier, token, full URL or network address is carried in a trigger or alert.
Run identity, ownership generation and readiness fencing are internal control state; their
runtime representation is implemented/tested in T8; exact quota reservation generations are deferred, not a fabricated wire schema.

Origin: S7 “Receive scheduled five-second cleanup tick or startup or recovery trigger”.
Delivery/ordering: local scheduling, not exactly-once or durable at-least-once delivery. Ticks
may be delayed or missed during outages, dependency downtime or suspension. Every later cleanup catches all expired backlog by original deadline, not only records expired since the previous tick. Duplicate or overlapping runs must be suppressed
by current ownership; store deletion is independently idempotent. No HTTP Idempotency-Key
is required by or exposed for this trigger.

## Internal trigger: startup or recovery

Producer: Secret API startup/dependency reconnect/store-identity/discontinuity detection.
Consumer: the same maintenance handler under the current closed readiness generation.
Payload schema: no external message; current dependency identity and safe clock/readiness
state are handler context implemented/tested in T8 under ADR-0008/0009.

Origin: S7 “Startup, reconnection, store identity change or runtime or clock discontinuity”.
Close Secret traffic first, fence old eligibility and remove expired records/reconcile
basic counter expiry before reopening. Current ADR-0009 retains ADR-0007's continuous quiet interval of at least sixty seconds after the last possible old mutation when continuity is lost or a key rotates. Repeated discontinuity restarts the interval; elapsed time without confirmed old-owner shutdown/current-run safety cannot reopen traffic. A successful sweep alone is insufficient. T8/T12 implement and verify these single-process time/recovery guards, not a guessed startup sleep; exact per-request quota reservations/fencing remain deferred backlog T22. Failed PostgreSQL health keeps serving closed. Safe Redis cleanup may continue, but physical cleanup may be missed or delayed during dependency downtime, including PostgreSQL down at startup; Redis reachability alone does not impose an outage erasure deadline (ADR-0004 amendment, 2026-10-23). Metadata restoration never restores payloads/verifiers.

## Idempotency and retry

Current-run identity/ownership suppresses duplicate execution. Completion from an old process,
store or recovery generation must never reopen the current readiness gate. No API owners may overlap. Exact per-request quota leases and cross-process accounting are deferred backlog T22; no pending quota slots exist in v1.

S7 requires at most N retries with bounded backoff against the normal-healthy-operation sixty-second target. N,
backoff and batch budgets are bounded implementation parameters verified in T8 against that amended target; outage debt carries forward until all expired backlog is cleared before serving, not quota-lease prerequisites. Do not invent numbers,
exponential backoff, durable delivery or a broker DLQ. Expiration is never extended by retry.

Dead-letter means only a failed maintenance-run state plus an aggregate operational alert
inside the existing service, without Secret material or durable payload queue. Failure and
uncertainty keep readiness closed; subsequent recovery still needs a confirmed current sweep.

| S7 branch | Required effect |
|---|---|
| Duplicate/completed/currently owned run | Skip duplicate work; stale completion cannot authorize readiness |
| Startup/reconnect/identity/discontinuity | Close and fence readiness before checking dependencies |
| Regular tick cannot assure cleanup bound | Close readiness; continue executable cleanup |
| Redis cannot execute cleanup or time unsafe | Stay closed; aggregate failure only |
| PostgreSQL health fails, including at startup | Stay closed; safe cleanup may continue, but missed physical cleanup is accepted; catch all expired backlog before serving resumes |
| Due payload/verifier batches | Idempotent bounded deletion/reconciliation of ALL scores due by current safe cutoff, with no last-tick/recent-interval lower cutoff; carry unresolved debt across runs |
| Basic counter retention or expiry debt | Bounded due-state cleanup; never discard active safety history |
| Batch/reconciliation retry budget exhausted | Internal dead-letter failure and aggregate alert; remain closed |
| Retry budget not exhausted but debt unresolved | Bounded retry, remain closed, never extend expiry |
| Sweep complete but identity/time/debt changes | Remain closed; repeat under current ownership |
| Current confirmed sweep and all recovery checks hold | Complete current run and permit Secret traffic |
| Crash/restart erased still-unexpired payload | No payload restore; status reports early loss, later explicit expiry |

## Retention and verification boundary

Delete active expired payload/verifier records within sixty seconds during normal healthy operation.
Outages, dependency downtime or suspension/hang may delay or miss physical cleanup. Each subsequent
cleanup must catch all expired backlog by original deadline, not only a recent interval; bounded batches
may span runs, but all expired backlog must clear before traffic resumes. The startup-PostgreSQL-down
T8/T8b case is accepted delayed erasure, not a requirement to redesign the scheduler. Never disclose expired data.
A month-old cohort is illustrative only, not a retention/lookback or selected-lifetime change; minimal lifecycle metadata remains indefinite. A five-second tick, TTL or fail-closed API alone
does not prove the deletion bound. Never scan indefinitely retained PostgreSQL metadata for
payload cleanup; use bounded Redis expiry indexes and prune orphan handles. Do not delete
lifecycle metadata or persist Secret material as maintenance state.

All of this remains an implementation/test obligation. Schema registry and broker validator
are N/A; `_audit/verify-api.py` checks the documentation structure, not runtime scheduling,
cleanup latency, identity fencing, lease safety, infrastructure retention or physical erasure.
