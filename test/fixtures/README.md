# Test fixtures

`routes.json` and `sitemap-urls.json` pin the site's exact URL surface;
`npm test` fails if a build produces anything different.

They were originally snapshotted from the **final Gatsby build** (2026-07-24)
to prove the esbuild SSG reproduced it exactly. Since the Gatsby→esbuild
cutover they mean *"parity with the last accepted build"*: an unexpected
diff is a bug, an expected one (new composer or work) is updated with

    npm run test:update

which rebuilds `dist/` and regenerates both files. **Review the resulting
diff** — it is precisely the list of URL changes you are shipping.
