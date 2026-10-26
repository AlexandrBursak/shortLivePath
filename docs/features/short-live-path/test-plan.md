---
status: Draft
owner: "Product Owner and implementing engineer (QA responsibility)"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-23"
feature_size: M
---

# Test plan — short-live-path

Verify anonymous temporary text sharing, explicit repeat disclosure, exact copying and optional Reading codes without weakening expiration, bounded retention or confidentiality.

Sources: [spec.md](./spec.md) §§5–6.1; [data-model.md](./data-model.md); [sad.md](./sad.md) §6 S1–S7; [ux-flows.md](./ux-flows.md) US-01–US-05; [screens.md](./screens.md) SCR-01–SCR-05; [OpenAPI](./contracts/openapi.yaml); [internal maintenance contract](./contracts/events.md); Accepted ADR-0008/0009 and the non-quota protections they retain from ADR-0006/0007. Size M, route standard; separate plan is the correct target. Exact concurrent quota reservations remain deferred to T22, not a hidden v1 test or launch requirement.

## Levels

| Level | Scope | Strategy (generic — no tool names) |
|---|---|---|
| unit | Scalar text, byte counts, minute selection, code generation, conservative timing and response eligibility | Pure deterministic cases without I/O; controlled time and randomness at explicit seams. |
| integration | Lifecycle services, real metadata/payload stores, hashing, admission, cleanup and fault recovery | Ephemeral real PostgreSQL and Redis instances matching the implementation's pinned versions; never a mocked datastore. |
| contract | Browser/API request and response boundary | Exercise actual handlers against the agreed OpenAPI shapes, envelopes and headers, including safe refusal variants. |
| component | Screen/component states and asynchronous interactions | Isolated rendering with controlled responses, clipboard completion and lifecycle events; this does not replace real API/store tests. |
| e2e | Full service retention, restart, backup and confidentiality scenarios | Real local applications, proxy and ephemeral dependencies, with synthetic canaries and controlled failures. |
| e2e-through-UI | US-01–US-05 through the rendered browser interface | Follow the UX paths and screen states with real service calls and isolated dependencies. |
| load | Numeric throughput, retention and abuse scenarios | Use the test/load tools detected in the implementation; no runner or language is prescribed here. |

Visual-regression is deferred until an approved visual canon exists. Wireframes are not an approved pixel baseline. Before UI acceptance, capture synthetic-data baselines for SCR-01–SCR-05 at narrow and desktop widths, then compare intended states against those deliberately approved baselines. This future visual check is supplemental, not a replacement for behavioral coverage or a current claim of completion.

## AC coverage

Every row is a named test commitment. Parameterized vectors below must remain independently identifiable. Implemented case names or their enclosing groups cite the exact AC identifier. Expected outcomes intentionally use plain words, not transport status numbers or error-code literals.

