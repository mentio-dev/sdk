# @mentio-dev/sdk

Typed TypeScript client for the [Mentio API](https://docs.mentio.dev), generated from its OpenAPI document. One function per endpoint, the same names as the reference (`searchMentions`, `createKeyword`, `getAnalyticsSummary`), request and response types included. Node 22+, Bun, Deno and browsers; no runtime dependencies.

```bash
npm install @mentio-dev/sdk
```

```ts
import { createMentio } from '@mentio-dev/sdk';

const mentio = createMentio({ apiKey: process.env.MENTIO_API_KEY! });

const { data, error } = await mentio.searchMentions({
  query: { platform: 'reddit', relevant: true, limit: 25 },
});
if (error) throw new Error(error.error.message);
for (const mention of data.data) {
  console.log(mention.post.platform, mention.classification?.relevance, mention.post.url);
}
```

Every call resolves to `{ data, error, request, response }`; pass `throwOnError: true` to get `data` alone and an exception on a non-2xx. Page a list by passing `nextCursor` back as `cursor`. `mentio.client` is the underlying client for interceptors and raw requests.

The whole surface is documented at [docs.mentio.dev/sdks](https://docs.mentio.dev/sdks). Regenerate from a checkout with `pnpm --filter @mentio-dev/sdk generate`.
