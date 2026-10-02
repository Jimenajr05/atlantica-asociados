import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';

test('publication categories persist, validate and preserve legacy articles', async () => {
  const originalDirectory = process.cwd();
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'atlantica-post-categories-'));
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder';
  process.chdir(temporaryDirectory);
  let server: ReturnType<ReturnType<typeof express>['listen']> | undefined;
  try {
    fs.mkdirSync('data');
    fs.writeFileSync('data/posts.json', JSON.stringify([{ id: 'legacy', slug: 'legacy', title: 'Legacy', content: 'Text', published: true }]));
    const { default: adminRoutes } = await import('../src/routes/admin-posts');
    const { default: publicRoutes } = await import('../src/routes/posts');
    const app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
    app.use('/posts', publicRoutes);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server!.once('listening', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const write = (route: string, method: string, body: object) => fetch(url + route, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const base = { title: 'Test', content: '<p><strong>Text</strong></p><script>alert(1)</script>', excerpt: 'Summary', published: true };
    const blogResponse = await write('/admin', 'POST', { ...base, slug: 'blog-test' });
    assert.equal(blogResponse.status, 200);
    assert.equal((await blogResponse.json()).post.category, 'blog');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newsResponse = await write('/admin', 'POST', { ...base, slug: 'news-test', category: 'noticias' });
    const news = (await newsResponse.json()).post;
    assert.equal(news.category, 'noticias');
    const publicArticle = await (await fetch(url + '/posts/news-test')).json();
    assert.ok(publicArticle.html.includes('<strong>Text</strong>'));
    assert.ok(!publicArticle.html.includes('<script'));
    assert.ok(!publicArticle.html.includes('alert(1)'));
    const persisted = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
    assert.equal(persisted.find((post: { slug: string }) => post.slug === 'news-test').category, 'noticias');
    const updated = await write(`/admin/${news.id}`, 'PUT', { ...base, slug: 'news-test', category: 'blog' });
    assert.equal((await updated.json()).post.category, 'blog');
    const legacy = await write('/admin/legacy', 'PUT', { ...base, slug: 'legacy', category: 'noticias' });
    assert.equal((await legacy.json()).post.category, 'noticias');
    const draft = await write('/admin/legacy', 'PUT', { ...base, slug: 'legacy', published: false });
    assert.equal((await draft.json()).post.category, 'noticias');
    assert.equal((await fetch(url + '/posts/legacy')).status, 404);
    const publicPosts = (await (await fetch(url + '/posts')).json()).posts;
    assert.ok(publicPosts.every((post: { published: boolean }) => post.published));
    assert.equal((await write('/admin', 'POST', { ...base, slug: 'invalid', category: 'invalid' })).status, 400);
    assert.equal((await write('/admin/legacy', 'PUT', { category: null })).status, 400);
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
    process.chdir(originalDirectory);
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    assert.equal(path.dirname(temporaryDirectory), path.resolve(os.tmpdir()));
    fs.rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
