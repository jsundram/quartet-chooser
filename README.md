# Quartet Roulette
![site icon](https://user-images.githubusercontent.com/150536/187096035-ea1f8f79-ffab-4659-bb4a-4ace4c993aad.png)

The code behind https://quartetroulette.com. See more at [https://quartetroulette.com/about/](https://quartetroulette.com/about/).

* Data is sourced from [this Google Sheet](https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/edit#gid=0)
* Feedback is welcome [here](https://forms.gle/JUCS5FT9CkNtvRZT9).

## Build

* `npm run build` — render the site to `dist/` (React + esbuild static site generator, `scripts/build.mjs`)
* `npm run serve` — preview `dist/` locally
* `npm test` — build and verify output (routes, sitemap, links)
* `npm run test:update` — regenerate `test/fixtures/` after intentionally changing the route set (new composer/work); review the diff

Deploys via Netlify on push to `main` (see `netlify.toml`).
