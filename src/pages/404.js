import * as React from "react"
import { COMPOSERS, composer_url } from "../lib/utils"
import { OG_SITE_CARD, OG_SITE_CARD_ALT } from "../lib/site"

import Layout from '../components/layout'
import Meta from '../components/meta'

// The 404 is the only page a lost visitor is guaranteed to see, so it carries
// the site nav (via Layout) and the composer list: the likeliest way to get
// here is a URL that is nearly right -- a typo, a stale link, or a mis-cased
// /Haydn/ once we are on a case-sensitive host -- and one click should fix it.
const NotFoundPage = () => {
  return (
    <Layout>
      <h1>Page not found</h1>
      <p>
        Sorry{" "}
        <span role="img" aria-label="Pensive emoji">
          😔
        </span>{" "}
        we couldn’t find what you were looking for.
      </p>
      <p>
        Try a composer:{" "}
        {COMPOSERS.map((composer, i) => (
          <React.Fragment key={composer}>
            {i > 0 ? ", " : ""}
            <a href={composer_url(composer)}>{composer}</a>
          </React.Fragment>
        ))}
        .
      </p>
    </Layout>
  )
}

export const Head = ({ path }) => (
  <Meta
    title="Not found"
    description={`That page isn't here. Pick one of the ${COMPOSERS.length} composers and `
        + `get back to the quartets.`}
    path={path}
    image={OG_SITE_CARD}
    image_alt={OG_SITE_CARD_ALT}
  />
)

export default NotFoundPage
