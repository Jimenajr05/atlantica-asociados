const assert = require('node:assert/strict');
const test = require('node:test');

test('admin API requires the allowed email and admin role', async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  let email = 'other@example.com';
  let role = 'admin';
  let profileRequests = 0;
  process.env.SUPABASE_URL = 'https://auth-test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  global.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('/auth/v1/user')) {
      return Response.json({ id: 'test-user', email });
    }
    profileRequests++;
    return Response.json({ role });
  };
  try {
    const { requireAdmin } = require('../dist/middleware/require-admin.js');
    const check = async (token = 'test-token') => {
      let status;
      let permitted = false;
      const response = {
        locals: {},
        status(value) { status = value; return this; },
        json() { return this; },
      };
      await requireAdmin({ headers: token ? { authorization: `Bearer ${token}` } : {} }, response, () => { permitted = true; });
      return { status, permitted };
    };
    assert.deepEqual(await check(''), { status: 401, permitted: false });
    assert.deepEqual(await check(), { status: 403, permitted: false });
    assert.equal(profileRequests, 0, 'other emails must be rejected before checking their role');
    email = 'INFOATLANTICA.ASOCIADOS@gmail.com';
    assert.deepEqual(await check(), { status: undefined, permitted: true });
    role = 'user';
    assert.deepEqual(await check(), { status: 403, permitted: false });
    email = undefined;
    assert.deepEqual(await check(), { status: 403, permitted: false });
  } finally {
    global.fetch = originalFetch;
    for (const key of ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});
