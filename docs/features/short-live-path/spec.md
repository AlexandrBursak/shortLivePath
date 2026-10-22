---
status: Draft
owner: "Product Owner"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-22"
feature_size: M
---

# Spec — short-live-path

> Glossary: [CONTEXT](./CONTEXT.md).
> Reference module / docs / channels used: [Idea source](./idea-source.md); interview only. No additional private sources selected. No existing implementation or architecture map.

## 1. Context

A Sender needs to give a client administrative or server access without leaving credentials indefinitely in this service. A Secret can contain an external address, an optional login, and a password or multiline server key. The Recipient must be able to read the details more than once during a limited period without registering.

The immediate trigger is the Product Owner's current need to transfer access details to clients. No incident, contractual deadline, or existing traffic baseline was supplied. This is a new product covering both a human-facing interface and a supporting service, not an extension of a deployed application.

The committed approach is anonymous creation of text-only Share links, repeated reading until expiration, and an optional Reading code separate from the link. Lifetime defaults to one hour and cannot exceed twenty-four hours. Content is encrypted before transmission so routine service operation does not have access to readable credentials; expiration stops further disclosure and removes stored ciphertext. Unlike view-count expiration, the chosen lifetime does not penalize repeated client visits or link previews. The highest risk is retaining access or copies beyond the promised period, so the promise explicitly separates service-side erasure from copies already acquired by a Recipient.

Scope is M with route standard. No production security properties have yet been implemented or verified. Product Owner denotes the commissioning user, not a new application role. Confidentiality takes priority over recovery: a crash or restart may permanently remove a still-valid Secret. Lifetime is a maximum sharing window, not a durability promise. In that case a Sender must create a new Share link; no recovery or history is provided.

## 2. Goals

- Enable a Sender to deliver access details without requiring Sender or Recipient registration, with successful creation and retrieval measured during the pilot.
- Bound disclosure and service retention by the Sender-selected lifetime, with measurable expiration and erasure compliance.
- Prevent routine service operators from reading content and offer an independent Reading code while preserving multiline credentials exactly.

## 3. Non-goals

- File uploads or downloads are excluded from v1 because pasted text covers the confirmed password and key use cases.
- Accounts, link history, recovery of lost links or codes, and Sender-initiated early removal are excluded because v1 uses anonymous creation with no subsequent ownership-management workflow.
- One-time disclosure and view-count limits are excluded because the Recipient must be able to return until expiration.
- Provisioning or revoking external credentials, erasing Recipient-controlled copies, and defeating a malicious operator that changes delivered application code are excluded because a temporary sharing service cannot guarantee these outcomes.

## 4. User stories

### US-01: Create and share credentials

**As a** Sender
**I want** to enter optional address and login plus a password or multiline key, create a Share link without registration, and copy it
**So that** I can give a client access details without keeping a permanent copy in this service.

### US-02: Set the sharing lifetime

**As a** Sender
**I want** to select a lifetime from one minute to twenty-four hours, defaulting to one hour
**So that** disclosure lasts only for the intended handover window.

### US-03: Add a reading code

**As a** Sender
**I want** to optionally choose or generate a Reading code and communicate it separately
**So that** possession of the Share link alone need not permit reading.

### US-04: Read and copy credentials

**As a** Recipient
**I want** to open a neutral Share link page, provide a Reading code when required, explicitly choose Show, copy the Secret, and return before expiration
**So that** I can use the supplied access details without registering.

### US-05: Understand expiration and limits

**As a** Recipient
**I want** the Secret to become unavailable after expiration and to understand what that means
**So that** I do not mistake a temporary sharing window for revocation of external credentials or deletion of copies I saved.

## 5. Acceptance criteria

### AC-01 (US-01) — happy

**Given** a Sender has entered a valid Secret
**When** the Sender successfully creates it
**Then** the Sender receives a copyable Share link and a confirmed expiration time without registration.

### AC-02 (US-01) — error

