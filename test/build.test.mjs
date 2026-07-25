// Verifies the SSG's output against fixtures snapshotted from the last
// Gatsby build (see test/fixtures/), plus internal-link integrity.
// Run with: npm test (builds dist/ first, then node --test).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { routes_in, walk } from './routes.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const fixtures = p => JSON.parse(readFileSync(path.join(root, 'test', 'fixtures', p), 'utf8'));

const read = route => readFileSync(path.join(dist, ...route.split('/').filter(Boolean), 'index.html'), 'utf8');

before(() => {
    execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { stdio: 'inherit' });
});

describe('route parity with the Gatsby build', () => {
    test('same 279 routes', () => {
        assert.deepEqual(routes_in(dist), fixtures('routes.json'));
    });

    test('root 404.html exists and matches /404/', () => {
        assert.equal(readFileSync(path.join(dist, '404.html'), 'utf8'), read('/404/'));
    });

    test('sitemap has the same URLs at the same location', () => {
        const xml = readFileSync(path.join(dist, 'sitemap', 'sitemap-0.xml'), 'utf8');
        const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();
        assert.deepEqual(locs, fixtures('sitemap-urls.json'));

        const index = readFileSync(path.join(dist, 'sitemap', 'sitemap-index.xml'), 'utf8');
        assert.match(index, /<loc>https:\/\/quartetroulette\.com\/sitemap\/sitemap-0\.xml<\/loc>/);
    });
});

