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
        assert.equal(count(read('/random/')), 1, 'random: Quartet nav');
        assert.equal(count(read('/about/')), 1, 'about: About nav');
        assert.equal(count(read('/haydn/')), 0, 'composer pages: none');
    });

    test('every page inlines the stylesheet and links the manifest', () => {
        for (const route of ['/', '/haydn/', '/about/', '/random/']){
            const html = read(route);
            assert.match(html, /<style>.*navLinks/s, route + ' has inlined CSS');
            assert.ok(html.includes('rel="manifest"'), route + ' links manifest');
        }
    });
});

describe('random redirects', () => {
    const targets = name => {
        const js = readFileSync(path.join(dist, 'js', name), 'utf8');
        return JSON.parse(js.slice(js.indexOf('['), js.indexOf(']') + 1));
    };

    test('random pages load their redirect scripts', () => {
        assert.ok(read('/random/').includes('<script src="/js/random.js">'));
        assert.ok(read('/random-composer/').includes('<script src="/js/random-composer.js">'));
    });

    test('all redirect targets are real routes', () => {
        const routes = new Set(fixtures('routes.json'));
        for (const name of ['random.js', 'random-composer.js']){
            const t = targets(name);
            assert.ok(t.length > 0);
            for (const slug of t) assert.ok(routes.has(slug), `${name}: ${slug}`);
        }
    });

    test('HIDDEN composers excluded from random quartets, not random composers', () => {
        assert.ok(!targets('random.js').some(s => s.startsWith('/boccherini-')));
        assert.ok(targets('random-composer.js').includes('/boccherini/'));
    });
});

describe('composer 🔀 shuffle links', () => {
    // composer routes are no longer distinguishable by case, so derive them
    // from the same data the route generator uses; read() throws if one is
    // missing from dist/, so drift from the real route set still fails
    const data = JSON.parse(readFileSync(path.join(root, 'src', 'data', 'data.json'), 'utf8'));
    const composer_routes = data.composers.map(c => '/' + c.name.toLowerCase() + '/');
    const shuffles = html => [...html.matchAll(/data-shuffle="([^"]*)"/g)].map(m => m[1].split(' '));

    test('every multi-work composer page has shuffle links and the script', () => {
        for (const route of composer_routes){
            const html = read(route);
            const lists = shuffles(html);
            assert.equal(html.includes('<script src="/js/shuffle.js">'), lists.length > 0,
                route + ' loads shuffle.js iff it has shuffle links');
        }
        // spot-check: Haydn groups by opus, Bach has a single work
        assert.ok(shuffles(read('/haydn/')).length > 1);
        assert.equal(shuffles(read('/bach/')).length, 0);
    });

    test('every shuffle target is a real same-composer route', () => {
        const routes = new Set(fixtures('routes.json'));
        for (const route of composer_routes){
            const composer = route.replaceAll('/', '');
            for (const list of shuffles(read(route))){
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
    });
});

describe('client scripts', () => {
    const work_js = () => readFileSync(path.join(dist, 'js', 'work.js'), 'utf8');

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

    test('static assets copied through', () => {
        for (const f of ['icon.png', 'play.png', 'favicon-32x32.png', 'manifest.webmanifest',
                         'Haydn.svg', 'Haydn-Signature.svg', 'Haydn-Original.svg',
                         'icons/icon-512x512.png']){
            assert.ok(files.has(f), f);
        }
    });
});
