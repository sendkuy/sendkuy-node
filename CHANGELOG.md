# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Version 1.x speaks SendKuy API v1.

## [1.0.0] - 2026-10-14

### Added

- A method for each of the 61 operations of the SendKuy API v1, with types generated from the API contract.
- Automatic idempotency keys, reused across retries of the same call.
- Retries for network errors, timeouts, 429, 5xx and in-progress idempotency conflicts; caller aborts are never retried.
- Typed errors carrying the error code, parameter, documentation link and request id.
- Cursor pagination with `autoPaginate()`.
- `verifyWebhook()` on Web Crypto, for Node.js, Bun, Deno and edge runtimes.
- A guard that refuses to run in a browser unless `dangerouslyAllowBrowser` is set.
