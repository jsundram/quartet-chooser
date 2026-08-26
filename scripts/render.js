// SSR entry point, bundled by scripts/build.mjs (esbuild). Renders every
// page to static markup; also exposes the bits of build-time data the
// generator needs (hashed CSS class names, random-redirect targets).
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { get_pages, random_targets } from '../src/lib/routes'
import { SITE_TITLE, SITE_URL } from '../src/lib/site'

import { PathContext } from '../src/components/path-context'

import IndexPage, { Head as IndexHead } from '../src/pages/index'
import AboutPage, { Head as AboutHead } from '../src/pages/about'
import NotFoundPage, { Head as NotFoundHead } from '../src/pages/404'
import Composer, { Head as ComposerHead } from '../src/templates/composer'
import Work, { Head as WorkHead } from '../src/templates/work'

import { tableMobile, playIcon } from '../src/templates/work.module.css'

const COMPONENTS = {
    'index': { Page: IndexPage, Head: IndexHead },
    'about': { Page: AboutPage, Head: AboutHead },
    '404': { Page: NotFoundPage, Head: NotFoundHead },
    'composer': { Page: Composer, Head: ComposerHead },
    'work': { Page: Work, Head: WorkHead },
}

function render_pages(){
    return get_pages().map(({ path, component, context }) => {
        const { Page, Head } = COMPONENTS[component];
        return {
            path,
            component,
            // Head needs the path too: og:url has to be this page's own
            // absolute URL, and only the route generator knows it.
            head: renderToStaticMarkup(React.createElement(Head, { path, pageContext: context })),
            body: renderToStaticMarkup(
                React.createElement(PathContext.Provider, { value: path },
                    React.createElement(Page, { pageContext: context }))),
        };
    });
}

// class names come out of the CSS-modules build hashed; the client script
// that swaps Spotify embeds for play links on touch devices needs them.
const CLASS_NAMES = { tableMobile, playIcon };

export { CLASS_NAMES, SITE_TITLE, SITE_URL, random_targets, render_pages };
