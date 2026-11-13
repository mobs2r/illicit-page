const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const local = ref => path.join(root, ref.replace(/^\.\//, '').replace(/[?#].*$/, ''));

test('Questrial is self-hosted, preloaded and licensed; no render-blocking font CSS', () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /<link rel="preload" href="\.\/assets\/fonts\/questrial-latin\.woff2" as="font" type="font\/woff2" crossorigin>/);
  const faces = [...html.matchAll(/@font-face \{ font-family:Questrial;[^}]*font-display:swap; src:url\("([^"]+)"\) format\("woff2"\); unicode-range:[^;]+; \}/g)];
  assert.equal(faces.length, 3);
  for (const [, src] of faces) assert.ok(fs.statSync(local(src)).size > 1000, src);
  assert.match(fs.readFileSync(path.join(root, 'assets/fonts/OFL.txt'), 'utf8'), /SIL Open Font License/);
});

test('every Workshop preview offers a smaller WebP with the original as fallback', () => {
  const shots = [...html.matchAll(/<picture><source srcset="([^"]+\.webp)" type="image\/webp"><img class="mod-shot" src="([^"]+)"[^>]*loading="lazy"[^>]*><\/picture>/g)];
  assert.equal(shots.length, 3);
  for (const [, webp, original] of shots) {
    assert.ok(fs.statSync(local(webp)).size < fs.statSync(local(original)).size, webp);
  }
  assert.doesNotMatch(html, /<img class="mod-shot"(?![^>]*>\s*<\/picture>)/);
});

test('every local asset the page references exists', () => {
  const refs = new Set([...html.matchAll(/["'(](\.\/assets\/[^"')\s]+)/g)].map(match => match[1]));
  assert.ok(refs.size > 20);
  for (const ref of refs) assert.ok(fs.existsSync(local(ref)), `missing ${ref}`);
});

test('link previews carry complete Open Graph and Twitter image metadata', () => {
  for (const tag of ['og:site_name', 'og:locale', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:image:type']) {
    assert.match(html, new RegExp(`<meta property="${tag}" content="[^"]+">`), tag);
  }
  assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
});
