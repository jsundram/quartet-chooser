// Step 1: Import your component
import * as React from 'react'
import {get_work_title, slugify, choose_one} from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    // the actual redirect happens in /js/random.js; this static page is
    // the no-JS fallback with a valid build-time choice
    const works = pageContext.node.greats;
    let work = choose_one(works)
    let random = slugify(work);

    return (
          <Layout pageTitle="Random Quartet">
            <h1>Random Quartet</h1>
            <p>Redirecting to a random quartet: <a href={random}>{work.composer}:&nbsp;{get_work_title(work)}</a> &hellip;</p>
          </Layout>
      )
}

export default RandomPage
