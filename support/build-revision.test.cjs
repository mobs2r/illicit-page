const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { stampPageBuild } = require('./refresh-builds.cjs');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = html.match(/const isLoadedBuild = [\s\S]*?\n      };\n/)[0];
const commit = '7896ee2f0bbb1b6e261a975ecbedda20b2959a3b';

function isLoaded(href, meta) {
  const document = { querySelector: () => (meta ? { content: meta } : null) };
  return vm.runInNewContext(`${source}; isLoadedBuild(${JSON.stringify(commit)})`, { document, URL, window: { location: { href } } });
}

test('stamped, short and embed-length revisions are recognised without a reload', () => {
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/', commit), true);
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/?rev=7896ee2'), true);
  // mmm-embed.html passes a 12-character revision; it must not trigger a second load.
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/?rev=7896ee2f0bbb#funds'), true);
});

test('stale, missing or malformed revisions still bust the page cache', () => {
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/'), false);
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/?rev=4fd7866'), false);
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/', 'ed8ddb923a801dfe92cf81496c8c66e0b94fe4fe'), false);
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/?rev=78'), false);
  assert.equal(isLoaded('https://mobs2r.github.io/illicit-page/?rev=<script>'), false);
});

test('later build checks never reload a visible page', () => {
  assert.match(html, /if \(initialLoad \|\| document\.hidden\) \{\s*window\.location\.replace\(currentUrl\);/);
  assert.match(html, /pendingReload && document\.hidden/);
  assert.match(html, /updateBuilds\(true\);/);
});

test('the deploy stamps only the published copy with the site commit', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'illicit-site-'));
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  assert.equal(stampPageBuild(dir, commit.toUpperCase()), true);
  assert.equal(stampPageBuild(dir, commit), true);
  const stamped = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.equal(stamped.match(/<meta name="illicit-build" content=/g).length, 1);
  assert.match(stamped, new RegExp(`<meta charset="utf-8">\\n  <meta name="illicit-build" content="${commit}">`));
  assert.equal(stampPageBuild(dir, 'not-a-commit'), false);
  assert.doesNotMatch(html, /<meta name="illicit-build" content=/);
});

test('copy buttons and the brand link name their visible text', () => {
  assert.match(html, /aria-label', `Copy \$\{partner\.code\}, \$\{partner\.name\} partner code`/);
  assert.match(html, /<span class="brand-copy">ILLICIT <small>CORPORATION<\/small><\/span>/);
  assert.match(html, /:root\[data-theme="light"\] \.currency-symbol \{ opacity:1; \}/);
});
