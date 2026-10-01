const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('../node_modules/express');

test('revisión: autorización, actualizaciones parciales, caché y almacenamiento corrupto', async () => {
  const originalDirectory = process.cwd();
  const originalEnvironment = { ...process.env };
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'atlantica-review-'));
  process.chdir(temporaryDirectory);
  process.env.NODE_ENV = 'test';
  const supabase = require('../dist/services/supabase-admin');
  const originalClient = supabase.createAdminClient;
  supabase.createAdminClient = () => null;
  const { readLocalRecords, writeLocalRecords } = require('../dist/services/local-json-store');
  const posts = require('../dist/services/posts-store');
  const app = express();
  app.use(express.json());
  app.use('/admin/posts', require('../dist/routes/admin-posts').default);
  app.use('/admin/cases', require('../dist/routes/admin-cases').default);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method = 'GET', body, token) => fetch(url + route, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    const created = await request('/admin/posts', 'POST', { title: 'Artículo', slug: 'articulo', content: 'Texto original', published: true });
    assert.equal(created.status, 200);
    const post = (await created.json()).post;
    const changed = await request(`/admin/posts/${post.id}`, 'PUT', { title: 'Nuevo título' });
    const updated = (await changed.json()).post;
    assert.equal(updated.content, 'Texto original');
    assert.equal(updated.published, true);
    assert.equal(updated.published_at, post.published_at);
    assert.equal((await request('/admin/posts', 'POST', { title: 123, slug: 'invalido', content: 'Texto' })).status, 400);
    assert.equal((await request('/admin/posts', 'POST', { title: '  ', slug: 'invalido', content: 'Texto' })).status, 400);
    assert.equal((await request(`/admin/posts/${post.id}`, 'PUT', { published: 'false' })).status, 400);
    await assert.rejects(posts.createPost({ title: 'Duplicado', slug: 'articulo', content: 'Texto' }));
    assert.equal((await posts.getAllPosts()).length, 1);
    const draft = await posts.createPost({ title: 'Borrador', slug: 'borrador', content: 'Texto' });
    const before = fs.readFileSync('data/posts.json', 'utf8');
    supabase.createAdminClient = () => ({ from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [post], error: null }) }) }) }) });
    assert.equal((await posts.getPublicPosts()).length, 1);
    assert.equal(fs.readFileSync('data/posts.json', 'utf8'), before);
    supabase.createAdminClient = () => null;
    assert.equal((await posts.getPostById(draft.id)).published, false);
    writeLocalRecords('data/safe.json', [{ id: 'preserved' }]);
    assert.deepEqual(readLocalRecords('data/safe.json'), [{ id: 'preserved' }]);
    fs.writeFileSync('data/posts.json', '{broken');
    await assert.rejects(posts.createPost({ slug: 'another', content: 'Texto' }));
    assert.equal(fs.readFileSync('data/posts.json', 'utf8'), '{broken');
    fs.writeFileSync('data/posts.json', before);

    const attachments = require('../dist/services/local-attachments');
    const cases = require('../dist/services/cases-store');
    const filePath = attachments.saveLocalAttachment('local-case', { originalname: 'prueba.pdf', buffer: Buffer.from('documento de prueba') });
    const caseItem = await cases.createCaseRecord({ id: 'local-case', full_name: 'Persona', phone: '88888888' }, [{ name: 'prueba.pdf', size: 19, mimeType: 'application/pdf', path: filePath }]);
    const file = caseItem.files[0];
    const download = await request(`/admin/cases/local-case/files/${file.id}`);
    assert.equal(download.status, 200);
    assert.equal(await download.text(), 'documento de prueba');
    assert.equal((await request('/admin/cases/local-case/signed-url', 'POST', { filePath: 'other/file.pdf' })).status, 404);
    assert.throws(() => attachments.getLocalAttachmentPath('local/../../outside.pdf'));
    assert.equal((await request('/admin/cases/local-case', 'DELETE')).status, 200);
    assert.equal(fs.existsSync(attachments.getLocalAttachmentPath(filePath)), false);

    process.env.NODE_ENV = 'production';
    for (const route of ['/admin/posts', '/admin/cases']) assert.equal((await request(route)).status, 503);
    let role = 'staff';
    supabase.createAdminClient = () => ({ auth: { getUser: async token => ({ data: { user: token === 'valid' ? { id: 'user', email: 'infoatlantica.asociados@gmail.com' } : null }, error: null }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role }, error: null }) }) }) }) });
    for (const [route, method, body] of [
      ['/admin/posts', 'GET'], ['/admin/posts', 'POST', {}], ['/admin/posts/id', 'PUT', {}], ['/admin/posts/id', 'DELETE'],
      ['/admin/cases', 'GET'], ['/admin/cases/id/status', 'PATCH', {}], ['/admin/cases/id/notes', 'POST', {}],
      ['/admin/cases/id', 'DELETE'], ['/admin/cases/id/signed-url', 'POST', {}], ['/admin/cases/id/appointment', 'PATCH', {}],
      ['/admin/cases/id/files/file', 'GET'],
    ]) {
      assert.equal((await request(route, method, body)).status, 401);
      assert.equal((await request(route, method, body, 'invalid')).status, 401);
      assert.equal((await request(route, method, body, 'valid')).status, 403);
    }
    role = 'admin';
    assert.equal((await request('/admin/posts', 'POST', {}, 'valid')).status, 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
    supabase.createAdminClient = originalClient;
    process.chdir(originalDirectory);
    for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
    Object.assign(process.env, originalEnvironment);
    assert.equal(path.dirname(temporaryDirectory), path.resolve(os.tmpdir()));
    fs.rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('revisión: CORS, límites por IP y escape HTML en correos', async () => {
  const originalEnvironment = { ...process.env };
  process.env.NODE_ENV = 'test';
  process.env.TRUST_PROXY = '';
  process.env.RATE_LIMIT_MAX_PER_HOUR = '2';
  const app = require('../dist/server').default;
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const nodemailer = require('../node_modules/nodemailer');
  const originalTransport = nodemailer.createTransport;
  const supabase = require('../dist/services/supabase-admin');
  const originalClient = supabase.createAdminClient;
  const counts = new Map();
  supabase.createAdminClient = () => ({ rpc: async (name, args) => {
    assert.equal(name, 'consume_submission_limit');
    const count = (counts.get(args.rate_key) || 0) + 1;
    counts.set(args.rate_key, count);
    return { data: [{ allowed: count <= args.max_requests, remaining: Math.max(0, args.max_requests - count), reset_in_minutes: 60 }], error: null };
  } });
  try {
    process.env.NODE_ENV = 'production';
    const blocked = await fetch(url + '/api/health', { headers: { Origin: 'https://untrusted.example' } });
    assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null);
    const allowed = await fetch(url + '/api/health', { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
    for (let index = 0; index < 3; index++) {
      const response = await fetch(url + '/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `192.0.2.${index}` }, body: '{}' });
      assert.equal(response.status, index < 2 ? 400 : 429);
    }
    let mail;
    nodemailer.createTransport = () => ({ sendMail: async value => { mail = value; } });
    process.env.SMTP_HOST = 'smtp.test'; process.env.SMTP_USER = 'test@example.com'; process.env.SMTP_PASS = 'test';
    process.env.NOTIFICATION_EMAIL_TO = 'office@example.com';
    const { sendCaseNotificationEmail } = require('../dist/services/email');
    await sendCaseNotificationEmail({ caseCode: 'CAS-TEST', fullName: '<img src=x>', phone: '+12025550123', description: '<script>unsafe</script>', institution: 'A & B', appointmentRequested: false, filesCount: 0 });
    assert.doesNotMatch(mail.html, /<script>|<img src=x>/);
    assert.match(mail.html, /&lt;script&gt;/);
    assert.match(mail.html, /https:\/\/wa.me\/12025550123/);
  } finally {
    nodemailer.createTransport = originalTransport;
    supabase.createAdminClient = originalClient;
    await new Promise(resolve => server.close(resolve));
    for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
    Object.assign(process.env, originalEnvironment);
  }
});
