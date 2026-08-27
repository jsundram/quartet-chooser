#!/usr/bin/env node
// Generates the 1200x630 link-preview (og:image) cards into static/og/.
//
// Why a script and not hand-made images: the portraits are SVGs, and iMessage,
// WhatsApp and Slack all ignore SVG og:images -- they need a raster at an
// absolute https URL. So each card is *composed* from the same SVGs the site
// renders (static/<Composer>.svg + <Composer>-Signature.svg) and rasterized.
// The SVGs stay the source of truth; the PNGs are build output that happens to
// be committed, because Netlify has neither rsvg-convert nor pngquant. Never
// hand-edit static/og/*.png -- change the layout here and rerun:
//
//     npm run og
//
// Cards are hard-gated at MAX_BYTES: a card too big to scrape previews as a
// silent grey box, so this fails loudly instead of shipping one. scripts/build.mjs
// re-checks the committed files, so a stale oversized card can't sneak in.
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const static_dir = path.join(root, 'static');
const out_dir = path.join(static_dir, 'og');

// Marusya's palette, pulled from the portrait SVGs (see layout.module.css).
const BLACK = '#111011';
const CYAN = '#5dcbf5';
const RED = '#b82327';
const WHITE = '#f7f7f3';

const W = 1200, H = 630;
// Keep in sync with the MAX_BYTES gate in scripts/build.mjs. 250 KB leaves a
// margin under WhatsApp's ~300 KB scrape cutoff.
const MAX_BYTES = 250_000;

// A card is read at thumbnail size in a chat bubble, so the type has to be big
// and the stack short. -apple-system is not a real font to rsvg; name real ones.
// Note this resolves against locally installed fonts, so a machine without
// Helvetica Neue regenerates a subtly different card -- issue #39 tracks
// vendoring and embedding a face so generation is reproducible anywhere.
const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';

