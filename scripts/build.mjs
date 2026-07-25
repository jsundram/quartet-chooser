#!/usr/bin/env node
// Static site generator, replacing `gatsby build`. Renders every page in
// src/lib/routes.js to dist/<route>/index.html, inlines the CSS, emits the
// sitemap and 404.html, generates the client scripts, and copies static/.
// See docs/simplification-plan.md, Phase 1.
import * as esbuild from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const cache = path.join(root, '.cache'); // gitignored; may hold stale Gatsby output
const ssr = path.join(cache, 'ssg');

// what ships to browsers (client JS + CSS); explicit so syntax lowering and
// CSS prefixing (e.g. -webkit-sticky for Safari <= 12) are a choice, not an
// accident of esbuild's defaults
const BROWSER_TARGET = ['chrome80', 'edge80', 'firefox75', 'safari12'];

function xml_escape(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// JSON that is safe to embed in a script regardless of context
function script_json(value){
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

function page_html({ head, body, scripts }, css, icons){
    return '<!DOCTYPE html><html lang="en"><head>'
        + '<meta charset="utf-8"/>'
        + '<meta http-equiv="x-ua-compatible" content="ie=edge"/>'
        + '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>'
        + head
        + `<style>${css}</style>`
        + '<link rel="icon" href="/favicon-32x32.png" type="image/png"/>'
        + '<link rel="manifest" href="/manifest.webmanifest" crossorigin="anonymous"/>'
        + icons
        + '<link rel="sitemap" type="application/xml" href="/sitemap/sitemap-index.xml"/>'
        + '</head><body>'
        + body
        + (scripts || '')
        + '</body></html>';
}

function sitemap_xml(site_url, paths){
    const urls = paths.map(p =>
        `<url><loc>${xml_escape(site_url + p)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
    ).join('');
    return {
        'sitemap-index.xml': '<?xml version="1.0" encoding="UTF-8"?>'
            + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + `<sitemap><loc>${xml_escape(site_url)}/sitemap/sitemap-0.xml</loc></sitemap>`
            + '</sitemapindex>',
        'sitemap-0.xml': '<?xml version="1.0" encoding="UTF-8"?>'
            + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + urls
            + '</urlset>',
    };
}

async function build(){
    await rm(dist, { recursive: true, force: true });
    await rm(cache, { recursive: true, force: true });

    // apple-touch-icon links, derived from the manifest so there is one
    // source of truth for the icon set
    const manifest = JSON.parse(await readFile(path.join(root, 'static', 'manifest.webmanifest'), 'utf8'));
    const icons = manifest.icons.map(i =>
        `<link rel="apple-touch-icon" sizes="${i.sizes}" href="${i.src}"/>`
    ).join('');

    // 1. Bundle the SSR entry (JSX + CSS modules + data.json) for Node.
    await esbuild.build({
        entryPoints: [path.join(root, 'scripts', 'render.js')],
        bundle: true,
        platform: 'node',
        format: 'esm',
        packages: 'external', // react/react-dom resolve from node_modules
        loader: { '.js': 'jsx' },
        target: 'node22', // matches engines/.nvmrc
        outdir: ssr,
        outExtension: { '.js': '.mjs' },
    });

    const { CLASS_NAMES, SITE_URL, random_targets, render_pages } =
        await import(pathToFileURL(path.join(ssr, 'render.mjs')));

    // 2. The bundle's CSS output (all modules' styles) gets inlined into
    // every page, as Gatsby did.
    const raw_css = await readFile(path.join(ssr, 'render.css'), 'utf8');
    const css = (await esbuild.transform(raw_css, {
        loader: 'css',
        minify: true,
        target: BROWSER_TARGET,
    })).code.trim();

    // 3. Client scripts: the touch-device player swap for work pages, the
    // 🔀-link re-randomizer for composer pages, and the random-redirect
    // scripts with their target lists baked in.
    await esbuild.build({
        entryPoints: [
            path.join(root, 'src', 'client', 'work.js'),
            path.join(root, 'src', 'client', 'shuffle.js'),
        ],
        bundle: true,
        minify: true,
        target: BROWSER_TARGET,
        define: {
            TABLE_MOBILE: script_json(CLASS_NAMES.tableMobile),
            PLAY_ICON: script_json(CLASS_NAMES.playIcon),
        },
        outdir: path.join(dist, 'js'),
    });

    await mkdir(path.join(dist, 'js'), { recursive: true }); // not just an esbuild side effect
    const targets = random_targets();
    for (const [name, slugs] of Object.entries(targets)){
        const js = `var t=${script_json(slugs)};location.replace(t[Math.floor(Math.random()*t.length)]);\n`;
        await writeFile(path.join(dist, 'js', `${name}.js`), js);
    }

    const SCRIPTS = {
        'composer': '<script src="/js/shuffle.js"></script>',
        'work': '<script src="/js/work.js"></script>',
        'random': '<script src="/js/random.js"></script>',
        'random-composer': '<script src="/js/random-composer.js"></script>',
    };

    // 4. Render every page.
    const pages = render_pages();
    for (const page of pages){
        let scripts = SCRIPTS[page.component];
        if (page.component === 'composer' && !page.body.includes('data-shuffle')){
            scripts = undefined; // single-work composers have no 🔀 to re-randomize
        }
        const dir = path.join(dist, ...page.path.split('/').filter(Boolean));
        // page paths come from data.json names/catalogs; never write outside dist/
        if (!(dir + path.sep).startsWith(dist + path.sep)){
            throw new Error(`page path escapes dist/: ${page.path}`);
        }
        await mkdir(dir, { recursive: true });
        const html = page_html({ ...page, scripts }, css, icons);
        await writeFile(path.join(dir, 'index.html'), html);
        if (page.path === '/404/'){
            await writeFile(path.join(dist, '404.html'), html); // Netlify's custom 404
        }
    }

    // 5. Sitemap: every page except /404/, at the same URL as gatsby-plugin-sitemap.
    const sitemap = sitemap_xml(SITE_URL, pages.map(p => p.path).filter(p => p !== '/404/'));
    await mkdir(path.join(dist, 'sitemap'), { recursive: true });
    for (const [name, xml] of Object.entries(sitemap)){
        await writeFile(path.join(dist, 'sitemap', name), xml);
    }

    // 6. Static assets, copied through as-is.
    await cp(path.join(root, 'static'), dist, {
        recursive: true,
        filter: src => path.basename(src) !== '.DS_Store',
    });

    await rm(ssr, { recursive: true, force: true });
    console.log(`built ${pages.length} pages to dist/`);
}

await build();
