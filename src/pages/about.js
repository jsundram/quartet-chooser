// Step 1: Import your component
import * as React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'



// Step 2: Define your component
const AboutPage = () => {
    return (
        <Layout pageTitle="About">
            <h1>About</h1>
            <p>
                Quartet Chooser was created to help break the "what should we play" indecision by codifying a purposely small list of "standard" rep and helping people by adding a "random" button to figure out what to play next.
            </p>

            <p>The composer portraits were comissioned from <a href="https://www.instagram.com/marusyachaika/">Marusya Chaika</a> for this project.</p>

            <p>Please send bugs and feature requests to Jason. The code is available <a href="https://github.com/jsundram/quartet-chooser">on Github</a></p>
        </Layout>
    )
}

// Step 3: Export your component
export default AboutPage
