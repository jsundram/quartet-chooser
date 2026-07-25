# Simplifying Quartet Roulette — build & deployment

> **Status (2026-07-25):** Phase 1 done and live. Phase 1.5 next. Phases 2–3 not started.

## Goal

Short-term: **remove the security surface by dropping every non-vital dependency.** End state:
a static site built by a small **esbuild + custom SSG**, deployed by **GitHub Actions → GitHub
Pages** on the same domain, with a trivial build/serve and a short runbook.

The site has **no client-side framework** and almost no client behavior, so very little is tied to
Gatsby. It *is*, however, tied to Netlify in one way the first draft of this plan got wrong — see
below.

## What the site actually depends on its host for

The original plan claimed "no host-specific features (no `netlify.toml`, `_redirects`, `_headers`,
or server redirects)". Two corrections, the second one load-bearing:

1. There **is** a `netlify.toml` now (added in Phase 1, on purpose, so the build command ships with
   the commit that needs it instead of living in the Netlify UI).
2. Netlify resolves **HTML paths case-insensitively and 301s to lowercase**, and nothing in the
   repo asks it to. Measured against production:

   | request | Netlify |
   |---|---|
   | `/haydn/` | `200` |
   | `/Haydn/`, `/HAYDN/` | `301` → `/haydn/` |
   | `/About/` | `301` → `/about/` |
   | `/Haydn.svg`, `/haydn.svg` | `200` both, no redirect |

   The build emits `/Haydn/` and the sitemap advertises `/Haydn/`, so **every real-world reference
   is the lowercase form** — that is what crawlers followed the 301 to and what anyone copying from
   their address bar got. GitHub Pages is case-sensitive and would `404` on `/haydn/`.

So "both hosts serve byte-identical static files" is true of the **files** and false of the **URL
resolution**. Phase 1.5 below closes that gap before the host changes.

**Invariant:** quartetroulette.com serves working content at every moment, and the URLs that
external links and search results actually use keep working.

## Why this is safe to do incrementally

Independent decisions, changed **one at a time**, each reversible:

- **Framework** (Gatsby → esbuild+SSG): a change to the *build output*. Verified by output parity
  **plus runtime behavior** — see the Phase 1 retrospective for why output parity alone is not
  enough.
- **URL shape** (mixed-case → lowercase): also a *build output* change, and safe to do while still
  on Netlify because Netlify serves both cases throughout.
- **Host + DNS** (Netlify → GitHub Pages): a change to *serving*.

**Never change the build output and the host at the same time** — so we never debug both at once.

## Target dependency set (the security win)

- **authoring:** `react`, `react-dom` — build-time only, nothing ships to the browser
- **build:** `esbuild` — JSX + CSS-modules + bundling
- nothing else

Achieved. The cutover deploy log reads `added 2 packages, removed 1337 packages, and changed 3
packages in 4s`; `npm audit` reports 0 vulnerabilities and the `got` SSRF override is gone with the
transitive tree that needed it.

The plan predicted "effectively all of the current CVEs disappear, because they were all Gatsby's,
not React's." Measured after the cutover — **144 Dependabot alerts fixed, 0 open**:

| severity | count |
|---|---|
| critical | 7 |
| high | 73 |
| medium | 49 |
| low | 15 |

142 of the 144 were npm alerts in `package-lock.json`, every one a Gatsby transitive dependency,
closed by deleting the tree rather than by patching anything. The criticals were `shell-quote`,
`webpack`, `loader-utils`, `@babel/traverse`, `form-data`, and `parse-url`. The other 2 were
`spotipy` in `scripts/requirements.txt` — unrelated to the site, fixed by a version bump.