function xml_escape(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Inline one of the site's SVGs as a nested <svg>, positioned in the card's
// coordinate system. Nesting (rather than <image href>) keeps everything one
// vector document, so there is exactly one rasterization pass and no external
// file resolution at render time. The sources are pure <path> data -- no
// url(#...) references anywhere -- so their ids are inert and get stripped:
// two files in one document would otherwise collide on id="path100".
async function inline_svg(file, { x, y, width, height, align = 'xMidYMid' }){
    const src = await readFile(path.join(static_dir, file), 'utf8');
    const view_box = src.match(/viewBox="([^"]*)"/);
    if (!view_box) throw new Error(`${file}: no viewBox`);
    if (/url\(#|<use\b|<text\b/.test(src)) throw new Error(`${file}: not a plain-path SVG`);

    const open = src.indexOf('>', src.indexOf('<svg'));
    const close = src.lastIndexOf('</svg>');
    const body = src.slice(open + 1, close).replace(/\sid="[^"]*"/g, '');

    return `<svg x="${x}" y="${y}" width="${width}" height="${height}"`
        + ` viewBox="${view_box[1]}" preserveAspectRatio="${align} meet">${body}</svg>`;
}

async function data_uri(file){
    const bytes = await readFile(path.join(static_dir, file));
    return `data:image/png;base64,${bytes.toString('base64')}`;
}

// The site wordmark: roulette icon + name, as it reads in the site header.
function wordmark({ x, y, size, icon }){
    const gap = size * 0.45;
    return `<image x="${x}" y="${y - size * 0.82}" width="${size * 1.05}" height="${size * 1.05}"`
        + ` href="${icon}" preserveAspectRatio="xMidYMid meet"/>`
        + `<text x="${x + size * 1.05 + gap}" y="${y}" font-family="${SANS}" font-size="${size}"`
        + ` font-weight="700" fill="${CYAN}">Quartet Roulette</text>`;
}

// Per-composer card: portrait on the left, their own signature on the right.
// The signature is the site's identity for a composer -- the same asset the
// composer page uses as its <h1> -- so the card reads as "this composer, on
// this site" without depending on a font being installed.
async function composer_card(composer, icon){
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
        + `<rect width="${W}" height="${H}" fill="${WHITE}"/>`
        + `<rect x="0" y="0" width="${W}" height="14" fill="${RED}"/>`
        + await inline_svg(`${composer}.svg`, { x: 60, y: 60, width: 420, height: 510 })
        + await inline_svg(`${composer}-Signature.svg`,
            { x: 540, y: 215, width: 600, height: 150, align: 'xMinYMid' })
        + wordmark({ x: 540, y: 470, size: 46, icon })
        + `<text x="540" y="520" font-family="${SANS}" font-size="26" fill="${BLACK}"`
        + ` opacity="0.72">quartetroulette.com</text>`
        + '</svg>';
}

// Site-wide card for /, /about/ and /404/: four portraits, because four
// players is the whole point, under the wordmark. The icon sits *above* the
// name rather than beside it: centering an icon+text row needs the rendered
// text width, which we have no way to measure here, and a guess drifts as
// soon as the wordmark or the font changes. A centered stack cannot drift.
async function site_card(quartet, icon){
    const slot = (W - 2 * 70) / 4;
    const portraits = await Promise.all(quartet.map((c, i) =>
        inline_svg(`${c}.svg`, { x: 70 + i * slot, y: 250, width: slot, height: 300 })));

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
        + `<rect width="${W}" height="${H}" fill="${WHITE}"/>`
        + `<rect x="0" y="0" width="${W}" height="14" fill="${RED}"/>`
        + `<image x="${W / 2 - 42}" y="48" width="84" height="84" href="${icon}"/>`
        + `<text x="${W / 2}" y="204" text-anchor="middle" font-family="${SANS}" font-size="72"`
        + ` font-weight="700" fill="${CYAN}">Quartet Roulette</text>`
        + `<text x="${W / 2}" y="244" text-anchor="middle" font-family="${SANS}" font-size="28"`
        + ` fill="${BLACK}" opacity="0.72">What should we play next?</text>`
        + portraits.join('')
        + `<rect x="0" y="${H - 14}" width="${W}" height="14" fill="${CYAN}"/>`
        + '</svg>';
}

async function rasterize(svg, name){
    const png = path.join(out_dir, `${name}.png`);
    const tmp = path.join(out_dir, `.${name}.svg`);
    await writeFile(tmp, svg);
    try {
        execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), tmp, '-o', png]);
        // Palette-quantize: a card that rasterized fine but never got
        // compressed is exactly the one that previews as a grey box.
        // --skip-if-larger leaves the original alone if quantizing doesn't help.
        execFileSync('pngquant', ['--force', '--skip-if-larger', '--speed', '1',
                                  '--output', png, png]);
    } finally {
        await rm(tmp, { force: true });
    }

    const { size } = await stat(png);
    if (size > MAX_BYTES){
        throw new Error(`og/${name}.png is ${size} bytes (> ${MAX_BYTES}): `
            + 'simplify the layout or shrink the palette');
    }
    return size;
}

function require_tools(){
    for (const tool of ['rsvg-convert', 'pngquant']){
        try {
            execFileSync(tool, ['--version'], { stdio: 'ignore' });
        } catch (e) {
            if (e.code !== 'ENOENT') continue; // it ran; a nonzero --version is its business
            throw new Error(`${tool} not found: brew install librsvg pngquant`);
        }
    }
}

async function main(){
    require_tools();

    // Composers come from the files on disk, not a hard-coded list: adding a
    // portrait to static/ is all it should take to get a card.
    const composers = (await readdir(static_dir))
        .filter(f => f.endsWith('-Signature.svg'))
        .map(f => f.replace('-Signature.svg', ''))
        .sort();

    await mkdir(out_dir, { recursive: true });
    const icon = await data_uri('icon.png');

    // Haydn first -- the site's namesake enthusiasts -- then a spread of eras.
    const cards = [['og', await site_card(['Haydn', 'Beethoven', 'Debussy', 'Bartok'], icon)]];
    for (const c of composers){
        cards.push([`og-${c.toLowerCase()}`, await composer_card(c, icon)]);
    }

    let total = 0;
    for (const [name, svg] of cards){
        const size = await rasterize(svg, name);
        total += size;
        console.log(`  static/og/${name}.png  ${size.toLocaleString()} bytes`);
    }
    console.log(`wrote ${cards.length} cards (${total.toLocaleString()} bytes total)`);
}

await main();
