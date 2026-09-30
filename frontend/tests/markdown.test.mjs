import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAndSanitizeMarkdown } from '../src/lib/markdown.ts';

test('preserves article formatting through repeated save and display cycles', async () => {
  const source = '<p style="margin-left:48px;text-align:center"><strong>Negrita</strong> <em>Cursiva</em> <u>Subrayado</u> <s>Tachado</s> <span style="color:#163664;background-color:rgb(254, 240, 138)">Color</span></p><ol start="3"><li>Elemento</li></ol>';
  const html = await parseAndSanitizeMarkdown(source);
  assert.match(html, /margin-left:48px/);
  assert.match(html, /text-align:center/);
  assert.match(html, /color:#163664/);
  assert.match(html, /background-color:rgb\(254, 240, 138\)/);
  for (const tag of ['strong', 'em', 'u', 's']) assert.ok(html.includes(`<${tag}>`));
  assert.match(html, /<ol start="3">/);
  assert.equal(await parseAndSanitizeMarkdown(html), html);
});

test('strips unsafe HTML and CSS while retaining permitted formatting', async () => {
  const html = await parseAndSanitizeMarkdown('<p onclick="alert(1)" style="position:fixed;margin-left:9999px;text-align:right;background-image:url(https://example.com/pixel)"><span style="color:#ff0000">Texto</span><script>alert(1)</script><a href="javascript:alert(1)">Enlace</a><img src=x onerror="alert(1)"></p>');
  assert.doesNotMatch(html, /onclick|onerror|script|position|9999|background-image|<img|javascript:/);
  assert.match(html, /text-align:right/);
  assert.match(html, /color:#ff0000/);
});

test('keeps existing Markdown articles and safe links compatible', async () => {
  const html = await parseAndSanitizeMarkdown('## Título\n\n**Negrita** y *cursiva*\n\n- Uno\n- Dos\n\n[Enlace](https://example.com)');
  assert.match(html, /<h2>Título<\/h2>/);
  assert.match(html, /<strong>Negrita<\/strong>/);
  assert.match(html, /<em>cursiva<\/em>/);
  assert.match(html, /<ul>/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
});