**Given** a Sender has omitted the password or key, provided only whitespace in that field, or entered more than 64 KiB of Secret text
**When** the Sender attempts creation
**Then** creation is blocked with a plain-language explanation and no Share link is issued. The 64 KiB limit counts the sum of the UTF-8 encoded address, login, and password or key text before encryption, excluding the Reading code and packaging overhead. Nonempty password or key text is preserved verbatim, not trimmed or normalized.

### AC-03 (US-01) — domain invariant

**Given** a Secret contains a multiline key
**When** the Recipient reads and copies it before expiration
**Then** its characters, spaces, and line breaks are preserved without alteration.

### AC-04 (US-02) — happy

**Given** a Sender is creating a Secret
**When** creation succeeds with the default lifetime or a chosen whole number of minutes from 1 to 1440
**Then** expiration is one hour after successful creation by default, or the chosen duration after successful creation. The service establishes the creation and expiration times; changing the Recipient device clock must not extend the sharing window. The Sender can select every whole-minute value in this range with hour-snapping assistance; selecting a non-hour duration remains possible. The exact interaction is owned by screens and must not silently remove minute-level choices.

### AC-05 (US-02) — domain invariant

**Given** a Sender has entered a lifetime shorter than one minute, longer than twenty-four hours, or not a whole number of minutes
**When** the Sender attempts creation
**Then** creation is blocked and the permitted lifetime bounds are explained.

### AC-06 (US-03) — happy

**Given** a Sender enables a Reading code
**When** the Sender chooses a code or requests random generation
**Then** creation requires at least six Unicode code points of any composition, longer codes are allowed, random generation produces twenty characters drawn from Latin letters and digits, and the Reading code is not included in the Share link. There is no character-class or complexity requirement; an informational weak-code warning does not block creation. A chosen code is compared exactly, including case and spaces, without trimming or normalization.

### AC-07 (US-03) — authorization

**Given** a Secret requires a Reading code
**When** a Recipient attempts reading without the correct code
**Then** no Secret content can be seen or copied; the correct code permits reading only while the Share link remains valid. A wrong code does not permanently consume or invalidate the Share link; temporary protection against repeated attempts is specified before design approval.

### AC-08 (US-04) — happy

**Given** a Share link has not expired and its reading conditions are satisfied
**When** the Recipient explicitly chooses Show on the neutral page, on an initial or repeat visit
**Then** the Recipient can read and copy the Secret without registration while it remains available and unexpired. Opening the page alone reveals no Secret content, including in previews. Concurrent reading is permitted; no visit consumes the link.

### AC-09 (US-04) — error

**Given** a Share link is invalid or unavailable
**When** the Recipient opens it
**Then** a safe unavailability message contains no Secret fragments; simply viewing a page never consumes a valid Share link.

### AC-10 (US-05) — domain invariant

**Given** a Share link has reached expiration
**When** a Recipient attempts a new disclosure, including with the correct Reading code
**Then** the service refuses to release Secret data at or after expiration, checking the time immediately before release rather than only when reading begins. The normal application checks expiration before display and must not show a response that arrives after expiration. A running page hides displayed content locally at expiration even without network access; after suspension or a return to the page it checks expiration before redisplaying content. This is a normal-application guarantee, not remote revocation of plaintext or ciphertext and keys already obtained by a Recipient. Data released before expiration cannot be recalled while in transit.

### AC-11 (US-05) — domain invariant

**Given** a Secret has expired
**When** the service applies its retention policy
**Then** active stored ciphertext is removed within sixty seconds of expiration, and Secret content, Reading codes, and full Share links are absent from logs and backups.

### AC-11b (US-04) — error

**Given** a crash or restart has removed a Secret before its scheduled expiration
**When** a Recipient attempts to show it
**Then** the page explains that the Secret is unavailable, reveals no content, and does not offer recovery; a new Share link must be requested from the Sender.

### AC-12 (US-05) — cross-context

