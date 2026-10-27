const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('About preserves the supplied four-paragraph copy with readable spacing', () => {
  const section = html.slice(html.indexOf('id="about"'), html.indexOf('id="contact"'));
  const paragraphs = [...section.matchAll(/<p class="about-copy">([^<]+)<\/p>/g)].map(match => match[1].replaceAll('&amp;', '&'));
  assert.deepEqual(paragraphs, [
  "Illicit Corporation is a Métis founded independent research & development lab located in Saskatoon, Saskatchewan, Canada. The focus of our research & development is game design, specifically with networking or peripherals. We are constantly evolving our team & commitment to mirror these responsibilities.",
  "Illicit's founder (mobs2r) is deeply passionate about the foundational values of the lab. Previously, our founder has worked for companies like Overwolf (Tebex, NitroPay, CurseForge) & Ex Corp (CS Money, Scope, XPlay) where they were able to learn the skills integral to building the Illicit API.",
  "Illicit API enables game developers & game server administrators to levy a suite of tools. These tools aren't like the late viral trend of traditional game bridges, instead, this is infrastructure. Resupply Locker grants the connective tissue for web to integrate with game engines like never before & bridge in-game economies.",
  "Mushrum enables our clients & partners to levy the data we collect internally within the Illicit Ecosystem. Clients & partners can tap into the Illicit API suite to integrate Faked ID or Faked Credit Card into their stack seamlessly. The behavior & trust factor of users is also accessible, integrated into robust cross-ban systems."
]);
  assert.match(html, /\.about-copy \+ \.about-copy \{ margin-top:20px; \}/);
});
