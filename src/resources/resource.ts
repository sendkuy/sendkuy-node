import { SendKuyError } from '../errors';
import { Page } from '../page';
import type { Query, RequestOptions, SendInit, Transport } from '../transport';

export abstract class Resource {
  protected readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  protected async item<T>(
    method: string,
    path: string,
    init: SendInit = {},
    options?: RequestOptions
  ): Promise<T> {
    const response = (await this.transport.send(method, path, init, options)) as { data?: unknown };
    return response.data as T;
  }

  protected async items<T>(
    method: string,
    path: string,
    init: SendInit = {},
    options?: RequestOptions
  ): Promise<T[]> {
    const response = (await this.transport.send(method, path, init, options)) as { data?: unknown };
    return Array.isArray(response.data) ? (response.data as T[]) : [];
  }

  protected async page<T>(
    path: string,
    query: Query = {},
    options?: RequestOptions
  ): Promise<Page<T>> {
    const response = (await this.transport.send('GET', path, { query }, options)) as {
      data?: unknown;
      meta?: { has_more?: unknown; next_cursor?: unknown };
    };
    const cursor = response.meta?.next_cursor;

    return new Page<T>(
      Array.isArray(response.data) ? (response.data as T[]) : [],
      response.meta?.has_more === true,
      typeof cursor === 'string' ? cursor : typeof cursor === 'number' ? String(cursor) : null,
      (next) => this.page<T>(path, { ...query, starting_after: next }, options)
    );
  }
}

export function encode(id: string): string {
  if (id === '' || id === '.' || id === '..') {
    throw new SendKuyError(
      `"${id}" is not a SendKuy id. Pass the id SendKuy returned, such as msg_….`
    );
  }

  return encodeURIComponent(id);
}
