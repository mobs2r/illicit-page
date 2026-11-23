'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('hero subtitle stays concise and retains its animated word scroller', () => {
  assert.match(html, /<p class="hero-intro">One lab in Saskatoon, building <span class="hero-word-window"/);
  assert.match(html, /id="hero-word">analytics\.<\/span>/);
  assert.doesNotMatch(html, /building the connective tissue behind/);
});

test('Apps replaces the public Worlds label without breaking existing section links', () => {
  assert.match(html, /<h1>One foundation\.<em>Many apps\.<\/em><\/h1>/);
  assert.match(html, /id="worlds-title">Apps</);
  assert.equal([...html.matchAll(/href="#worlds">Apps<\/a>/g)].length, 2);
  assert.match(html, /id="worlds" aria-labelledby="worlds-title"/);
  assert.doesNotMatch(html, />Worlds<|Many worlds\./);
});
test('Repacks sits between Mods and Scale in both navs, the page, and the embed hash allowlist', () => {
  const header = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
  const footer = html.match(/<nav class="illicit-links"[\s\S]*?<\/nav>/)[0];
  for (const nav of [header, footer]) {
    const mods = nav.indexOf('href="#mods">Mods');
    const repacks = nav.indexOf('href="#repacks">Repacks');
    const scale = nav.indexOf('href="#funds">Scale');
    assert.ok(mods !== -1 && repacks !== -1 && scale !== -1, nav.slice(0, 80));
    assert.ok(mods < repacks && repacks < scale);
  }
  const modsSection = html.indexOf('id="mods"');
  const repacksSection = html.indexOf('id="repacks" aria-labelledby="repacks-title"');
  const fundsSection = html.indexOf('id="funds"');
  assert.ok(modsSection < repacksSection && repacksSection < fundsSection);
  const section = html.slice(repacksSection, fundsSection);
  assert.match(section, /id="repacks-title">Repacks</);
  assert.match(section, /class="mod-grid"/);
  const cards = [
    ['3817814674', 'White Knuckle Prop Pack', '60 Active Subscribers', 'Last Updated Oct 13, 2026', 'white-knuckle-prop-pack.webp', 'white-knuckle-prop-pack.jpg'],
    ['3832775332', 'Hood Warfare Character Pack', '19 Active Subscribers', 'Last Updated Nov 9, 2026', 'hood-warfare-character-pack.webp', 'hood-warfare-character-pack.jpg'],
    ['3832776416', 'World War Legion Character Pack', '18 Active Subscribers', 'Last Updated Nov 3, 2026', 'world-war-legion-characters.webp', 'world-war-legion-characters.png'],
    ['3832764386', 'Milo Character Pack', '13 Active Subscribers', 'Last Updated Nov 4, 2026', 'milo-character-pack.webp', 'milo-character-pack.jpg']
  ];
  let cursor = 0;
  for (const [id, name, subscribers, updated, webp, original] of cards) {
    const card = section.indexOf(`filedetails/?id=${id}`);
    assert.ok(card > cursor, id);
    cursor = card;
    const item = section.slice(card, section.indexOf('</li>', card));
    assert.match(item, new RegExp(`class="mod-name">${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</span>`));
    assert.match(item, new RegExp(subscribers));
    assert.match(item, new RegExp(updated));
    assert.match(item, /alt="Garry's Mod"/);
    assert.match(item, new RegExp(`srcset="\\./assets/mods/${webp}"`));
    assert.match(item, new RegExp(`src="\\./assets/mods/${original}"`));
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/mods', webp)));
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/mods', original)));
  }
  const embed = fs.readFileSync(path.join(__dirname, '../mmm-embed.html'), 'utf8');
  assert.match(embed, /#\(\?:home\|platform\|worlds\|mods\|repacks\|funds\|donate\|about\|contact\|crypto-\(\?:btc\|eth\|sol\|tron\|stellar\)\)/);
});
test('workshop titles wrap in full beside a top-aligned icon, with stats sharing the row bottom', () => {
  assert.match(html, /\.mod-grid > li \{ display:flex; min-width:0; \}/);
  assert.match(html, /\.mod-grid a \{ display:flex; flex:1; flex-direction:column;/);
  assert.match(html, /\.mod-heading \{ display:flex; align-items:flex-start; gap:8px; min-width:0; \}/);
  assert.match(html, /\.mod-name \{[^}]*white-space:normal;[^}]*overflow:visible;[^}]*text-overflow:clip;[^}]*overflow-wrap:break-word;/);
  assert.doesNotMatch(html, /\.mod-name[^{]*\{[^}]*(?:ellipsis|line-clamp|nowrap)/);
  assert.match(html, /\.mod-heading \+ \.mod-stat \{ margin-top:auto; \}/);
  assert.match(html, /\.mod-shot \{[^}]*object-fit:contain;[^}]*object-position:center;/);
  assert.doesNotMatch(html, /object-fit:cover|Players, &amp; Dolls|Players &amp; Dolls|World War Legion Characters/);
  assert.match(html, /@media \(max-width:900px\) \{[\s\S]*?\.mod-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); \}/);
  assert.match(html, /@media \(max-width:620px\) \{[\s\S]*?\.mod-grid[\s\S]*?grid-template-columns:1fr;/);
});
test('homepage navigation reaches real sections and documentation instead of reopening itself', () => {
  for (const [label, id] of [['Explore', 'worlds'], ['Platform', 'platform']]) {
    assert.match(html, new RegExp(`href="#${id}"( aria-current="page")?>${label}`));
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.match(html, /href="https:\/\/github\.com\/mobs2r" target="_blank" rel="noopener noreferrer" aria-label="GitHub"/);
  assert.doesNotMatch(html, />Docs </);
  assert.match(html, /href="https:\/\/illicit\.up\.railway\.app\/support\/distribution" target="_blank" rel="noopener noreferrer">Build/);
});
test('homepage retains keyboard focus, responsive layout and reduced-motion support', () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /@media \(max-width:620px\)/);
  assert.match(html, /currentUrl\.searchParams\.set\('rev', revision\)/);
});

