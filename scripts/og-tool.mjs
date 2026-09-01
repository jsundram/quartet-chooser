#!/usr/bin/env node
// Design playground for the site-wide share card (issue #39). Writes
// og-tool.html, which you open from the repo root: it re-creates the
// site_card() layout from scripts/make-og.mjs in the browser and puts knobs on
// the open questions -- which portraits, in what order, facing which way, and
// what the tagline says. The "config" block at the bottom is the answer key:
// paste it into the issue (or at Claude) and the choice gets baked into
// make-og.mjs, which stays the only generator of real cards.
//
// Like svg-diff.html, the page references static/ by relative path, so it only
// works from the repo root and shows edits to the drawings on refresh. The
// layout constants are duplicated from site_card() on purpose: this page is
// for trying what the card is not yet, and once a variant wins, its numbers
// move into make-og.mjs and this file's defaults follow.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'og-tool.html');

const composers = (await readdir(path.join(root, 'static')))
    .filter(f => f.endsWith('-Signature.svg'))
    .map(f => f.replace('-Signature.svg', ''))
    .sort();
if (!composers.length) throw new Error('no portraits in static/');

// Same icon source as make-og.mjs: a build-time asset, not deployed, so it
// has to be inlined rather than referenced.
const icon_png = await readFile(path.join(root, 'assets', 'icon.png'));
const icon = `data:image/png;base64,${icon_png.toString('base64')}`;

