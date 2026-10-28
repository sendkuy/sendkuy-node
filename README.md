<p align="center">
  <a href="https://sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node">
    <img src="https://raw.githubusercontent.com/sendkuy/sendkuy-node/main/art/banner.png" alt="SendKuy for Node.js" width="100%">
  </a>
</p>

# SendKuy for Node.js

Send WhatsApp, SMS and email from Node.js, Bun, Deno and edge runtimes, with typed responses and retries that never send twice.

[![npm](https://img.shields.io/npm/v/sendkuy)](https://www.npmjs.com/package/sendkuy)
[![Downloads](https://img.shields.io/npm/dm/sendkuy)](https://www.npmjs.com/package/sendkuy)
[![CI](https://github.com/sendkuy/sendkuy-node/actions/workflows/ci.yml/badge.svg)](https://github.com/sendkuy/sendkuy-node/actions/workflows/ci.yml)
[![Types included](https://img.shields.io/badge/types-included-blue)](src/types.ts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Baca dalam Bahasa Indonesia](README.id.md)

## What you can send

- **WhatsApp** from a number connected by QR code, the [SendKuy WA Gateway Chrome extension](https://chromewebstore.google.com/detail/sendkuy-wa-gateway/kdopgnbocfeoehhjbolfmibnmoicdofc), or the WhatsApp Cloud API ([WhatsApp API](https://sendkuy.com/channels/whatsapp?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)).
- **SMS** through an Android phone running SendKuy Gateway, or an SMS provider ([SMS gateway](https://sendkuy.com/channels/sms?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)).
- **Email** from your own domain ([email API](https://sendkuy.com/channels/email?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)).
- **OTP codes** with `verifications`, falling back from WhatsApp to SMS.
- **Bulk sends** to several recipients or a batch of up to 500, paced per number for you.
- **Two-way conversations** for your helpdesk: incoming messages arrive as `message.received` webhooks.

## Install

```bash
npm i sendkuy
```

Zero dependencies: the SDK uses only `fetch` and Web Crypto. CI tests Node.js 20.3+, Bun and Deno on every change, and Cloudflare Workers and Vercel Edge provide the same two APIs. ESM and CommonJS both work. Date parameters such as `created_after` and `schedule_at` accept a `Date` or an ISO 8601 string with a time zone offset.

## Quickstart

```ts
import { SendKuy } from 'sendkuy';

const sendkuy = new SendKuy(); // reads SENDKUY_API_KEY

const [message] = await sendkuy.messages.send({
  channel: 'whatsapp',
  to: ['+6281234567890'],
  body: 'Your order is on its way.',
});

console.log(message.id); // msg_...
```

Create a key in the [SendKuy dashboard](https://app.sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node) under **Developers → Keys**. Numbers go in E.164 form, with the leading `+`. You get one message back per recipient.

## Every endpoint has a method

Field names are the API's own, so every example in the [API reference](https://docs.sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node) maps one to one onto this SDK, and TypeScript checks your parameters against the same contract.

| Group           | Methods                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `account`       | `get`, `usage`                                                                                      |
| `messages`      | `list`, `send`, `sendBatch`, `get`, `cancel`, `resend`                                              |
| `numbers`       | `check`                                                                                             |
| `verifications` | `create`, `get`, `check`                                                                            |
| `jobs`          | `get`                                                                                               |
| `contacts`      | `list`, `create`, `bulkImport`, `lookup`, `get`, `update`, `delete`, `listAttributes`               |
| `groups`        | `list`, `create`, `get`, `update`, `delete`, `addContacts`, `removeContacts`                        |
| `templates`     | `list`, `create`, `get`, `update`, `delete`                                                         |
| `gateways`      | `list`, `get`                                                                                       |
| `webhooks`      | `list`, `create`, `get`, `update`, `delete`, `listDeliveries`                                       |
| `campaigns`     | `list`, `create`, `get`, `update`, `delete`, `listDispatches`, `start`, `pause`, `resume`, `cancel` |
| `conversations` | `list`, `get`, `listMessages`, `markRead`, `reply`                                                  |
| `workflows`     | `list`, `get`, `listExecutions`, `trigger`                                                          |
| `executions`    | `get`                                                                                               |

An endpoint newer than your SDK version is still one call away: `await sendkuy.request({ method: 'GET', path: '/account' })`.

## Retries and idempotency

A timeout tells you nothing about whether a message went out. That is why every write this SDK sends carries an `Idempotency-Key`, and every retry of that call reuses it: if the first attempt did go through, SendKuy answers the retry with the first result instead of sending again.

The SDK retries network errors, timeouts, `429` (waiting for `Retry-After` when it is a minute or less), `5xx` and `409 idempotency_request_in_progress`, up to twice, with exponential backoff. A request you abort with your own `signal` is never retried.

When your own code retries, pass a key derived from something stable in your system:

```ts
await sendkuy.messages.send(params, { idempotencyKey: 'order-1042-shipped' });
```

| Option       | Default                          |                                                           |
| ------------ | -------------------------------- | --------------------------------------------------------- |
| `baseUrl`    | `https://app.sendkuy.com/api/v1` | change it only to reach a proxy or a mock server in tests |
| `timeout`    | `30000`                          | milliseconds; also per request                            |
| `maxRetries` | `2`                              |                                                           |
| `fetch`      | `globalThis.fetch`               | for proxies and tests                                     |

## Pagination

```ts
const page = await sendkuy.contacts.list({ limit: 100 });

for await (const contact of page.autoPaginate()) {
  console.log(contact.id);
}
```

## Errors

```ts
import { InvalidRequestError, RateLimitError, SendKuyError } from 'sendkuy';

try {
  await sendkuy.messages.send(params);
} catch (error) {
  if (error instanceof InvalidRequestError && error.code === 'validation_failed') {
    console.log(error.param); // to
  } else if (error instanceof RateLimitError) {
    console.log(error.retryAfter); // seconds
  } else if (error instanceof SendKuyError) {
    console.log(error.requestId); // quote it when you contact support
  }
}
```

`error.code` autocompletes every code the API can answer with. Branch on it, never on the message.

## Webhooks

Verify against the raw body, before any JSON parsing:

```ts
// app/api/sendkuy/route.ts (Next.js)
import { verifyWebhook, type ReceivedMessage } from 'sendkuy';

export async function POST(request: Request) {
  try {
    const event = await verifyWebhook({
      payload: await request.text(),
      signature: request.headers.get('x-sendkuy-signature'),
      secret: process.env.SENDKUY_WEBHOOK_SECRET!,
    });

    if (event.event === 'message.received') {
      const message = event.data as ReceivedMessage;
      // message.from, message.channel, message.body, message.provider_message_id
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 403 });
  }
}
```

With Express, read the body raw: `app.post('/sendkuy', express.raw({ type: 'application/json' }), …)` and pass `req.body` as `payload`.

`x-sendkuy-event-id` stays the same across SendKuy's retries of one delivery: use it to skip duplicates. Use the endpoint secret in full, `whsec_` included, and answer within 10 seconds.

`message.received` carries who wrote (`from`), the channel, the number that received it and any media. When your account forwards incoming messages to your webhook only, nothing is stored in SendKuy and `id` and `conversation_id` are `null`: reply with `sendkuy.messages.send({ channel: message.channel, to: [message.from], body })`.

## Server-side only

Your API key can send messages and spend credit. The SDK refuses to start in a browser, because anyone who opens the page could read the key. Call SendKuy from your server, an API route or an edge function instead.

## Testing your code

```ts
const sendkuy = new SendKuy('sk_test_123', { fetch: yourFakeFetch });
```

## Links

- [Documentation](https://docs.sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)
- [SendKuy](https://sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)
- [Support](https://sendkuy.com/contact?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node)
- [Changelog](CHANGELOG.md)

## License

MIT. See [LICENSE](LICENSE).
