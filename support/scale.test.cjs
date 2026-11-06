const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/costs.json')));
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('conversion uses each source currency once before presentation rounding', async () => {
  const { convertMoney, roundMoney, formatMoney } = await import('../assets/scale-pricing.mjs');
  assert.equal(convertMoney(100, 'CAD', 'CAD', data.rates), 100);
  assert.equal(roundMoney(convertMoney(100, 'USD', 'CAD', data.rates)), 141.54);
  assert.equal(roundMoney(convertMoney(141.54, 'CAD', 'USD', data.rates)), 100);
  assert.equal(formatMoney(18.99, 'USD'), 'US$18.99');
  assert.equal(roundMoney(155.40), 155.4);
  assert.equal(roundMoney(2400), 2400);
  for (const amount of [NaN, -1, Infinity]) assert.throws(() => convertMoney(amount, 'USD', 'CAD', data.rates));
  assert.throws(() => convertMoney(20, 'XXX', 'CAD', data.rates));
});

test('annual display restores upward tens/hundreds without adding public explanatory text', async () => {
  const { roundBudgetMoney, formatMoney, convertMoney } = await import('../assets/scale-pricing.mjs');
  for (const [amount, expected] of [[0, 0], [18.99, 20], [26.88, 30], [125, 130], [999.99, 1000], [1000, 1000], [1000.01, 1100], [1864.8, 1900], [2400, 2400], [3396.96, 3400]]) assert.equal(roundBudgetMoney(amount), expected);
  assert.equal(roundBudgetMoney(convertMoney(18.99, 'USD', 'CAD', data.rates)), 30);
  assert.equal(formatMoney(roundBudgetMoney(18.99), 'USD'), 'US$20');
  for (const amount of [NaN, -1, Infinity]) assert.throws(() => roundBudgetMoney(amount));
  assert.match(html, /const grouped = groupAnnualCosts/);
  assert.match(html, /const total = rawTotal/);
  const section = html.slice(html.indexOf('id="funds"'), html.indexOf('id="donate"'));
  assert.doesNotMatch(section, /disclaimer|indicative|round|invoice|estimate|group-note|rates-as-of/i);
});

test('confirmed invoices retain CAD; domains and published USD subscriptions are not relabelled', () => {
  assert.equal(data.rateBasis, 'units-per-USD');
  const cost = name => data.costs.find(c => c.name === name);
  assert.deepEqual([cost('Anthropic').amount, cost('Anthropic').currency], [1864.8, 'CAD']);
  assert.deepEqual([cost('SoundCloud').amount, cost('SoundCloud').currency], [125, 'CAD']);
  assert.deepEqual([cost('Grok').amount, cost('Grok').currency], [2400, 'USD']);
  assert.match(cost('Grok').basis, /invoice may differ/);
  for (const c of data.costs.filter(c => c.name.includes('.'))) assert.equal(c.currency, 'USD');
});

test('requested copy is removed, Scale is visible and donations stay on the corporation site', () => {
  assert.match(html, /id="funds-title">Scale</);
  assert.match(html, /id="planet-pills">Canada</);
  assert.doesNotMatch(html, /Preserve Our Planet|Give directly to relief and conservation\.|Rates as of|>Funds</);
  assert.doesNotMatch(html, /omerta\.chat\/\?donate/);
  assert.match(html, /id="donate"/);
  assert.doesNotMatch(html, /Email-linked rewards|Future Crypto Ball rewards|For an existing donation receipt|Send only the selected asset|Annual costs in their original billing currencies|The same account, coin, and inventory|id="crypto-wallets"|donation-rewards/);
  assert.equal([...html.matchAll(/<button type="button" disabled class="pill"[^>]+data-crypto-wallet=/g)].length, 5);
  assert.match(html, /id="crypto-copy-status" class="sr-only" role="status"/);
  assert.match(html, /href="mailto:biz@illicit\.page">biz@illicit\.page<\/a>/);
  assert.match(html, /href="mailto:promo@illicit\.page">promo@illicit\.page<\/a>/);
  assert.match(html, /"email":\["biz@illicit\.page","promo@illicit\.page"\]/);
  assert.doesNotMatch(html, /Inbox setup pending|mobs2r@illicit\.page|Support Illicit Corporation and its projects here|No Omerta account is required to give/);
  assert.match(html, /Saskatoon, Saskatchewan S7K 1N7/);
  assert.doesNotMatch(html, /mobs2@waifu\.club/);
});

test('contact contains direct contact details without the scrapped support ticket area', () => {
  assert.match(html, /mailto:biz@illicit.page/);
  assert.match(html, /mailto:promo@illicit.page/);
  assert.doesNotMatch(html, /support-desk|support\/desk|Illicit private support chat|Open support in its own window|crabcoin_token|X-Support-Guest|api\/support/);
  assert.doesNotMatch(html, /Conversions are indicative\. Taxes, card fees and metered usage may differ\. Source amounts and pricing basis appear beside each cost\./);
});

