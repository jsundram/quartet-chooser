import * as React from 'react'
import { Link } from 'gatsby'
import { useStaticQuery, graphql } from 'gatsby'

import {
  container,
  navLinks,
  navLinkItem,
  navLinkText,
  siteTitle,
  siteIcon,
} from './layout.module.css'

const Layout = ({ pageTitle, children }) => {
  const data = useStaticQuery(graphql`
      query {
          site {
            siteMetadata {
              title
            }
          }
  }`);

  return (
    <main className={container}>
      {pageTitle ? <title>{pageTitle} | {data.site.siteMetadata.title}</title> : <title>{data.site.siteMetadata.title}</title>}

      <Link className={siteTitle} to="/">{data.site.siteMetadata.title}</Link>
      &nbsp;&nbsp;<img src="/icon.png" alt="site icon" className={siteIcon}/>

      <nav>
        <ul className={navLinks}>
          <li className={navLinkItem}><Link to="/" className={navLinkText}>Home</Link></li>
          <li className={navLinkItem}><Link to="/random" className={navLinkText}>Random Quartet</Link></li>
          <li className={navLinkItem}><Link to="/random-composer" className={navLinkText}>Random Composer</Link></li>
          <li className={navLinkItem}><Link to="/about" className={navLinkText}>About</Link></li>
        </ul>
      </nav>

      {children}
    </main>
  )
}

export default Layout

