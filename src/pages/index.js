import * as React from "react"
import { Link, useStaticQuery, graphql } from 'gatsby'
import { COMPOSERS, get_portrait } from  "../lib/utils"


// markup
const IndexPage = () => {
    const data = useStaticQuery(graphql`
        query {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `)
    const title = data.site.siteMetadata.title;
    return (
        <main >
            <title>{data.site.siteMetadata.title}</title>
            <h1>{title}</h1>

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
        </main>
    )
}

export default IndexPage
