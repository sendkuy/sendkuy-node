import type { ErrorCode } from './types';

export type SignatureFailureReason =
  'malformed_header' | 'timestamp_out_of_tolerance' | 'signature_mismatch' | 'invalid_payload';

export interface SendKuyErrorInit {
  status?: number;
  type?: string | null;
  code?: string | null;
  param?: string | null;
  docUrl?: string | null;
  requestId?: string | null;
  retryAfter?: number | null;
  cause?: unknown;
}

export class SendKuyError extends Error {
  override name = 'SendKuyError';
  readonly status: number;
  readonly type: string | null;
  readonly code: ErrorCode | (string & {}) | null;
  readonly param: string | null;
  readonly docUrl: string | null;
  readonly requestId: string | null;
  readonly retryAfter: number | null;

  constructor(message: string, init: SendKuyErrorInit = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.status = init.status ?? 0;
    this.type = init.type ?? null;
    this.code = init.code ?? null;
    this.param = init.param ?? null;
    this.docUrl = init.docUrl ?? null;
    this.requestId = init.requestId ?? null;
    this.retryAfter = init.retryAfter ?? null;
  }
}

export class AuthenticationError extends SendKuyError {
  override name = 'AuthenticationError';
}
export class AuthorizationError extends SendKuyError {
  override name = 'AuthorizationError';
}
export class InvalidRequestError extends SendKuyError {
  override name = 'InvalidRequestError';
}
export class RateLimitError extends SendKuyError {
  override name = 'RateLimitError';
}
export class ApiError extends SendKuyError {
  override name = 'ApiError';
}
export class ConnectionError extends SendKuyError {
  override name = 'ConnectionError';
}

export class SignatureVerificationError extends SendKuyError {
  override name = 'SignatureVerificationError';
  readonly reason: SignatureFailureReason;

  constructor(reason: SignatureFailureReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

const BY_TYPE: Record<string, typeof SendKuyError> = {
  authentication_error: AuthenticationError,
  authorization_error: AuthorizationError,
  invalid_request_error: InvalidRequestError,
  rate_limit_error: RateLimitError,
  api_error: ApiError,
};

function byStatus(status: number): typeof SendKuyError {
  if (status === 401) return AuthenticationError;
  if (status === 403) return AuthorizationError;
  if (status === 429) return RateLimitError;
  if (status >= 500) return ApiError;
  return InvalidRequestError;
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function parseRetryAfter(value: string | null): number | null {
  const trimmed = value?.trim() ?? '';
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

export function errorFromResponse(response: Response, raw: string): SendKuyError {
  const status = response.status;
  const requestId = response.headers.get('x-request-id');
  const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
  let error: Record<string, unknown> | null = null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'error' in parsed) {
      const candidate = (parsed as { error: unknown }).error;
      if (candidate !== null && typeof candidate === 'object') {
        error = candidate as Record<string, unknown>;
      }
    }
  } catch {}

  if (error === null) {
    const snippet = raw.trim().slice(0, 200);
    const Klass = byStatus(status);
    return new Klass(`HTTP ${status}${snippet ? `: ${snippet}` : ''}`, {
      status,
      requestId,
      retryAfter,
    });
  }

  const type = text(error.type);
  const Klass = (type !== null ? BY_TYPE[type] : undefined) ?? SendKuyError;

  return new Klass(text(error.message) ?? `HTTP ${status}`, {
    status,
    type,
    code: text(error.code),
    param: text(error.param),
    docUrl: text(error.doc_url),
    requestId,
    retryAfter,
  });
}
