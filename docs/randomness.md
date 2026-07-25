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

All six principles hold.

- `choose_one()` is gone — it rolled dice at build time to fill a slot that `shuffle.js`
  overwrites on every view, which is what made every deploy report changed pages.
- The nav 🔀 links carry `data-shuffle` and `shuffle.js` loads on every page, so a nav 🔀 click
  is one direct navigation (was 4,943 bytes of `/random/` plus a *serial* 3,249-byte
  `/js/random.js` fetch before the redirect could even be decided).
- The redirect pages are emitted directly by `scripts/build.mjs`, not rendered from React
  templates: no layout, no stylesheet, redirect script inlined so it fires during parse. They
  remain only as entry points for typed and bookmarked URLs — in-site clicks never reach them,
  and they are not in the sitemap (principle 6 asks for a URL, not an indexed blank page).
- The old test invariant — a page loads `shuffle.js` *iff* it has shuffle links — collapsed to
  "every page" and was rewritten; its useful half survives as "a single-work composer page has
  no 🔀 beyond the nav pair."
