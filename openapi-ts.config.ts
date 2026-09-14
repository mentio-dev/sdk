import { defineConfig } from '@hey-api/openapi-ts';

/** Types, one SDK function per operationId, and a bundled fetch client.
 *  Output is committed; `pnpm generate` refreshes it from the worker. */
export default defineConfig({
  input: 'openapi.json',
  output: { path: 'src/generated', clean: true, indexFile: true },
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
});
