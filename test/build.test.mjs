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
        assert.match(html, /property="og:image" content="https:\/\/quartetroulette\.com\/og\/og\.png"/);
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

    test('exactly one <title>, in <head>, on every page', () => {
        // Layout used to render a <title> into <body> (issue #32): duplicated
        // on pages with a Head export, the only title on pages without one
        for (const route of routes_in(dist)){
            const html = read(route);
            assert.equal((html.match(/<title>/g) || []).length, 1, route + ' has one title');
            assert.ok(html.indexOf('<title>') < html.indexOf('</head>'), route + ' title is in head');
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

describe('share / link previews (pwa.md Phase 1)', () => {
    // The two /random* pages are deliberately excluded everywhere below: they
    // are one-statement redirect shells that must not trigger a single extra
    // request, they are not in the sitemap, and nothing links to them as a
    // destination. Every *other* route is a page someone can paste into a chat.
    const shareable = () => routes_in(dist).filter(r => !r.startsWith('/random'));

    const tag = (html, re) => {
        const m = html.match(re);
        return m && m[1];
    };
    const meta = (html, name) =>
        tag(html, new RegExp(`<meta name="${name}" content="([^"]*)"`));
    const og = (html, prop) =>
        tag(html, new RegExp(`<meta property="og:${prop}" content="([^"]*)"`));
    const title_of = html => tag(html, /<title>([^<]*)<\/title>/);
    // React escapes ' and & in attributes; compare against decoded text
    const unescape = s => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
                           .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    const SITE = 'https://quartetroulette.com';
    const MAX_BYTES = 250_000; // keep in sync with scripts/build.mjs + make-og.mjs

    test('every shareable page carries the whole tag set', () => {
        // half a tag set is the failure mode that actually happens: /about/ and
        // /404/ shipped with nothing but a <title> until this phase
        for (const route of shareable()){
            const html = read(route);
            assert.ok(title_of(html), route + ' has a title');
            for (const name of ['description', 'twitter:card', 'twitter:title',
                                'twitter:description', 'twitter:image']){
                assert.ok(meta(html, name), `${route} has meta[name=${name}]`);
            }
            for (const prop of ['type', 'site_name', 'title', 'description', 'url',
                                'image', 'image:width', 'image:height', 'image:alt']){
                assert.ok(og(html, prop), `${route} has og:${prop}`);
            }
            assert.equal(meta(html, 'twitter:card'), 'summary_large_image', route);
        }
    });

    test('og:url is the page\'s own absolute URL', () => {
        for (const route of shareable()){
            assert.equal(og(read(route), 'url'), SITE + route, route);
        }
    });

    test('descriptions are prose, not the title again', () => {
        // an og:description that repeats the title is what work pages used to
        // ship, and it tells a reader in iMessage nothing they cannot see
        for (const route of shareable()){
            const html = read(route);
            const description = unescape(meta(html, 'description'));
            const title = unescape(title_of(html));
            assert.notEqual(description, title, route);
            assert.notEqual(description, title.replace(' | Quartet Roulette', ''), route);
            assert.ok(description.length >= 60, `${route}: description too thin`);
            assert.ok(description.split(' ').length >= 10, `${route}: not a sentence`);
            // mobile social previews cut around 125 characters and Google
            // around 155. Work pages can run past 125 when the nickname is
            // long ("Thou shalt not trill / Twinkletoes / Brandenberg") --
            // that is real content, and the identity comes first, so what
            // truncation eats is the "N movements" tail. The pages with no
            // such excuse get held to the tighter bound.
            assert.ok(description.length <= 200, `${route}: ${description.length} chars`);
            if (['/', '/about/', '/404/'].includes(route)){
                assert.ok(description.length <= 125, `${route}: ${description.length} chars`);
            }
        }
    });

    test('og and twitter tags agree with the document title', () => {
        for (const route of shareable()){
            const html = read(route);
            assert.equal(meta(html, 'twitter:title'), og(html, 'title'), route);
            assert.equal(meta(html, 'twitter:description'), og(html, 'description'), route);
            assert.equal(meta(html, 'twitter:image'), og(html, 'image'), route);
            // og:title drops the " | Quartet Roulette" suffix that og:site_name
            // already carries, so the two differ by exactly that
            const title = unescape(title_of(html));
            const bare = unescape(og(html, 'title'));
            assert.ok(title === bare || title === bare + ' | Quartet Roulette',
                `${route}: <title> "${title}" vs og:title "${bare}"`);
        }
    });

    test('every og:image is an absolute https PNG that exists, 1200x630, under 250 KB', () => {
        // the whole point of the phase: iMessage ignores SVG and ignores
        // relative URLs, and silently skips an image over ~300 KB
        const seen = new Map();
        for (const route of shareable()){
            const html = read(route);
            const url = og(html, 'image');
            assert.ok(url.startsWith(SITE + '/og/') && url.endsWith('.png'),
                `${route}: og:image is ${url}`);
            assert.equal(og(html, 'image:width'), '1200', route);
            assert.equal(og(html, 'image:height'), '630', route);
            assert.ok(og(html, 'image:alt').length > 10, route + ' has real alt text');
            seen.set(url, (seen.get(url) || 0) + 1);
        }

        for (const url of seen.keys()){
            const file = path.join(dist, ...url.slice(SITE.length).split('/').filter(Boolean));
            const png = readFileSync(file);
            assert.equal(png.subarray(1, 4).toString(), 'PNG', url + ' is a real PNG');
            // IHDR is the first chunk: width and height are big-endian at 16/20
            assert.equal(png.readUInt32BE(16), 1200, url + ' width');
            assert.equal(png.readUInt32BE(20), 630, url + ' height');
            assert.ok(png.length <= MAX_BYTES,
                `${url} is ${png.length} bytes (> ${MAX_BYTES}): scrapers will skip it`);
        }
        // one site card plus one per composer, and every one of them used
        assert.equal(seen.size, 19, 'cards in use');
    });

    test('spot-check: index, about, 404, a composer and a work', () => {
        const expected = {
            '/': { title: 'Quartet Roulette', card: '/og/og.png' },
            '/about/': { title: 'About', card: '/og/og.png' },
            '/404/': { title: 'Not found', card: '/og/og.png' },
            '/haydn/': { title: 'Joseph Haydn', card: '/og/og-haydn.png' },
            '/haydn-opus-76-3/': {
                title: 'Haydn: Quartet Opus 76#3 in C major',
                card: '/og/og-haydn.png',
            },
        };
        for (const [route, want] of Object.entries(expected)){
            const html = read(route);
            assert.equal(unescape(og(html, 'title')), want.title, route);
            assert.equal(og(html, 'image'), SITE + want.card, route);
        }
        // a work page's description says what the work is, not what it is called
        const work = unescape(meta(read('/haydn-opus-76-3/'), 'description'));
        assert.match(work, /Joseph Haydn/);
        assert.match(work, /1797/);
        assert.match(work, /4 movements/);
    });
});

describe('install / manifest (pwa.md Phase 2)', () => {
    const installable = () => routes_in(dist).filter(r => !r.startsWith('/random'));
    const manifest = () => JSON.parse(readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
    const meta = (html, name) => {
        const m = html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`));
        return m && m[1];
    };

    // Enough of a PNG reader to answer the two questions that matter here:
    // how big is it really, and can any pixel be transparent. Both are in the
    // header and chunk list, so no decoding is needed.
    const png = file => {
        const b = readFileSync(path.join(dist, ...file.split('/').filter(Boolean)));
        assert.equal(b.subarray(1, 4).toString(), 'PNG', file + ' is a PNG');
        const chunks = [];
        for (let off = 8; off < b.length;){
            const len = b.readUInt32BE(off);
            const type = b.subarray(off + 4, off + 8).toString();
            chunks.push(type);
            if (type === 'IEND') break;
            off += 12 + len;
        }
        const colour_type = b[25];
        return {
            width: b.readUInt32BE(16),
            height: b.readUInt32BE(20),
            // alpha arrives either as a colour type carrying a channel, or as
            // a tRNS chunk on a palette image -- pngquant produces the latter
            transparent: colour_type === 4 || colour_type === 6 || chunks.includes('tRNS'),
        };
    };

    test('manifest carries everything an install needs', () => {
        const m = manifest();
        assert.equal(m.name, 'Quartet Roulette');
        assert.equal(m.short_name, 'Quartet 🎲');
        assert.equal(m.start_url, '/');
        assert.equal(m.display, 'standalone');
        assert.equal(m.theme_color, '#5dcbf5');
        assert.equal(m.background_color, '#f7f7f3');
        assert.ok(m.description && m.description.length > 40, 'has a real description');
        // short_name exists for surfaces with no room; Android launchers
        // truncate past ~12 units, which is the whole reason not to use `name`
        assert.ok([...m.short_name].length <= 12, `short_name is ${m.short_name.length} units`);
    });

    test('every icon the manifest advertises exists and is the size it claims', () => {
        // a manifest pointing at a missing or mis-sized icon fails silently:
        // the install just picks something else, or nothing
        for (const icon of manifest().icons){
            const { width, height } = png(icon.src);
            assert.equal(`${width}x${height}`, icon.sizes, icon.src);
            assert.equal(icon.type, 'image/png', icon.src);
        }
    });

    test('there is a maskable icon, and it is opaque and full size', () => {
        const maskable = manifest().icons.filter(i => i.purpose === 'maskable');
        assert.equal(maskable.length, 1, 'exactly one maskable icon');
        assert.equal(maskable[0].sizes, '512x512');
        // a maskable icon is cropped to the launcher's shape, so its padding
        // has to be filled -- a transparent one defeats the whole purpose
        assert.equal(png(maskable[0].src).transparent, false, 'maskable icon is opaque');
    });

    test('the apple-touch-icon is opaque; the ordinary icons are not', () => {
        // iOS composites an alpha channel in an apple-touch-icon against
        // BLACK, so a transparent one puts the wheel on a black tile. This is
        // the regression this whole phase exists to prevent coming back.
        assert.equal(png('/icons/icon-180x180.png').transparent, false,
            'apple-touch-icon must be flattened');
        // the plain manifest icons keep their transparency -- Android and
        // Chrome composite those onto backgrounds of their own choosing
        for (const size of [48, 192, 512]){
            assert.equal(png(`/icons/icon-${size}x${size}.png`).transparent, true,
                `icon-${size}x${size} keeps its alpha`);
        }
    });

    test('every page carries the install metas, from the manifest', () => {
        const m = manifest();
        for (const route of installable()){
            const html = read(route);
            assert.equal(meta(html, 'theme-color'), m.theme_color, route + ' theme-color');
            assert.equal(meta(html, 'apple-mobile-web-app-title'), m.name, route + ' ios title');
            assert.equal(meta(html, 'mobile-web-app-capable'), 'yes', route);
            // deprecated in favour of the line above, but older iOS reads only this
            assert.equal(meta(html, 'apple-mobile-web-app-capable'), 'yes', route);
            assert.ok(html.includes('rel="manifest"'), route + ' links the manifest');
        }
    });

    test('exactly one apple-touch-icon link per page, at 180', () => {
        // it used to emit one per manifest icon -- eight links, and iOS picked
        // a transparent one
        for (const route of installable()){
            const links = [...read(route).matchAll(/<link rel="apple-touch-icon"[^>]*>/g)];
            assert.equal(links.length, 1, route + ' has one apple-touch-icon');
            assert.match(links[0][0], /sizes="180x180"/, route);
            assert.match(links[0][0], /href="\/icons\/icon-180x180\.png"/, route);
        }
    });

    test('the redirect shells stay bare', () => {
        // they exist for one location.replace and must not fetch an icon or a
        // manifest on the way past
        for (const route of ['/random/', '/random-composer/']){
            const html = read(route);
            assert.ok(!html.includes('apple-touch-icon'), route);
            assert.ok(!html.includes('manifest'), route);
            assert.ok(!html.includes('theme-color'), route);
        }
    });
});

describe('mobile + accessibility floor (pwa.md Phase 3)', () => {
    const pages = () => routes_in(dist).filter(r => !r.startsWith('/random'));
    const style_of = html => html.match(/<style>([\s\S]*?)<\/style>/)[1];

    // The accessible name of a link, as a screen reader would compute the part
    // of it that matters here: its own aria-label, else its text, else the alt
    // text of the images inside it. Anchors cannot nest, so a non-greedy match
    // to the next </a> is a whole link.
    const links_in = html => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m => {
        const [, attrs, inner] = m;
        const label = attrs.match(/aria-label="([^"]*)"/);
        const alts = [...inner.matchAll(/<img\b[^>]*\balt="([^"]*)"/g)].map(a => a[1]);
        const text = inner.replace(/<[^>]*>/g, '').replace(/&[#0-9a-zA-Z]+;/g, ' ');
        return { attrs, inner, name: [label && label[1], text, ...alts].filter(Boolean).join(' ') };
    });

    test('viewport opts into the safe area, and the page declares its scheme', () => {
        // viewport-fit=cover without the env() padding below puts content under
        // the notch; the padding without cover does nothing. They ship together.
        for (const route of pages()){
            const html = read(route);
            const viewports = [...html.matchAll(/<meta name="viewport"[^>]*>/g)];
            assert.equal(viewports.length, 1, route + ' has one viewport meta');
            assert.match(viewports[0][0], /viewport-fit=cover/, route);
            assert.match(viewports[0][0], /width=device-width/, route);
            // light until pwa.md Phase 6 decides on dark mode; a wrong value
            // here is a dark canvas behind a light page
            assert.match(html, /<meta name="color-scheme" content="light"\/>/, route);
        }
    });

    test('the stylesheet pads for the notch and honours reduce-motion', () => {
        const css = style_of(read('/'));
        for (const side of ['top', 'right', 'bottom', 'left']){
            assert.ok(css.includes(`env(safe-area-inset-${side})`), `padding for inset-${side}`);
        }
        assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
        // nothing animates today, so this only has to survive minification --
        // the point is that the guard is in place before the first animation is
        assert.match(css, /animation-duration:[^;]*!important/);
        assert.match(css, /transition-duration:[^;]*!important/);
    });

    test('focus stays visible', () => {
        // the browser's own focus ring is the whole a11y story here; removing it
        // without a :focus-visible replacement is what would break keyboard use
        const css = style_of(read('/'));
        const kills = [...css.matchAll(/outline\s*:\s*(none|0)\b/g)];
        assert.deepEqual(kills.map(m => m[0]), [], 'no outline:none in the stylesheet');
    });

    test('exactly one <h1> per page, and it says something', () => {
        for (const route of pages()){
            const html = read(route);
            const body = html.slice(html.indexOf('</head>'));
            const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
            assert.equal(h1s.length, 1, route + ' has one <h1>');
            const [{ name }] = links_in(h1s[0][1]).length
                ? links_in(h1s[0][1])
                : [{ name: h1s[0][1].replace(/<[^>]*>/g, '') }];
            assert.ok(name.trim(), route + "'s <h1> has text or a named image");
        }
    });

    test('the nav is a real landmark, outside <main>', () => {
        // a VoiceOver rotor reads the page by landmark; the nav used to be
        // inside main, so "main" meant "the whole document"
        for (const route of pages()){
            const html = read(route);
            assert.equal((html.match(/<main\b/g) || []).length, 1, route + ' has one <main>');
            // indexOf returns -1 for a missing nav, and -1 is less than any
            // real index -- so without this the landmark test passes on a page
            // that has no nav at all
            const nav = html.indexOf('<nav>');
            assert.ok(nav >= 0, route + ' has a nav');
            assert.ok(nav < html.indexOf('<main>'), route + ': nav before main');
            assert.ok(html.includes('<header>'), route + ' has a header');
        }
    });

    test('every image declares alt, and every link has a name', () => {
        for (const route of pages()){
            const html = read(route);
            for (const [tag] of html.matchAll(/<img\b[^>]*>/g)){
                // decorative images say alt=""; a *missing* alt makes a screen
                // reader read the file name instead
                assert.match(tag, /\balt="/, `${route}: ${tag}`);
            }
            for (const link of links_in(html)){
                assert.ok(link.name.trim(), `${route}: unnamed link <a${link.attrs}>`);
            }
        }
    });

    test('icon-only controls carry an aria-label', () => {
        // 🔀 alone is not a name: the per-opus shuffle links on composer pages
        // are an emoji and nothing else
        let icons = 0;
        for (const route of pages()){
            for (const link of links_in(read(route))){
                const text = link.inner.replace(/<[^>]*>/g, '').replace(/&[#0-9a-zA-Z]+;/g, ' ');
                const wordless = !/[a-z0-9]/i.test(text) && !link.inner.includes('<img');
                if (!wordless) continue;
                icons++;
                assert.match(link.attrs, /aria-label="[^"]+"/, `${route}: <a${link.attrs}>${text}`);
            }
        }
        assert.ok(icons > 0, 'found the icon-only links to check');
    });

    test('the composer-date links name their own date and their destination', () => {
        const composers = JSON.parse(
            readFileSync(path.join(root, 'src', 'data', 'data.json'), 'utf8')).composers;
        let checked = 0;
        for (const route of pages()){
            const dates = links_in(read(route)).filter(l => l.attrs.includes('daily-composers'));
            if (!dates.length) continue;
            assert.equal(dates.length, 2, route + ': a birth link and a death link');
            ['Born', 'Died'].forEach((verb, i) => {
                const label = dates[i].attrs.match(/aria-label="([^"]*)"/);
                assert.ok(label, route + ': date link carries an aria-label');
                // The label keeps the date the link shows and says which date
                // it is -- a screen reader gets no dash between them. It names
                // the destination rather than the date's meaning, because
                // daily-composers lists everyone *born* on that calendar day:
                // "born on this day" on the death link misstated the year it
                // had just read out.
                const date = dates[i].inner.replace(/<[^>]*>/g, '');
                assert.equal(label[1], `${verb} ${date} — see composers born on that day`, route);
                // and the href has to be the same day the label names: the
                // label is only honest if daily-composers gets that calendar
                // day, and pinning the copy alone would not catch a swap
                const href = dates[i].attrs.match(/href="([^"]*)"/)[1];
                const d = new Date(date);
                assert.equal(href, `https://daily-composers.netlify.app/${d.getMonth() + 1}-${d.getDate()}`,
                    `${route}: ${verb} link points at the day it names`);
                checked++;
            });
        }
        assert.equal(checked, composers.length * 2, 'both dates on every composer page');
    });

    test('nothing is made clickable by a handler on a non-control', () => {
        for (const route of pages()){
            assert.doesNotMatch(read(route), /\son[a-z]+="/, route + ' has no inline handlers');
        }
    });
});

