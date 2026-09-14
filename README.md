# Mentio TypeScript SDK

[![npm](https://img.shields.io/npm/v/@mentio-dev/sdk?label=npm)](https://www.npmjs.com/package/@mentio-dev/sdk)
[![license](https://img.shields.io/npm/l/@mentio-dev/sdk)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-docs.mentio.dev-1421b9)](https://docs.mentio.dev/sdks/typescript)

Social listening for developers, typed. [Mentio](https://mentio.dev) watches Reddit, Hacker News, X, GitHub, Bluesky, LinkedIn, Stack Overflow, DEV, YouTube and news for your keywords and scores every mention for relevance, sentiment and intent. This package is the official TypeScript client for its API: one function per endpoint, generated from the OpenAPI document, request and response types included. Node 22+, Bun, Deno and browsers. No runtime dependencies.

## Installation

```bash
npm install @mentio-dev/sdk
```

## Quick start

```ts
import { createMentio } from '@mentio-dev/sdk';

const mentio = createMentio({ apiKey: process.env.MENTIO_API_KEY! });

// Track a keyword on two platforms.
await mentio.createKeyword({ body: { term: 'acme cloud', kind: 'brand', platforms: ['reddit', 'x'] } });

// Read what arrived, relevant posts only, newest first.
const { data, error } = await mentio.searchMentions({
  query: { platform: 'reddit', relevant: true, limit: 25 },
});
if (error) throw new Error(`${error.error.code}: ${error.error.message}`);

for (const mention of data.data) {
  console.log(mention.post.platform, mention.classification?.relevance, mention.classification?.intents, mention.post.url);
}
```

An API key comes from the dashboard (Settings, API keys) or from `POST /v1/api-keys`. Every account starts with $5.80 of credit and no card.

## Configuration

```ts
const mentio = createMentio({
  apiKey: 'mk_live_...',                 // required
  baseUrl: 'https://api.mentio.dev',     // another deployment's host, if you run one
  fetch: customFetch,                    // tests, or a runtime without a global fetch
  headers: { 'x-request-id': 'my-id' },  // sent on every request; the id comes back on the response
});
```

Every call resolves to `{ data, error, request, response }` and never throws on a non-2xx. Pass `throwOnError: true` on a call to get `data` alone and an exception instead:

```ts
const keyword = await mentio.getKeyword({ path: { id: 'kw_...' }, throwOnError: true });
```

`mentio.client` is the underlying client for interceptors and raw requests:

```ts
mentio.client.interceptors.response.use((response) => {
  console.log(response.status, response.headers.get('x-request-id'));
  return response;
});
```

## Examples

### Page through every mention of the last week

```ts
let cursor: string | undefined;
do {
  const { data } = await mentio.searchMentions({
    query: { since: '2026-09-07T00:00:00Z', relevant: true, limit: 100, cursor },
    throwOnError: true,
  });
  for (const mention of data.data) console.log(mention.post.url);
  cursor = data.nextCursor ?? undefined;
} while (cursor);
```

### Filter by intent and sentiment

```ts
const { data } = await mentio.searchMentions({
  query: { intent: 'buy_intent', sentiment: 'negative', minFollowers: 1000, sort: 'priority' },
  throwOnError: true,
});
```

Intents are `buy_intent`, `question`, `complaint`, `praise` and `comparison`. `sort: 'priority'` puts fresh, relevant, high-reach posts first.

### Triage

```ts
await mentio.updateMention({ path: { id: 'mm_...' }, body: { status: 'done', note: 'replied 2026-09-14' } });
await mentio.updateMention({ path: { id: 'mm_...' }, body: { status: 'ignored' } });
```

### An instant Slack alert for buying signals on Reddit

```ts
const { data: channels } = await mentio.listChannels({ throwOnError: true });
const slack = channels.data.find((c) => c.kind === 'slack');

await mentio.createAlert({
  body: {
    name: 'Reddit buying signals',
    mode: 'instant',
    filter: { platforms: ['reddit'], intents: ['buy_intent'], minRelevance: 40 },
    channelIds: slack ? [slack.id] : [],
  },
  throwOnError: true,
});
```

Slack, Telegram, email and webhook channels are created with `createChannel`; `testAlert` sends a sample; `runAlertDigest` sends a daily alert's last 24 hours now.

### Analytics

```ts
const { data: summary } = await mentio.getAnalyticsSummary({
  query: { range: '30d', compare: true, timezone: 'Europe/Madrid' },
  throwOnError: true,
});
const { data: byPlatform } = await mentio.getAnalyticsBreakdown({ query: { range: '30d', by: 'platform' }, throwOnError: true });
const { data: sov } = await mentio.getShareOfVoice({ query: { range: '90d' }, throwOnError: true });
```

### People

```ts
const { data: people } = await mentio.listPeople({ query: { platforms: ['x'], minFollowers: 5000 }, throwOnError: true });
await mentio.updatePerson({ path: { id: people.data[0].id }, body: { tags: ['influencer'], muted: false } });
```

### CSV export

```ts
const { data: csv } = await mentio.exportMentionsCsv({ query: { since: '2026-09-01T00:00:00Z' }, throwOnError: true });
```

## Error handling

A non-2xx response comes back as `error` with a stable code, the message, and the request id to quote to support:

```ts
const { error } = await mentio.createKeyword({ body: { term: 'acme', kind: 'brand' } });
if (error) {
  switch (error.error.code) {
    case 'duplicate_keyword':      // already tracked
    case 'insufficient_balance':   // top up from Billing
    case 'keyword_limit_reached':  // 500 keywords is an enterprise conversation
    case 'rate_limited':           // Retry-After is on the response
    default:
      console.error(error.error.code, error.error.message, error.error.requestId);
  }
}
```

The full catalog, with status and meaning, is at [docs.mentio.dev/errors](https://docs.mentio.dev/errors). Common ones: `unauthorized`, `forbidden`, `read_only_key`, `validation_error`, `not_found`, `invalid_cursor`, `rate_limited`, `duplicate_keyword`, `insufficient_balance`, `keyword_limit_reached`, `upstream_unavailable`, `internal_error`.

## SDK reference

One function per operation. Names match the [API reference](https://docs.mentio.dev/api/keywords/create-keyword).

| Resource | Functions |
| --- | --- |
| Keywords | `createKeyword`, `listKeywords`, `getKeyword`, `updateKeyword`, `deleteKeyword` |
| Mentions | `searchMentions`, `getMention`, `updateMention`, `exportMentionsCsv` |
| People | `listPeople`, `getPerson`, `updatePerson`, `mergePeople`, `splitPerson`, `exportPeopleCsv` |
| Segments | `listSegments`, `createSegment`, `getSegment`, `updateSegment`, `deleteSegment` |
| Alerts | `listAlerts`, `createAlert`, `getAlert`, `updateAlert`, `deleteAlert`, `testAlert`, `runAlertDigest` |
| Channels | `listChannels`, `createChannel`, `getChannel`, `updateChannel`, `deleteChannel`, `testChannel`, `rotateWebhookSecret`, `listChannelDeliveries` |
| Analytics | `getAnalyticsSummary`, `getAnalyticsSeries`, `getAnalyticsBreakdown`, `getShareOfVoice` |
| Company | `getCompany`, `updateCompany` |
| API keys | `createApiKey`, `listApiKeys`, `revokeApiKey` |
| System | `getHealth` |

Lists return `{ data, nextCursor }` (cursor lists) or `{ data, total }` (offset lists). Timestamps are ISO 8601 strings; instants in accept ISO or epoch milliseconds. The public word is `platform` everywhere.

## MCP server

The same API is available to Claude Code, Cursor, Codex, claude.ai and ChatGPT as tools, with no SDK at all:

```bash
claude mcp add --transport http mentio https://mcp.mentio.dev/mcp
```

Guide: [docs.mentio.dev/mcp](https://docs.mentio.dev/mcp).

## Requirements

- Node 22+, Bun, Deno, or a browser with `fetch`
- A Mentio API key

## Links

- [Documentation](https://docs.mentio.dev) and the [TypeScript guide](https://docs.mentio.dev/sdks/typescript)
- [API reference](https://docs.mentio.dev/api/keywords/create-keyword) and the [OpenAPI document](https://api.mentio.dev/v1/openapi.json)
- [Dashboard](https://app.mentio.dev)
- [Python SDK](https://github.com/mentio-dev/sdk-python), [CLI](https://github.com/mentio-dev/cli), [Claude Code skills](https://github.com/mentio-dev/claude-skills)

This repository is published from the Mentio monorepo on every release; regenerate from a checkout with `pnpm --filter @mentio-dev/sdk generate`.

## License

MIT.
