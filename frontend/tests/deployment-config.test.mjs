import assert from 'node:assert/strict';
import test from 'node:test';

test('Vercel requires matching HTTPS backend origins before building', async () => {
  const names = ['VERCEL', 'BACKEND_URL', 'NEXT_PUBLIC_BACKEND_URL'];
  const original = Object.fromEntries(names.map(name => [name, process.env[name]]));
  let version = 0;
  const load = () => import(`../next.config.mjs?deployment-test=${version++}`);
  try {
    process.env.VERCEL = '1';
    delete process.env.BACKEND_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
    await assert.rejects(load(), /BACKEND_URL/);
    process.env.BACKEND_URL = 'https://atlantica-api.vercel.app';
    await assert.rejects(load(), /NEXT_PUBLIC_BACKEND_URL/);
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:5000';
    await assert.rejects(load(), /HTTPS/);
    process.env.NEXT_PUBLIC_BACKEND_URL = 'https://another-api.vercel.app';
    await assert.rejects(load(), /mismo backend/);
    process.env.NEXT_PUBLIC_BACKEND_URL = 'https://atlantica-api.vercel.app';
    process.env.BACKEND_URL += '/';
    const { default: config } = await load();
    assert.deepEqual(await config.rewrites(), [{
      source: '/api/:path*', destination: 'https://atlantica-api.vercel.app/api/:path*',
    }]);
    delete process.env.VERCEL;
    delete process.env.BACKEND_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
    const { default: localConfig } = await load();
    assert.equal((await localConfig.rewrites())[0].destination, 'http://127.0.0.1:5000/api/:path*');
  } finally {
    for (const name of names) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
});