**Given** a Recipient has copied external access details and the Share link later expires
**When** the Recipient checks what expiration means
**Then** the service explains that it does not change external passwords or revoke external server keys, and does not claim to erase saved copies.

## 6. Non-functional requirements

These are approved targets, not results of existing tests.

| ID | Aspect | Target | Measurement |
|---|---|---|---|
| NFR-01 | Creation and reading latency and throughput | p95 at most 2 seconds at 10 operations per second for Secret text up to 64 KiB | End-to-end load test including client-side confidentiality processing; representative browser and network profile fixed before test planning |
| NFR-02 | Availability | At least 99.5% per calendar month | External synthetic creation/read checks using disposable synthetic values, never real credentials |
| NFR-03 | Expiration and erasure | Zero new releases by the service at or after expiration, checked immediately before release; zero late displays in the normal application; active ciphertext removed no later than 60 seconds after expiration, including across failure and recovery | Clock-boundary, in-flight response, concurrent-read, offline-page, suspension/resume, cleanup and crash/recovery tests; no persistent resurrection of expired content. Earlier loss of unexpired Secrets during crash or restart is permitted and is not a recovery guarantee |
| NFR-04 | Confidentiality and retention | Zero plaintext Secrets, Reading codes, or content-decryption keys in server-bound traffic, server logs, analytics, or backups; zero full Share links in logs | Network inspection, logging/analytics review, backup and restore review using canary credentials; exclude Secret records including ciphertext from backups |
| NFR-05 | Creation abuse control | At most 10 successful creations in any rolling 60-second window per network address | Boundary-burst and concurrent-creation limit tests and aggregate counters; global capacity and privacy-safe counter retention resolved before tasks. Rejected creation issues no link, preserves entered text in the current page, and explains that the Sender should wait |
| NFR-06 | Interface accessibility | Usable from 360 pixels wide; all primary actions keyboard-operable | Mobile and desktop browser checks and keyboard flow tests; exact supported browser matrix resolved before test planning |

## 6.1 Security / privacy

- **Data classification:** confidential — complete combinations of destination, login and credentials can grant access to external systems.
- **Personal data touched:** Secret address and login may identify a person or organization; password or private-key text is highly sensitive. No registration data is collected. Network addresses may be processed transiently for abuse control; metadata retention requires an explicit design decision.
- **AuthZ/AuthN impact:** anyone may create without registration. A Recipient needs possession of the complete Share link and, if enabled, the separate Reading code. No identity verification or exclusive delivery to a named client is promised. The server must not receive the keys needed to decrypt the Secret or the plaintext Reading code. Copy controls are convenience, not access revocation.
- **Threat-model boundary:** encryption protects against routine operator inspection and disclosure of stored ciphertext when keys remain unknown. It does not by itself prevent a malicious operator changing the delivered web application, compromised Recipient devices, extensions, screen capture, or an authorized Recipient retaining content. Share links must be treated as credentials. The page must explain these limits rather than promise absolute secrecy.
- **Abuse cases:**
  - Stolen link: opening a link shows a neutral page; Secret disclosure requires the explicit Show action. This is preview protection, not proof of a human or of Recipient identity. Reading code is an optional independent barrier; recommend sending it through a separate channel. Without a code, anyone possessing the complete link can read until expiration.
  - Weak or reused code: require at least six Unicode code points of any composition, with no complexity checks blocking creation, and offer a twenty-character Latin-letter-and-digit code generated with a cryptographically secure random source. The Product Owner explicitly accepted this lower minimum during UX-flow confirmation after the offline-guessing risk was explained. Informational guidance recommends the generated code but does not reject a six-character code solely for being predictable. The optional code is an additional barrier, not a guarantee against guessing: online throttling cannot prevent offline guessing of copied ciphertext. Cryptographic and resource-budget choices still require Security Lead review before implementation; do not claim strong protection based on the six-character minimum.
  - Secret or link leakage: never include readable content in link previews, page titles, analytics, logs or backups. Do not execute supplied text or automatically open supplied destinations; an address is Secret content, not a redirect instruction.
  - Anonymous resource exhaustion: enforce the approved size, lifetime and per-address creation limits; determine global storage budget and overload behavior before tasks. Shared office networks may legitimately hit the per-address limit.
  - Expiration races and recovery: check service time immediately before releasing data, reject expired releases independently of delayed cleanup, suppress late responses in the normal application, and prevent expired data from returning through restore or restart. Hide content locally offline and recheck before redisplay after suspension. Copies of ciphertext and keys acquired earlier are outside revocation guarantees, just as saved plaintext is. Earlier loss during crash or restart is allowed; this does not relax the sixty-second erasure bound. During a full outage cleanup cannot run; retained-copy and storage choices must be reviewed and any inability to meet the approved erasure bound must not be accepted silently.
