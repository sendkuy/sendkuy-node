import { describe, expect, it } from 'vitest';
import spec from '../spec/openapi.json';
import vectors from '../spec/webhook-vectors.json';
import { WEBHOOK_EVENTS, verifyWebhook } from '../src/webhook';

describe('verifyWebhook', () => {
  it.each(vectors.map((vector) => [vector.name, vector] as const))(
    'matches the server on %s',
    async (_name, vector) => {
      const result = verifyWebhook({
        payload: vector.payload,
        signature: vector.header,
        secret: vector.secret,
        tolerance: vector.tolerance,
        now: vector.now,
      });

      if (vector.reason === null) {
        await expect(result).resolves.toEqual(JSON.parse(vector.payload));
      } else {
        await expect(result).rejects.toMatchObject({
          name: 'SignatureVerificationError',
          reason: vector.reason,
        });
      }
    }
  );

  it('refuses an empty secret with a clear error', async () => {
    await expect(
      verifyWebhook({ payload: '{}', signature: `t=1,v1=${'a'.repeat(64)}`, secret: '' })
    ).rejects.toMatchObject({ name: 'SendKuyError', message: expect.stringContaining('whsec_') });
  });

  it('accepts the raw body as bytes', async () => {
    const vector = vectors.find((candidate) => candidate.name === 'unicode_raw')!;

    await expect(
      verifyWebhook({
        payload: new TextEncoder().encode(vector.payload),
        signature: vector.header,
        secret: vector.secret,
        now: vector.now,
      })
    ).resolves.toEqual(JSON.parse(vector.payload));
  });

  it('knows every event the API can send', () => {
    const events = (spec as unknown as { 'x-webhook-events': { events: Array<{ name: string }> } })[
      'x-webhook-events'
    ].events.map((event) => event.name);

    expect([...WEBHOOK_EVENTS]).toEqual(events);
  });
});
