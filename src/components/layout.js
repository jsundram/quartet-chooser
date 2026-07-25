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
  siteTitle,
  siteIcon,
} from './layout.module.css'

// 🔀 nav links: /js/shuffle.js overwrites href with a random member of
// data-shuffle on every view, so a click is one direct navigation. The
// static href is what the link means before JS enhances it — /random and
// /random-composer stay real entry-point URLs.
const SHUFFLE = random_targets();

const Layout = ({ pageTitle, children }) => {
  let title = pageTitle ? (pageTitle + " | ") : "";
  title += SITE_TITLE;

  // aria-current="page" on the link matching the rendered page,
  // as gatsby-link used to do
  const path = React.useContext(PathContext);
  let current = href => (href === path || href + '/' === path) ? 'page' : undefined;

  return (
    <main className={container}>
      <title>{title}</title>

      <a className={siteTitle} href="/" aria-current={current('/')}>{SITE_TITLE}</a>
      &nbsp;&nbsp;<img src="/icon.png" alt="site icon" className={siteIcon}/>

      <nav>
        <ul className={navLinks}>
          <li className={navLinkItem}><a href="/" className={navLinkText} aria-current={current('/')}>Home</a></li>
          <li className={navLinkItem}><a href="/random" data-shuffle={SHUFFLE['random'].join(' ')} className={[navLinkText, button].join(" ")} title="Random Quartet">Quartet 🔀</a></li>
          <li className={navLinkItem}><a href="/random-composer" data-shuffle={SHUFFLE['random-composer'].join(' ')} className={[navLinkText, button].join(" ")} title="Random Composer">Composer 🔀</a></li>
          <li className={navLinkItem}><a href="/about" className={navLinkText} aria-current={current('/about')}>About</a></li>
        </ul>
      </nav>

      {children}
    </main>
  )
}

export default Layout