- **Security review:** Required — new confidential-data handling and an anonymous link-based authorization boundary. No claim of implementation readiness until review of encryption, key handling, retention, failure behavior, and public abuse controls.

## 7. Metrics / KPIs

- **KPI-01: Valid creation success** — baseline: unknown before launch; instrument aggregate valid attempts and successes during the pilot, excluding deliberate rate-limit rejections. Target: at least 95% during the first 30 days of the pilot. Never record Secret text or full Share links.
- **KPI-02: Eligible reading success** — baseline: unknown before launch; use synthetic control scenarios with valid links and satisfied reading conditions, not content-level tracking of real clients. Target: at least 95% during the first 30 days of the pilot.
- **KPI-03: Expiration and erasure compliance** — baseline: unknown before launch; regularly create disposable synthetic Secrets and test normal expiration and recovery, recording aggregate compliance only. Target: 100% of checked samples deny new reading at expiration and meet the sixty-second erasure bound during the first 30 days of the pilot. Zero observed violations is not proof that untested paths are safe.

## 8. Open questions

- [ ] What exact cryptographic and key-handling design meets the operator-confidentiality boundary and optional Reading code, including resistance to offline guessing? Default now: no server-held content decryption keys or plaintext codes; do not invent algorithms in this spec. — owner: Security Lead, due: before design approval.
- [ ] How will the selected storage and infrastructure guarantee erasure within sixty seconds during outage, crash and recovery, including snapshots, replicas and other retained copies? Default now: exclude all Secret records from backups; loss of unexpired Secrets at crash or restart is permitted, but any inability to meet the approved erasure bound blocks implementation rather than silently relaxing it. — owner: Tech Lead, due: before design approval.
- [ ] What global resource budget, overload response, abuse-counter retention and metadata privacy rules apply to anonymous use? Default now: 64 KiB per Secret, lifetime at most twenty-four hours, at most ten creations per minute per network address; further values require approval. — owner: Tech Lead, due: before tasks.
- [ ] Which browser versions and network conditions define the reproducible quality test profile? Default now: 360-pixel minimum width, keyboard-operable primary actions, p95 two seconds at ten operations per second; size accounting and Reading code behavior are settled in AC-02 and AC-06. — owner: Tech Lead, due: before plan-tests.
- [ ] What temporary controls apply to repeated wrong Reading codes and what is the safe response to corrupted encrypted data? Default now: no partial disclosure, no permanent consumption of the Share link after a wrong code, no false success or readable fragments; exact attempt limits, delays, and error distinctions require review. — owner: Security Lead, due: before design approval.
- [ ] How are creation retries handled when the service may have created a Secret but the success response was lost? Default now: do not claim success without a confirmed Share link; do not silently extend an existing lifetime; define duplicate handling, safe retry behavior, and cleanup of unreachable creations within the existing retention limits. — owner: Tech Lead, due: before tasks.
- [ ] How will the requested lifetime slider snap to hours while still allowing every whole-minute value from one minute through twenty-four hours, with keyboard and mobile access? Default now: retain the one-hour default and full minute-level range; hour snapping is assistance, not hour-only restriction. — owner: Designer, due: before screens approval.
