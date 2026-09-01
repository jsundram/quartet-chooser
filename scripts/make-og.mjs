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
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { quantize, rasterize_svg, require_tools } from './png-tools.mjs'
import { OG_SITE_QUARTET } from '../src/lib/site.js'

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

// Advance width of "Quartet Roulette" in Helvetica Neue bold -- the *advance*,
// not the ink: measured by rendering it anchored at each end and solving the
// two ink boxes for the side bearings. A constant because rsvg cannot report
// text width and librsvg 2.62 ignores textLength, so nothing here can measure
// type; it is what centers the header row, and it drifts with the font, which
// is the other half of why #39 wants a vendored face.
// Keep in sync with scripts/og-tool.mjs.
const TITLE_EMS = 7.92;

// Inline one of the site's SVGs as a nested <svg>, positioned in the card's
// coordinate system. Nesting (rather than <image href>) keeps everything one
// vector document, so there is exactly one rasterization pass and no external
// file resolution at render time. The sources are pure <path> data -- no
// url(#...) references anywhere -- so their ids are inert and get stripped:
// two files in one document would otherwise collide on id="path100".
//
// <image> is rejected for a different reason than the rest of that guard: it
// is the one element that would reach outside the document, and rasterize_svg
// feeds rsvg on stdin, where a relative reference resolves to nothing at exit
// code 0. A redelivered drawing carrying an embedded raster would inline
// cleanly and render a blank slot -- and pass the card's size gate, because
// the miss makes the PNG smaller rather than larger.
async function inline_svg(file, { x, y, width, height, align = 'xMidYMid' }){
    const src = await readFile(path.join(static_dir, file), 'utf8');
    const view_box = src.match(/viewBox="([^"]*)"/);
    if (!view_box) throw new Error(`${file}: no viewBox`);
    if (/url\(#|<use\b|<text\b|<image\b/.test(src)) throw new Error(`${file}: not a plain-path SVG`);

    const open = src.indexOf('>', src.indexOf('<svg'));
    const close = src.lastIndexOf('</svg>');
    const body = src.slice(open + 1, close).replace(/\sid="[^"]*"/g, '');

    return `<svg x="${x}" y="${y}" width="${width}" height="${height}"`
        + ` viewBox="${view_box[1]}" preserveAspectRatio="${align} meet">${body}</svg>`;
}

async function data_uri(file, dir = static_dir){
    const bytes = await readFile(path.join(dir, file));
    return `data:image/png;base64,${bytes.toString('base64')}`;
}

// How wordmark() spaces its two halves, in ems of the type size: the icon is
// square and a little taller than the caps, and stands this far off the name.
// Named because wordmark() lays the row out and wordmark_width() measures it,
// and the two must not disagree about the same row.
const ICON_EMS = 1.05, ICON_GAP_EMS = 0.45;

// Width of the icon + name row, so a caller can center it without restating
// how wordmark() spaces its two halves.
const wordmark_width = size => size * (ICON_EMS + ICON_GAP_EMS + TITLE_EMS);

// The site wordmark: roulette icon + name, as it reads in the site header.
function wordmark({ x, y, size, icon }){
    const icon_size = size * ICON_EMS;
    return `<image x="${x}" y="${y - size * 0.82}" width="${icon_size}" height="${icon_size}"`
        + ` href="${icon}" preserveAspectRatio="xMidYMid meet"/>`
        + `<text x="${x + icon_size + size * ICON_GAP_EMS}" y="${y}" font-family="${SANS}"`
        + ` font-size="${size}" font-weight="700" fill="${CYAN}">Quartet Roulette</text>`;
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
// players is the whole point, under the wordmark. Icon and name share a line,
// which keeps the header short and buys the tagline clear air and the
// portraits another 50px of height.
//
// The quartet is `'Name'` or `{ name, flip }` -- flip mirrors a portrait about
// its own slot, for when two sitters face away from each other and the row
// reads as bookends rather than a group. Variants are tried in og-tool.html
// (npm run og-tool), which mirrors these numbers and emits a config in exactly
// this shape.
async function site_card(quartet, icon){
    const players = quartet.map(c => typeof c === 'string' ? { name: c } : c);
    const slot = (W - 2 * 70) / players.length;
    const portraits = await Promise.all(players.map(async ({ name, flip }, i) => {
        const x = 70 + i * slot;
        const svg = await inline_svg(`${name}.svg`, { x, y: 219, width: slot, height: 350 });
        // mirror about the slot's own centerline, so the portrait stays put
        return flip ? `<g transform="translate(${2 * x + slot} 0) scale(-1 1)">${svg}</g>` : svg;
    }));

    const size = 72;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
        + `<rect width="${W}" height="${H}" fill="${WHITE}"/>`
        + `<rect x="0" y="0" width="${W}" height="14" fill="${RED}"/>`
        + wordmark({ x: (W - wordmark_width(size)) / 2, y: 110, size, icon })
        + `<text x="${W / 2}" y="173" text-anchor="middle" font-family="${SANS}" font-size="28"`
        + ` fill="${BLACK}" opacity="0.72">What should we play next?</text>`
        + portraits.join('')
        + `<rect x="0" y="${H - 14}" width="${W}" height="14" fill="${CYAN}"/>`
        + '</svg>';
}

async function rasterize(svg, name){
    const png = path.join(out_dir, `${name}.png`);
    rasterize_svg(svg, { width: W, height: H, out: png });
    // Palette-quantize: a card that rasterized fine but never got compressed
    // is exactly the one that previews as a grey box. If pngquant declines (it
    // would not have helped), the rsvg output already at `png` stands, and the
    // size gate below still applies.
    quantize(png);

    const { size } = await stat(png);
    if (size > MAX_BYTES){
        throw new Error(`og/${name}.png is ${size} bytes (> ${MAX_BYTES}): `
            + 'simplify the layout or shrink the palette');
    }
    return size;
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
    // from assets/, not static/: it is a build-time source and is not deployed
    const icon = await data_uri('icon.png', path.join(root, 'assets'));

    // From site.js, where the alt text is derived from the same list.
    const cards = [['og', await site_card(OG_SITE_QUARTET, icon)]];
    for (const c of composers){
        cards.push([`og-${c.toLowerCase()}`, await composer_card(c, icon)]);
    }

    let total = 0;
    for (const [name, svg] of cards){
        const size = await rasterize(svg, name);
        total += size;
        console.log(`  static/og/${name}.png  ${size.toLocaleString()} bytes`);
        // Who is actually on the committed card, for check_og_cards() to
        // compare against site.js. In assets/, not static/og/: a record, not a
        // file to serve. Written the moment og.png exists rather than after
        // all 19 cards, because a failure in a later one -- the size gate,
        // rsvg, pngquant -- would otherwise leave the new card on disk beside
        // a record of the old quartet, and the next build would report stale
        // provenance for a card that is in fact correct.
        if (name === 'og'){
            await writeFile(path.join(root, 'assets', 'og-quartet.json'),
                JSON.stringify(OG_SITE_QUARTET) + '\n');
        }
    }

    console.log(`wrote ${cards.length} cards (${total.toLocaleString()} bytes total)`);
}

await main();
