'use strict';

// Adds a Content-Security-Policy and referrer policy to the published copy of
// index.html. GitHub Pages cannot send custom headers, so the policy is a
// <meta> tag. Inline script hashes are computed at deploy time, so editing the
// page's inline JavaScript never needs a manual hash update.
// Usage: node support/harden-html.cjs _site

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Data blocks such as JSON-LD are never executed, so they need no hash.
const DATA_TYPES = /^(application\/(ld\+)?json|text\/plain)$/i;

function inlineScriptHashes(html) {
  const hashes = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    if (/\bsrc\s*=/i.test(attributes)) continue;
    const type = (attributes.match(/\btype\s*=\s*"([^"]*)"/i) || [])[1] || '';
    if (DATA_TYPES.test(type.trim())) continue;
    hashes.push(`'sha256-${crypto.createHash('sha256').update(match[2], 'utf8').digest('base64')}'`);
  }
  return [...new Set(hashes)];
}

function buildPolicy(html) {
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes(html).join(' ')}`.trim(),
    // Inline <style> and style="" attributes are part of the page design.
    // Google Fonts stays allowed so older revisions keep their typeface.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "frame-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
}

function hardenHtml(html) {
  const cleaned = html
    .replace(/\s*<meta http-equiv="Content-Security-Policy" content="[^"]*">/i, '')
    .replace(/\s*<meta name="referrer" content="[^"]*">/i, '');
  const tags = `\n  <meta http-equiv="Content-Security-Policy" content="${buildPolicy(cleaned)}">\n  <meta name="referrer" content="strict-origin-when-cross-origin">`;
  const hardened = cleaned.replace(/(<meta charset="utf-8">)/i, `$1${tags}`);
  if (hardened === cleaned) throw new Error('index.html has no <meta charset="utf-8"> to anchor the security policy');
  return hardened;
}

function hardenDirectory(dir) {
  const page = path.join(dir, 'index.html');
  fs.writeFileSync(page, hardenHtml(fs.readFileSync(page, 'utf8')));
  return page;
}

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, '..', '_site'));
  console.log(`Applied Content-Security-Policy to ${path.relative(process.cwd(), hardenDirectory(dir)) || 'index.html'}`);
}

module.exports = { buildPolicy, hardenHtml, hardenDirectory, inlineScriptHashes };
