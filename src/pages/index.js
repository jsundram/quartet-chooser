import * as React from "react"
import { Link } from 'gatsby'
import { COMPOSERS, get_portrait } from  "../lib/utils"

import Layout from '../components/layout'

// markup
const IndexPage = () => {
    return (
        <Layout pageTitle="Home">
            <p>go to a random quartet <Link to="/random">here</Link>!</p>

            <div>
            {
                COMPOSERS.map(composer => (
                    <Link to={"/" + composer + "/"} key={composer}>
                        <img
                            alt={composer}
                            src={get_portrait(composer)}
                            height={200}
                            key={composer}
                        />
                    </Link>
                ))
            }
            </div>
        </Layout>
    )
}

export default IndexPage
