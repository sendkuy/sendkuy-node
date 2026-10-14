import { describe, expect, it } from 'vitest';
import pkg from '../package.json';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ConnectionError,
  InvalidRequestError,
  RateLimitError,
  SendKuyError,
} from '../src/errors';
import { Transport, type ClientOptions } from '../src/transport';
import { VERSION } from '../src/version';
import { fakeFetch, json } from './support';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function setup(replies: Array<Response | Error>, options: ClientOptions = {}) {
  const { fetch, requests } = fakeFetch(...replies);
  const sleeps: number[] = [];
  const transport = new Transport('sk_test_123', {
    fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    ...options,
  });

  return { transport, requests, sleeps };
}

function error(status: number, type: string, code: string, headers: Record<string, string> = {}) {
  return json(
    status,
    {
      error: {
        type,
        code,
        message: 'The field to is required.',
        param: 'to',
        doc_url: `https://docs.sendkuy.com/errors#${code}`,
      },
    },
    { 'x-request-id': 'req_123', ...headers }
  );
}

describe('Transport', () => {
  it('keeps VERSION in step with package.json', () => {
    expect(VERSION).toBe(pkg.version);
  });

  it('sends the key and user agent to a self-hosted base URL', async () => {
    const { transport, requests } = setup([json(200, { data: {} })], {
      baseUrl: 'https://sendkuy.example.com/api/v1/',
    });

    await transport.send('GET', '/account');

    expect(requests[0]!.url.href).toBe('https://sendkuy.example.com/api/v1/account');
    expect(requests[0]!.headers.get('authorization')).toBe('Bearer sk_test_123');
    expect(requests[0]!.headers.get('user-agent')).toMatch(
      new RegExp(`^sendkuy-node/${VERSION} node/`)
    );
  });

  it('retries connection and server errors with the same idempotency key', async () => {
    const { transport, requests, sleeps } = setup([
      new TypeError('fetch failed'),
      error(503, 'api_error', 'internal_error'),
      json(201, { data: [] }),
    ]);

    await transport.send('POST', '/messages', { body: { body: 'Hi' } });

    expect(requests).toHaveLength(3);
    const key = requests[0]!.headers.get('idempotency-key');
    expect(key).toMatch(UUID_V4);
    expect(requests[1]!.headers.get('idempotency-key')).toBe(key);
    expect(requests[2]!.headers.get('idempotency-key')).toBe(key);
    expect(sleeps).toHaveLength(2);
    expect(sleeps[0]).toBeGreaterThanOrEqual(250);
    expect(sleeps[0]).toBeLessThanOrEqual(500);
    expect(sleeps[1]).toBeGreaterThanOrEqual(500);
    expect(sleeps[1]).toBeLessThanOrEqual(1000);
  });

  it('waits for Retry-After on 429', async () => {
    const { transport, sleeps } = setup([
      error(429, 'rate_limit_error', 'rate_limit_exceeded', { 'retry-after': '2' }),
      json(200, { data: {} }),
    ]);

    await transport.send('GET', '/account');

    expect(sleeps).toEqual([2000]);
  });

  it('throws at once when Retry-After is over a minute', async () => {
    const { transport, requests, sleeps } = setup([
      error(429, 'rate_limit_error', 'rate_limit_exceeded', { 'retry-after': '120' }),
    ]);

    await expect(
      transport.send('POST', '/verifications', { body: { to: '+6281234567890' } })
    ).rejects.toMatchObject({ name: 'RateLimitError', retryAfter: 120 });
    expect(requests).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  it('falls back to backoff when Retry-After is not seconds', async () => {
    const { transport, sleeps } = setup([
      error(429, 'rate_limit_error', 'rate_limit_exceeded', {
        'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT',
      }),
      json(200, { data: {} }),
    ]);

    await transport.send('GET', '/account');

    expect(sleeps).toHaveLength(1);
    expect(sleeps[0]).toBeGreaterThanOrEqual(250);
    expect(sleeps[0]).toBeLessThanOrEqual(500);
  });

  it('retries a request still in progress', async () => {
    const { transport, requests } = setup([
      error(409, 'invalid_request_error', 'idempotency_request_in_progress'),
      json(201, { data: [] }),
    ]);

    await transport.send(
      'POST',
      '/messages',
      { body: { body: 'Hi' } },
      { idempotencyKey: 'order-1042' }
    );

    expect(requests).toHaveLength(2);
  });

  it('gives up after maxRetries', async () => {
    const { transport, requests } = setup([
      error(503, 'api_error', 'internal_error'),
      error(503, 'api_error', 'internal_error'),
      error(503, 'api_error', 'internal_error'),
    ]);

    await expect(transport.send('GET', '/account')).rejects.toBeInstanceOf(ApiError);
    expect(requests).toHaveLength(3);
  });

  it('does not retry other client errors and keeps every field', async () => {
    const { transport, requests } = setup([
      error(422, 'invalid_request_error', 'validation_failed'),
    ]);

    const failure = await transport
      .send('POST', '/messages', { body: { channel: 'whatsapp' } })
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(InvalidRequestError);
    expect(failure).toMatchObject({
      code: 'validation_failed',
      type: 'invalid_request_error',
      param: 'to',
      docUrl: 'https://docs.sendkuy.com/errors#validation_failed',
      requestId: 'req_123',
      status: 422,
      message: 'The field to is required.',
    });
    expect(requests).toHaveLength(1);
  });

  it('uses the given idempotency key and none for reads', async () => {
    const { transport, requests } = setup([json(201, { data: [] }), json(200, { data: [] })]);

    await transport.send(
      'POST',
      '/messages',
      { body: { body: 'Hi' } },
      { idempotencyKey: 'order-1042' }
    );
    await transport.send('GET', '/messages');

    expect(requests[0]!.headers.get('idempotency-key')).toBe('order-1042');
    expect(requests[1]!.headers.has('idempotency-key')).toBe(false);
  });

  it.each([
    ['authentication_error', AuthenticationError],
    ['authorization_error', AuthorizationError],
    ['invalid_request_error', InvalidRequestError],
    ['rate_limit_error', RateLimitError],
    ['api_error', ApiError],
    ['quota_error', SendKuyError],
  ] as const)('picks the error class for %s', async (type, Klass) => {
    const { transport } = setup([error(400, type, 'request_refused')], { maxRetries: 0 });

    const failure = await transport.send('GET', '/account').catch((e: unknown) => e);

    expect((failure as object).constructor).toBe(Klass);
  });

  it('maps a failure without an error envelope by status', async () => {
    const { transport } = setup(
      [
        new Response('<html>Bad gateway</html>', {
          status: 502,
          headers: { 'content-type': 'text/html' },
        }),
      ],
      { maxRetries: 0 }
    );

    const failure = await transport.send('GET', '/account').catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ code: null, message: 'HTTP 502: <html>Bad gateway</html>' });
  });

  it('serializes dates, booleans and nulls into the query', async () => {
    const { transport, requests } = setup([json(200, { data: [] })]);

    await transport.send('GET', '/messages', {
      query: { created_after: new Date('2026-10-14T03:00:00Z'), flag: true, missing: null },
    });

    expect(Object.fromEntries(requests[0]!.url.searchParams)).toEqual({
      created_after: '2026-10-14T03:00:00.000Z',
      flag: 'true',
    });
  });

  it('retries a body that fails mid-read with the same idempotency key', async () => {
    const broken = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new DOMException('timed out', 'TimeoutError'));
        },
      }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );
    const { transport, requests } = setup([broken, json(201, { data: [] })]);

    await expect(transport.send('POST', '/messages', { body: { body: 'Hi' } })).resolves.toEqual({
      data: [],
    });
    expect(requests).toHaveLength(2);
    expect(requests[1]!.headers.get('idempotency-key')).toBe(
      requests[0]!.headers.get('idempotency-key')
    );
  });

  it('stops waiting when the caller aborts during a backoff', async () => {
    const controller = new AbortController();
    const { fetch, requests } = fakeFetch(
      error(429, 'rate_limit_error', 'rate_limit_exceeded', { 'retry-after': '5' })
    );
    const transport = new Transport('sk_test_123', {
      fetch,
      sleep: () => {
        controller.abort();
        return new Promise<void>(() => {});
      },
    });

    await expect(
      transport.send('GET', '/account', {}, { signal: controller.signal })
    ).rejects.toBeInstanceOf(ConnectionError);
    expect(requests).toHaveLength(1);
  });

  it('names the root cause when the connection fails', async () => {
    const refused = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), {
        code: 'ECONNREFUSED',
      }),
    });
    const { transport } = setup([refused], { maxRetries: 0 });

    await expect(transport.send('GET', '/account')).rejects.toMatchObject({
      name: 'ConnectionError',
      message: 'Could not reach SendKuy: fetch failed (ECONNREFUSED)',
    });
  });

  it('does not retry a request the caller aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const { transport, requests, sleeps } = setup([new DOMException('aborted', 'AbortError')]);

    await expect(
      transport.send('GET', '/account', {}, { signal: controller.signal })
    ).rejects.toBeInstanceOf(ConnectionError);
    expect(requests).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });
});
