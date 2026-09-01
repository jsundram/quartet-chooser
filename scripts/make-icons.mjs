#!/usr/bin/env node
// Generates the PWA / home-screen icons into static/icons/ from a single
// source image. Run after changing that source:
//
//     npm run icons
//
// static/manifest.webmanifest lists what comes out of here and is the single
// source of truth for which file plays which role -- scripts/build.mjs reads it
// to emit the apple-touch-icon link and the install metas. Add a size here and
// in the manifest together.
//
// Source: assets/icon.svg if it exists, else assets/icon.png. These live in
// assets/ rather than static/ because they are inputs to this script, not
// files the site serves -- static/ is copied to the deploy. The PNG is the
// 512x512 original from flaticon (their largest), so every size below is a
// downscale -- nothing is ever upscaled. Drop an SVG in and it wins
// automatically, which is the only reason to bother getting one.
//
// Three kinds of output, and the differences are not cosmetic:
//
//   any       transparent, as the artwork ships. Android and Chrome composite
//             these onto their own backgrounds.
//   apple     OPAQUE. iOS renders an alpha channel in an apple-touch-icon as
//             *black*, so a transparent one shows the wheel on a black tile.
//             That is what this site shipped before this script existed.
//   maskable  OPAQUE, artwork inset to the 80% safe zone. Android crops icons
//             to whatever shape the launcher uses (circle, squircle, rounded
//             square); art outside that centred 80% circle can be cut off.
//             The wheel being circular is lucky here -- a circle in a circular
//             safe zone wastes no space.
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { quantize, rasterize_svg, require_tools } from './png-tools.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const static_dir = path.join(root, 'static');
const out_dir = path.join(static_dir, 'icons');
// build-time sources, deliberately outside static/ so they are not deployed
const assets_dir = path.join(root, 'assets');

// must match background_color in the manifest: this is what shows through
// behind a transparent corner or inside a maskable icon's padding
const BACKGROUND = '#f7f7f3';

// Android's maskable safe zone is a centred circle 80% of the icon's width.
const SAFE_ZONE = 0.8;

// the sizes the manifest advertises, plus the two special ones
const ANY_SIZES = [48, 72, 96, 144, 192, 256, 384, 512];
const APPLE_SIZE = 180;   // the one size iOS actually wants
const MASKABLE_SIZE = 512;

async function exists(p){
    try { await access(p); return true; } catch { return false; }
}

// The source, as markup that can be dropped into a composed SVG at any size.
// Both branches end up as one vector document rasterized in a single pass, so
// the SVG and PNG sources go through identical code below.
async function load_source(){
    const svg = path.join(assets_dir, 'icon.svg');
    if (await exists(svg)){
        const src = await readFile(svg, 'utf8');
        const view_box = src.match(/viewBox="([^"]*)"/);
        if (!view_box) throw new Error('assets/icon.svg has no viewBox');
        const open = src.indexOf('>', src.indexOf('<svg'));
        const body = src.slice(open + 1, src.lastIndexOf('</svg>'));
        return {
            name: 'assets/icon.svg',
            place: (x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}"`
                + ` viewBox="${view_box[1]}" preserveAspectRatio="xMidYMid meet">${body}</svg>`,
        };
    }

    const png = path.join(assets_dir, 'icon.png');
    if (!await exists(png)) throw new Error('need assets/icon.svg or assets/icon.png');
    const uri = `data:image/png;base64,${(await readFile(png)).toString('base64')}`;
    return {
        name: 'assets/icon.png',
        place: (x, y, w, h) => `<image x="${x}" y="${y}" width="${w}" height="${h}"`
            + ` href="${uri}" preserveAspectRatio="xMidYMid meet"/>`,
    };
}

function compose(source, size, { opaque, inset }){
    const art = inset ? Math.round(size * SAFE_ZONE) : size;
    const offset = (size - art) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"`
        + ` viewBox="0 0 ${size} ${size}">`
        + (opaque ? `<rect width="${size}" height="${size}" fill="${BACKGROUND}"/>` : '')
        + source.place(offset, offset, art, art)
        + '</svg>';
}

// Scratch SVGs go to a private temp directory rather than alongside the icons
// they rasterize into. The `finally` below cannot run if the process is killed
// outright, and this wrote `static/icons/icon-48x48.png.svg` -- a drawing in a
// subdirectory of static/, which minify_svgs does not handle and build.mjs
// refuses outright, so one interrupted `npm run icons` broke every later build
// and test until someone found the file. make-og.mjs had the same flaw.
// mkdtemp rather than a name built from the pid: an unguessable 0700 directory
// cannot be pre-empted by a symlink on a shared /tmp.
let scratch_dir;

async function rasterize(svg, size, file){
    scratch_dir ??= await mkdtemp(path.join(tmpdir(), 'qr-icons-'));
    const tmp = path.join(scratch_dir, path.basename(file) + '.svg');
    await writeFile(tmp, svg);
    let quantized;
    try {
        rasterize_svg(tmp, { width: size, height: size, out: file });
        // false means pngquant declined because it would not have helped; the
        // rsvg output already at `file` is the right answer. See png-tools.mjs.
        quantized = quantize(file);
    } finally {
        await rm(tmp, { force: true });
    }
    return { bytes: (await stat(file)).size, quantized };
}

async function main(){
    require_tools();
    const source = await load_source();
    await mkdir(out_dir, { recursive: true });

    const jobs = [
        ...ANY_SIZES.map(s => ({
            size: s, file: `icon-${s}x${s}.png`, opaque: false, inset: false, kind: 'any',
        })),
        {
            size: APPLE_SIZE, file: `icon-${APPLE_SIZE}x${APPLE_SIZE}.png`,
            opaque: true, inset: false, kind: 'apple',
        },
        {
            size: MASKABLE_SIZE, file: `icon-${MASKABLE_SIZE}x${MASKABLE_SIZE}-maskable.png`,
            opaque: true, inset: true, kind: 'maskable',
        },
    ];

    let total = 0;
    try {
        for (const job of jobs){
            const svg = compose(source, job.size, job);
            const { bytes, quantized } =
                await rasterize(svg, job.size, path.join(out_dir, job.file));
            total += bytes;
            console.log(`  static/icons/${job.file.padEnd(28)} ${job.kind.padEnd(9)}`
                + `${bytes.toLocaleString().padStart(7)} bytes`
                + (quantized ? '' : '   (pngquant declined; kept the rsvg output)'));
        }
    } finally {
        if (scratch_dir) await rm(scratch_dir, { recursive: true, force: true });
    }
    console.log(`wrote ${jobs.length} icons from ${source.name}`
        + ` (${total.toLocaleString()} bytes total)`);
}

await main();
