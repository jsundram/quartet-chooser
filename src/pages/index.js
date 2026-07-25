import * as React from "react"
import { COMPOSERS, composer_url, get_portrait, get_signature } from  "../lib/utils"
import { SITE_URL } from "../lib/site"

import Layout from '../components/layout'

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

export const Head = ({ location, params, data, pageContext }) => (
  <>
    <title>Quartet Roulette</title>
    <meta property="og:title" content="Quartet Roulette" />
    <meta property="og:description" content="Quartet Roulette is a project by some of The Haydn Enthusiasts to help break indecision about what to play next by codifying a purposely small list of standard repertoire and helping people by adding a 'random' button for a suggestion of what to play next." />
    <meta property="og:image" content={SITE_URL + "/icon.png"} />
  </>
)

export default IndexPage
