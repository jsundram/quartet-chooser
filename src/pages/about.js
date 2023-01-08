// Step 1: Import your component
import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { COMPOSERS } from  "../lib/utils"

import Layout from '../components/layout'


// Step 2: Define your component
const AboutPage = () => {
    const result = useStaticQuery(graphql`
        query {
            dataJson(parent: {}) {
                greats {
                  title
                  composer
                  catalog
                }
            }
        }`
    );
    let work_count = result.dataJson.greats.length;

    return (
        <Layout pageTitle="About">
            <h2>About</h2>
            <p>
                Quartet Roulette is a project by some of <a href="http://www.haydnenthusiasts.org/about.html">The Haydn Enthusiasts</a> to help break the "what should we play" indecision by codifying a purposely small list of "standard" rep and helping people by adding a "random" button to figure out what to play next.
            </p>

            <p>
                If you're interested in keeping a log of what you play, this site doesn't (yet?) support that functionality. You can follow <a href="https://gist.io/@jsundram/703c2b4f51c6bc7c1613280e30a7d0cc">the instructions I posted here</a> to create a chamber music log of your own, the same way I do.
            </p>

            <p>
                Deciding on the {work_count} quartets presented here as "standard" rep is certainly a matter of opinion; I've biased towards music that lots of people I know tend to have. You can check out <a href="http://viz.runningwithdata.com/quartet_composers/">this (old) visualization I made of String Quartet Composers</a>, showing how prolific and familiar different composers are to get a sense of who is getting left out.
            </p>

            <p>
                The composer portraits were created by <a href="https://www.instagram.com/marusyachaika/">Marusya Chaika</a>. The list of {COMPOSERS.length} composers is limited by portrait availability&hellip;so if you want to suggest a composer, see if Marusya has already created an image for them <a href="https://www.shutterstock.com/g/marusyachaika">here</a>.
            </p>

            <p>
                The <a href="https://www.flaticon.com/free-icon/roulette_1254355" title="roulette">roulette icon</a> was created by <a href="https://www.flaticon.com/authors/smalllikeart" title="casino icons">smalllikeart</a> on <a href="https://www.flaticon.com/">flaticon</a>.
            </p>

            <p>The code is available <a href="https://github.com/jsundram/quartet-chooser">on Github</a>.</p>

            <h2>Feedback</h2>
            <p>Bug reports, feature requests, nickname suggestions, feedback, and other ideas are welcome <a href="https://forms.gle/chvU7wmH7vunk9MX6">here</a>!</p>

            <p>
                If you'd like to nominate a quartet to be added to the site, please fill out <a href="https://forms.gle/F179UideebWptoQj6">this form</a>.
            </p>
        </Layout>
    )
}

// Step 3: Export your component
export default AboutPage
