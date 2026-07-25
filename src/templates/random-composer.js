// Step 1: Import your component
import * as React from 'react'
import { choose_one, composer_url } from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    // the actual redirect happens in /js/random-composer.js; this static
    // page is the no-JS fallback with a valid build-time choice
    const composers = pageContext.node.composers;
    let composer = choose_one(composers)
    let random = composer_url(composer.name);

    return (
        <Layout pageTitle="Random Composer">
            <h1>Random Composer</h1>
            <p>Redirecting to a random composer: <a href={random}>{composer.full_name}</a> &hellip;</p>
        </Layout>
    )
}

export default RandomPage
