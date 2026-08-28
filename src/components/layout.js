import * as React from 'react'
import { SITE_TITLE } from '../lib/site'
import { random_targets } from '../lib/routes'
import { PathContext } from './path-context'

import {
  button,
  container,
  navLinks,
  navLinkItem,
  navLinkText,
  siteHeading,
  siteTitle,
  siteIcon,
} from './layout.module.css'

// 🔀 nav links: /js/shuffle.js overwrites href with a random member of the
// named list on every view, so a click is one direct navigation. The static
// href is what the link means before JS enhances it — /random and
// /random-composer stay real entry-point URLs, and they still work with no
// JS at all.
//
// data-shuffle-KEY, not the list itself. The lists live in shuffle.js, baked
// in at build time (pwa.md Phase 7). Inlining them here put ~3.9 KB of route
// paths in the nav of all 279 pages, twice each: more than half of a 10-14 KB
// page, ~2 MB across the site, re-parsed on every navigation and re-downloaded
// with every page, to say the same two things every page already said. In the
// script it is fetched once, cached, and shared.
const SHUFFLE_KEYS = Object.keys(random_targets());

// A tripwire: shuffle.js is handed these same lists by name, so a key added
// or renamed in routes.js without a matching data-shuffle-key here would show
// up as a 🔀 that never randomizes. Failing the build is louder.
for (const key of ['random', 'random-composer']){
  if (!SHUFFLE_KEYS.includes(key)) throw new Error(`random_targets() lost ${key}`);
}

const Layout = ({ children }) => {
  // aria-current="page" on the link matching the rendered page,
  // as gatsby-link used to do
  const path = React.useContext(PathContext);
  let current = href => (href === path || href + '/' === path) ? 'page' : undefined;

  // The wordmark is the home page's only real heading, so on / it *is* the
  // <h1>. Every other page brings its own — the work title, the composer's
  // signature, "About", "Page not found" — and a second <h1> would flatten
  // the outline. .siteHeading exists only to keep the h1 from changing how
  // any of this looks: it inherits font size and weight (the <a> sets its
  // own) and drops the default margins.
  const wordmark = (
    <>
      <a className={siteTitle} href="/" aria-current={current('/')}>{SITE_TITLE}</a>
      {/* decorative: it repeats the wordmark next to it, so alt="" keeps a
          screen reader from reading the site's name twice.

          NOT /icon.png, which is the 512x512 16-bit RGBA master that
          make-icons.mjs and make-og.mjs rasterize from: 105 KB, on every page
          on the site, to draw 25 CSS pixels -- and React preloads it, so it
          competed with the HTML for the connection. This is the same artwork
          from the generated set, at 4.4 KB, big enough to stay crisp at 35 px
          on a 2x screen. width/height are the intrinsic size, so the header
          reserves the box before the file lands (the CSS height still wins). */}
      &nbsp;&nbsp;<img src="/icons/icon-96x96.png" alt="" width="96" height="96" className={siteIcon}/>
    </>
  );

  return (
    <div className={container}>
      <header>
        {path === '/' ? <h1 className={siteHeading}>{wordmark}</h1> : wordmark}

        <nav>
          <ul className={navLinks}>
            <li className={navLinkItem}><a href="/" className={navLinkText} aria-current={current('/')}>Home</a></li>
            <li className={navLinkItem}><a href="/random" data-shuffle-key="random" className={[navLinkText, button].join(" ")} title="Random Quartet">Quartet 🔀</a></li>
            <li className={navLinkItem}><a href="/random-composer" data-shuffle-key="random-composer" className={[navLinkText, button].join(" ")} title="Random Composer">Composer 🔀</a></li>
            <li className={navLinkItem}><a href="/about" className={navLinkText} aria-current={current('/about')}>About</a></li>
          </ul>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}

export default Layout
