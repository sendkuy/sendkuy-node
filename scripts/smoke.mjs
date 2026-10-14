import { SendKuy, verifyWebhook } from '../dist/index.js';
import vectors from '../spec/webhook-vectors.json' with { type: 'json' };

for (const vector of vectors) {
  let reason = null;

  try {
    await verifyWebhook({
      payload: vector.payload,
      signature: vector.header,
      secret: vector.secret,
      tolerance: vector.tolerance,
      now: vector.now,
    });
  } catch (error) {
    reason = error.reason ?? String(error);
  }

  if (reason !== vector.reason) {
    throw new Error(`webhook vector ${vector.name}: expected ${vector.reason}, got ${reason}`);
  }
}

const sendkuy = new SendKuy('sk_test_smoke', {
  fetch: async () =>
    new Response(JSON.stringify({ data: { object: 'account', id: 'usr_smoke' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
});

const account = await sendkuy.account.get();

if (account.id !== 'usr_smoke') {
  throw new Error(`expected usr_smoke, got ${account.id}`);
}

console.log(`smoke ok: ${vectors.length} webhook vectors and one request`);