A side effect: it obsoleted the standing backlog of Dependabot PRs, some open since 2022, since each
proposed bumping a package that no longer exists. All ten were closed on 2026-07-25, along with two
human-authored PRs (#9, #14) whose content had already landed by other routes. Open PRs and open
alerts are both now zero.

---

## Phase 1 — Replace Gatsby with esbuild + custom SSG (still on Netlify) — **DONE 2026-07-25**

Shipped in #24 (20 commits, rebased onto `main`, tip `aa19418`). Live in production and verified:
279 routes, 278 sitemap URLs, zero Gatsby runtime JS, images byte-identical, build 435ms.

### What the plan got wrong

Worth keeping, because the same mistakes are available in Phases 2 and 3.

- **"Zero client-side interactivity" was wrong.** React hydration had been providing *three*
  behaviors, not one: the random-page redirects (the plan anticipated this), the touch-device
  Spotify-embed swap, and re-randomizing the composer pages' 🔀 links on each view. Missing the
  third shipped a real regression — 56 links across 14 pages that returned the same "random"
  quartet until the next deploy. Now `/js/random*.js`, `/js/work.js`, `/js/shuffle.js`.
- **"Verify parity: diff `dist/` against `public/`, click through a few pages" was insufficient.**
  It is exactly the method that misses the frozen-🔀 bug: the static HTML is shaped identically
  whether the href is re-randomized on load or frozen forever, and clicking the link *works* — it
  just always goes to the same place. **Output diffing cannot see runtime behavior.** The test
  suite now covers the client scripts directly.
- **"Ships as one commit" was optimistic** — 9 commits, then 11 more from review.
- **Undiscovered work:** vendoring the `gatsby-plugin-manifest` icon set, and reproducing
  `gatsby-transformer-json`'s `"full name"` → `full_name` key normalization.
- **The build command moved into the repo** (`netlify.toml`) rather than the Netlify UI as step 3
  said, so the deploy switches atomically with its commit.

### Left behind, to clean up

- The **Essential Gatsby** build plugin (`@netlify/plugin-gatsby`) is installed via the Netlify UI,
  so no repo change removes it. It still loads on every build, restores and re-saves a Gatsby cache
  that `scripts/build.mjs` deletes, and asks for a `gatsby-config.js` that no longer exists. It
  injects no redirects, headers, or functions, and images are served untransformed — so it is inert
  but wasteful (build is 435ms; the whole deploy request is ~20s). Remove it, then **Clear cache and
  deploy** to flush the Gatsby-era `node_modules` and `.cache` out of Netlify's cache store.
- Netlify's **UI build settings** (build command, publish directory, env vars, build plugins) still
  exist outside the repo. `netlify.toml` supersedes the command and publish directory for normal
  builds — but a git-revert rollback *deletes* `netlify.toml`, so that path falls back to the UI and
  only works if the UI still reads `gatsby build` / `public`.

  **Unverified as of 2026-07-25**, and post-merge deploy logs can no longer tell you: every
  production build now reports `build.command from netlify.toml`. To check, open a **pre-merge**
  production deploy's log and look for `$ gatsby build`, or read the settings form at
  `Project configuration → Build & deploy`. Until that is confirmed, prefer the rollback that needs
  no rebuild and no build config at all: **Publish deploy** on the last Gatsby production deploy.

---

## Phase 1.5 — Lowercase the composer URLs (still on Netlify) — **NEXT**

**Reasoning:** this is the case-sensitivity fix, and it belongs here rather than in Phase 2 or 3
for three reasons:

1. It is a **build-output** change, the same class as Phase 1 — not a serving change. Folding it
   into the DNS cutover would mean changing URL generation and the host in one step, which is the
   one thing this plan exists to avoid.
2. It is **self-verifying on Netlify and nowhere else.** Because Netlify serves HTML paths
   case-insensitively, `/haydn/` (a direct hit after the rename) and `/Haydn/` (a 301) both work
   before, during, and after. There is no window in which anything breaks. That safety net
   disappears the moment the site is on Pages.
3. Doing it before Phase 2 means the Pages smoke test exercises the **final** URL shape.

**Scope: exactly 18 routes** — the composer pages. Everything else is already lowercase: work slugs
(`slugify` lowercases), `/about/`, `/random`, `/random-composer`, `/404/`.

```
/Bach/ /Bartok/ /Beethoven/ /Boccherini/ /Brahms/ /Britten/ /Debussy/ /Dvorak/ /Grieg/
/Haydn/ /Mendelssohn/ /Mozart/ /Prokofiev/ /Ravel/ /Schubert/ /Schumann/ /Shostakovich/
/Tchaikovsky/
```

**Steps:**

1. Lowercase the composer path in `src/lib/routes.js`, and the composer hrefs in
   `src/pages/index.js`, `src/templates/composer.js`, `src/templates/work.js`, and
   `random_targets()` in `scripts/render.js`.
2. `npm run test:update` — the fixture diff should be exactly 18 route changes and 18 sitemap URL
   changes. If it is anything else, stop.
3. Note that `test/build.test.mjs` identifies composer pages with `/^\/[A-Z]/`; that discriminator
   stops working and needs replacing.
4. Deploy and confirm on production that `/haydn/` is a direct `200` and `/Haydn/` still `301`s to
   it.

**Static assets need no change.** Their references are generated from the real filenames
(`/Haydn.svg`), so they are already correct-case. But note Netlify serves assets case-insensitively
*without* redirecting — a leniency Pages will not provide — so correct case matters from Phase 2 on.

**The CI job is the guard for this.** `npm test`'s link-integrity check uses `existsSync`, which is
case-*insensitive* on macOS (verified: `existsSync('static/haydn.svg')` is `true` although the file
is `Haydn.svg`) and case-*sensitive* on the `ubuntu-latest` runner. So a case mismatch passes
locally and fails in CI. Trust CI, not a local run, for anything case-related.

**Optional:** emitting `/Haydn/` redirect stubs is not necessary — Netlify has been 301ing every
mixed-case reference to lowercase for years, so external links already use the lowercase form — but
it is 18 tiny files if you want belt-and-braces. If you do emit them, add a
`<link rel="canonical">` (the site currently has none) so the duplicate is unambiguous.

**Rollback:** revert the commit. Netlify serves both cases regardless, so neither the change nor its
revert can break a URL.

---

## Phase 2 — Move hosting Netlify → GitHub Pages (domain still on Netlify)

**Reasoning:** stand up and prove the new host *before* moving the domain.

1. Add `.github/workflows/deploy.yml`: on push to `main`, run `npm ci && npm run build` and deploy
   `dist/` with `actions/deploy-pages`. `.github/workflows/test.yml` already does the `npm ci` +
   `npm test` half on every PR and push, so this extends an existing green pipeline rather than
   starting one.
2. Enable Pages (source: GitHub Actions). It goes live at the temporary `*.github.io` URL.
   - Assets use root-absolute paths (as today). The temporary project URL serves under a subpath,
     so treat it as a **pipeline smoke test**; true root serving happens once the custom domain is
     attached in Phase 3.
3. Confirm the Action builds and publishes green, and spot-check that a composer page, a work page,
   and the portraits all load — this is the first host that will not paper over a case mismatch.
4. Remove the Essential Gatsby plugin from Netlify and **Clear cache and deploy**, confirming
   Netlify still serves the site correctly with no plugins loaded.

**Atomicity / rollback:** Netlify still serves quartetroulette.com the entire time. A broken Action
cannot affect the live site.

## Phase 3 — DNS cutover to GitHub Pages

**Reasoning:** last, smallest, fastest-to-reverse step. With Phase 1.5 done, both hosts resolve the
same URLs, so propagation is seamless.

**Prep (day before):**
1. Lower the domain's DNS TTL to ~300s (makes both cutover and rollback fast).
2. Add a `CNAME` file (`quartetroulette.com`) to the repo and set the custom domain in Pages.
3. Re-confirm no remaining route or asset reference depends on case-insensitive serving (CI green
   on `ubuntu-latest` is the check).

**Cutover (off-peak):**
4. Update DNS: apex `A`/`ALIAS` → GitHub Pages IPs (`185.199.108–111.153`), or `www`
   `CNAME` → `jsundram.github.io`.
5. Let GitHub auto-provision the HTTPS cert (after DNS resolves), then enable **Enforce HTTPS**.

**Rollback:** repoint DNS to Netlify — fast thanks to the low TTL; both hosts serve the same site,
so there is no broken window during propagation.

**The one real caveat:** the Pages HTTPS cert is issued *after* DNS points at it (minutes–hours),
so there can be a brief HTTPS-provisioning gap. Mitigate by cutting over off-peak and keeping
Netlify as instant rollback. If you want **zero cert gap + PR preview deploys**, use **Cloudflare
Pages** instead of GitHub Pages (edge certs are instant) — same workflow, different target.

**Decommission:** once Pages serves the domain over HTTPS and is stable, delete the Netlify site.

---

## Build / serve (end state)

- `npm run build` → `node scripts/build.mjs` → `dist/` (~0.5s for 279 pages)
- `npm run serve` → `npx serve dist` (local preview, served at root)
- `npm test` → build, then verify routes, sitemap, page content, client scripts, and link integrity
- `npm run test:update` → regenerate `test/fixtures/` after an intentional route-set change
- **Deploy:** push to `main`. No watch task — a full rebuild is faster than a watcher would be.

## Runbook

- **Update content:** edit the Google Sheet → `python scripts/update.py -c 0` → commit
  `src/data/data.json` → `npm run test:update` if the route set changed → push (auto-deploys).
- **Add a composer/work:** the TODO.md checklist (`DISPATCHER`/`HIDDEN` in `src/lib/utils.js`, then
  `npm run test:update`).
- **Roll back a deploy:** revert the commit; the deploy pipeline republishes the previous output.
  While on Netlify, **Publish deploy** on a previous deploy is faster and needs no rebuild.
- **Emergency host rollback:** repoint DNS to Netlify (kept live until fully confident).

## Sequencing summary

1. ~~**esbuild + SSG, deployed via Netlify**~~ — done 2026-07-25 (#24).
2. **Lowercase the 18 composer URLs, still on Netlify** — closes the case-sensitivity gap while the
   host still forgives it.
3. **GitHub Actions → Pages at the temporary URL** — prove the host; live site unaffected. Drop the
   Netlify Gatsby plugin.
4. **DNS cutover (low TTL) + HTTPS** — seamless handoff; instant rollback to Netlify.
5. **Decommission Netlify** once stable.
