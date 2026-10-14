export interface Recorded {
  url: URL;
  method: string;
  headers: Headers;
  body: string | undefined;
}

export function fakeFetch(...replies: Array<Response | Error>) {
  const requests: Recorded[] = [];
  const queue = [...replies];

  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    requests.push({
      url: new URL(String(input)),
      method: init.method ?? 'GET',
      headers: new Headers(init.headers),
      body: typeof init.body === 'string' ? init.body : undefined,
    });

    const next = queue.shift();

    if (next === undefined) throw new Error(`No reply queued for ${init.method} ${String(input)}`);
    if (next instanceof Error) throw next;

    return next;
  };

  return { fetch: fetch as typeof globalThis.fetch, requests };
}

export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
