import * as React from 'react'
import { SITE_TITLE } from '../lib/site'

import {
  button,
  container,
  navLinks,
  navLinkItem,
  navLinkText,
  siteTitle,
  siteIcon,
} from './layout.module.css'

const Layout = ({ pageTitle, children }) => {
  let title = pageTitle ? (pageTitle + " | ") : "";
  title += SITE_TITLE;

  return (
    <main className={container}>
      <title>{title}</title>

      <a className={siteTitle} href="/">{SITE_TITLE}</a>
      &nbsp;&nbsp;<img src="/icon.png" alt="site icon" className={siteIcon}/>

      <nav>
        <ul className={navLinks}>
          <li className={navLinkItem}><a href="/" className={navLinkText}>Home</a></li>
          <li className={navLinkItem}><a href="/random" className={[navLinkText, button].join(" ")} title="Random Quartet">Quartet 🔀</a></li>
          <li className={navLinkItem}><a href="/random-composer" className={[navLinkText, button].join(" ")} title="Random Composer">Composer 🔀</a></li>
          <li className={navLinkItem}><a href="/about" className={navLinkText}>About</a></li>
        </ul>
      </nav>

      {children}
    </main>
  )
}

export default Layout

