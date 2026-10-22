---
status: Draft
owner: "Backend Lead"
reviewers: []
feature_size: M
---

# Events — short-live-path

## Scope

Source: sad.md §6 S7 and §8 Events/workers; data-model.md Temporary admission state;
spec AC-10/AC-11/AC-11b and ADR-0004/0005.

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
exact representation remains DM-OQ-03/04, not a fabricated wire schema.

Origin: S7 “Receive scheduled five-second cleanup tick or startup or recovery trigger”.
Delivery/ordering: local scheduling, not exactly-once or durable at-least-once delivery. Ticks
may be delayed or missed during suspension. Duplicate or overlapping runs must be suppressed
by current ownership; store deletion is independently idempotent. No HTTP Idempotency-Key
is required by or exposed for this trigger.

## Internal trigger: startup or recovery

Producer: Secret API startup/dependency reconnect/store-identity/discontinuity detection.
Consumer: the same maintenance handler under the current closed readiness generation.
Payload schema: no external message; current dependency identity and safe clock/readiness
state are handler context, with concrete representation unresolved in DM-OQ-03/04.

Origin: S7 “Startup, reconnection, store identity change or runtime or clock discontinuity”.
Close Secret traffic first, fence old eligibility and remove expired records/reconcile
reservations before reopening. Accepted ADR-0007 additionally requires a fenced continuous quiet interval of at least sixty seconds after the last possible old mutation when continuity is lost or a key rotates. Repeated discontinuity restarts the interval; elapsed time without proven fencing cannot reopen traffic. A successful sweep alone is insufficient. T2 still defines executable time/fencing mechanics, not a guessed startup sleep. Failed PostgreSQL health keeps serving closed without stopping
Redis cleanup that can still execute. Metadata restoration never restores payloads/verifiers.

## Idempotency and retry

Current-run identity/ownership suppresses duplicate execution. Completion from an old process,
store or recovery generation must never reopen the current readiness gate. Leases alone must
not free uncertain slots while old work can still publish; DM-OQ-04 resolves fencing.

S7 requires at most N retries with bounded backoff inside the active-cleanup deadline. N,
backoff and batch budgets are explicitly unresolved under DM-OQ-03/04. Do not invent numbers,
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
| PostgreSQL health fails but Redis cleanup works | Stay closed; continue executable expiration cleanup |
| Due payload/verifier batches | Idempotent bounded deletion/reconciliation using expiry indexes |
| Limiter retention or reservation debt | Bounded due-state cleanup; never discard active safety history |
| Batch/reconciliation retry budget exhausted | Internal dead-letter failure and aggregate alert; remain closed |
| Retry budget not exhausted but debt unresolved | Bounded retry, remain closed, never extend expiry |
| Sweep complete but identity/time/debt changes | Remain closed; repeat under current ownership |
| Current confirmed sweep and all recovery checks hold | Complete current run and permit Secret traffic |
| Crash/restart erased still-unexpired payload | No payload restore; status reports early loss, later explicit expiry |

## Retention and verification boundary

Delete active expired payload/verifier records within sixty seconds while Redis can execute
cleanup. No physical RAM-erasure deadline is promised while a process/VM is suspended or hung.
Clear expired records before traffic resumes. A five-second tick, TTL or fail-closed API alone
does not prove the deletion bound. Never scan indefinitely retained PostgreSQL metadata for
payload cleanup; use bounded Redis expiry indexes and prune orphan handles. Do not delete
lifecycle metadata or persist Secret material as maintenance state.

All of this remains an implementation/test obligation. Schema registry and broker validator
are N/A; `_audit/verify-api.py` checks the documentation structure, not runtime scheduling,
cleanup latency, identity fencing, lease safety, infrastructure retention or physical erasure.
