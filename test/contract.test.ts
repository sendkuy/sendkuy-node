import { describe, expect, it } from 'vitest';
import operations from '../spec/operations.json';
import spec from '../spec/openapi.json';
import { Page, SendKuy } from '../src';
import { fakeFetch, json } from './support';

type Parameter = { $ref?: string; in?: string };
type Operation = {
  operationId: string;
  requestBody?: unknown;
  parameters?: Parameter[];
  responses: Record<
    string,
    { content?: { 'application/json'?: { schema?: { allOf?: Array<{ $ref?: string }> } } } }
  >;
};

const doc = spec as unknown as {
  paths: Record<string, Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', Operation>>>;
  components: { parameters: Record<string, { in: string }> };
};
const map = operations as Record<string, string>;
const PROBE = { probe: 'value' };
const REPLIES: Record<string, unknown> = {
  ItemEnvelope: { data: { id: 'x_1' } },
  ListEnvelope: { data: [{ id: 'x_1' }] },
  CollectionEnvelope: { data: [{ id: 'x_1' }], meta: { has_more: false, next_cursor: null } },
};

const cases = Object.entries(doc.paths).flatMap(([path, item]) =>
  (['get', 'post', 'put', 'patch', 'delete'] as const)
    .filter((verb) => item[verb] !== undefined)
    .map((verb) => ({ path, verb: verb.toUpperCase(), operation: item[verb]! }))
);

function envelope(operation: Operation): string {
  const status = Object.keys(operation.responses).find((code) => code.startsWith('2'))!;
  const parts = operation.responses[status]!.content!['application/json']!.schema!.allOf!;
  return parts
    .find((part) => part.$ref)!
    .$ref!.split('/')
    .at(-1)!;
}

function hasQuery(operation: Operation): boolean {
  return (operation.parameters ?? []).some((parameter) => {
    const resolved = parameter.$ref
      ? doc.components.parameters[parameter.$ref.split('/').at(-1)!]
      : parameter;
    return resolved?.in === 'query';
  });
}

describe('every operation in the spec', () => {
  it('has exactly one entry in operations.json', () => {
    expect(Object.keys(map).sort()).toEqual(cases.map((c) => c.operation.operationId).sort());
  });

  it.each(cases.map((c) => [c.operation.operationId, c] as const))(
    '%s reaches its route and returns its envelope',
    async (operationId, { path, verb, operation }) => {
      const [group, method] = map[operationId]!.split('.') as [string, string];
      const kind = envelope(operation);
      const { fetch, requests } = fakeFetch(json(200, REPLIES[kind]));
      const sendkuy = new SendKuy('sk_test_123', { fetch });
      const withBody = operation.requestBody !== undefined;
      const withQuery = hasQuery(operation);
      const args: unknown[] = Array.from(
        { length: (path.match(/\{/g) ?? []).length },
        () => 'obj_123'
      );

      if (withBody || withQuery) args.push(PROBE);

      const resource = (
        sendkuy as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>
      )[group]!;
      const result = await resource[method]!.apply(resource, args);
      const request = requests[0]!;

      expect(request.method).toBe(verb);
      expect(request.url.pathname).toBe(`/api/v1${path.replaceAll('{id}', 'obj_123')}`);

      if (withBody) {
        expect(JSON.parse(request.body!)).toEqual(PROBE);
      } else {
        expect(request.body).toBeUndefined();
      }

      if (withQuery) {
        expect(Object.fromEntries(request.url.searchParams)).toEqual(PROBE);
      }

      if (kind === 'CollectionEnvelope') {
        expect(result).toBeInstanceOf(Page);
        expect((result as Page<unknown>).data).toEqual([{ id: 'x_1' }]);
      } else if (kind === 'ListEnvelope') {
        expect(result).toEqual([{ id: 'x_1' }]);
      } else {
        expect(result).toEqual({ id: 'x_1' });
      }
    }
  );

  it('exposes no resource method outside operations.json', () => {
    const sendkuy = new SendKuy('sk_test_123', { fetch: fakeFetch().fetch });
    const found = Object.entries(sendkuy).flatMap(([group, resource]) =>
      Object.getOwnPropertyNames(Object.getPrototypeOf(resource))
        .filter((name) => name !== 'constructor')
        .map((name) => `${group}.${name}`)
    );

    expect(found.sort()).toEqual(Object.values(map).sort());
  });
});