| AC (spec.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-01 | confirmed anonymous creation returns a copyable link and deadline | integration + contract + e2e-through-UI | Only a validated confirmed response reaches SCR-02; no registration is needed. |
| AC-01 | uncertain creation never presents a speculative link | integration + contract + e2e-through-UI | Metadata or payload failures, lost responses and invalid confirmation retain the form without success, automatic retry or deadline extension. |
| AC-02 | missing or whitespace-only credential blocks creation | unit + integration + component | Each invalid credential is explained and no link is issued. |
| AC-02 | aggregate UTF-8 boundary excludes code and packaging | unit + integration + component | Exactly 65536 text bytes are accepted; one byte more across address, login and credential is rejected without truncation. |
| AC-02 | invalid scalar text is rejected without normalization | unit + integration + component | Malformed scalar text is refused safely; valid nonempty strings retain all original characters. |
| AC-03 | multiline multibyte credentials survive the complete round trip | unit + integration + e2e-through-UI | Original characters, leading/trailing spaces, tabs, Unicode and line endings reach display and per-field clipboard submission unchanged. |
| AC-03 | clipboard failure offers only an eligible exact-text fallback | unit + e2e-through-UI | No false copied message; manual selection preserves text and is unavailable once concealed or expired. |
| AC-04 | every whole-minute lifetime retains its database anchor | unit + integration | Default is sixty minutes; all values from one through 1440 use one database creation-time sample and the immutable selected duration. |
| AC-04 | publication and confirmation delay consume lifetime | integration + e2e-through-UI | Hash preparation precedes the anchor; later commit, payload-write and response delays never restart the countdown. |
| AC-04 | lifetime controls preserve minute choices with hour assistance | unit + component + e2e-through-UI | Pointer/touch hour snapping, higher-hour ties, minimum endpoint, keyboard minute steps and exact numeric edits follow SCR-01; a non-hour choice remains unchanged. |
| AC-04 | service-derived countdown ignores device wall-clock changes | unit + component + e2e-through-UI | Confirmation, gate and reading show remaining time and an explicit expiration zone; changing the device clock never extends access. |
| AC-05 | invalid lifetime is refused without silent correction | unit + integration + component | Empty, fractional, shorter-than-minimum and longer-than-maximum values remain visible for correction; creation is blocked and bounds are explained. |
| AC-06 | optional code supports exact chosen values and weak-code guidance | unit + integration + component + e2e-through-UI | Any composition meeting six Unicode code points and the byte maximum is accepted without blocking complexity rules; disabled protection omits the code. |
| AC-06 | code minimum and byte maximum are independently enforced | unit + integration + component | Five code points or more than 1024 UTF-8 bytes are rejected with an explanation, no truncation and no link; valid boundary values are accepted. |
| AC-06 | generated code uses secure unbiased twenty-character sampling | unit + component + e2e-through-UI | The runtime secure random source is used with unbiased sampling; output is twenty Latin letters/digits. Deterministic tests prove mapping, not entropy through a sample. |
| AC-06 | code and link are handed over separately | integration + component + e2e-through-UI | Code never enters the Share link or server confirmation; SCR-02 copies each separately and offers no recovery. |
| AC-06 | code comparison preserves case spaces and normalization form | unit + integration + e2e-through-UI | Only the exact chosen scalar string matches; altered case, spaces or Unicode normalization do not silently match. |
| AC-07 | missing required code reveals nothing and performs no verification | integration + contract + e2e-through-UI | Reading stays concealed, no content can be copied, and omission creates no failed-verification event. |
| AC-07 | wrong short and explicitly empty guesses share the failure policy | integration + contract + e2e-through-UI | Supplied guesses within the byte bound are verified, reveal nothing on mismatch and do not permanently consume the link. |
| AC-07 | five observed failures temporarily deny only the address pair | integration + contract + e2e-through-UI | Further verification is refused until fewer than five failures remain in the rolling minute; refusals do not extend it, other addresses remain eligible and shared-address readers share the limit. |
| AC-07 | correct verification never resets failure history or consumes the link | integration + e2e-through-UI | Correct code permits only this eligible disclosure; previous failures and original expiration remain unchanged. |
| AC-07 | invalid input and saturated work do not become wrong-code failures | integration + contract + e2e-through-UI | Oversized/malformed input and temporary work refusal do not hash or add failures; UI keeps a safe distinct explanation. |
| AC-07 | hard hash-work cap survives cancellation and concurrent guesses | integration | Creation and disclosure together run at most two native operations with no queue; timeout/disconnect retains the slot until actual completion. Already-admitted quota overshoot is allowed, but lost failure updates and unbounded work are not. |
| AC-07 | stored code uses only a valid salted verifier | integration | No plaintext code is stored; malformed or incompatible verifiers fail closed rather than disabling protection. |
| AC-08 | opening or previewing a link remains neutral | integration + contract + e2e-through-UI | Initial/repeat HTML, title, preview and status contain no Secret; page open performs no disclosure or code verification. |
| AC-08 | explicit show supports repeat and concurrent readers | integration + contract + e2e-through-UI | With and without code, each reader explicitly chooses Show; no account, recipient binding or read consumption is introduced. |
| AC-09 | malformed and unknown links show safe unavailability | integration + contract + e2e-through-UI | No fragments, recovery claim or previous-existence claim is shown. |
| AC-09 | known expiry survives payload deletion and store restart | integration + contract + e2e-through-UI | After recovery gates reopen, durable metadata keeps the original URL explicitly expired rather than a missing-page experience. |
| AC-09 | known unexpired payload loss is distinct from expiry | integration + contract + e2e-through-UI | Confirmed missing content is explained as early unavailability; lifecycle metadata is retained. |
| AC-09 | dependency uncertainty and corruption remain safe temporary failures | integration + contract + e2e-through-UI | A timeout, invalid record or unsafe readiness does not fabricate unknown, expired, early-loss or wrong-code evidence. |
| AC-10 | final release denies the exact expiration boundary | unit + integration | Requests started earlier, slow correct verification and concurrent reads are refused at or after the deadline using fresh authoritative time immediately before release. |
| AC-10 | late and superseded responses never become visible | unit + component + e2e-through-UI | Delayed, invalid, backgrounded or superseded responses render no partial content and enable no copy action. |
| AC-10 | offline expiration hides content and invalidates callbacks | unit + component + e2e-through-UI | Active offline pages hide at the conservative deadline; pending disclosure/copy feedback cannot restore text or start a new expired copy. |
| AC-10 | return from background or suspension requires a fresh show | unit + component + e2e-through-UI | Page hide, freeze, history-cache return and resume conceal prior content; neutral revalidation and explicit Show are required, with failure staying concealed. |
| AC-10 | unsafe time and stale recovery runs cannot authorize disclosure | unit + integration | Backward time, discontinuities, stale readiness and old callbacks close or retain the gate; no expired release is permitted. |
| AC-11 | expired payload and verifier disappear within the executable cleanup bound | integration + e2e | Active Secret records disappear within sixty seconds during normal healthy operation, including at configured capacity and within healthy bounded-retry budgets; outage/dependency-down/suspension delay is accepted separately. |
| AC-11 | orphan cleanup preserves the original immutable deadline | integration + e2e | Unconfirmed writes get no extra lifetime, no recovery and no rollback deletion of committed lifecycle metadata. |
| AC-11 | suspension recovery clears expired data before serving | integration + e2e | Outage, dependency downtime (including PostgreSQL unavailable at startup), or suspension longer than the cleanup interval may miss/delay physical erasure; resume/startup stays closed until all expired backlog is cleared by original deadline and current-run checks succeed. Seed mixed-age expired debt older than the previous tick/recent interval (a month-old synthetic cohort is illustrative only), cross bounded-batch/run limits, and prove no old due records are skipped before readiness reopens. Selected lifetime and indefinite minimal metadata retention remain unchanged. |
| AC-11 | cleanup faults never masquerade as readiness | integration + e2e | Duplicate/old runs cannot reopen traffic; retry exhaustion alerts safely. Cleanup may continue after an established metadata session fails, but startup metadata-store outage may delay physical cleanup even with Redis reachable. This T8/T8b disposition is accepted delayed erasure, not a scheduler-redesign requirement; recovery must still clear all expired backlog before serving. |
| AC-11 | canary secrets codes and links stay out of persistent copies | integration + e2e | Proxy/app/store diagnostics, telemetry, caches, backups and restore contain no forbidden canaries; only approved minimal lifecycle metadata persists. |
| AC-11b | restart loss before expiry provides no content or recovery | integration + e2e-through-UI | A lost unexpired payload yields early-unavailable guidance requesting a new link; no reconstruction or old-content prefill occurs. |
| AC-12 | expiration guidance does not promise external revocation | component + e2e-through-UI | SCR-01/02/04/05 explain that external passwords/keys and acquired copies remain outside the service's control. |

## Edge cases / error paths

Each error/authorization AC has dedicated rows above. Supplementary commitments below cover approved transport, abuse and infrastructure obligations without silently expanding product scope.

| Source | Test name | Level | Expected outcome |
|---|---|---|---|
| NFR-05; S2 | rolling creation threshold preserves the current form | integration + e2e-through-UI | Twenty-five sequential observed successes are allowed per address/minute; the next attempt is refused without a link, with entered text retained. At the oldest-success boundary admission resumes. Concurrent overshoot is allowed, not asserted as an exact ceiling. |
| NFR-04/05; S2 | hard storage and counter bounds refuse without eviction | integration + load | At 1000 active payloads, 10000 limiter identities or the 256 MiB store limit, safe refusal preserves existing Secrets and active counter history; no protection bypass occurs. |
| Spec §6.1; S1/S4 | transport limits reject before expensive work | integration + contract | Both submitting boundaries enforce 524288 wire bytes during receive, with or without declared length; overflow, unsupported media/compression and malformed JSON yield safe refusals, no confirmed link and no wrong-code event. |
| Spec §6.1; S4 | body and code limits are independent | integration + contract | Test exact and over-limit wire/code boundaries, escaped JSON expansion, multibyte strings, null, unknown fields and invalid types without truncation or submitted-value echo. |
| Spec §6.1; S2/S4 | trusted address canonicalization resists spoofing | unit + integration | Only the configured immediate proxy supplies one sanitized address; equivalent spellings and mapped addresses share identity, ordinary IPv6 uses its full address, and invalid/untrusted context fails closed before new admission state. |
| Spec §6.1; S7 | continuity loss requires a confirmed quiet recovery interval | integration + e2e | Same-key restarts retain surviving histories; loss/rotation stops old owners and waits at least sixty continuous seconds after the last possible old mutation plus cleanup. Repeated discontinuity restarts the interval; a timer alone cannot reopen traffic. |
| Spec §6.1; S7 | transient pseudonymous counters expire without logging identities | integration | Counters disappear within five minutes of last relevant activity, pair state no later than link expiry; no addresses, forwarding headers or keyed labels enter logs or durable metadata. |
| NFR-04; S5 | supplied text cannot execute or trigger destination fetching | component + e2e-through-UI | Markup, script-looking strings and external destinations render as inert exact text, without execution, linkification, redirects or automatic network fetches. |
| NFR-04; API | every response enforces safe envelopes and cache boundaries | contract + e2e | Actual success/error/status variants match OpenAPI, include noncacheable/no-referrer controls, omit sensitive echoes and keep error details empty. Status accepts no body and performs no hash work. |
| NFR-06; SCR-01–05 | keyboard and narrow layouts preserve every primary action | component + e2e-through-UI | At 360 px and desktop width, creation, minute input/slider, generation, Show, copy and fallback are usable with labels, visible focus and announced safe errors; long exact text scrolls internally, not the whole page. |
| SCR-01–05 | screen states match the canonical manifest | component | Every applicable state row in screens.md is exercised, including loading, validation, uncertain creation, clipboard denial, concealment and the three terminal distinctions; N/A rows remain intentionally absent. |

## Test data

- Use factories matching LinkLifecycle and ephemeral payload shapes in data-model.md: synthetic UUID/digest/timestamps, optional/required verifiers, known-expired, early-lost and unknown tokens. Generate synthetic capabilities in memory; never use real credentials or print full generated URLs in test reports.
- Exact-text vectors include leading/trailing spaces, tabs, empty optional fields, LF/CRLF, combining characters, non-BMP scalar characters, inert markup and long lines. Build byte-boundary cases programmatically; test code-point length separately from UTF-8 length. Do not normalize either text or expected strings.
- Seed valid data through actual creation/service paths for behavioral suites. Direct synthetic store insertion is permitted only for targeted corruption, expired-record, migration and deterministic capacity tests, and must remain isolated from the real application configuration.
- Integration dependencies are ephemeral real PostgreSQL and Redis containers, not mocked stores. Isolated namespaces/databases and a unique per-suite project prevent touching personal or production data. Application stores are never selected through an ambient production connection.
- Per-test cleanup resets synthetic lifecycle/payload/counter state and browser contexts, completes native work, and resets controlled fault/time seams. Per-suite teardown removes only test-owned containers, networks and disposable metadata volumes; never prune unrelated containers or volumes. Resetting the test database is not a production retention policy.
- Recovery tests deliberately preserve synthetic state across selected restarts within the test, then tear it down. Metadata backup/restore uses only a disposable synthetic database; no Secret-store backup is created as a production feature.
- Real monotonic/wall-time and process/container suspension tests complement controlled clock tests. Never change the laptop's system clock, disable host security controls or suspend the user's whole laptop automatically. Platform operations needing elevated permissions require explicit agreement; an unavailable fault mechanism is recorded as unverified, not simulated evidence of a real suspension.
- Capture only sanitized assertions and aggregate metrics. Disable sensitive failure screenshots, browser traces, body dumps and request URL diagnostics by default. Synthetic leak-audit artifacts are access-restricted, scanned, summarized without values and deleted at suite teardown; visual baselines contain symbolic synthetic placeholders only.

## Local execution profile

Product Owner approved local testing on their laptop, isolated real stores and synthetic data; real-phone and actual production checks remain required before launch. The earlier offered shaped-network profile was not selected and is not assumed.

Discovery on 2026-10-22: arm64 macOS 26.5.2; installed desktop Chrome 155.0.8059.85, Firefox 149.0.2 and Safari 26.5.2. These are observed local versions, not a promise to support every future release. Re-record exact browser/OS versions, host hardware, container CPU/memory allocations, application/dependency revisions and background workload for every measured run. Local HTTPS includes the proxy, UI, service and both stores; record loopback network conditions rather than claiming representative mobile transport.

- Desktop functional/browser lifecycle coverage uses all three installed browsers. Narrow 360 px viewport checks establish responsive layout only, not actual mobile-browser behavior.
- Run latency measurements on charger with energy-saving mode off and avoid competing heavy workloads. Record the fixed local resource allocations; do not silently resize them between comparable runs. Confirm pinned runtime versions during scaffolding rather than assuming installed utilities are the final project versions.
- Before launch, execute the critical UX, keyboard/touch, exact-copy, background/resume and expiry scenarios on real iOS Safari and Android Chrome, recording device/OS/browser versions and real network conditions. Audit actual production proxy trust, HTTPS, backup exclusions, swap/dumps/snapshot controls, readiness and non-sensitive telemetry. Local configuration cannot certify a different host.
- No test application, test runner, scaffold or runtime success is claimed by this document. Implementation detects available commands and writes the red tests from this map.

## NFR validation (load)

The following are reproducible test scenarios, not measured results or new product targets. Run only against isolated local dependencies. Record eligible completion throughput and separate refused/failed operations; fast rejections never count as successful latency attainment. Fix the workload, version/resource profile and measurement window before comparing runs.

| Source | Scenario and rate | Duration | Metric and threshold |
|---|---|---|---|
| NFR-01 | Open-loop 10 operations/s: five creations and five disclosures each second. Run unprotected and protected phases separately, with 64 KiB aggregate text and valid codes; pair disclosures with eligible created links. Use sixty-minute lifetime, 100 trusted synthetic client-address identities distributed evenly and unique link/address pairs. Recycle only test-owned fixtures between phases. | Per phase: 30 s warm-up, reset measurements/state, then 120 s measured traffic. | Eligible completed throughput sustains 10 operations/s and p95 end-to-end latency is at most 2 s, reported separately for creation and disclosure. Include HTTPS, server processing and actual browser completion for matched UI probes; report refusals/failures separately and fail attainment if they replace required eligible operations. The phase stays below 1000 payloads; legitimate rate limits are not bypassed. |
| NFR-03 | 10 operations/s using preseeded synthetic expiring cohorts near the hard active-record cap; repeatedly attempt disclosure around exact expiry while cleanup, hashing and faults compete. Include delayed responses and an offline UI. | 120 s healthy traffic plus at least 60 s healthy-cleanup observation after the last expiration; separately suspend a test dependency/runtime for 90 s, include startup PostgreSQL down and mixed-age/multi-batch expired debt, and verify recovery before traffic. | Zero service releases at or after expiry; zero late normal-application displays; active expired payload/verifier removal within 60 s during normal healthy operation. Outage/dependency-down/suspension delay is accepted, not measured as healthy-target attainment. All expired backlog must clear before readiness reopens, with no recent-interval lower cutoff; zero expired releases throughout. |
| NFR-04 | 10 operations/s canary creation/disclosure traffic through the real proxy with protected and unprotected fixtures; scan configured logs, telemetry, browser persistence and metadata-only backup/restore artifacts after the run. | 120 s per protection phase plus post-run artifact inspection. | Zero Secret/code/full-link canaries in forbidden sinks; zero persistent payload/verifier copies; all public Secret/code traffic uses HTTPS. Approved metadata-only persistence is not a leak. Actual-host infrastructure checks remain a pre-launch gate. |
| NFR-05 | One synthetic shared address submits one creation/s until 25 confirmed successes, then one attempt/s while the observed rolling history is full; continue past the oldest-success boundary. Separate simultaneous burst: ten attempts started together when 24 successes are already observed. | 120 s sequential phase; separate 60 s concurrent-observation phase. | Basic rejection starts when 25 successes are observed within 60 s and ends when fewer remain. Refusals issue no link and retain form input. Do not demand an exact concurrent ceiling; enforce hard work/storage limits and atomic completed-event accounting. |

Use synthetic addresses only behind the isolated configured test proxy; never add a publicly spoofable forwarding-header bypass to the application. Before performance sign-off T21 must benchmark real code-work parameters after T3; T20 depends on that calibration and the retention/browser/security tests. Saturation exposes a failed target or reviewed tuning requirement, never permission to disable the two-call bound, weaken hashing or hide refusals.

NFR-02 is an operational availability measurement, not a short load test: schedule one disposable synthetic create/read transaction per minute, report only sanitized aggregate results, and observe a complete calendar month. Availability is at least 99.5% successful eligible probes, with maintenance/outages and required-dependency failures counted as unavailable; report monitoring gaps separately and do not certify a month with unexplained missing samples. Local checks validate the probe and aggregation behavior, not production monthly attainment.

NFR-06 is a numeric layout/accessibility requirement, not a throughput target: check all primary flows at 360 px and a recorded desktop width, using keyboard-only operation and the full minute domain. Real-phone checks remain separate. Do not invent a load rate for viewport width.

## CI placement

- Every change/PR: unit, contract and component suites; real-store integration for changed lifecycle, authorization, publication, cleanup and schema paths. No mocked datastore shortcut for a fast green result.
- Before accepting a feature increment: critical e2e-through-UI paths for creation, protected/unprotected Show, exact copy, failure distinctions, local expiry and return concealment. Local commands must be repeatable even before a remote pipeline exists.
- Scheduled and pre-release: complete desktop browser matrix, full fault/recovery/confidentiality e2e and load phases. Any touched expiration/security path runs its relevant heavy suite before acceptance, not merely at a later schedule.
- Before launch: real-phone validation, actual-host infrastructure/security review and a repeatable performance report. Monthly availability remains unmeasured until the required observation window has elapsed; probe installation is not attainment evidence.
- Tests must remain isolated and serial where they intentionally manipulate one store/runtime's readiness, time or capacity. Parallel suites use separate test projects/state; load runs do not compete with functional tests.

## Confirmation and remaining gates

- Product Owner selected laptop-local testing instead of treating an offered representative shaped-network/mobile matrix as already agreed. Approved scope: isolated synthetic stores now; actual-phone and production-host verification before launch.
- Product Owner accepted the complete proposed AC-to-level distribution, dedicated error tests and the real ephemeral dependency strategy. Detailed vectors above expand that accepted intent; they do not alter ACs or restore deferred exact quotas.
- Visual baselines wait for the approved visual canon. Runtime clock/recovery mechanisms, cleanup batch/retry budgets, installed test commands and resource calibration are implementation obligations, not invented completed decisions.
- Profile ownership: implementing engineer records exact local versions/resources/network per run; Product Owner and implementing engineer confirm real devices/deployment inputs before launch. No independent security sign-off is claimed.
- This plan resolves the planning profile locally without changing NFR targets. Its confirmation supersedes the historical browser-profile note in spec §8 for local planning; that source note is retained as history, and production/mobile evidence remains explicitly pending.

## Validation

Structural self-check: 6/6 pass, executed with `_audit/verify-test-plan.py` on 2026-10-22. All thirteen acceptance criteria appear in 42 dedicated AC coverage rows; error/authorization ACs have separate rows, test levels use the fixed vocabulary, no test runner/tool is prescribed, numeric NFRs have explicit scenarios or the appropriate non-load measurement, and size M/route standard select this separate file. The supplementary error-path table adds transport, capacity, address, privacy and accessibility checks. This verifies documentation structure only, not application behavior, security, cleanup timing, browser behavior or performance. No commit was made; proposed commit: `test-plan: short-live-path`.
