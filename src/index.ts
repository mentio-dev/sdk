/**
 * @mentio-dev/sdk: a typed client for the Mentio API. Everything under
 * ./generated comes from the API's OpenAPI document (`pnpm generate`), one
 * function per operation; this file adds the constructor that binds a key
 * and a host once so calls read `mentio.searchMentions({ query })`.
 */
import { createClient, createConfig, type Client } from './generated/client';
import * as sdk from './generated/sdk.gen';

export * from './generated';
export { createClient, createConfig } from './generated/client';
export type { Client, Config, RequestResult } from './generated/client';

export const DEFAULT_BASE_URL = 'https://api.mentio.dev';

export interface MentioOptions {
  /** API key from the dashboard or POST /v1/api-keys (mk_live_...). */
  apiKey: string;
  /** Another deployment's host; the hosted API by default. */
  baseUrl?: string;
  /** Custom fetch, for tests or runtimes without a global one. */
  fetch?: typeof fetch;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
}

/** Every SDK function, pre-bound to one client, plus the client itself for
 *  interceptors and raw requests. Passing `client` in a call still wins. */
export type Mentio = typeof sdk & { client: Client };

export function createMentio(options: MentioOptions): Mentio {
  const client = createClient(
    createConfig({
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
      auth: () => options.apiKey,
      ...(options.fetch ? { fetch: options.fetch } : {}),
      ...(options.headers ? { headers: options.headers } : {}),
    }),
  );
  const bound: Record<string, unknown> = {};
  for (const [name, fn] of Object.entries(sdk)) {
    if (typeof fn !== 'function') continue;
    const call = fn as (callOptions?: { client?: Client }) => unknown;
    bound[name] = (callOptions?: { client?: Client }) => call({ ...callOptions, client: callOptions?.client ?? client });
  }
  return { ...(bound as typeof sdk), client };
}
