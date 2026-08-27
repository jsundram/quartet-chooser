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

// 🔀 nav links: /js/shuffle.js overwrites href with a random member of
// data-shuffle on every view, so a click is one direct navigation. The
// static href is what the link means before JS enhances it — /random and
// /random-composer stay real entry-point URLs.
const SHUFFLE = random_targets();

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
          screen reader from reading the site's name twice */}
      &nbsp;&nbsp;<img src="/icon.png" alt="" className={siteIcon}/>
    </>
  );

  return (
    <div className={container}>
      <header>
        {path === '/' ? <h1 className={siteHeading}>{wordmark}</h1> : wordmark}

        <nav>
          <ul className={navLinks}>
            <li className={navLinkItem}><a href="/" className={navLinkText} aria-current={current('/')}>Home</a></li>
            <li className={navLinkItem}><a href="/random" data-shuffle={SHUFFLE['random'].join(' ')} className={[navLinkText, button].join(" ")} title="Random Quartet">Quartet 🔀</a></li>
            <li className={navLinkItem}><a href="/random-composer" data-shuffle={SHUFFLE['random-composer'].join(' ')} className={[navLinkText, button].join(" ")} title="Random Composer">Composer 🔀</a></li>
            <li className={navLinkItem}><a href="/about" className={navLinkText} aria-current={current('/about')}>About</a></li>
          </ul>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}

export default Layout
