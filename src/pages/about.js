// Step 1: Import your component
import * as React from 'react'
import { COMPOSERS } from  "../lib/utils"

import Layout from '../components/layout'


// Step 2: Define your component
const AboutPage = () => {
    return (
        <Layout pageTitle="About">
            <h2>About</h2>
            <p>
                Quartet Chooser was created to help break the "what should we play" indecision by codifying a purposely small list of "standard" rep and helping people by adding a "random" button to figure out what to play next.
            </p>

            <p>
                Deciding what is "standard" rep is certainly a matter of opinion; I've biased towards music that lots of people I know tend to have. You can check out <a href="http://viz.runningwithdata.com/quartet_composers/">this (old) visualization I made of String Quartet Composers</a>, showing how prolific and familiar different composers are to get a sense of who is getting left out.
            </p>

            <p>
                The composer portraits were created by <a href="https://www.instagram.com/marusyachaika/">Marusya Chaika</a>. The list of {COMPOSERS.length} composers is limited by portrait availability&hellip;so if you want to suggest a composer, see if Marusya has already created an image for them <a href="https://www.shutterstock.com/g/marusyachaika">here</a>.
            </p>

            <p>The code is available <a href="https://github.com/jsundram/quartet-chooser">on Github</a>.</p>

            <p>Please submit bugs, feature requests, feedback, or other ideas <a href="https://forms.gle/chvU7wmH7vunk9MX6">here</a>.</p>
        </Layout>
    )
}

// Step 3: Export your component
export default AboutPage
