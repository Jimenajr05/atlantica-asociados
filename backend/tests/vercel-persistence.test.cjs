const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('production uses Supabase without disk caches; database errors never fall back locally', async () => {
  const originalEnvironment = { ...process.env };
  const cwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlantica-cloud-'));
  const admin = require('../dist/services/supabase-admin');
  const originalClient = admin.createAdminClient;
  process.chdir(dir);
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';
  let failure = false;
  const row = { id: 'database-id', title: 'Persisted', full_name: 'Persona', appointment_requested: false };
  admin.createAdminClient = () => ({ from: () => {
    const chain = {
      select: () => chain, eq: () => chain, insert: () => chain,
      order: async () => ({ data: failure ? null : [row], error: failure ? new Error('offline') : null }),
      single: async () => ({ data: row, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return chain;
  } });
  try {
    const posts = require('../dist/services/posts-store');
    const cases = require('../dist/services/cases-store');
    assert.deepEqual(await posts.getAllPosts(), [row]);
    assert.deepEqual(await cases.getAllCases(), [row]);
    assert.equal((await posts.createPost({ title: 'Test', slug: 'test', content: 'Text' })).id, row.id);
    assert.equal((await cases.createCaseRecord({ full_name: 'Persona' })).id, row.id);
    assert.equal(fs.existsSync('data'), false);
    failure = true;
    await assert.rejects(posts.getAllPosts(), /almacenamiento local/);
    await assert.rejects(cases.getAllCases(), /almacenamiento local/);
    assert.equal(fs.existsSync('data'), false);
    const { readLocalRecords, writeLocalRecords } = require('../dist/services/local-json-store');
    assert.throws(() => readLocalRecords('data/cases.json'), /producción/);
    assert.throws(() => writeLocalRecords('data/cases.json', []), /producción/);
  } finally {
    admin.createAdminClient = originalClient;
    process.chdir(cwd);
    for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
    Object.assign(process.env, originalEnvironment);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cloud notifications use leases, isolate failures and protect the cron endpoint', async () => {
  const originalEnvironment = { ...process.env };
  const admin = require('../dist/services/supabase-admin');
  const originalClient = admin.createAdminClient;
  const nodemailer = require('../node_modules/nodemailer');
  const originalTransport = nodemailer.createTransport;
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';
  process.env.NOTIFICATIONS_TEST_MODE = 'false';
  process.env.SMTP_HOST = 'smtp.test';
  process.env.SMTP_USER = 'test@example.com';
  process.env.SMTP_PASS = 'test';
  process.env.CRON_SECRET = 'test-cron-secret';
  const updates = [];
  let claimed = false;
  admin.createAdminClient = () => ({
    rpc: async name => {
      assert.equal(name, 'claim_notification_jobs');
      if (claimed) return { data: [], error: null };
      claimed = true;
      return { data: ['ok', 'failure'].map((key, index) => ({ key, channel: 'email', to: key + '@example.com', values: ['Name', 'Date', 'Time', 'Type', 'Status', 'Contact'], event: 'creada', office: false, attempts: index ? 3 : 1, next: 0, state: 'pending', lease_token: key + '-lease' })), error: null };
    },
    from: table => ({ update: payload => {
      assert.equal(table, 'notification_jobs');
      const filters = {};
      const chain = { eq: (key, value) => {
        filters[key] = value;
        if (key === 'lease_token') { updates.push({ payload, filters }); return Promise.resolve({ error: null }); }
        return chain;
      } };
      return chain;
    } }),
  });
  nodemailer.createTransport = () => ({ sendMail: async mail => { if (mail.to.startsWith('failure')) throw new Error('SMTP failure'); } });
  let server;
  try {
    const notifications = require('../dist/services/appointment-notifications');
    await notifications.processNotificationQueue();
    assert.equal(updates.length, 2);
    assert.equal(updates.find(item => item.filters.key === 'ok').payload.state, 'sent');
    assert.equal(updates.find(item => item.filters.key === 'failure').payload.state, 'failed');
    assert.ok(updates.every(item => item.filters.lease_token === item.filters.key + '-lease'));
    const app = require('../dist/server').default;
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/internal/notifications`;
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer incorrect' } })).status, 401);
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer test-cron-secret' } })).status, 200);
    admin.createAdminClient = () => null;
    assert.equal((await fetch(url)).status, 503);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    admin.createAdminClient = originalClient;
    nodemailer.createTransport = originalTransport;
    for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
    Object.assign(process.env, originalEnvironment);
  }
});
