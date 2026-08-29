# Working in this repo

Quartet Roulette (<https://quartetroulette.com>) — 256 string quartets by 18 composers, one static
page per work and per composer. Deployed on Netlify from `main`.

## The build

`scripts/build.mjs` is a static site generator: esbuild bundles `scripts/render.js` (JSX + CSS
modules + `data.json`) for Node, React renders every route in `src/lib/routes.js` to
`dist/<route>/index.html`, and the CSS is inlined into each page. It replaced `gatsby build`; see
`docs/simplification-plan.md`.

- The shared `<head>` is `page_html()` in `scripts/build.mjs`. Per-page tags come from each page's
  or template's `Head` export (`src/pages/*.js`, `src/templates/*.js`).
- Install metadata and the `apple-touch-icon` are derived from `static/manifest.webmanifest`, so the
  manifest is the single source of truth for icons and theme colour. Preserve that.
- Client JS is `src/client/*.js`, bundled by the same build. Hashed CSS-module class names reach it
  through esbuild `define` — see `CLASS_NAMES` in `scripts/render.js`.
- Site-wide constants (URL, title, share cards, GoatCounter endpoint and event name) live in
  `src/lib/site.js`. Change them there, not at the use sites.
- `npm test` runs `test/*.test.mjs` against a real `dist/`. It is fast (~5s); run it. One test
  shells out to four full builds, so it dominates the runtime, and it breaks if anything else builds
  at the same moment — `build.mjs` opens with `rm -rf dist`, so two concurrent builds delete each
  other's output. Don't run a build and the tests against the same tree at once.
- The optimized drawings are cached in `.cache/svg/`, keyed on each drawing's bytes plus
  `scripts/build.mjs` itself, so editing the build invalidates them automatically. A cold build is
  ~4.7s and a warm one ~1.0s. Deleting `.cache/` only costs one slow build.

## Assets: what is committed and what the build generates

Three categories, and the rule is about what Netlify's build image can run, not preference.

- **Committed, generated locally** — the icon set (`npm run icons`) and the share cards
  (`npm run og`). Their tools are `rsvg-convert` and `pngquant`, which Netlify does not have. The
  build re-checks the cards' size on the way past, because a stale or hand-edited oversized card
  would otherwise ship silently and break link previews.
- **Generated in the build** — the portrait SVGs (below). `svgo` and `svgpath` are pure JS and run
  anywhere, so `static/` keeps the drawings as delivered and there is no 54-file diff whenever the
  artwork changes. Both are `dependencies`, not devDependencies, because `npm run build` needs them
  and Netlify runs `npm run build`.
- **Copied through** — everything else in `static/`.

## The portrait SVGs

`static/*.svg` is 54 drawings: `X.svg` (home grid, and the composer page), `X-Original.svg` (work
pages), `X-Signature.svg`. They are the heaviest thing the site ships.

**They are not editable originals.** No Inkscape editing metadata in any of them — no
`sodipodi:namedview`, no layers, no labels, only auto-generated ids — and 36 of 54 carry the PDF→SVG
conversion signature: a `matrix(1.3333 0 0 -1.3333 …)` y-flip (96/72 dpi) wrapping a `scale(0.1)`
group. They are machine conversions of something upstream. If the artist's real source files exist,
those are the honest place to fix anything about the geometry.

`minify_svgs()` in `scripts/build.mjs` does svgo → fold each path's transform into its coordinates
(`svgpath`) → scale every drawing into one 16,384-unit space → svgo again, rounding to integers.
The fold is the point: svgo collapses the nested groups but will **not** fold their transform into
the path data, because these paths contain elliptical arcs and the matrix reflects, so it declines
rather than risk the arc maths. Without the fold, every file ships coordinates in a space up to 8×
larger than its own viewBox.

**The precision budget is a property of the site, not the artwork**, which is why this is in the
build and not baked into `static/`. It is set by the largest size anything draws these: the composer
page portrait at `height: 600px` (`src/templates/composer.module.css`), which is 1,800 device pixels
on a 3× phone. Work pages draw 300px, the home grid 200px, signatures 100px. **If those CSS heights
change, re-check `SVG_UNITS`.**

Two traps, both of which have already cost real time:

1. Scale the viewBox **and** the path data together, and leave `width`/`height` alone. Ten files
   have `width`/`height` ratios that disagree with their `viewBox` (Grieg by 31%) and are meant to
   render letterboxed; rewriting those attributes silently un-letterboxes them.
2. Never rescale **before** folding. The rounding then happens in each path's local space and gets
   multiplied by the leftover transform — up to 1,900×.

Changes to any of this must be verified by rendering, not by reading the diff: rasterize all 54
against the authored originals at 600, 900 and 1,800px and compare channel by channel. The bar met
today is mean 0.5–0.7% of pixels differing, none over 3%, all of it edge antialiasing. Two tests
guard the mechanism — no path in `dist/` may carry a transform, and every drawing must land in the
normalized space — but they cannot tell you it still *looks* right.

### Known data defects, upstream of the build

- **Six `-Original.svg` files carry an opaque white background rectangle** — Bartok, Boccherini,
  Britten, Debussy, Mendelssohn, Schumann. The other twelve, and all the `X.svg`, are transparent.
  Removing it changes 0.0% of pixels on a white page and 87.9% on a dark one, so this is invisible
  today and **blocks dark mode**: it would put white boxes on six work pages.
- **Ten drawings letterbox themselves** (trap 1 above): Dvorak, Grieg, Haydn, Mendelssohn, Mozart,
  Prokofiev, Ravel, Schubert, Schumann, Shostakovich.
- **~91,000 coordinate pairs** across the 36 the home page loads, for artwork drawn at most 600 CSS
  px — far more geometry than any render uses. Reducing it means refitting curves, which changes the
  artwork rather than how it is written down, and needs a person to look at the result.

## Current workstream

`pwa.md` at the repo root is the plan, audit rubric and review checklist for the PWA work
(share cards, manifest, install metas, analytics, offline, performance, dark mode). It cites commit
hashes, so **merge its PRs with `--ff-only` or a merge commit — never squash or rebase.** It is
temporary and leaves the repo when Jason says so; anything in it that outlives the workstream should
move here first.