describe('analytics (pwa.md Phase 4)', () => {
    const pages = () => routes_in(dist).filter(r => !r.startsWith('/random'));

    // The endpoint, the CDN and the event name are constants in
    // src/lib/site.js, read here as text rather than imported: site.js is an ESM
    // .js in a package with no "type": "module", so only the esbuild bundles can
    // import it. Reading it keeps this suite honest about the *real* values --
    // the site code is `quartet-roulette`, hyphenated, and pwa.md's task list
    // guessed `quartetroulette`, which would have counted into a site that does
    // not exist while every page still looked correct.
    const site_js = readFileSync(path.join(root, 'src', 'lib', 'site.js'), 'utf8');
    const constant = name => {
        const m = site_js.match(new RegExp(`export const ${name} = "([^"]*)"`));
        assert.ok(m, `src/lib/site.js exports ${name}`);
        return m[1];
    };
    const ENDPOINT = constant('GC_ENDPOINT');
    const SCRIPT = constant('GC_SCRIPT');
    const EVENT = constant('GC_PLAY_EVENT');

    // the whole element, closing tag included, so "last in the body" can be
    // asserted against the end of the document
    const gc_tags = html =>
        [...html.matchAll(/<script[^>]*\bdata-goatcounter=[^>]*><\/script>/g)].map(m => m[0]);

    test('the endpoint is the site that exists, over https', () => {
        assert.equal(ENDPOINT, 'https://quartet-roulette.goatcounter.com/count');
        // protocol-relative //gc.zgo.at/count.js is GoatCounter's own snippet;
        // the site is https-only, so pinning the scheme costs nothing
        assert.equal(SCRIPT, 'https://gc.zgo.at/count.js');
    });

    test('every page carries exactly one count.js tag, async and last', () => {
        for (const route of pages()){
            const html = read(route);
            const tags = gc_tags(html);
            assert.equal(tags.length, 1, route + ' has one goatcounter tag');
            assert.ok(tags[0].includes(`data-goatcounter="${ENDPOINT}"`), route + ': ' + tags[0]);
            assert.ok(tags[0].includes(`src="${SCRIPT}"`), route + ': ' + tags[0]);
            // async or the page's own parse waits on a third-party host
            assert.match(tags[0], /\basync\b/, route + ': ' + tags[0]);
            // and last: after the site's own scripts, immediately before
            // </body>, so nothing the page does is queued behind analytics
            assert.ok(html.indexOf(tags[0]) > html.lastIndexOf('<script src="/js/'),
                route + ': counted before the site\'s own scripts');
            assert.ok(html.endsWith(tags[0] + '</body></html>'), route + ': not last in the body');
        }
    });

    test('the redirect shells stay bare', () => {
        // they replace themselves in the same tick; fetching a third-party
        // script to count that would slow down the only thing they do, and the
        // page they land on counts the visit a moment later
        for (const route of ['/random/', '/random-composer/']){
            assert.deepEqual(gc_tags(read(route)), [], route + ' has no analytics');
        }
    });

    test('a play click is counted, but nothing waits on GoatCounter', () => {
        const js = readFileSync(path.join(dist, 'js', 'work.js'), 'utf8');
        // the event name comes from site.js through esbuild's define, and is a
        // literal at the call site: no movement title, no slug, no PII
        assert.match(js, new RegExp(`count\\(\\{\\s*path\\s*:\\s*"${EVENT}"`), 'counts a literal event');
        assert.ok(!js.includes('goatcounter.count('), 'never calls count() unguarded');
        // window.goatcounter is undefined whenever count.js is blocked, offline
        // or simply not loaded yet -- all three have to be a no-op, not a throw
        assert.match(js, /typeof\s+\w+\.count\s*!=/, 'guards on count being a function');
        // and count() itself can throw even when it exists: it reads
        // localStorage through goatcounter.filter(), which is a SecurityError in
        // a browser blocking all site data. An uncaught one would land in the
        // console on every tap.
        assert.match(js, /try\s*\{[^}]*\.count\(/, 'the count() call sits in a try');
        for (const event of ['click', 'auxclick']){
            assert.ok(js.includes(`"${event}"`), `binds ${event}`);
        }
        // auxclick fires for every non-primary button, so an unfiltered handler
        // counts a right-click-to-copy-address as a play. Only the middle button
        // (1) is an open-in-new-tab.
        assert.match(js, /auxclick"[\s\S]{0,80}?\.button\s*===?\s*1/, 'auxclick is middle-button only');
    });

    test('no page depends on the analytics host for anything else', () => {
        // the acceptance criterion is that a blocked gc.zgo.at costs the visitor
        // nothing: it may serve count.js and nothing else -- no stylesheet, no
        // preconnect, no image, nothing the page renders around
        for (const route of routes_in(dist)){
            const html = read(route);
            for (const [tag] of html.matchAll(/<[^>]*\bgc\.zgo\.at[^>]*>/g)){
                assert.match(tag, /^<script[^>]*\basync\b/, `${route}: ${tag}`);
            }
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
            const html = read(route);
            // 70 movements (all Boccherini) have no spotify link in data.json.
            // They used to render an iframe with no src: an empty box on
            // desktop, and on touch a play link whose href resolved to the
            // current page -- a button that silently reloads. The template
            // renders no player for them at all now.
            for (const [tag] of html.matchAll(/<iframe\b[^>]*>/g)){
                assert.match(tag, /\bsrc="/, `${route}: iframe with no src`);
            }
            for (const [, src] of html.matchAll(/<iframe[^>]*\bsrc="([^"]*)"/g)){
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

// Last in the file on purpose: it rebuilds dist/ under a Netlify build context
// to see what that build really ships, then rebuilds it back. Every describe
// above reads the normal build, so this one has to come after all of them.
describe('the build is not host-aware (pwa.md Phase 4)', () => {
    const build_with = context => {
        const env = { ...process.env };
        if (context) env.CONTEXT = context; else delete env.CONTEXT;
        execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { env, stdio: 'ignore' });
    };
    const sample = ['/', '/haydn/', '/haydn-opus-76-3/', '/about/', '/404/'];

    test('a deploy preview ships exactly what production ships, analytics included', () => {
        // Deploy previews count into the same dashboard as production, and that
        // is a decision rather than an oversight: Jason tests against production
        // anyway, the traffic should dilute it, and keeping the tag everywhere is
        // what lets a preview URL answer "does a hit actually land" before a
        // merge. A CONTEXT gate was written and reverted; this asserts the build
        // output does not depend on the environment at all, so re-adding one is
        // a deliberate act with a failing test attached, not a quiet change.
        const counted = sample.map(read);
        try {
            for (const context of ['deploy-preview', 'branch-deploy', 'production']){
                build_with(context);
                sample.forEach((route, i) => {
                    assert.equal(read(route), counted[i], `${route} differs under CONTEXT=${context}`);
                });
            }
        } finally {
            build_with(null); // leave dist/ as the rest of the suite found it
        }
        assert.equal(read('/'), counted[0], 'the restored build matches');
    });
});