test('annual cost breakdown renders only service name and right-aligned amount with no links', () => {
  const render = html.slice(html.indexOf('const renderFunds = () => {'), html.indexOf('const partnerCodes = ['));
  assert.match(render, /name\.textContent = cost\.name/);
  assert.match(render, /row\.append\(name, amount\)/);
  assert.match(render, /amount\.textContent = formatMoney\(shown, fundsCurrency\)/);
  assert.doesNotMatch(render, /createElement\('a'\)|createElementNS\(svgNS, 'a'\)|cost-basis|cost-swatch|createElement\('small'\)|createElement\('img'\)|supportsLabel|setAttribute\('href'/);
  assert.match(html, /\.cost-list li \{ display:flex; align-items:center; justify-content:space-between/);
  assert.match(html, /\.cost-amount \{[^}]*text-align:right/);
});

test('crypto buttons show only the chain name; Solana is purple', () => {
  const buttons = [...html.matchAll(/data-crypto-wallet="([a-z]+)"[^>]*>[\s\S]*?<span data-crypto-label>([^<]+)<\/span><\/button>/g)];
  assert.deepEqual(buttons.map(match => match[2]), ['Bitcoin', 'Ethereum', 'Solana', 'Tron', 'Stellar']);
  const crypto = html.slice(html.indexOf('id="crypto-pills"'), html.indexOf('id="skins-pills"'));
  assert.doesNotMatch(crypto, /\$|\b(?:BTC|ETH|SOL|TRX|XLM|AVAX|POL|USDC|USDT|APE)\b|Avalanche|Polygon|Tether|ApeCoin|USD Coin/);
  for (const match of buttons) assert.doesNotMatch(match[0], /<small>|C-Chain|PoS|on Ethereum|·/);
  assert.match(html, /data-brand="sol"\] \{ background:#9945ff; color:#fff/);
  assert.match(html, /data-brand="tron"\] \{ background:#ef0027; color:#fff/);
  assert.match(html, /data-brand="stellar"\] \{ background:#000; color:#fff/);
  assert.match(html, /pill\[data-crypto-wallet\] img \{ filter:brightness\(0\) invert\(1\)/);
  assert.match(html, /data-theme="light"\] \.support-grid \.pill\[data-crypto-wallet\] img \{ filter:brightness\(0\)/);
});

test('five recipients validate and bad or duplicated networks fail closed', async () => {
  const { validateWallets } = await import('../assets/donations.mjs');
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/donation-wallets.json')));
  assert.deepEqual(validateWallets(config).map(chain => chain.name), ['Bitcoin', 'Ethereum', 'Solana', 'Tron', 'Stellar']);
  const byId = id => config.chains.find(chain => chain.id === id);
  assert.equal(byId('btc').address, 'bc1qx5kqn0euaqsplq5y6j9fx59xl729hz2shvyafj');
  assert.equal(byId('eth').address, '0xE7e7f86B917CCE369991d0DA51D61b3e183C9718');
  assert.equal(byId('sol').address, '4J4Xp9ysBS68r9RGjPSULP8ZwUyUYurzRa4FGKH4YoC4');
  assert.equal(byId('tron').address, 'TRyBxzD5ojJhNQs2LVL8sFyZ7U9HNRtwEu');
  assert.equal(byId('stellar').address, 'GCW7MA7DTVRPOZRSUG3YJEG7QWVZ5CGMUTHNGIITPJSRE3MIPPGC2U76');
  const bad = structuredClone(config); bad.chains[0].address = 'not-a-wallet';
  assert.throws(() => validateWallets(bad));
  const duplicate = structuredClone(config); duplicate.chains[1].id = duplicate.chains[0].id;
  assert.throws(() => validateWallets(duplicate));
  const wrongNetwork = structuredClone(config); wrongNetwork.chains[3].network = 'ethereum';
  assert.throws(() => validateWallets(wrongNetwork));
  const badTron = structuredClone(config); badTron.chains.find(chain => chain.id === 'tron').address = byId('eth').address;
  assert.throws(() => validateWallets(badTron));
  const badStellar = structuredClone(config); badStellar.chains.find(chain => chain.id === 'stellar').address = 'G' + '0'.repeat(55);
  assert.throws(() => validateWallets(badStellar));
  assert.throws(() => validateWallets({ ...config, rewardsEnabled: true }));
});

test('Partners appears before Canada and both new partners use the supplied MOBS2R code', () => {
  assert.ok(html.indexOf('id="partner-pills"') < html.indexOf('id="planet-pills"'));
  assert.match(html, /name: 'Lis-Skins', code: 'MOBS2R', href: 'https:\/\/lis-skins.com\/'/);
  assert.match(html, /name: 'XPlay.gg', code: 'MOBS2R', href: 'https:\/\/xplay.gg\/'/);
});

test('Lis-Skins and XPlay have local real favicons and their orange/black and monochrome palettes', () => {
  for (const [brand, file] of [['lis-skins', 'lis-skins.png'], ['xplay', 'xplay.png']]) {
    assert.match(html, new RegExp(`icon: './assets/icons/${file.replace('.', '\\.')}', brand: '${brand}'`));
    const bytes = fs.readFileSync(path.join(__dirname, '../assets/icons', file));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.ok(bytes.readUInt32BE(16) >= 32 && bytes.readUInt32BE(20) >= 32);
  }
  assert.match(html, /data-brand="lis-skins"\] \{ background:#ff7200; color:#161006/);
  assert.match(html, /data-brand="xplay"\] \{ background:#000; color:#f8f8f8/);
  assert.doesNotMatch(html, /background:#f6ad62|color:#f5d77b/);
});

test('every referenced local icon is present and is an image, not an HTML error page', () => {
  const icons = new Set([...html.matchAll(/src="\.\/(assets\/icons\/[^"?]+)"/g)].map(m => m[1]).concat(data.costs.map(c => c.icon)));
  for (const icon of icons) {
    const bytes = fs.readFileSync(path.join(__dirname, '..', icon));
    assert.ok(bytes.length > 50, icon);
    if (icon.endsWith('.svg')) { assert.match(bytes.toString(), /<svg\b/); assert.doesNotMatch(bytes.toString(), /<script|<!doctype html/i); }
    else assert.ok(bytes[0] === 0x89 && bytes[1] === 0x50 || bytes[0] === 0xff && bytes[1] === 0xd8, icon + ' signature');
  }
});

test('manifest and touch icon use the same corporate favicon', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.webmanifest')));
  assert.match(html, /rel="apple-touch-icon" href="\.\/assets\/favicon\.png"/);
  assert.ok(manifest.icons.some(i => i.src === './assets/favicon.png' && i.sizes === '512x512'));
  assert.equal(fs.readFileSync(path.join(__dirname, '../assets/favicon.png')).subarray(1, 4).toString(), 'PNG');
});

test('remaining button palettes match their audited sources', () => {
  for (const [brand, color] of Object.entries({kofi:'ff6433',patreon:'000',twitch:'9146ff',paypal:'002991',streamlabs:'80f5d2',bmc:'ffdd00',throne:'7065f2',rampage:'f8c705',redcross:'cc0000'})) {
    assert.ok(html.includes(`data-brand="${brand}"] { background:#${color};`), brand);
  }
  assert.match(html, /src="\.\/assets\/icons\/streamlabs.png"/);
  assert.doesNotMatch(html, /assets\/icons\/(?:usdc|usdt|avax|pol)\.|assets\/icons\/ape\./);
});

test('Skins follows crypto, Boosty joins support, and Canada charities have no Donate caption', () => {
  assert.ok(html.indexOf('id="crypto-pills"') < html.indexOf('id="skins-pills"'));
  assert.ok(html.indexOf('id="skins-pills"') < html.indexOf('id="partner-pills"'));
  const skins = html.slice(html.indexOf('id="skins-pills"'), html.indexOf('id="partner-pills"'));
  assert.match(skins, /id="skins-pills">Skins</);
  assert.match(skins, /data-brand="steam" href="https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=1081247513&amp;token=Qc777wxt" target="_blank" rel="noopener noreferrer"/);
  assert.match(skins, /<span>Steam<\/span>/);
  assert.match(skins, /data-brand="supertripland" href="https:\/\/supertrip\.land\/profile\/mobs2r" target="_blank" rel="noopener noreferrer"/);
  assert.match(skins, /<span>SuperTripLand<\/span>/);
  assert.match(html, /data-brand="boosty" href="https:\/\/boosty\.to\/mobs2r" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<span>Boosty<small>\/mobs2r<\/small><\/span>/);
  const canada = html.slice(html.indexOf('id="planet-pills"'), html.indexOf('id="about"'));
  assert.doesNotMatch(canada, /<small>\s*Donate\s*<\/small>/);
  assert.match(canada, /<span>Red Cross<\/span>/);
  assert.match(canada, /<span>WWF<\/span>/);
  assert.match(canada, /data-brand="salvation-army" href="https:\/\/salvationarmy\.ca\/get-involved\/donate\/"/);
  assert.match(canada, /<span>Salvation Army<\/span>/);
  assert.match(canada, /data-brand="extra-life" href="https:\/\/extra-life\.org\/donate"/);
  assert.match(canada, /<span>Extra Life<\/span>/);
});

test('domain categories combine into exactly one wheel chunk in every currency', async () => {
  const { groupAnnualCosts } = await import('../assets/scale-groups.mjs');
  const { convertMoney, roundBudgetMoney } = await import('../assets/scale-pricing.mjs');
  for (const currency of Object.keys(data.rates)) {
    const grouped = groupAnnualCosts(data.costs, currency, data.rates, ['#123456', '#abcdef']);
    assert.deepEqual(grouped.sections.map(section => section.name), ['Domains', 'Services']);
    assert.equal(grouped.sections[0].rows.length, 9);
    assert.equal(grouped.sections[1].rows.length, 9);
    assert.equal(grouped.slices.filter(slice => slice.name === 'Domains').length, 1);
    assert.equal(grouped.slices.length, 10);
    assert.ok(grouped.sections[0].rows.every(row => row.sliceIndex === 0));
    assert.ok(grouped.sections[1].rows.every(row => row.sliceIndex > 0));
    const expected = data.costs.reduce((sum, cost) => sum + roundBudgetMoney(convertMoney(cost.amount, cost.currency, currency, data.rates)), 0);
    assert.equal(grouped.total, expected);
    assert.equal(grouped.slices.reduce((sum, slice) => sum + slice.value, 0), expected);
    assert.equal(grouped.slices[0].value, grouped.sections[0].rows.reduce((sum, row) => sum + row.shown, 0));
    if (currency === 'CAD') { assert.equal(grouped.total, 10150); assert.equal(grouped.slices[0].value, 500); }
  }
  const tbd = groupAnnualCosts([{name:'example.test',category:'domain',amount:null}], 'USD', data.rates, ['#123456']);
  assert.equal(tbd.total, 0); assert.equal(tbd.slices.length, 0); assert.equal(tbd.sections[0].rows[0].sliceIndex, null);
});

test('wheel segments use their complete share with matching strokes to close antialias seams', () => {
  assert.match(html, /const length = full;/);
  assert.doesNotMatch(html, /full - gap|Math.max\(full|const gap = full/);
  assert.match(html, /wedge.setAttribute\('stroke', slice.color\)/);
  assert.match(html, /wedge.setAttribute\('stroke-width', '\.35'\)/);
});

test('twelve symbol-labelled currencies use the verified snapshot and single conversion basis', async () => {
  const { currencyOptions, convertMoney, formatMoney } = await import('../assets/scale-pricing.mjs');
  assert.equal(currencyOptions.length, 12);
  assert.equal(currencyOptions[0].code, 'CAD');
  assert.equal(new Set(currencyOptions.map(option => option.code)).size, 12);
  const codes = [...html.matchAll(/role="radio" data-currency="([A-Z]+)"/g)].map(match => match[1]);
  assert.deepEqual(codes, currencyOptions.map(option => option.code));
  assert.match(html, /data-currency="CAD"[^>]*aria-checked="true"/);
  assert.match(html, /let fundsCurrency = 'CAD';/);
  assert.equal(data.ratesAsOf, '2026-10-16');
  for (const option of currencyOptions) {
    assert.ok(data.rates[option.code] > 0);
    assert.ok(html.includes(`aria-label="${option.code} — ${option.name}"`));
    assert.ok(html.includes(`>${option.code} <span class="currency-symbol" aria-hidden="true">${option.symbol}</span>`));
    assert.ok(Math.abs(data.rates[option.code] - data.rateInputsCadPerUnit.USD / data.rateInputsCadPerUnit[option.code]) < 1e-12);
    const converted = convertMoney(100, 'USD', option.code, data.rates);
    assert.ok(Math.abs(convertMoney(converted, option.code, 'USD', data.rates) - 100) < 1e-9);
    assert.ok(formatMoney(converted, option.code).startsWith(option.prefix));
  }
  assert.equal(formatMoney(123.45, 'JPY'), 'JP¥123');
  assert.equal(formatMoney(123.45, 'KRW'), '₩123');
  assert.throws(() => formatMoney(100, 'XXX'));
  assert.throws(() => formatMoney(-1, 'USD'));
  assert.match(html, /\.funds-top \{ display:grid; grid-template-columns:minmax\(260px,340px\) minmax\(0,1fr\)/);
  assert.match(html, /\.currency-switch \{ display:grid; grid-template-columns:repeat\(6,minmax\(0,1fr\)\); width:100%/);
});

test('the bottom profile link is removed while the top profile and sponsor buttons remain', () => {
  const contact = html.slice(html.indexOf('id="contact"'), html.indexOf('</main>'));
  assert.doesNotMatch(contact, /github.com/);
  assert.equal([...html.matchAll(/href="https:\/\/github.com\/mobs2r"/g)].length, 1);
  assert.match(html, /href="https:\/\/github.com\/sponsors\/mobs2r"/);
});
