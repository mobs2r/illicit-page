# Illicit Corporation

October 19 button audit: current local favicons for Ko-fi, Patreon, PayPal,
Streamlabs, Throne, Cinch, Rampage, Lis-Skins, XPlay, Red Cross and WWF.
Twitch and Buy Me a Coffee retain their matching purple/yellow favicons. The
GitHub button uses the GitHub mark; crypto uses token marks, not exchange logos.
The bottom profile link is removed; the top-right GitHub link remains.

Brand sources: https://more.ko-fi.com/brand-assets (orange #ff6433),
https://www.patreon.com/brand (current monochrome identity and rebrand favicon),
https://streamlabs.com/about (mint #80f5d2 and the linked social-avatar favicon),
https://rampagecoffee.com/ (site theme yellow #f8c705), and the current site
favicons linked by Cinch and WWF. PayPal's current favicon retains the
#002991 deep blue. Throne's purple #7065f2 and Red Cross #cc0000 match their
favicon pixels. Ko-fi/Patreon/Streamlabs/Cinch/Rampage/WWF were downloaded from
their own published asset links; PayPal/Throne/Red Cross are cached site favicons
from Google's s2 service. All are served locally, not requested by visitors.
Crypto buttons name Bitcoin, Ethereum, Solana, Tron, and Stellar only.
Bitcoin, Ethereum, and Solana keep their existing monochrome marks. Tron uses
the official triangular icon from the Tron.network logo. Stellar uses the
historical rocket mark. All five are forced white in dark mode and black in
light mode, the same idea as the Wallstreet Common mark following the theme.

Scale groups explicit domain rows separately from services in the same board.
The wheel has one Domains segment; it sums the displayed per-domain budgets
without re-rounding. Wheel colors meet edge-to-edge, with matching small strokes
to cover antialias hairlines. Currency conversion and the annual total are
unchanged. No pricing disclaimers or per-service subtext were restored.

The corporate billing/server picker and its header gear are removed for now.
Its source and planning notes are retained but are not loaded by the page.
The existing Illicit backend, accounts and billing records are unchanged.
See [the hosting boundary](support/HOSTING-PLAN.md) before resuming this work.
The theme button uses centered SVG sun/moon icons rather than font glyphs.

Source for [illicit.page](https://illicit.page), the home of Illicit Corporation and the worlds it runs: Omerta Chat, Atlantis Chat, cod.city and gKnuckle.

All code lives on GitHub under [@mobs2r](https://github.com/mobs2r).

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole site: one self-contained page with no build step. |
| `mmm-embed.html` | The snippet pasted into mmm.page, so illicit.page shows the published site. |
| `manifest.webmanifest` | Install metadata for the page. |
| `builds.json` | The live Omerta and Atlantis build numbers shown on the world cards. GitHub Actions refreshes it hourly. |
| `support/` | Tests and maintenance scripts. |

## Publishing

1. Push to `main`. `.github/workflows/corporation-pages.yml` publishes `index.html` to GitHub Pages at <https://mobs2r.github.io/illicit-page/>.
2. illicit.page is built on [mmm.page](https://mmm.page). It shows the site through an embed:
   1. In the mmm.page editor, add an **Embed / HTML** block.
   2. Paste the contents of `mmm-embed.html` into it.
   3. Publish.

The embed only frames the GitHub Pages site. Updates to `index.html` show up on illicit.page without touching mmm.page again. Change `mmm-embed.html` only if the frame itself should change, then paste it into mmm.page again.

The public embed uses one viewport-sized iframe, outside mmm.page's transformed
canvas. The inner document owns all scrolling and its normal sticky header;
the outer page does not scroll. Do not restore the old 2,827-pixel frame,
header-pinning messages or 640-pixel footer spacer. Those created nested
scrolling, a disappearing header and a black footer band. The script skips
fullscreen mounting in `?editing` so the mmm.page editor remains accessible.
It forwards supported section hashes and sets the outer tab icon to the hosted
corporate PNG. Keep the host background `#101318` as a loading fallback.

## Checks

```sh
node --test support/*.test.cjs
```

## Scale and donations

`assets/costs.json` stores annual amounts in their original billing currency.
Exchange rates are units per USD; convert once, then restore the owner's
requested budget display: round upward to the next 10 below 1,000 and the
next 100 from 1,000 onward. Exact source amounts stay unchanged. The total
equals the displayed line items. Public rows show only name and annual amount,
without links, subtext or a rounding disclaimer. Claude Max and SoundCloud use
owner-confirmed CAD bills; source metadata retains the pricing basis for the
other rows. Rate dates remain in source metadata, not a banner on the page.
The panel-width currency selector includes USD, CAD, EUR, GBP, AUD, NZD, JPY,
CHF, CNY, INR, BRL and KRW with symbols. All use the October 16, 2026 Bank of
Canada observation: CAD per currency unit is inverted against USD/CAD once
to store units per USD. Raw observation inputs and URL are retained in the
JSON. JPY and KRW display no fractional units; dollar and yen prefixes keep
different currencies distinguishable in amounts. The visible subtitle says
"One lab in Saskatoon, building" and retains its word scroller.

`assets/donation-wallets.json` is a snapshot of the public recipients, not
credentials or donor records. It avoids requiring Omerta login or widening
the shared API's CORS policy. Recheck the public configuration before changing
recipients. Crypto buttons copy the verified recipient directly and briefly
show a confirmation outline. Labels are the chain name only, with no ticker.
An accessible status announces success or failure without changing those
labels or adding visible wallet panels. Recipient networks remain validated
in the wallet configuration.

Bitcoin, Ethereum, and Solana keep the recipients published by the public
configuration on 2026-11-06. Tron and Stellar were not in that configuration
or on the previous page; their recipients are the ones supplied for this
page. Avalanche, Polygon, USD Coin, ApeCoin, and Tether buttons are removed.
The dropped EVM entries shared the Ethereum address, which remains only on
Ethereum. Partners appear before Canada; Lis-Skins and XPlay.gg both use the
owner-supplied MOBS2R code and link to their homepages. The Canada group
names Red Cross, WWF, Salvation Army, and Extra Life without a Donate caption.
Support includes Boosty at https://boosty.to/mobs2r. Skins, directly below
crypto, links Steam and SuperTripLand.

Partner favicon sources: Lis-Skins' https://lis-skins.com/favicon.ico (converted
losslessly to a local PNG), and Google's cached favicon for xplay.gg via
https://www.google.com/s2/favicons?domain=xplay.gg&sz=128, matching the white X
mark on XPlay's official blog. The favicon pixels supply Lis-Skins' orange
`#ff7200`; XPlay uses its black/white mark. These files are served locally,
without runtime favicon-proxy requests, and are used only to identify the
linked partners. The MOBS2R codes are unchanged.
The corporate page does not issue quotes, connect a wallet, mint
rewards or collect email addresses. Existing backend receipts and awarded
inventory remain intact.

Email-linked rewards are not enabled. Before launch, require a verified payment
receipt plus ownership of its linked email, expiring single-use verification
tokens, replay-safe receipt/account binding and server-side reward idempotency.
The shared API already has a Resend recovery-mail transport, but its sender,
domain and production configuration must be verified before reusing it. The
public contact addresses are biz@illicit.page and promo@illicit.page. The
support ticket embed and standalone link have been removed from this site;
existing private ticket records are preserved in Illicit API.

The three world icons reuse their actual marks from the world cards. The manifest
and embedded page share the Illicit favicon. The embed script explicitly sets the
outer favicon to the same public PNG; the mmm.page Site Icon setting can also use
that PNG as a no-script fallback.
