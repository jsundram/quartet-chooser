// Step 1: Import your component
import * as React from 'react'
import { Link } from 'gatsby'
import { choose_one } from  "../lib/utils"

import Layout from '../components/layout'

const RandomPage = ( {pageContext} ) => {
    console.log(pageContext.node);
    const composers = pageContext.node.composers;
    let composer = choose_one(composers)
    console.log(composer)
    let random = "/" + composer.name + "/";
    const isBrowser = typeof window !== `undefined`;

    if (isBrowser){
        window.location.replace(random);
    }

    return (
        <Layout pageTitle="Random Composer">
            <h1>Random Composer</h1>
            <p>Redirecting to a random composer: <Link to={random}>{composer.full_name}</Link> &hellip;</p>
        </Layout>
    )
}

export default RandomPage
