import { ApiError, ConnectionError, type SendKuyError, errorFromResponse } from './errors';
import { VERSION } from './version';

export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
  dangerouslyAllowBrowser?: boolean;
  sleep?: (ms: number) => Promise<void>;
}

export interface RequestOptions {
  idempotencyKey?: string;
  timeout?: number;
  signal?: AbortSignal;
}

export type Query = Record<string, unknown>;

export interface SendInit {
  query?: Query;
  body?: unknown;
}

export const DEFAULT_BASE_URL = 'https://app.sendkuy.com/api/v1';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_RETRY_AFTER = 60;

type Globals = {
  window?: { document?: unknown };
  process?: { env?: Record<string, string | undefined>; versions?: { node?: string } };
  Bun?: { version?: string };
  Deno?: { version?: { deno?: string } };
};

const globals = globalThis as unknown as Globals;

export function isBrowser(): boolean {
  return globals.window !== undefined && globals.window.document !== undefined;
}

export function envApiKey(): string | undefined {
  try {
    return globals.process?.env?.SENDKUY_API_KEY;
  } catch {
    return undefined;
  }
}

function runtime(): string {
  if (globals.Bun?.version) return `bun/${globals.Bun.version}`;
  if (globals.Deno?.version?.deno) return `deno/${globals.Deno.version.deno}`;
  if (globals.process?.versions?.node) return `node/${globals.process.versions.node}`;
  return 'unknown';
}

export class Transport {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #timeout: number;
  readonly #maxRetries: number;
  readonly #fetch: typeof fetch;
  readonly #sleep: (ms: number) => Promise<void>;
  readonly #userAgent: string | null;

  constructor(apiKey: string, options: ClientOptions = {}) {
    this.#apiKey = apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.#timeout = options.timeout ?? 30_000;
    this.#maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.#fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.#userAgent = isBrowser() ? null : `sendkuy-node/${VERSION} ${runtime()}`;
  }

  async send(
    method: string,
    path: string,
    init: SendInit = {},
    options: RequestOptions = {}
  ): Promise<unknown> {
    const verb = method.toUpperCase();
    const key = options.idempotencyKey ?? (WRITES.has(verb) ? crypto.randomUUID() : undefined);
    const url = this.#url(path, init.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.#apiKey}`,
    };

    if (this.#userAgent !== null) headers['User-Agent'] = this.#userAgent;
    if (key !== undefined) headers['Idempotency-Key'] = key;

    let body: string | undefined;

    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.body);
    }

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      let text: string;

      try {
        response = await this.#fetch(url, {
          method: verb,
          headers,
          body,
          signal: this.#signal(options),
        });
        text = await response.text();
      } catch (cause) {
        if (options.signal?.aborted) {
          throw new ConnectionError('The request was aborted.', { cause });
        }

        if (attempt < this.#maxRetries) {
          await this.#pause(backoff(attempt), options.signal);
          continue;
        }

        throw new ConnectionError(`Could not reach SendKuy: ${describe(cause)}`, { cause });
      }

      if (response.ok) return parse(response, text);

      const error = errorFromResponse(response, text);
      const delay = attempt < this.#maxRetries ? retryDelay(error, attempt) : null;

      if (delay === null) throw error;

      await this.#pause(delay, options.signal);
    }
  }

  async #pause(ms: number, signal: AbortSignal | undefined): Promise<void> {
    if (signal?.aborted) {
      throw new ConnectionError('The request was aborted.', { cause: signal.reason });
    }

    if (signal === undefined) return this.#sleep(ms);

    await new Promise<void>((resolve, reject) => {
      const onAbort = () =>
        reject(new ConnectionError('The request was aborted.', { cause: signal.reason }));

      signal.addEventListener('abort', onAbort, { once: true });
      this.#sleep(ms).then(
        () => {
          signal.removeEventListener('abort', onAbort);
          resolve();
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
      );
    });
  }

  #signal(options: RequestOptions): AbortSignal {
    const timeout = AbortSignal.timeout(options.timeout ?? this.#timeout);
    return options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  }

  #url(path: string, query: Query = {}): string {
    const params = new URLSearchParams();

    for (const [name, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.append(name, value instanceof Date ? value.toISOString() : String(value));
    }

    const search = params.toString();
    return `${this.#baseUrl}/${path.replace(/^\/+/, '')}${search ? `?${search}` : ''}`;
  }
}

function parse(response: Response, text: string): unknown {
  if (text === '') return {};

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw new ApiError('SendKuy answered with a body that is not JSON.', {
      status: response.status,
      requestId: response.headers.get('x-request-id'),
      cause,
    });
  }
}

function retryDelay(error: SendKuyError, attempt: number): number | null {
  if (error.status === 429) {
    if (error.retryAfter === null) return backoff(attempt);
    return error.retryAfter > MAX_RETRY_AFTER ? null : error.retryAfter * 1000;
  }

  if (error.status >= 500) return backoff(attempt);
  if (error.status === 409 && error.code === 'idempotency_request_in_progress')
    return backoff(attempt);

  return null;
}

function backoff(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt) * (0.5 + Math.random() * 0.5);
}

function describe(cause: unknown): string {
  if (!(cause instanceof Error)) return String(cause);

  const root = cause.cause;

  if (root instanceof Error) {
    const code = (root as { code?: unknown }).code;
    return `${cause.message} (${typeof code === 'string' ? code : root.message})`;
  }

  return cause.message;
}
