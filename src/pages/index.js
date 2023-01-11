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

export default IndexPage
