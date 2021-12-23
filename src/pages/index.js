import * as React from "react"
import { Link, useStaticQuery, graphql } from 'gatsby'
import { StaticImage } from 'gatsby-plugin-image'
import { COMPOSERS, get_image } from  "../lib/utils"


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
                    <Link to={composer}>
                        <img
                            alt={composer.full_name}
                            src={get_image(composer)}
                            height={200}
                        />
                    </Link>
                ))
            }
            </div>
        </main>
    )
}

export default IndexPage
