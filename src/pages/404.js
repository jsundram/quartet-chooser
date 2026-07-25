import * as React from "react"
import { COMPOSERS, composer_url } from "../lib/utils"

import Layout from '../components/layout'

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

export const Head = () => (
  <title>Not found | Quartet Roulette</title>
)

export default NotFoundPage
