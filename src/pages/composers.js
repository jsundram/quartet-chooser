import * as React from "react"
import { Link, useStaticQuery, graphql } from 'gatsby'
import { StaticImage } from 'gatsby-plugin-image'


// markup
const ComposersPage = ({ data }) => {
    console.log(data);
    const composers = data.dataJson.composers;
    return (
        <main >
            <title>Quartet Composers</title>
            <h1>Compoosers</h1>

            <ul>
            {
                composers.map(c => (
                    <li key={c.name}>
                        {c.name}
                    </li>
                ))
            }
            </ul>

            <StaticImage
                alt="Sample Composer Image"
                src="../images/Bartok.svg"
                height={300}
            />
        </main>
    )
}

 export const query = graphql`
    query {
        dataJson {
            composers {
                name
            }
        }
    }
`

export default ComposersPage
