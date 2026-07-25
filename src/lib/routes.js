// The site's page manifest: which pages exist, at what paths, with what
// context. This is the port of gatsby-node.js's createPages.
import data from '../data/data.json'
import { HIDDEN, composer_url, slugify } from './utils'

function underscore_keys(obj){
    // data.json composer entries have keys like "full name"; gatsby-transformer-json
    // exposed them as full_name, and the templates expect that spelling.
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.split(' ').join('_'), v]));
}

function with_counts(composers, greats){
    // add a count of quartets by each composer to their entry. Don't hard code
    // work counts because e.g. schubert and mendelssohn could get more quartets added ...
    let counts = {};
    composers.forEach(c => counts[c.name] = 0);
    greats.forEach(w => counts[w.composer] += 1);
    return composers.map(c => ({...underscore_keys(c), quartets: counts[c.name]}));
}

function get_data(){
    return {
        composers: with_counts(data.composers, data.greats),
        greats: data.greats,
        movements: data.movements,
    };
}

function get_pages(){
    const d = get_data();

    // Paths mirror what Gatsby generated (trailing slashes and all), so no
    // URLs or SEO break: see test/fixtures/routes.json.
    // /random and /random-composer are not here: they render no React and
    // are emitted directly by scripts/build.mjs as thin redirect pages.
    const pages = [
        { path: '/', component: 'index' },
        { path: '/about/', component: 'about' },
        { path: '/404/', component: '404' },
    ];

    d.composers.forEach(c => pages.push({
        path: composer_url(c.name),
        component: 'composer',
        context: { node: c, data: d.greats },
    }));

    d.greats.forEach(w => pages.push({
        path: slugify(w),
        component: 'work',
        context: { node: w, data: d },
    }));

    return pages;
}

function random_targets(){
    // Candidate lists for the nav 🔀 links (data-shuffle) and the /random
    // redirect pages. Quartets by HIDDEN composers are excluded; the
    // composer list is not filtered.
    const d = get_data();
    return {
        'random': d.greats.filter(w => !HIDDEN[w.composer]).map(slugify),
        'random-composer': d.composers.map(c => composer_url(c.name)),
    };
}

export { get_data, get_pages, random_targets };