describe('page content', () => {
    test('home page: composer grid and og tags', () => {
        const html = read('/');
        assert.match(html, /<title>Quartet Roulette<\/title>/);
        assert.match(html, /property="og:image" content="https:\/\/quartetroulette\.com\/icon\.png"/);
        for (const c of ['haydn', 'beethoven', 'bartok']){
            assert.ok(html.includes(`href="/${c}/"`), `home links to /${c}/`);
        }
    });

    test('composer page: title, portrait, work links', () => {
        const html = read('/haydn/');
        assert.match(html, /<title>Joseph Haydn \| Quartet Roulette<\/title>/);
        assert.ok(html.includes('src="/Haydn.svg"'));
        assert.ok(html.includes('href="/haydn-opus-76-3/"'));
    });

    test('work page: movements, spotify embeds, player-swap script', () => {
        const html = read('/haydn-opus-76-3/');
        assert.match(html, /<title>Haydn: Quartet Opus 76#3 in C major \| Quartet Roulette<\/title>/);
        assert.ok(html.includes('https://open.spotify.com/embed/track/'));
        assert.ok(html.includes('<script src="/js/work.js">'));
    });

    test('active nav link carries aria-current', () => {
        const count = html => (html.match(/aria-current="page"/g) || []).length;
        assert.equal(count(read('/')), 2, 'home: site title + Home nav');
        assert.equal(count(read('/about/')), 1, 'about: About nav');
        assert.equal(count(read('/haydn/')), 0, 'composer pages: none');
        assert.equal(count(read('/404/')), 0, '404: no nav item matches');
    });

    test('404 carries the nav and a link to every composer', () => {
        // the 404 is the only page a lost visitor is guaranteed to see, and
        // on a case-sensitive host it is where a stale /Haydn/ link lands
        const html = read('/404/');
        assert.ok(html.includes('href="/random-composer"'), '404 has the nav');
        const data = JSON.parse(readFileSync(path.join(root, 'src', 'data', 'data.json'), 'utf8'));
        for (const c of data.composers){
            assert.ok(html.includes(`href="${'/' + c.name.toLowerCase() + '/'}"`), `404 links to ${c.name}`);
        }
    });

    test('every page inlines the stylesheet and links the manifest', () => {
        for (const route of ['/', '/haydn/', '/haydn-opus-76-3/', '/about/', '/404/']){
            const html = read(route);
            assert.match(html, /<style>.*navLinks/s, route + ' has inlined CSS');
            assert.ok(html.includes('rel="manifest"'), route + ' links manifest');
        }
    });
});

describe('random redirect pages', () => {
    const REDIRECTS = ['/random/', '/random-composer/'];
    const targets = route => {
        const m = read(route).match(/<script>var t=(\[[^\]]*\]);location\.replace/);
        assert.ok(m, route + ' inlines the redirect script');
        return JSON.parse(m[1]);
    };

    test('thin shells: inline redirect, no stylesheet, no external requests', () => {
        // these pages render nothing and live for one script statement, so
        // they must not inline the site CSS or fetch a script before they
        // can decide where to go
        for (const route of REDIRECTS){
            const html = read(route);
            targets(route); // asserts the inline script is present
            assert.ok(!html.includes('<style>'), route + ' has no stylesheet');
            assert.ok(!/(?:href|src)="/.test(html), route + ' triggers no other request');
        }
    });

    test('all redirect targets are real routes', () => {
        const routes = new Set(fixtures('routes.json'));
        for (const route of REDIRECTS){
            const t = targets(route);
            assert.ok(t.length > 0);
            for (const slug of t) assert.ok(routes.has(slug), `${route}: ${slug}`);
        }
    });

    test('HIDDEN composers excluded from random quartets, not random composers', () => {
        assert.ok(!targets('/random/').some(s => s.startsWith('/boccherini-')));
        assert.ok(targets('/random-composer/').includes('/boccherini/'));
    });
});

describe('🔀 shuffle links', () => {
    // composer routes are no longer distinguishable by case, so derive them
    // from the same data the route generator uses; read() throws if one is
    // missing from dist/, so drift from the real route set still fails
    const data = JSON.parse(readFileSync(path.join(root, 'src', 'data', 'data.json'), 'utf8'));
    const composer_routes = data.composers.map(c => '/' + c.name.toLowerCase() + '/');
    const shuffles = html => [...html.matchAll(/data-shuffle="([^"]*)"/g)].map(m => m[1].split(' '));
    // the nav renders first, so on every page lists[0] is the Quartet 🔀
    // candidates and lists[1] the Composer 🔀 candidates
    const nav_lists = () => shuffles(read('/')).slice(0, 2);

    test('every page carries the nav shuffle lists and loads shuffle.js', () => {
        const nav = nav_lists();
        for (const route of routes_in(dist)){
            if (route === '/random/' || route === '/random-composer/') continue;
            const html = read(route);
            assert.deepEqual(shuffles(html).slice(0, 2), nav, route + ' has the nav 🔀 lists');
            assert.ok(html.includes('<script src="/js/shuffle.js">'), route + ' loads shuffle.js');
        }
    });

    test('nav shuffle targets are real routes; HIDDEN quartets excluded, composers not', () => {
        const routes = new Set(fixtures('routes.json'));
        const [quartets, composers] = nav_lists();
        for (const slug of [...quartets, ...composers]){
            assert.ok(routes.has(slug), slug + ' is a route');
        }
        assert.ok(!quartets.some(s => s.startsWith('/boccherini-')));
        assert.ok(composers.includes('/boccherini/'));
        assert.equal(composers.length, data.composers.length, 'every composer reachable');
    });

    test('composer-page group 🔀 targets are real same-composer routes', () => {
        const routes = new Set(fixtures('routes.json'));
        for (const route of composer_routes){
            const composer = route.replaceAll('/', '');
            for (const list of shuffles(read(route)).slice(2)){ // beyond the nav pair
                // deliberate tripwire: composer.js only emits a 🔀 when there
                // is a real choice (works.length > 1 / group.length > 1), so a
                // one-option list means the template and this suite drifted —
                // a single-work group must render as a plain item, not a
                // pointless shuffle button
                assert.ok(list.length > 1, route + ' shuffle list has choices');
                for (const slug of list){
                    assert.ok(routes.has(slug), `${route}: ${slug} is a route`);
                    assert.ok(slug.startsWith('/' + composer + '-'), `${route}: ${slug} same composer`);
                }
            }
        }
        // spot-check: Haydn groups by opus; Bach's single work gets no 🔀
        // beyond the nav pair
        assert.ok(shuffles(read('/haydn/')).length > 3);
        assert.equal(shuffles(read('/bach/')).length, 2);
    });
});

describe('client scripts', () => {
    const work_js = () => readFileSync(path.join(dist, 'js', 'work.js'), 'utf8');

    test('shuffle.js re-randomizes on a bfcache restore', () => {
        // a back-navigation restores the DOM with the href shuffle.js already
        // mutated and does not re-run scripts, so the pageshow handler is the
        // only thing keeping the 🔀 off the quartet you just visited
        const shuffle_js = readFileSync(path.join(dist, 'js', 'shuffle.js'), 'utf8');
        assert.match(shuffle_js, /pageshow/, 'listens for pageshow');
        assert.match(shuffle_js, /persisted/, 'distinguishes a bfcache restore from a load');
    });

    test('every Spotify embed src round-trips through work.js\'s reversal', () => {
        // work.js turns iframe src into a play link via
        // src.replace('/embed/track/', '/track/'); both halves must hold
        assert.ok(work_js().includes('"/embed/track/"'));
        assert.ok(work_js().includes('"/track/"'));
        let embeds = 0;
        for (const route of routes_in(dist)){
            for (const [, src] of read(route).matchAll(/<iframe[^>]*\bsrc="([^"]*)"/g)){
                // ~70 movements (mostly Boccherini) have no spotify link in
                // data.json and render src="" — pre-existing, matches prod
                if (src === '') continue;
                assert.match(src, /^https:\/\/open\.spotify\.com\/embed\/track\//, `${route}: ${src}`);
                embeds++;
            }
        }
        assert.ok(embeds >= 800, `found ${embeds} embeds`); // ~846 linked movements
    });

    test('work.js uses the hashed class names from the page CSS', () => {
        const html = read('/haydn-opus-76-3/');
        for (const suffix of ['tableMobile', 'playIcon']){
            const m = work_js().match(new RegExp(`"([\\w-]*${suffix})"`));
            assert.ok(m, `work.js references a ${suffix} class`);
            assert.ok(html.includes('.' + m[1] + '{'), `${m[1]} exists in the inlined CSS`);
        }
    });
});

describe('link integrity', () => {
    // exact-case set membership, not existsSync: existsSync is
    // case-insensitive on macOS, so a /Haydn/ reference would pass
    // locally and 404 on any case-sensitive host
    let files;
    before(() => {
        files = new Set(walk(dist).map(p => path.relative(dist, p).split(path.sep).join('/')));
    });

    test('every internal href/src on every page resolves', () => {
        const missing = new Set();
        for (const route of routes_in(dist)){
            const html = read(route);
            for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
                const target = decodeURIComponent(url.split(/[?#]/)[0]);
                const rel = target.split('/').filter(Boolean).join('/');
                // trailing slash serves index.html; extensionless paths
                // like /random serve either /random or /random/index.html
                const candidates = target.endsWith('/')
                    ? [rel === '' ? 'index.html' : rel + '/index.html']
                    : [rel, rel + '/index.html'];
                if (!candidates.some(c => files.has(c))){
                    missing.add(`${route} -> ${url}`);
                }
            }
        }
        assert.deepEqual([...missing], []);
    });

    test('every og:image URL is the site URL plus a real file', () => {
        // og:image lives in content=, which the href/src test above never
        // sees — the //Haydn.svg double slash shipped that way
        const site = 'https://quartetroulette.com/';
        let found = 0;
        for (const route of routes_in(dist)){
            for (const [, url] of read(route).matchAll(/property="og:image" content="([^"]*)"/g)){
                assert.ok(url.startsWith(site) && files.has(url.slice(site.length)),
                    `${route}: ${url}`);
                found++;
            }
        }
        // home + 18 composers + every work page carry one
        assert.ok(found >= 200, `found ${found} og:image tags`);
    });

    test('static assets copied through', () => {
        for (const f of ['icon.png', 'play.png', 'favicon-32x32.png', 'manifest.webmanifest',
                         'Haydn.svg', 'Haydn-Signature.svg', 'Haydn-Original.svg',
                         'icons/icon-512x512.png']){
            assert.ok(files.has(f), f);
        }
    });
});
