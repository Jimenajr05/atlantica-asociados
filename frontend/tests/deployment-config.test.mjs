import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Services builds without runtime bindings and leaves API routing to Vercel', async () => {
  const original = process.env.VERCEL;
  try {
    process.env.VERCEL = '1';
    const { default: config } = await import('../next.config.mjs?services');
    assert.deepEqual(await config.rewrites(), []);
    delete process.env.VERCEL;
    const { default: local } = await import('../next.config.mjs?local');
    const routes = await local.rewrites();
    assert.equal(routes[0].source, '/api/:path*');
    assert.ok(routes[0].destination.endsWith('/api/:path*'));
  } finally {
    if (original === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original;
  }
});

test('project routes preserve API prefix and bind frontend to backend', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url)));
  assert.deepEqual(config.services.frontend.bindings, [
    { type: 'service', service: 'backend', format: 'url', env: 'BACKEND_URL' },
  ]);
  assert.deepEqual(config.rewrites, [
    { source: '/api/(.*)', destination: { service: 'backend' } },
    { source: '/(.*)', destination: { service: 'frontend' } },
  ]);
  assert.equal(config.crons[0].path, '/api/internal/notifications');
});
