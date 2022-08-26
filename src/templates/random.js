// Step 1: Import your component
import * as React from 'react'
import { Link } from 'gatsby'
import {get_work_title, slugify, choose_one} from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    console.log(pageContext.node);
    const works = pageContext.node.greats;
    let work = choose_one(works)
    console.log(work)
    let random = slugify(work);
    const isBrowser = typeof window !== `undefined`;

    if (isBrowser){
        window.location.replace(random);
    }

    return (
          <Layout pageTitle="Random Quartet">
            <h1>Random Quartet</h1>
            <p>Redirecting to a random quartet: <Link to={random}>{work.composer}:&nbsp;{get_work_title(work)}</Link> &hellip;</p>
          </Layout>
      )
}

export default RandomPage
