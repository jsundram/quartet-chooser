// The site's page manifest: which pages exist, at what paths, with what
// context. This is the port of gatsby-node.js's createPages.
import data from '../data/data.json'
import { slugify } from './utils'

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
    const pages = [
        { path: '/', component: 'index' },
        { path: '/about/', component: 'about' },
        { path: '/404/', component: '404' },
        { path: '/random', component: 'random', context: { node: d } },
        { path: '/random-composer', component: 'random-composer', context: { node: d } },
    ];

    d.composers.forEach(c => pages.push({
        path: '/' + c.name.toLowerCase() + '/',
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

export { get_data, get_pages };
