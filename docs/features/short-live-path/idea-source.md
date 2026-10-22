# Idea source — short-live-path

Interview depth: medium

## Original idea (verbatim)

> мені потрібно клієнтам передавати паролі або доступа по посиланню. Це посилання має дити обмежений час. Дані не повині збрігатись в подальшому в цьому сервісі.

## Content examples (verbatim)

> ну наприклад потірбно предати доступ до адмінки, де має бути посилання, логін і пароль
> або доступ до сервера, де ма бути якесь посиалння, і якийсь ключ

## Confirmed lifecycle

Repeated viewing until expiration; not one-time disclosure.

## Lifetime (verbatim)

> той хто створбює це посилання маж мати можливість виставити час життя, але не більше 24 годин, по замовчуванню 1 година

## Additional confirmed decisions

- Anyone may create Share links without registration.
- Text only; no file uploads in v1. Address and login are optional; password or multiline key text is required. Preserve key line breaks.
- Maximum Secret text size: 64 KiB.
- Lifetime: whole minutes from 1 to 1440; default 60, starting at successful creation.
- Encrypt before sending to the server; the server must not possess the content decryption key. Explicit limitation: this alone cannot defeat a malicious operator replacing the browser application.
- Optional Reading code is included in v1. Initially agreed minimum: 12 characters; superseded by Product Owner during UX-flow confirmation to at least 6 arbitrary Unicode code points, without blocking complexity requirements, with longer codes allowed and twenty-character random generation retained. See edits-log.json for explicit risk acceptance. Code is separate from the Share link and should be sent through a separate message or channel. Lost codes cannot be recovered by the service.
- Glossary meanings confirmed; feature size M and route standard confirmed.
- No additional source selected; no external private documents read.

## Final confirmed scope and quality targets

- Exact expiry policy confirmed: no new disclosure at expiry; remove active ciphertext within 60 seconds, excluding secrets from logs and backups.
- Sender-initiated early removal is out of scope for v1.
- User approved proposed US-01–US-05, AC-01–AC-12, NFR-01–NFR-06, and KPI-01–KPI-03 in the interview. Approved baseline is preserved in spec.md; these are requirements and targets, not execution results.

## Completed specification gates

- Product approach and explicit security limitations confirmed after comparison with official product documentation.
- Independent critic completed: NO_CONTESTED_DECISIONS.
- Structural scan passed. Four owned design/test-profile questions remain in spec.md section 8; they do not silently relax the approved requirements.
