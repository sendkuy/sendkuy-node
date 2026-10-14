# Contributing

Thank you for helping improve SendKuy for Node.js.

## Setup

```bash
npm install
npm test
npm run typecheck
npm run build
npm run lint:package
```

## How the SDK stays in sync with the API

`spec/openapi.json` is a copy of the SendKuy API contract, and `spec/operations.json` names the method for each operation. Both are synced by the SendKuy team, so please do not edit them by hand. `src/generated/openapi.ts` comes from `npm run generate`. `test/contract.test.ts` calls every operation in the spec and fails when a method is missing or points at the wrong route.

## Pull requests

- Keep each pull request to one change, with a test when behaviour changes.
- Use only APIs available in Node.js 20.3+, Bun, Deno and edge runtimes. `tsconfig.json` leaves Node's types out on purpose, so `Buffer` or `node:*` imports fail to compile.
- Use [Conventional Commits](https://www.conventionalcommits.org/) in English, for example `fix(webhook): accept a Uint8Array payload`.
- Make sure `npm test`, `npm run typecheck`, `npm run format:check` and `npm run lint:package` pass.
