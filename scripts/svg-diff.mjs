#!/usr/bin/env node
// Build a visual diff of the drawings: static/ (as authored) against dist/
// (as the build optimizes them). Writes svg-diff.html, which you open.
//
// The build rewrites all 54 drawings -- folding transforms, renormalizing the
// coordinate space, rounding to integers (see minify_svgs in build.mjs). Tests
// can prove the *mechanism* still holds, and a pixel comparison can put a
// number on the difference, but neither can tell you the artwork still looks
// right. That needs eyes, and eyes need something better than memory.
//
// So each drawing gets three panes: authored, shipped, and the two stacked
// with `mix-blend-mode: difference` -- identical pixels come out black, and
// anything that moved glows. The glow is amplified, so faint antialiasing on
// an edge is visible; that is expected and is what the whole set should look
// like. A shape that shifted, vanished or changed size shows as a solid bright
// blob, and there is no mistaking one for the other.
//
// The size slider matters: the drawings are shown at 200px on the home page
// and up to 600px on a composer page, and rounding error scales with size.
// Push it to the top of its range to see the worst case.
//
// The report references static/ and dist/ by relative path rather than
// inlining them: inlining meant a 9.5 MB file (every drawing appears twice --
// once in its own pane, once in the difference stack), and referencing has the
// better property anyway, that rebuilding and hitting refresh shows the new
// result without regenerating. It does mean the file only works where it is
// written, at the repo root.
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const authored_dir = path.join(root, 'static');
const shipped_dir = path.join(root, 'dist');
const out = path.join(root, 'svg-diff.html');

const kb = n => (n / 1024).toFixed(1) + ' KB';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const names = (await readdir(authored_dir)).filter(f => f.endsWith('.svg')).sort();
if (!names.length) throw new Error('no drawings in static/');

const rows = [];
let missing = 0, total_a = 0, total_b = 0;
for (const name of names){
    const a = await stat(path.join(authored_dir, name));
    let b;
    try {
        b = await stat(path.join(shipped_dir, name));
    } catch {
        missing++;
        continue; // dist/ not built, or this one is not shipped
    }
    total_a += a.size; total_b += b.size;
    const src_a = `static/${encodeURIComponent(name)}`;
    const src_b = `dist/${encodeURIComponent(name)}`;
    rows.push(`<section class="row">
  <h2>${esc(name)} <span class="meta">${kb(a.size)} &rarr; ${kb(b.size)}
    (${(100 - 100 * b.size / a.size).toFixed(0)}% smaller)</span></h2>
  <div class="panes">
    <figure><div class="pane"><img src="${src_a}" alt="" loading="lazy"></div><figcaption>authored</figcaption></figure>
    <figure><div class="pane"><img src="${src_b}" alt="" loading="lazy"></div><figcaption>shipped</figcaption></figure>
    <figure><div class="pane diff"><img src="${src_a}" alt="" loading="lazy"><img src="${src_b}" alt="" loading="lazy"></div>
      <figcaption>difference</figcaption></figure>
  </div>
</section>`);
}

// npm test builds into a temp directory and cleans up after itself, so a
// fresh checkout has no dist/ at all -- in which case every drawing is
// missing and a report of nothing would render `NaN% smaller` over a blank
// page and still exit 0. Fail the way the empty-static/ case above does.
if (!rows.length) throw new Error('nothing in dist/ -- run `npm run build` first');
if (missing) console.warn(`${missing} drawing(s) not found in dist/ -- run \`npm run build\` first`);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Drawings: authored vs shipped</title>
<style>
  :root { --h: 300px; --gain: 6; color-scheme: light dark; }
  body { margin: 0; font: 15px/1.5 -apple-system, system-ui, sans-serif;
         background: #fbfbfa; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { background: #14141a; color: #e8e8ea; } }
  header { position: sticky; top: 0; z-index: 2; padding: 1rem 1.5rem;
           background: inherit; border-bottom: 1px solid #8884; }
  h1 { font-size: 1.1rem; margin: 0 0 .35rem; }
  p { margin: .35rem 0; max-width: 62ch; color: #666; }
  @media (prefers-color-scheme: dark) { p { color: #aaa; } }
  .controls { display: flex; gap: 1.5rem; align-items: center; margin-top: .75rem;
              flex-wrap: wrap; font-variant-numeric: tabular-nums; }
  label { display: flex; gap: .5rem; align-items: center; }
  .row { padding: 1.25rem 1.5rem; border-bottom: 1px solid #8882; }
  h2 { font-size: .95rem; font-weight: 600; margin: 0 0 .6rem; }
  .meta { font-weight: 400; color: #888; }
  .panes { display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: flex-start; }
  figure { margin: 0; }
  figcaption { font-size: .78rem; color: #888; margin-top: .3rem; }
  /* white behind every pane: these drawings are line art with transparency,
     and the difference blend is only meaningful against a fixed ground */
  .pane { background: #fff; position: relative; display: flex; }
  .pane img { height: var(--h); width: auto; display: block; }
  /* identical pixels subtract to black; anything that moved glows, and the
     gain makes a fraction of a pixel of antialiasing visible */
  .diff { background: #000; filter: brightness(var(--gain)); }
  /* top/left only, never \`inset: 0\`. With both left and right pinned and
     width:auto, the used width solves to the pane's width -- so the shipped
     drawing would be stretched to the authored one's width and any change in
     aspect ratio, the very thing this pane advertises catching, would render
     as pure black. */
  .diff img:last-child { position: absolute; top: 0; left: 0; right: auto;
                         mix-blend-mode: difference; }
</style></head>
<body>
<header>
  <h1>Drawings: authored vs shipped</h1>
  <p>Left is <code>static/</code> as delivered, middle is what the build ships. The right pane
     stacks them with a difference blend and turns the brightness up: <b>black means identical</b>,
     and anything that moved glows. The shipped drawing is placed at its own size, not fitted to the
     pane, so a change in aspect ratio shows up as the two diverging across the width rather than
     being hidden. A faint outline everywhere is expected &mdash; that is
     antialiasing on edges, and it is what all 54 should look like. <b>A solid bright shape means
     something actually moved, vanished or resized</b>, and it will be obvious.</p>
  <p>Rounding error scales with size, so drag the size up to see the worst case. The home page draws
     these at 200px and a composer page at 600px. This page reads <code>static/</code> and
     <code>dist/</code> live, so after a rebuild just refresh.</p>
  <div class="controls">
    <label>size <input type="range" min="100" max="1800" value="300" step="20"
      oninput="document.documentElement.style.setProperty('--h', this.value + 'px');
               this.nextElementSibling.textContent = this.value + 'px'"><span>300px</span></label>
    <label>glow <input type="range" min="1" max="14" value="6" step="1"
      oninput="document.documentElement.style.setProperty('--gain', this.value);
               this.nextElementSibling.textContent = '\\u00d7' + this.value"><span>&times;6</span></label>
    <span>${rows.length} drawings &middot; ${kb(total_a)} &rarr; ${kb(total_b)}
      (${(100 - 100 * total_b / total_a).toFixed(0)}% smaller)</span>
  </div>
</header>
${rows.join('\n')}
</body></html>`;

await writeFile(out, html);
console.log(`wrote ${path.relative(root, out)} (${kb(Buffer.byteLength(html))}, ${rows.length} drawings)`);
console.log('open it and drag the size slider up; black means identical.');
