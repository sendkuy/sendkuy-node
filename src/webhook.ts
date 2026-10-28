import { SendKuyError, SignatureVerificationError } from './errors';

export const WEBHOOK_EVENTS = [
  'message.sent',
  'message.delivered',
  'message.opened',
  'message.clicked',
  'message.replied',
  'message.bounced',
  'message.failed',
  'message.received',
  'campaign.completed',
  'campaign.paused',
  'contact.created',
  'contact.updated',
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEvent {
  event: WebhookEventName;
  created_at: string;
  test?: boolean;
  data: Record<string, unknown>;
}

export interface VerifyWebhookParams {
  payload: string | Uint8Array;
  signature: string | null | undefined;
  secret: string;
  tolerance?: number;
  now?: number;
}

const HEADER = /^t=(\d+),v1=([a-f0-9]{64})$/;
const PHP_TRIM = /^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g;
const encoder = new TextEncoder();

export async function verifyWebhook(params: VerifyWebhookParams): Promise<WebhookEvent> {
  if (!params.secret) {
    throw new SendKuyError('Pass the webhook endpoint secret, whsec_…, to verifyWebhook().');
  }

  const tolerance = params.tolerance ?? 300;
  const match = HEADER.exec((params.signature ?? '').replace(PHP_TRIM, ''));

  if (!match) {
    throw new SignatureVerificationError(
      'malformed_header',
      'The X-SendKuy-Signature header is missing or not shaped t={timestamp},v1={signature}.'
    );
  }

  const timestamp = Number.parseInt(match[1] ?? '', 10);
  const now = params.now ?? Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > tolerance) {
    throw new SignatureVerificationError(
      'timestamp_out_of_tolerance',
      `The signature is more than ${tolerance} seconds from now. Check the server clock, or this delivery is a replay.`
    );
  }

  const body = typeof params.payload === 'string' ? encoder.encode(params.payload) : params.payload;
  const prefix = encoder.encode(`${timestamp}.`);
  const signed = new Uint8Array(prefix.length + body.length);
  signed.set(prefix);
  signed.set(body, prefix.length);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(params.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  if (!(await crypto.subtle.verify('HMAC', key, hexToBytes(match[2] ?? ''), signed))) {
    throw new SignatureVerificationError(
      'signature_mismatch',
      'The signature does not match. Use the endpoint secret in full, including whsec_, and the raw request body before any JSON parsing.'
    );
  }

  let event: unknown = null;

  try {
    event = JSON.parse(
      typeof params.payload === 'string' ? params.payload : new TextDecoder().decode(params.payload)
    );
  } catch {}

  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new SignatureVerificationError(
      'invalid_payload',
      'The request body is not a JSON object.'
    );
  }

  return event as WebhookEvent;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}
