import * as React from "react"
import { COMPOSERS, composer_url, get_portrait, get_signature } from  "../lib/utils"
import { OG_SITE_CARD, OG_SITE_CARD_ALT, SITE_TITLE } from "../lib/site"
import data from "../data/data.json"

import Layout from '../components/layout'
import Meta from '../components/meta'

import {
    image,
    signature,
    wrapper,
    composer_box
} from './index.module.css'

// loading="lazy" on the grid is a performance fix, not a preference, and it is
// load-bearing twice over (pwa.md Phase 7):
//
//  1. React 19 emits a <link rel="preload" as="image"> for every *eager* image
//     it server-renders. Thirty-six portraits and signatures meant 1.31 MB
//     (447 KB brotli) of top-priority preloads racing the HTML on the one page
//     everybody lands on first. loading="lazy" suppresses the preload.
//  2. It also defers the fetch for everything below the fold. In-viewport
//     images still load immediately -- the lazy threshold does not delay what
//     is on screen -- so nothing visible arrives later than it used to.
//
// Do not "optimize" this back to eager. Composer and work pages keep their one
// portrait eager on purpose: there it is the LCP element and it is above the
// fold, which is exactly when a preload earns its priority.

// markup
const IndexPage = () => {
    return (
        <Layout>
            <div className={wrapper}>
            {
                COMPOSERS.map(composer => (
                    <a href={composer_url(composer)} key={composer} className={composer_box}>
                        <img
                            alt={composer}
                            src={get_portrait(composer)}
                            key={composer}
                            className={image}
                            loading="lazy"
                            decoding="async"
                        />

                        {/* decorative: the portrait above it, inside the same link, already
                            names the composer */}
                        <img src={get_signature(composer)} alt="" className={signature}
                             loading="lazy" decoding="async" />
                    </a>
                ))
            }
            </div>
        </Layout>
    )
}

// counted, not hard-coded: quartets get added, and a description that quietly
// goes stale is worse than one that never mentioned a number
const DESCRIPTION = `${data.greats.length} string quartets by ${COMPOSERS.length} composers: `
    + `a purposely small standard-repertoire list, with recordings and a shuffle button.`;

export const Head = ({ path }) => (
  <Meta
    title={SITE_TITLE}
    description={DESCRIPTION}
    path={path}
    image={OG_SITE_CARD}
    image_alt={OG_SITE_CARD_ALT}
  />
)

export default IndexPage
