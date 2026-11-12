'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { hardenDirectory } = require('./harden-html.cjs');

const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(process.argv[2] || path.join(root, '_site'));
const fallback = JSON.parse(fs.readFileSync(path.join(root, 'builds.json'), 'utf8'));
const worlds = {
  omerta: 'https://illicit.up.railway.app/health',
  atlantis: 'https://ill.up.railway.app/health'
};

async function main() {
  // GitHub Pages cannot send headers: add the CSP <meta> to the published copy.
  if (fs.existsSync(path.join(outputDir, 'index.html'))) hardenDirectory(outputDir);
  const builds = { ...fallback };
  const siteCommit = String(process.env.GITHUB_SHA || '');
  if (/^[a-f0-9]{40}$/i.test(siteCommit)) builds.platform = siteCommit.toLowerCase();
  await Promise.all(Object.entries(worlds).map(async ([world, url]) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health = await response.json();
      const commit = String(health?.release?.commit || '');
      if (health?.release?.branch !== world || !/^[a-f0-9]{7,40}$/i.test(commit)) {
        throw new Error('No matching deployed commit');
      }
      builds[world] = commit.slice(0, 12).toLowerCase();
    } catch (error) {
      console.warn(`${world}: using checked-in build fallback (${error.message})`);
    }
  }));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'builds.json'), `${JSON.stringify(builds, null, 2)}\n`);
  console.log(`Published build labels: ${Object.entries(builds).map(([name, hash]) => `${name} #${hash.slice(0, 7)}`).join(', ')}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
