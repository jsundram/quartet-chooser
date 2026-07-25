// Step 1: Import your component
import * as React from 'react'
import { composer_url } from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    // /js/random-composer.js does the redirect and picks afresh on every
    // visit; this static link is only what shows in the instant before that.
    // Fixed, not random, so the build stays reproducible.
    const composers = pageContext.node.composers;
    let composer = composers[0]
    let random = composer_url(composer.name);

    return (
        <Layout pageTitle="Random Composer">
            <h1>Random Composer</h1>
            <p>Redirecting to a random composer: <a href={random}>{composer.full_name}</a> &hellip;</p>
        </Layout>
    )
}

export default RandomPage
