# Randomness: where the dice get rolled

The site is a roulette wheel, so "pick a random thing" shows up in several places. They grew
separately under Gatsby and drifted into two unrelated mechanisms. This note is the target
they should converge on.

## Principles

1. **The choice happens when the user acts**, in the browser — never at build time.
2. **The build is a pure function of the data.** Two builds of one commit are byte-identical.
3. **One mechanism.** "Pick a random target for this link" is one primitive, used everywhere.
4. **A random link is a real link.** It has a correct `href` before the click, so middle-click,
   copy-link-address, open-in-new-tab, and the status bar all tell the truth.
5. **One navigation per click.** No redirect hop for a click that originates in-site.
6. **`/random` stays a URL.** It is an entry point — bookmarkable, shareable, typeable — not the
   mechanism the nav uses to get you somewhere.

## Target architecture

One script owns the story: for any element with `data-shuffle="slug slug slug"`, pick a member and
set `href` — on load, and on `pageshow` when `persisted` (bfcache restores the mutated DOM without
re-running scripts). That is `src/client/shuffle.js`. Everything else is a *use* of it.

| link | fallback `href` | `data-shuffle` |
| --- | --- | --- |
| nav "Quartet 🔀" | `/random` | the great-quartet slugs |
| nav "Composer 🔀" | `/random-composer` | the composer URLs |
| composer page 🔀 | first work in the group | that group's slugs |

The fallback `href` is what the link means before JS enhances it. For the nav that is literally
`/random` — semantically exact, correct with JS off, and upgraded to a direct target so the click
costs one navigation instead of three requests.

The redirect pages stay, thin: no rendered link, script inlined, redirect fired during parse.

## Decisions

- **Candidate lists are inlined per page, not shipped as a shared cached file.** ~670 B gzipped on
  every page. The shared-file option is *technically* better for this site's core loop — repeated
  🔀 clicks mean repeated page loads, so the inline copy is re-sent each time while a shared file
  would be cached after the first. At current size that difference is ~13 KB across a 20-click
  session, which does not justify another build artifact to cache-bust. **Revisit if the list
  exceeds ~5 KB gzipped, or if more shuffle surfaces appear.**

- **Composer-page 🔀 keeps a first-element fallback rather than getting its own `/random` URL.**
  The 🔀 links are per opus group, not per composer: 56 of them across 14 pages, 15 on Haydn alone.
  Giving each a URL means 56 near-empty pages (~4.9 KB each, since every page inlines the whole
  stylesheet) plus 56 sitemap entries, to replace an array index no user ever sees. A URL should
  exist because someone would navigate to it directly, not to make a line of code read better.
  Name the value (`fallback`) and state the contract in a comment instead.

- **No-JS parity is not a goal.** Fallback `href`s exist so links behave like links, not to serve
  a no-JS audience. That is why the fallback need not be random.

## Status

Holds today: 1, 2, 4. `choose_one()` is gone — it rolled dice at build time to fill a slot that
`shuffle.js` overwrites on every view, which is what made every deploy report changed pages.

Still open:

- **Principle 3** — nav 🔀 bounces through a redirect page while composer 🔀 randomizes in place.
- **Principle 5** — a nav 🔀 click costs two extra round-trips: `/random/` is 4,943 bytes, and it
  then fetches `/js/random.js` (3,249 bytes) *serially* before it can decide where to go. That
  script has exactly one consumer, so the external file buys no cache reuse — it is pure latency.
- **Redirect-page weight** — `/random/` inlines the entire site stylesheet for a page that renders
  nothing and lives ~50 ms.

## Implementation notes for the open items

Two things the nav change drags along, neither obvious from the diff it will produce:

- **`shuffle.js` currently loads only on composer pages** (the `SCRIPTS` map in `scripts/build.mjs`).
  The nav lives in the layout, so putting `data-shuffle` on nav links means the script has to load
  everywhere.
- **That breaks `test/build.test.mjs`**, which asserts a page loads `shuffle.js` *iff* it has
  shuffle links. Once every page has a nav shuffle link the invariant collapses to "every page,"
  so the test needs rewriting rather than re-running — and the useful assertion it was making
  (composer pages with no multi-work group must not load the script) needs somewhere else to live,
  or it is silently lost.