test('sun and moon use centered SVG boxes instead of font-dependent glyphs', () => {
  for (const icon of ['sun', 'moon']) assert.match(html, new RegExp('class="theme-' + icon + '" viewBox="0 0 24 24" aria-hidden="true"'));
  assert.match(html, /\.theme-toggle svg \{ display:block; width:22px; height:22px; grid-area:1 \/ 1/);
  assert.match(html, /data-theme="light"\] \.theme-toggle \.theme-sun \{ display:none/);
  assert.match(html, /data-theme="light"\] \.theme-toggle \.theme-moon \{ display:block/);
  assert.doesNotMatch(html, /themeToggle.textContent|☀|☾/);
});
test('homepage links every current world with its own mark and concise moniker', () => {
  for (const [href, name, moniker] of [
    ['https://www.cod.city/', 'Cod City', 'Call it what you want...'],
    ['https://www.gk.style/', 'gKnuckle', 'A mix of old &amp; new...']
  ]) {
    assert.match(html, new RegExp(`href="${href.replaceAll('.', '\\.')}`));
    assert.match(html, new RegExp(`<h3>${name}</h3><p>${moniker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
  assert.match(html, /class="world-symbol codcity-skull"/);
  assert.match(html, /class="world-symbol gknuckle-mark"/);
  assert.match(html, /Build #e0f83a3/);
  assert.match(html, /Build #6b7e0a4/);
});

test('the mmm.page embed lives at the repository root and frames the published site', () => {
  const embed = fs.readFileSync(path.join(__dirname, '../mmm-embed.html'), 'utf8');
  assert.match(embed, /<iframe[\s\S]*src="https:\/\/mobs2r\.github\.io\/illicit-page\/"/);
  assert.match(embed, /title="Illicit Corporation"/);
  assert.match(embed, /document\.body\.appendChild\(frame\)/);
  assert.match(embed, /position:fixed;inset:0/);
  assert.match(embed, /height:100dvh/);
  assert.match(embed, /overflow:hidden/);
  assert.match(embed, /searchParams\.has\('editing'\)/);
  assert.match(embed, /assets\/favicon\.png/);
  assert.match(embed, /#101318/);
  assert.match(html, /classList\.add\('is-embedded'\)/);
  assert.doesNotMatch(html, /--header-pin|embed-bleed|height:640px/);
  assert.match(html, /\.site-header \{ position:sticky;/);
});

test('active navigation follows scrolling through long Scale sections and the footer', () => {
  assert.match(html, /addEventListener\('scroll', queueCurrentNav, \{ passive: true \}\)/);
  assert.match(html, /if \(navFrame\) return/);
  assert.match(html, /requestAnimationFrame\(\(\) => \{ navFrame = 0; pickCurrentNav\(\); \}\)/);
  const source = html.slice(html.indexOf('const pickCurrentNav = () => {'), html.indexOf('let navFrame = 0;'));
  let active;
  const window = { innerHeight: 900, scrollY: 2800 };
  const document = { documentElement: { scrollHeight: 6000 } };
  const navSections = [{ id: 'mods', getBoundingClientRect: () => ({ top: -300 }) }, { id: 'funds', getBoundingClientRect: () => ({ top: 80 }) }, { id: 'contact', getBoundingClientRect: () => ({ top: 2500 }) }];
  const context = { window, document, navSections, navAnchor: null, header: { getBoundingClientRect: () => ({ bottom: 83 }) }, setCurrentNav: id => { active = id; } };
  const pick = vm.runInNewContext(source + '; pickCurrentNav', context);
  pick(); assert.equal(active, 'funds');
  window.scrollY = 5100;
  pick(); assert.equal(active, 'contact');
  context.navAnchor = 'about';
  pick(); assert.equal(active, 'about', 'short anchor destinations keep their bubble even when the browser clamps scrolling at the footer');
  context.navAnchor = null;
  window.scrollY = 0;
  navSections.forEach(section => { section.getBoundingClientRect = () => ({ top: 500 }); });
  pick(); assert.equal(active, null, 'hero has no incorrectly selected section');
  navSections[0].getBoundingClientRect = () => ({ top: -10 });
  navSections[1].getBoundingClientRect = () => ({ top: 130 });
  context.header.getBoundingClientRect = () => ({ bottom: 125 });
  pick(); assert.equal(active, 'funds', 'probe follows the actual header rather than a fixed desktop offset');
  const scheduler = html.slice(html.indexOf('let navFrame = 0;'), html.indexOf('// Intersection thresholds alone'));
  const frames = [];
  let updates = 0;
  const queue = vm.runInNewContext(scheduler + '; queueCurrentNav', {
    requestAnimationFrame: callback => frames.push(callback),
    pickCurrentNav: () => { updates++; }
  });
  queue(); queue(); queue();
  assert.equal(frames.length, 1);
  frames[0]();
  assert.equal(updates, 1);
  queue(); assert.equal(frames.length, 2);
});

test('navigation bubble uses the exact link box, including its row, border and fractional width', () => {
  const source = html.slice(html.indexOf('const placeNavPill = () => {'), html.indexOf('const setCurrentNav = id => {'));
  const navIndicator = { style: {} };
  let current = { getBoundingClientRect: () => ({ left: 152.5, top: 48.25, width: 68.75, height: 34.5 }) };
  const document = { querySelector: () => current };
  const nav = { clientLeft: 1, clientTop: 1, scrollLeft: 0, scrollTop: 0, getBoundingClientRect: () => ({ left: 100, top: 10 }) };
  const place = vm.runInNewContext(source + '; placeNavPill', { navIndicator, document, nav });
  place();
  assert.equal(navIndicator.style.width, '68.75px');
  assert.equal(navIndicator.style.height, '34.5px');
  assert.equal(navIndicator.style.transform, 'translate(51.5px, 37.25px)');
  assert.equal(navIndicator.hidden, false);
  current = null; place(); assert.equal(navIndicator.hidden, true);
  assert.match(html, /new ResizeObserver\(syncNavLayout\)/);
  assert.match(html, /document\.fonts\?\.ready\?\.then\(syncNavLayout\)/);
  assert.match(html, /--section-offset/);
  assert.match(html, /addEventListener\('wheel', releaseAnchor/);
  assert.match(html, /if \(navSections.length\)/);
});
