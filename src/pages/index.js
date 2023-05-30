import * as React from "react"
import { Link } from 'gatsby'
import { COMPOSERS, get_portrait, get_signature } from  "../lib/utils"

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
        <Layout pageTitle="">
            <div className={wrapper}>
            {
                COMPOSERS.map(composer => (
                    <Link to={"/" + composer + "/"} key={composer} className={composer_box}>
                        <img
                            alt={composer}
                            src={get_portrait(composer)}
                            key={composer}
                            className={image}
                        />

                        <img src={get_signature(composer)} alt={composer} className={signature} />
                    </Link>
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
    <meta property="og:image" content="https://quartetroulette.com/icon.png" />
  </>
)

export default IndexPage
