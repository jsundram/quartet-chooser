import * as React from "react"
import { Link } from 'gatsby'
import { COMPOSERS, get_portrait, get_signature } from  "../lib/utils"

import Layout from '../components/layout'

import {
    image,
    signature,
    wrapper,
} from './index.module.css'

// markup
const IndexPage = () => {
    console.log(COMPOSERS);
    console.log(get_signature(COMPOSERS[0]));
    return (
        <Layout pageTitle="Home">
            <p><i>Go to a random quartet <Link to="/random">here</Link>!</i></p>

            <div className={wrapper}>
            {
                COMPOSERS.map(composer => (
                    <Link to={"/" + composer + "/"} key={composer}>
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
