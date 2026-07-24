// Step 1: Import your component
import * as React from 'react'
import { choose_one } from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    const composers = pageContext.node.composers;
    let composer = choose_one(composers)
    let random = "/" + composer.name + "/";
    const isBrowser = typeof window !== `undefined`;

    if (isBrowser){
        window.location.replace(random);
    }

    return (
        <Layout pageTitle="Random Composer">
            <h1>Random Composer</h1>
            <p>Redirecting to a random composer: <a href={random}>{composer.full_name}</a> &hellip;</p>
        </Layout>
    )
}

export default RandomPage
