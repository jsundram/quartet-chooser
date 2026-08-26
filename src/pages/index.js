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

                        <img src={get_signature(composer)} alt={composer} className={signature} />
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
    + `a purposely small standard-repertoire list, with movements, keys and recordings — and a `
    + `shuffle button for when nobody can decide.`;

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
