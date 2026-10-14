import { afterEach, describe, expect, it } from 'vitest';
import { SendKuy, SendKuyError } from '../src';
import { fakeFetch, json } from './support';

const globals = globalThis as unknown as {
  window?: unknown;
  process: { env: Record<string, string | undefined> };
};

afterEach(() => {
  delete globals.window;
  delete globals.process.env.SENDKUY_API_KEY;
});

describe('SendKuy', () => {
  it('refuses to run in a browser unless told otherwise', () => {
    globals.window = { document: {} };

    expect(() => new SendKuy('sk_test_123')).toThrow(SendKuyError);
    expect(() => new SendKuy('sk_test_123', { dangerouslyAllowBrowser: true })).not.toThrow();
  });

  it('reads SENDKUY_API_KEY when no key is passed', async () => {
    globals.process.env.SENDKUY_API_KEY = 'sk_test_env';
    const { fetch, requests } = fakeFetch(json(200, { data: { object: 'account', id: 'usr_1' } }));

    await new SendKuy(undefined, { fetch }).account.get();

    expect(requests[0]!.headers.get('authorization')).toBe('Bearer sk_test_env');
  });

  it('follows next_cursor with the original params', async () => {
    const { fetch, requests } = fakeFetch(
      json(200, { data: [{ id: 'con_1' }], meta: { has_more: true, next_cursor: '1287' } }),
      json(200, { data: [{ id: 'con_2' }], meta: { has_more: false, next_cursor: null } })
    );
    const page = await new SendKuy('sk_test_123', { fetch }).contacts.list({ limit: 1 });
    const ids: string[] = [];

    for await (const contact of page.autoPaginate()) {
      ids.push(contact.id);
    }

    expect(ids).toEqual(['con_1', 'con_2']);
    expect(Object.fromEntries(requests[1]!.url.searchParams)).toEqual({
      limit: '1',
      starting_after: '1287',
    });
  });

  it('refuses an empty or dot id before any request', async () => {
    const { fetch, requests } = fakeFetch();
    const sendkuy = new SendKuy('sk_test_123', { fetch });

    for (const id of ['', '.', '..']) {
      await expect(
        sendkuy.groups.addContacts(id, { contacts: ['con_1'] } as never)
      ).rejects.toBeInstanceOf(SendKuyError);
    }

    expect(requests).toHaveLength(0);
  });

  it('accepts a Date for date params', async () => {
    const { fetch, requests } = fakeFetch(
      json(200, { data: [], meta: { has_more: false, next_cursor: null } })
    );

    await new SendKuy('sk_test_123', { fetch }).messages.list({
      created_after: new Date('2026-10-14T03:00:00Z'),
    });

    expect(requests[0]!.url.searchParams.get('created_after')).toBe('2026-10-14T03:00:00.000Z');
  });

  it('encodes an id into a single path segment', async () => {
    const { fetch, requests } = fakeFetch(json(200, { data: { id: 'x_1' } }));

    await new SendKuy('sk_test_123', { fetch }).messages.get('msg_1/../account\n');

    expect(requests[0]!.url.pathname).toBe('/api/v1/messages/msg_1%2F..%2Faccount%0A');
  });
});
