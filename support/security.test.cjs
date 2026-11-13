const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { hardenHtml, inlineScriptHashes } = require('./harden-html.cjs');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const hardened = hardenHtml(html);
const policy = hardened.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)[1];
const directive = name => policy.split('; ').find(part => part.startsWith(`${name} `)) || '';

test('the published page carries one CSP and referrer policy, idempotently', () => {
  assert.equal(hardenHtml(hardened), hardened);
  assert.equal(hardened.match(/Content-Security-Policy/g).length, 1);
  assert.match(hardened, /<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy"/);
  assert.match(hardened, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  assert.doesNotMatch(html, /<meta http-equiv="Content-Security-Policy"/, 'the source page stays policy-free; deploy adds it');
});

test('every executable inline script is allowed by hash and nothing else inline runs', () => {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attributes]) => !/src=|application\/ld\+json/.test(attributes));
  assert.ok(scripts.length >= 2);
  for (const [, , body] of scripts) {
    const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
    assert.ok(directive('script-src').includes(`'sha256-${hash}'`));
  }
  assert.equal(inlineScriptHashes(html).length, scripts.length);
  assert.doesNotMatch(directive('script-src'), /unsafe-inline|unsafe-eval|https?:|\*/);
  assert.doesNotMatch(html, /\son[a-z]+\s*=\s*["']/i, 'inline event handlers would be blocked');
  assert.doesNotMatch(html, /javascript:/i);
});

test('the policy locks down plugins, base URLs, forms and framing of other sites', () => {
  for (const rule of ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-src 'none'", "connect-src 'self'"]) {
    assert.ok(policy.split('; ').includes(rule), rule);
  }
});

test('the page only loads scripts and data from its own origin', () => {
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  for (const [, url] of html.matchAll(/fetch\('([^']+)'/g)) assert.match(url, /^\.\//);
  for (const [, url] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) assert.match(url, /^\.\/assets\//);
});

test('the deploy hardens the artifact after copying it', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/corporation-pages.yml'), 'utf8');
  const refresh = fs.readFileSync(path.join(root, 'support/refresh-builds.cjs'), 'utf8');
  assert.ok(workflow.indexOf('cp index.html') < workflow.indexOf('node support/refresh-builds.cjs _site'));
  assert.match(refresh, /hardenDirectory\(outputDir\)/);
});

test('external links opened in a new tab cannot reach window.opener', () => {
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="[^"]*noopener[^"]*"/, tag);
  assert.match(html, /link\.rel = 'noopener noreferrer'/);
});
