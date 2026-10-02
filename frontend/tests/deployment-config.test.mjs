import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { apiUrl } from '../src/lib/api-fetch.ts';

test('static export has no Next server, API proxy, service binding or Vercel cron', async () => {
  const { default: config } = await import('../next.config.mjs');
  assert.equal(config.output, 'export');
  assert.equal(config.images.unoptimized, true);
  assert.equal(config.rewrites, undefined);
  const deployment = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url)));
  assert.equal(deployment.services, undefined);
  assert.equal(deployment.crons, undefined);
  assert.equal(deployment.outputDirectory, 'frontend/out');
});

test('browser API URLs use Supabase functions and preserve paths and query strings', () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/';
    assert.equal(apiUrl('/api/cases'), 'https://project.supabase.co/functions/v1/atlantica-api/api/cases');
    assert.equal(apiUrl('/api/appointments/availability?days=42'), 'https://project.supabase.co/functions/v1/atlantica-api/api/appointments/availability?days=42');
    assert.throws(() => apiUrl('https://other.example'), /inválida/);
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.throws(() => apiUrl('/api/cases'), /Supabase/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});