// This function is serialized into the page verbatim (client.toString() below)
// and runs in the browser. It must not reference anything from module scope.
function client(COMPOSERS, ICON){
    'use strict';
    const CYAN = '#5dcbf5', RED = '#b82327', WHITE = '#f7f7f3', BLACK = '#111011';
    // Keep in sync with site_card() in scripts/make-og.mjs -- these are its
    // current values; the sliders start here and explore around them.
    const W = 1200, H = 630, BAR = 14, MARGIN = 70;
    const TITLE_SIZE = 72, TITLE_Y = 110, TAG_SIZE = 28, TAG_Y = 173;
    const TITLE_EMS = 7.92; // advance of "Quartet Roulette", see make-og.mjs

    const state = {
        tagline: 'What should we play next?',
        slots: ['Boccherini', 'Haydn', 'Beethoven', 'Bartok']
            .map(name => ({ name, flip: false })),
        gap: 46,  // tagline baseline -> portrait top
        ph: 350,  // portrait slot height
    };

    const PRESETS = [
        'What should we play next?',
        'Break the “what should we play?” indecision',
        '256 string quartets by 18 composers',
        '256 quartets. One spin.',
        '',
    ];

    const $ = id => document.getElementById(id);
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;');

    function card(){
        const parts = [];
        parts.push(`<rect width="${W}" height="${H}" fill="${WHITE}"/>`);
        parts.push(`<rect width="${W}" height="${BAR}" fill="${RED}"/>`);

        // Icon + name on one line, centered as a row (the browser could
        // measure the text, but make-og.mjs cannot, so this uses the same
        // TITLE_EMS constant -- what you see is what rsvg will do).
        const ic = TITLE_SIZE * 1.05, gap = TITLE_SIZE * 0.45;
        const row = ic + gap + TITLE_SIZE * TITLE_EMS;
        const x = (W - row) / 2;
        parts.push(`<image x="${x}" y="${TITLE_Y - TITLE_SIZE * 0.82}" width="${ic}" height="${ic}"`
            + ` href="${ICON}" preserveAspectRatio="xMidYMid meet"/>`);
        parts.push(`<text x="${x + ic + gap}" y="${TITLE_Y}" font-size="${TITLE_SIZE}"`
            + ` font-weight="700" fill="${CYAN}">Quartet Roulette</text>`);

        if (state.tagline.trim()){
            parts.push(`<text x="${W / 2}" y="${TAG_Y}" text-anchor="middle"`
                + ` font-size="${TAG_SIZE}" fill="${BLACK}" opacity="0.72">${esc(state.tagline)}</text>`);
        }

        const slot = (W - 2 * MARGIN) / state.slots.length; // remove disables at 1, never 0
        const py = TAG_Y + state.gap;
        state.slots.forEach((p, i) => {
            const px = MARGIN + i * slot;
            const img = `<image x="${px}" y="${py}" width="${slot}" height="${state.ph}"`
                + ` href="static/${encodeURIComponent(p.name)}.svg" preserveAspectRatio="xMidYMid meet"/>`;
            // mirror about the slot's own vertical centerline
            parts.push(p.flip
                ? `<g transform="translate(${2 * px + slot} 0) scale(-1 1)">${img}</g>` : img);
        });

        parts.push(`<rect y="${H - BAR}" width="${W}" height="${BAR}" fill="${CYAN}"/>`);
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"`
            + ` font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${parts.join('')}</svg>`;
    }

    function render(){
        const svg = card();
        $('big').innerHTML = svg;
        $('small').innerHTML = svg;
        // Reported in site_card()'s own vocabulary, because that is where each
        // of these has to land. `portraits` is the only one that is literally
        // paste-able -- it is OG_SITE_QUARTET in src/lib/site.js, and a plain
        // name unless the portrait is mirrored, in which case the { name, flip }
        // form site_card() takes. `portrait_y`/`portrait_height` are the y and
        // height passed to inline_svg(), not the gap the slider above shows,
        // and the tagline is a string literal in site_card(). All three are
        // hand-edits into make-og.mjs.
        $('config').textContent = JSON.stringify({
            portraits: state.slots.map(p => p.flip ? { name: p.name, flip: true } : p.name),
            tagline: state.tagline,
            portrait_y: TAG_Y + state.gap,
            portrait_height: state.ph,
        }, null, 2);
    }

    function render_slots(){
        $('slots').innerHTML = state.slots.map((p, i) => `<span class="slot">
            <select data-i="${i}">${COMPOSERS.map(c =>
                `<option${c === p.name ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
            <button data-i="${i}" data-act="flip" title="mirror the portrait"
                ${p.flip ? 'class="on"' : ''}>&#8646;</button>
            <button data-i="${i}" data-act="left" title="move left" ${i === 0 ? 'disabled' : ''}>&#9664;</button>
            <button data-i="${i}" data-act="right" title="move right"
                ${i === state.slots.length - 1 ? 'disabled' : ''}>&#9654;</button>
            <button data-i="${i}" data-act="remove" title="remove"
                ${state.slots.length === 1 ? 'disabled' : ''}>&#10005;</button>
        </span>`).join('');
        $('add').disabled = state.slots.length >= 6;
    }

    function shuffle(pool){
        for (let i = pool.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    }

    $('slots').addEventListener('change', e => {
        state.slots[+e.target.dataset.i].name = e.target.value;
        render();
    });
    $('slots').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        const i = +b.dataset.i, s = state.slots;
        if (b.dataset.act === 'flip') s[i].flip = !s[i].flip;
        if (b.dataset.act === 'left') [s[i - 1], s[i]] = [s[i], s[i - 1]];
        if (b.dataset.act === 'right') [s[i], s[i + 1]] = [s[i + 1], s[i]];
        if (b.dataset.act === 'remove') s.splice(i, 1);
        render_slots(); render();
    });
    $('add').onclick = () => {
        const used = new Set(state.slots.map(p => p.name));
        const fresh = COMPOSERS.filter(c => !used.has(c));
        state.slots.push({ name: fresh[0] || COMPOSERS[0], flip: false });
        render_slots(); render();
    };
    $('spin').onclick = () => {
        const n = state.slots.length;
        state.slots = shuffle(COMPOSERS.slice()).slice(0, n).map(name => ({ name, flip: false }));
        render_slots(); render();
    };
    $('tagline').oninput = e => { state.tagline = e.target.value; render(); };
    $('presets').innerHTML = PRESETS.map((t, i) =>
        `<button data-i="${i}">${t ? esc(t) : '(none)'}</button>`).join('');
    $('presets').onclick = e => {
        const b = e.target.closest('button');
        if (!b) return;
        state.tagline = PRESETS[+b.dataset.i];
        $('tagline').value = state.tagline;
        render();
    };
    const slider = (id, key, suffix) => {
        $(id).value = state[key];
        $(id).nextElementSibling.textContent = state[key] + suffix;
        $(id).oninput = e => {
            state[key] = +e.target.value;
            e.target.nextElementSibling.textContent = e.target.value + suffix;
            render();
        };
    };
    slider('gap', 'gap', 'px');
    slider('ph', 'ph', 'px');
    $('zoom').oninput = e => {
        $('big').style.width = e.target.value + 'px';
        e.target.nextElementSibling.textContent = e.target.value + 'px';
    };

    $('tagline').value = state.tagline;
    render_slots();
    render();
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Share card playground</title>
<style>
  body { margin: 0; font: 15px/1.5 -apple-system, system-ui, sans-serif;
         background: #fbfbfa; color: #1a1a1a; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { body { background: #14141a; color: #e8e8ea; } }
  header, .controls, .previews, .out { padding: 1rem 1.5rem; }
  header { border-bottom: 1px solid #8884; }
  h1 { font-size: 1.1rem; margin: 0 0 .35rem; }
  p { margin: .35rem 0; max-width: 70ch; color: #666; }
  @media (prefers-color-scheme: dark) { p { color: #aaa; } }
  .controls { display: grid; gap: .75rem; border-bottom: 1px solid #8882; }
  .rowc { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
  .rowc > b { min-width: 5.5rem; font-weight: 600; }
  #tagline { flex: 1; min-width: 16rem; max-width: 34rem; font: inherit; padding: .25rem .5rem; }
  #presets button { max-width: 22rem; overflow: hidden; text-overflow: ellipsis;
                    white-space: nowrap; }
  .slot { display: inline-flex; gap: .15rem; align-items: center; padding: .2rem .35rem;
          border: 1px solid #8884; border-radius: .5rem; }
  select, button, input[type=text] { font: inherit; }
  button.on { background: #5dcbf5; color: #111; }
  label { display: flex; gap: .5rem; align-items: center;
          font-variant-numeric: tabular-nums; }
  .previews { display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; }
  figure { margin: 0; }
  figcaption { font-size: .78rem; color: #888; margin-top: .3rem; }
  /* the card is opaque, but a hairline shows its true edge on any background */
  #big, #small { display: block; line-height: 0; box-shadow: 0 0 0 1px #8886; }
  #big { width: 800px; max-width: 100%; }
  #small { width: 320px; border-radius: 12px; overflow: hidden; }
  #big svg, #small svg { width: 100%; height: auto; display: block; }
  .out pre { background: #8881; padding: .75rem 1rem; border-radius: .5rem;
             overflow-x: auto; }
</style></head>
<body>
<header>
  <h1>Share card playground</h1>
  <p>Try-out bench for <code>static/og/og.png</code> (issue #39). Pick the portraits, reorder them,
     mirror any that should face the other way, and try taglines. The layout mirrors
     <code>site_card()</code> in <code>scripts/make-og.mjs</code>; portraits load live from
     <code>static/</code>, so this page only works from the repo root. Nothing here writes a card
     &mdash; when a variant wins, paste the config block below into the issue and
     <code>make-og.mjs</code> gets updated to match.</p>
</header>
<div class="controls">
  <div class="rowc"><b>tagline</b><input id="tagline" type="text"></div>
  <div class="rowc"><b></b><span id="presets" class="rowc"></span></div>
  <div class="rowc"><b>portraits</b><span id="slots" class="rowc"></span>
    <button id="add">+ add</button>
    <button id="spin" title="random draw, same count">&#127922; spin</button></div>
  <div class="rowc"><b>layout</b>
    <label>tagline&rarr;portraits gap <input id="gap" type="range" min="0" max="140" step="2"><span></span></label>
    <label>portrait height <input id="ph" type="range" min="220" max="400" step="5"><span></span></label>
    <label>preview size <input id="zoom" type="range" min="320" max="1200" value="800" step="20"><span>800px</span></label>
  </div>
</div>
<div class="previews">
  <figure><div id="big"></div><figcaption>1200&times;630, scaled</figcaption></figure>
  <figure><div id="small"></div><figcaption>&asymp; chat-bubble size</figcaption></figure>
</div>
<div class="out">
  <b>config</b> &mdash; the numbers to lock a variant in. <code>portraits</code> is
  <code>OG_SITE_QUARTET</code> in <code>src/lib/site.js</code> verbatim; the rest name where they
  land in <code>site_card()</code> and are hand-edits.
  <pre id="config"></pre>
</div>
<script>(${client.toString()})(${JSON.stringify(composers)}, ${JSON.stringify(icon)});</script>
</body></html>`;

await writeFile(out, html);
console.log(`wrote ${path.relative(root, out)} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, ${composers.length} composers)`);
console.log('open it from the repo root; portraits read static/ live.');
