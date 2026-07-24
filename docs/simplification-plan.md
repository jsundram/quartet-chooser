# Simplifying Quartet Roulette — build & deployment

## Goal

Short-term: **remove the security surface by dropping every non-vital dependency.** End state:
a static site built by a small **esbuild + custom SSG**, deployed by **GitHub Actions → GitHub
Pages** on the same domain, with a trivial build/serve and a short runbook.

The site has **zero client-side interactivity** and uses **no host-specific features** (no
`netlify.toml`, `_redirects`, `_headers`, or server redirects), so almost nothing is actually
tied to Gatsby or Netlify.

## Why this is safe to do incrementally

Two independent decisions, changed **one at a time**, each reversible:

- **Framework** (Gatsby → esbuild+SSG): a change to the *build output*. Verified by output parity.
- **Host + DNS** (Netlify → GitHub Pages): a change to *serving*. Both hosts serve byte-identical
  static files, so DNS propagation is a **seamless handoff, not downtime**.

**Never change the framework and the host at the same time** — so we never debug both at once.

**Invariant:** quartetroulette.com serves working content at every moment. Keep the current
Gatsby-on-Netlify site live and untouched until each replacement is proven, and **keep identical
URLs** (`/Composer/`, `/composer-work/`, `/random`, `404.html`) so no links or SEO break.

## Target dependency set (the security win)

From ~850 packages down to:

- **authoring:** `react`, `react-dom` — 5 transitive packages total (only 3 unique to React)
- **build:** `esbuild` — one tool: JSX + CSS-modules + bundling
- nothing else required

Result: ~99% of the transitive tree — and effectively all of the current CVEs — disappears,
because they were all Gatsby's, not React's.

---

## Phase 1 — Replace Gatsby with esbuild + custom SSG (still on Netlify)

**Reasoning:** de-risk the biggest change *alone*, in production, without touching hosting or DNS.

1. Add `scripts/build.mjs` (the SSG) + `esbuild`. Reuse as-is: `src/data/data.json`,
   `src/lib/utils.js`, the JSX templates, the CSS modules, and `static/`.
   - **SSG:** import `data.json` → for each route, `renderToStaticMarkup(<Template/>)` →
     write `dist/<route>/index.html`; render each page's `Head` into `<head>`; generate
     `sitemap.xml` + `manifest.webmanifest`; copy `static/` into `dist/`.
   - **esbuild:** compile JSX, handle `.module.css` (built-in local-css loader), bundle the
     ~3-line client redirect used by the random pages.
   - **Port the Gatsby-specific APIs** (the only real code work): `Link` → plain `<a href>`;
     `useStaticQuery`/`graphql` (in `layout.js`, `about.js`) → direct `data.json` import;
     the `Head` export → invoked by the SSG.
2. **Verify parity:** diff `dist/` against the current Gatsby `public/`; confirm all ~283 routes
   + `404.html` exist; `npx serve dist` and click through home / a composer / a work / random.
3. Point **Netlify's build command** at the new build (`node scripts/build.mjs`, publish `dist/`)
   and remove the Gatsby dependencies.

**Atomicity / rollback:** ships as one commit. If the Netlify deploy is wrong, revert the commit
and Netlify redeploys the old Gatsby build. Host, domain, and DNS are untouched the whole time.

## Phase 2 — Move hosting Netlify → GitHub Pages (domain still on Netlify)

**Reasoning:** stand up and prove the new host *before* moving the domain.

1. Add `.github/workflows/deploy.yml`: on push to `main`, run `node scripts/build.mjs` and
   deploy `dist/` with `actions/deploy-pages`.
2. Enable Pages (source: GitHub Actions). It goes live at the temporary `*.github.io` URL.
   - Note: assets use root-absolute paths (as today). The temporary project URL serves under a
     subpath, so treat it as a **pipeline smoke test**; true root serving happens once the custom
     domain is attached in Phase 3.
3. Confirm the Action builds and publishes green.

**Atomicity / rollback:** Netlify still serves quartetroulette.com the entire time. A broken
Action cannot affect the live site.

## Phase 3 — DNS cutover to GitHub Pages

**Reasoning:** last, smallest, fastest-to-reverse step. Both hosts serve identical content, so
propagation is seamless.

**Prep (day before):**
1. Lower the domain's DNS TTL to ~300s (makes both cutover and rollback fast).
2. Add a `CNAME` file (`quartetroulette.com`) to the repo and set the custom domain in Pages.

**Cutover (off-peak):**
3. Update DNS: apex `A`/`ALIAS` → GitHub Pages IPs (`185.199.108–111.153`), or `www`
   `CNAME` → `jsundram.github.io`.
4. Let GitHub auto-provision the HTTPS cert (after DNS resolves), then enable **Enforce HTTPS**.

**Rollback:** repoint DNS to Netlify — fast thanks to the low TTL; both hosts serve the same site,
so there is no broken window during propagation.

**The one real caveat:** the Pages HTTPS cert is issued *after* DNS points at it (minutes–hours),
so there can be a brief HTTPS-provisioning gap. Mitigate by cutting over off-peak and keeping
Netlify as instant rollback. If you want **zero cert gap + PR preview deploys**, use **Cloudflare
Pages** instead of GitHub Pages (edge certs are instant) — same workflow, different target.

**Decommission:** once Pages serves the domain over HTTPS and is stable, delete the Netlify site.

---

## Build / serve (end state)

- `npm run build` → `node scripts/build.mjs` → `dist/`
- `npm run serve` → `npx serve dist` (local preview, served at root)
- `npm run dev` *(optional)* → esbuild watch + live reload
- **Deploy:** push to `main` → GitHub Action builds and publishes.

## Runbook

- **Update content:** edit the Google Sheet → `python scripts/update.py -c 0` → commit
  `src/data/data.json` → push (auto-deploys).
- **Add a composer/work:** the existing TODO steps, minus any framework-specific edits.
- **Roll back a deploy:** revert the commit; the Action redeploys the previous output.
- **Emergency host rollback:** repoint DNS to Netlify (kept live until fully confident).

## Sequencing summary

1. **esbuild + SSG, deployed via Netlify** — prove the build; revertable in one commit.
2. **GitHub Actions → Pages at the temporary URL** — prove the host; live site unaffected.
3. **DNS cutover (low TTL) + HTTPS** — seamless handoff; instant rollback to Netlify.
4. **Decommission Netlify** once stable.
