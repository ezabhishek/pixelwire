export type QueryValue = string | number | boolean | null | undefined;

/**
 * A failed request. `status` is the HTTP status, or 0 when no response
 * arrived (network failure or timeout).
 */
export class HttpError extends Error {
  readonly status: number;
  readonly url: string;
  /** Raw Retry-After header, when the server sent one. */
  readonly retryAfter: string | null;

  constructor(message: string, status: number, url: string, retryAfter: string | null = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.retryAfter = retryAfter;
  }

  /** Worth retrying: no response, rate limited, or a server error. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function buildUrl(base: string, path: string, params: Record<string, QueryValue> = {}): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export interface GetJsonOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Extra attempts after a 429 or 5xx response. */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 1;
const MAX_RETRY_DELAY_MS = 3_000;

/** Delay before retrying: the server's Retry-After when given, else a short backoff. */
export function retryDelayMs(retryAfter: string | null, attempt: number): number {
  const seconds = retryAfter === null ? Number.NaN : Number.parseFloat(retryAfter);
  const delay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 600 * 2 ** attempt;
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('The request was cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * GET a JSON document. Honors the caller's AbortSignal (React Query passes
 * one so stale requests are cancelled), adds its own timeout, and retries
 * rate-limit and server errors. The retry matters because the aggregator
 * turns one failed source into a partial page, which React Query never
 * retries.
 */
export async function getJson<T>(url: string, options: GetJsonOptions = {}): Promise<T> {
  const { retries = DEFAULT_RETRIES, ...attemptOptions } = options;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await getJsonOnce<T>(url, attemptOptions);
    } catch (error) {
      const retryable = error instanceof HttpError && error.status !== 0 && error.isRetryable;
      if (!retryable || attempt >= retries) throw error;
      await wait(retryDelayMs(error.retryAfter, attempt), options.signal);
    }
  }
}

async function getJsonOnce<T>(url: string, options: Omit<GetJsonOptions, 'retries'>): Promise<T> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      if (timedOut) throw new HttpError('The request timed out', 0, url);
      if (signal?.aborted) throw new DOMException('The request was cancelled', 'AbortError');
      const reason = error instanceof Error ? error.message : 'Network request failed';
      throw new HttpError(reason, 0, url);
    }

    if (!response.ok) {
      throw new HttpError(
        `Request failed with status ${response.status}`,
        response.status,
        url,
        response.headers.get('Retry-After'),
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new HttpError('The response was not valid JSON', response.status, url);
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
