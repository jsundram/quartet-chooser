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

// The grid is deliberately EAGER, all 36 images, with no loading attribute.
// That is the state this page started in; Phase 7 tried lazy, measured it, and
// put it back. Recording why, because "add loading=lazy to the image grid"
// is exactly the change someone will propose again:
//
// React 19 emits a <link rel="preload" as="image"> for every eager image it
// server-renders, so this page does emit 36 preloads, and that looks like the
// obvious thing to kill. It is not.
//
//   - lazy does not defer anything here. Chrome fetches all 36 on load anyway,
//     on a phone viewport and on throttled Slow 3G alike; the page is too
//     short for its threshold. The only thing lazy changes is priority.
//   - and priority is already right. Document order is visual order, so 36
//     uniform-priority fetches in document order deliver the top of the page
//     first. Mixing priorities lets the 24 below-the-fold images interleave
//     with the 12 that decide LCP.
//
// Measured on Slow 3G (400kbps/400ms), median of 3, mobile viewport:
//
//     all eager (this)        LCP  8.8s    load 29.3s
//     12 eager + 24 lazy      LCP 13.7s    load 23.5s
//
// The load-event win is mostly bookkeeping -- lazy images do not block the
// load event, so it fires earlier without the page being readier. LCP is the
// one that tracks when this page looks done, and lazy made it 55% worse.
//
// The real problem is not the loading attribute. It is that this page ships
// ~1.3 MB of SVG: 36 full-detail vector portraits, drawn at 200px on desktop
// and 150px on a phone. At 50 KB/s nothing scheduled cleverly gets under ~9s.
// Rasterizing them to display size would cut that several-fold -- the icons
// already do exactly this (icon-192x192.png is 8.9 KB) and are generated and
// committed because Netlify has no rsvg-convert. See pwa.md Phase 7.

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
                        />

                        {/* decorative: the portrait above it, inside the same link, already
                            names the composer */}
                        <img src={get_signature(composer)} alt="" className={signature} />
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
