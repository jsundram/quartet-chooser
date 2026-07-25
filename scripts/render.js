// SSR entry point, bundled by scripts/build.mjs (esbuild). Renders every
// page to static markup; also exposes the bits of build-time data the
// generator needs (hashed CSS class names, random-redirect targets).
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { get_data, get_pages } from '../src/lib/routes'
import { HIDDEN, composer_url, slugify } from '../src/lib/utils'
import { SITE_URL } from '../src/lib/site'

import { PathContext } from '../src/components/path-context'

import IndexPage, { Head as IndexHead } from '../src/pages/index'
import AboutPage from '../src/pages/about'
import NotFoundPage from '../src/pages/404'
import Composer, { Head as ComposerHead } from '../src/templates/composer'
import Work, { Head as WorkHead } from '../src/templates/work'
import RandomPage from '../src/templates/random'
import RandomComposerPage from '../src/templates/random-composer'

import { tableMobile, playIcon } from '../src/templates/work.module.css'

const COMPONENTS = {
    'index': { Page: IndexPage, Head: IndexHead },
    'about': { Page: AboutPage },
    '404': { Page: NotFoundPage },
    'composer': { Page: Composer, Head: ComposerHead },
    'work': { Page: Work, Head: WorkHead },
    'random': { Page: RandomPage },
    'random-composer': { Page: RandomComposerPage },
}

function render_pages(){
    return get_pages().map(({ path, component, context }) => {
        const { Page, Head } = COMPONENTS[component];
        return {
            path,
            component,
            head: Head ? renderToStaticMarkup(React.createElement(Head, { pageContext: context })) : '',
            body: renderToStaticMarkup(
                React.createElement(PathContext.Provider, { value: path },
                    React.createElement(Page, { pageContext: context }))),
        };
    });
}

function random_targets(){
    // Redirect targets for the /random pages' client scripts. Quartets by
    // HIDDEN composers are excluded, matching choose_one()'s default filter;
    // the composer list is not filtered (choose_one's filter keys off
    // work.composer, which composer entries don't have).
    const d = get_data();
    return {
        'random': d.greats.filter(w => !HIDDEN[w.composer]).map(slugify),
        'random-composer': d.composers.map(c => composer_url(c.name)),
    };
}

// class names come out of the CSS-modules build hashed; the client script
// that swaps Spotify embeds for play links on touch devices needs them.
const CLASS_NAMES = { tableMobile, playIcon };

export { CLASS_NAMES, SITE_URL, random_targets, render_pages };
