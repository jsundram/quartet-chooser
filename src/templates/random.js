// Step 1: Import your component
import * as React from 'react'
import {get_work_title, slugify, HIDDEN} from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    // /js/random.js does the redirect and picks afresh on every visit; this
    // static link is only what shows in the instant before that. It is a
    // fixed placeholder, not a random one, so the build stays reproducible.
    // (HIDDEN filter matches random_targets() in scripts/render.js.)
    const works = pageContext.node.greats;
    let work = works.find(w => !HIDDEN[w.composer])
    let random = slugify(work);

    return (
          <Layout pageTitle="Random Quartet">
            <h1>Random Quartet</h1>
            <p>Redirecting to a random quartet: <a href={random}>{work.composer}:&nbsp;{get_work_title(work)}</a> &hellip;</p>
          </Layout>
      )
}

export default RandomPage
