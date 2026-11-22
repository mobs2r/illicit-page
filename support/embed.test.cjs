const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const embed = fs.readFileSync(path.join(__dirname, '../mmm-embed.html'), 'utf8');
const script = embed.match(/<script>([\s\S]*?)<\/script>/)[1];
function run(href, fetcher) {
  const location = new URL(href);
  let src = 'https://mobs2r.github.io/illicit-page/';
  const frame = { style: {}, getAttribute: () => src, setAttribute: (key, value) => { src = value; } };
  const icon = {};
  const attached = [];
  const events = {};
  const document = {
    getElementById: () => frame,
    querySelector: () => icon,
    documentElement: { style: { cssText: '' } },
    body: { style: { cssText: '' }, appendChild: node => attached.push(node) }
  };
  vm.runInNewContext(script, { document, location, URL, fetch: fetcher, window: { addEventListener: (name, fn) => { events[name] = fn; } } });
  return { document, location, frame, icon, attached, events, src: () => src };
}
test('public embed has one viewport scroll owner and matching favicon', () => {
  const app = run('https://illicit.page/#donate');
  assert.deepEqual(app.attached, [app.frame]);
  assert.match(app.frame.style.cssText, /position:fixed;inset:0/);
  assert.match(app.frame.style.cssText, /height:100dvh/);
  assert.match(app.document.documentElement.style.cssText, /overflow:hidden/);
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#donate');
  assert.equal(app.icon.href, 'https://mobs2r.github.io/illicit-page/assets/favicon.png');
  app.location.hash = '#repacks'; app.events.hashchange();
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#repacks');
  app.location.hash = '#contact'; app.events.hashchange();
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#contact');
  app.location.hash = '#untrusted'; app.events.hashchange();
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#home');
});
test('root visits force the initial navigation after the iframe is reparented', () => {
  const app = run('https://illicit.page/');
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#home');
});
test('editor preview is never covered or scroll-locked by the public embed', () => {
  const app = run('https://mmm.page/mobs2r?editing');
  assert.equal(app.attached.length, 0);
  assert.equal(app.document.body.style.cssText, '');
  assert.equal(app.frame.style.cssText, undefined);
});

test('the embed uses a verified build revision to avoid stale page caches', async () => {
  const app = run('https://illicit.page/#funds', async (url, options) => {
    assert.equal(url, 'https://mobs2r.github.io/illicit-page/builds.json');
    assert.equal(options.cache, 'no-store');
    return {ok:true,json:async()=>({platform:'4fd7866593bae8fa75b51ac322291d96362c9e4a'})};
  });
  await new Promise(setImmediate);
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/?rev=4fd7866593ba#funds');
  app.location.hash = '#contact'; app.events.hashchange();
  assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/?rev=4fd7866593ba#contact');
});

test('invalid build metadata and fetch failures cannot change the iframe origin or blank the site', async () => {
  for (const fetcher of [async()=>({ok:true,json:async()=>({platform:'https://other.example/'})}),async()=>{throw Error('Offline');}]) {
    const app = run('https://illicit.page/', fetcher);
    await new Promise(setImmediate);
    assert.equal(app.src(), 'https://mobs2r.github.io/illicit-page/#home');
  }
});
