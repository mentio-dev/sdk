/**
 * Exports the OpenAPI document straight from the API worker's route
 * definitions into openapi.json, the SDK's contract. The generated client
 * (src/generated) is built from this file and committed, so a fresh
 * checkout typechecks without touching the worker; `pnpm generate`
 * refreshes both. The worker module only touches Cloudflare bindings at
 * request time, so importing it in Node is safe (the docs do the same).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import app from '../../../workers/api/src/index';

const doc = app.getOpenAPIDocument({
  openapi: '3.0.0',
  info: {
    title: 'Mentio API',
    version: '0.0.1',
    description: 'Keyword and brand mention tracking across dev platforms.',
  },
  servers: [{ url: 'https://api.mentio.dev' }],
});

const out = fileURLToPath(new URL('../openapi.json', import.meta.url));
writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Wrote ${out} (${Object.keys(doc.paths ?? {}).length} paths)`);
