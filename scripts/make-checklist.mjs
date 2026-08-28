#!/usr/bin/env node
// Builds pwa-checklist.html: the human-facing companion to pwa.md, reduced to
// the items that need Jason's hands or eyes -- a device, a decision, or a
// judgement call -- with the share cards and icons embedded for review.
//
//     npm run checklist
//
// Then republish it as the artifact, passing the EXISTING url so it updates in
// place instead of spawning a second copy:
//
//     https://claude.ai/code/artifact/39f766d2-e56f-414a-95d5-1747dfb3ece2
//
// pwa.md stays the source of truth for the plan; this file is the source of
// truth for the page. When a phase lands, edit the PHASES data below, rerun,
// republish. The output is gitignored -- it is 1 MB of base64 and is
// regenerated in seconds.
//
// Deliberately depends on nothing but Node: every image is read straight out of
// static/ at full size and embedded, and the visual treatments that used to be
// baked into separate files (the circle and squircle launcher crops, the black
// iOS tile) are done in CSS instead. That means the proofs cannot drift from
// the real assets -- rerunning always shows what actually ships.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'pwa-checklist.html');

const ARTIFACT = 'https://claude.ai/code/artifact/39f766d2-e56f-414a-95d5-1747dfb3ece2';
const REPO = 'https://github.com/jsundram/quartet-chooser';

const uri = rel =>
    `data:image/png;base64,${readFileSync(path.join(root, rel)).toString('base64')}`;

const cap = s => s[0].toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- content

// Each task is [id, label, note?]. `done` marks one already closed, with the
// evidence in its note. Ids are localStorage keys -- changing one resets that
// box for anyone who had ticked it, so append rather than renumber.
const PHASES = [
    {
        n: 'Phase 1', title: 'Share &amp; link previews', chip: 'shipped', status: 'Merged &middot; live',
        blurb: `Shipped in <span class="path">cfc3777</span>&ndash;<span class="path">5b7b708</span>,
                live on production now. One check left, and it is the only real one.`,
        tasks: [
            { done: true, label: 'Run opengraph.xyz against a deployed URL',
              note: `Done 2026-08-26. Its &ldquo;og:image Failed to fetch&rdquo; finding was a
                     deploy-preview artifact, not a bug &mdash; og:image is absolute, so a scraper
                     always fetches production. Worth one re-run against
                     <span class="path">quartetroulette.com</span> now that the cards are live.` },
            { id: 'p1-imessage',
              label: '<b>Paste three URLs into a real iMessage thread</b> &mdash; the only ground truth',
              note: `Previews are cached per URL, so a stale bare link is not a failure. If one looks
                     wrong, try a quartet you have never shared before.`,
              children: [
                { id: 'p1-home', label: 'Home &mdash; <a href="https://quartetroulette.com/">quartetroulette.com</a>' },
                { id: 'p1-composer', label: 'A composer &mdash; <a href="https://quartetroulette.com/haydn/">/haydn/</a>' },
                { id: 'p1-work', label: 'A work &mdash; <a href="https://quartetroulette.com/haydn-opus-76-3/">/haydn-opus-76-3/</a>' },
              ] },
        ],
        after: () => sharecards(),
    },
    {
        n: 'Phase 2', title: 'Manifest &amp; install', chip: 'shipped', status: 'Merged &middot; live',
        blurb: `Merged in <span class="path">4e0f14e</span>&ndash;<span class="path">194008d</span> and
                live on production. Everything left is on a device.`,
        tasks: [
            { id: 'p2-blacktile', label: '<b>Look at your existing homescreen shortcut before you replace it</b>',
              note: `I expect a black tile behind the wheel &mdash; every icon in
                     <span class="path">static/icons/</span> was fully transparent, and iOS composites
                     an apple-touch-icon&rsquo;s alpha against black. Worth seeing once, because it means
                     the shortcut has looked wrong for a while. <b>iOS caches that icon at the moment you
                     add it</b>, so the shipped fix will not reach your existing shortcut on its own:
                     delete it and add it again.` },
            { id: 'p2-ios', label: '<b>Delete the old shortcut, then Add to Home Screen again</b> from production',
              children: [
                { id: 'p2-ios-name', label: 'Label reads <b>Quartet Roulette</b> &mdash; not truncated, not the Android short name' },
                { id: 'p2-ios-tile', label: 'Wheel sits on off-white <span class="path">#f7f7f3</span> &mdash; <b>not black</b>' },
                { id: 'p2-ios-standalone', label: 'Opens standalone, with no Safari chrome' },
              ] },
            { id: 'p2-chrome', label: '<b>Install on desktop Chrome</b>' },
            { id: 'p2-devtools',
              label: 'DevTools &rarr; Application &rarr; Manifest: <b>no warnings</b>, and the maskable icon renders in the purpose preview',
              note: `This is the acceptance criterion I genuinely cannot check from a terminal &mdash;
                     it needs a browser.` },
        ],
        after: () => icons(),
    },
    {
        n: 'Phase 3', title: 'Mobile polish &amp; accessibility floor', chip: 'shipped', status: 'Merged &middot; live',
        blurb: `Merged 2026-08-28 (<span class="path">8cd7315</span>&ndash;<span class="path">800f7dc</span>)
                and live on production. The head and CSS half was small; the sweep found three real
                defects. Everything left needs a device, a keyboard, or your opinion.`,
        tasks: [
            { id: 'p3-voiceover', label: '<b>VoiceOver skim of one work page</b>',
              note: `<a href="https://quartetroulette.com/haydn-opus-76-3/">/haydn-opus-76-3/</a>.
                     Three things changed and are worth listening for: the rotor should now offer
                     <b>banner &rarr; navigation &rarr; main</b> as separate landmarks (everything
                     used to be one <span class="path">&lt;main&gt;</span>), the heading should be
                     the work&rsquo;s own title, and on a touch device each play link should name
                     <b>its own movement</b> rather than saying &ldquo;play&rdquo; twenty times.` },
            { id: 'p3-keyboard', label: '<b>Keyboard-only navigation of the home page</b>',
              note: `Tab through the wordmark, the four nav links and the 18 composer tiles. Nothing
                     ever removed the browser&rsquo;s focus ring, so every stop should show one &mdash;
                     this is checking that claim, not a fix.` },
            { id: 'p3-landscape', label: 'On a notched phone, <b>in landscape</b> and installed: nothing under the notch or the home indicator',
              note: `<span class="path">viewport-fit=cover</span> now lets the page paint into that
                     area and <span class="path">env(safe-area-inset-*)</span> pads it back out.
                     Landscape is where a mistake shows, because the notch eats a whole edge.` },
            { id: 'p3-dates', label: 'Opinion wanted: the composer-page <b>dates</b> are links, and on a phone nothing says so',
              note: `They go to daily-composers, and the only thing that ever explained that was a
                     hover tooltip &mdash; which does not exist on touch. A screen reader now hears
                     it. A visible hint under every composer&rsquo;s dates would fix it for everyone,
                     but that is a design change, so I left it. Tap one on a phone and see whether it
                     feels like a trap.` },
        ],
        more: {
            summary: 'What landed',
            tasks: [
                { done: true, label: '<span class="path">viewport-fit=cover</span> on the viewport meta' },
                { done: true, label: '<span class="path">env(safe-area-inset-*)</span> padding for notch and home indicator',
                  note: `All four sides. Also removed three <span class="path">padding: 96</span> /
                         <span class="path">padding: 5</span> declarations from the same rule: unitless,
                         so invalid, so no browser ever applied them &mdash; but a later &ldquo;fix&rdquo;
                         to <span class="path">96px</span> would have quietly clobbered the insets.` },
                { done: true, label: '<span class="path">meta[name=color-scheme]</span>, value <span class="path">light</span> until Phase 6 lands' },
                { done: true, label: '<span class="path">prefers-reduced-motion</span> neutralising non-essential transitions',
                  note: `Nothing on the site transitions or animates today, so this is a guard for
                         whoever adds the first one rather than a fix.` },
                { done: true, label: 'A11y sweep: real buttons and links, <span class="path">aria-label</span> on the icon-only shuffle, visible focus, image alt text, one h1 per page',
                  note: `Three real finds: the wordmark, nav and page all lived in one
                         <span class="path">&lt;main&gt;</span>; the home page had no
                         <span class="path">&lt;h1&gt;</span> at all and About opened at
                         <span class="path">&lt;h2&gt;</span>; and a home-page tile announced itself
                         as &ldquo;Haydn Haydn&rdquo;, because the portrait and the signature carried
                         the same alt text.` },
                { done: true, label: 'Check for hover-only UI and add tap fallbacks',
                  note: `Only the composer-page dates carried anything a touch user could not get
                         another way &mdash; that is the open question above.` },
            ],
        },
    },
    {
        n: 'Phase 4', title: 'Analytics &mdash; GoatCounter', chip: 'shipped', status: 'Merged &middot; live',
        blurb: `Merged 2026-08-28 (<span class="path">452c7fa</span>, with two of your review&rsquo;s three
                fixes in <span class="path">bd34cac</span> and the third reverted at your word,
                <span class="path">d424376</span>) and live on production &mdash;
                <b>quartetroulette.com is counting right now</b>. Cookie-free, so no consent banner,
                and no page waits on it: the tag is <span class="path">async</span> and the last
                thing in the body. One check left, and you can do it today.`,
        tasks: [
            { done: true, label: 'Create the site at goatcounter.com',
              note: `Done &mdash;
                     <a href="https://quartet-roulette.goatcounter.com/">quartet<b>-</b>roulette.goatcounter.com</a>.
                     Note the hyphen: <span class="path">pwa.md</span> had guessed
                     <span class="path">quartetroulette</span>, and that mistake would have been
                     invisible &mdash; a page with the wrong endpoint looks exactly like a page with
                     the right one, and the hits just go nowhere. The test now pins the real URL.` },
            { id: 'p4-verify', label: '<b>Load <a href="https://quartetroulette.com/">quartetroulette.com</a> with an adblocker on, then off</b>',
              note: `Live now, so this is doable today. Two different questions, and the first one
                     matters more &mdash; the site must be exactly as good when count.js is blocked,
                     which it is for a large share of visitors.
                     <span class="path">npm run serve</span> cannot answer either, because count.js
                     ignores localhost by design.`,
              children: [
                { id: 'p4-blocked', label: 'Adblocker <b>on</b>: the site works normally, nothing broken in the console' },
                { id: 'p4-counted', label: 'Adblocker <b>off</b>: the visit shows up in the <a href="https://quartet-roulette.goatcounter.com/">dashboard</a>' },
                { id: 'p4-event', label: 'On a <b>phone</b>: tap a play link on a work page, then look for <span class="path">play-recording</span> under Events',
                  note: `Only touch devices can produce this one. On desktop the recording is a Spotify
                         iframe, and a play inside it is invisible to the page &mdash; nothing to count.` },
              ] },
        ],
        more: {
            summary: 'What landed, and two things worth knowing',
            tasks: [
                { done: true, label: 'The async <span class="path">count.js</span> tag, last in the body of all 277 pages',
                  note: `The two <span class="path">/random*</span> redirect shells deliberately get
                         none: they replace themselves in the same tick, and the page they land on
                         counts the visit a moment later anyway.` },
                { done: true, label: '<span class="path">play-recording</span> event on the mobile tap-to-play links' },
                { done: true, label: 'TODO.md&rsquo;s analytics bullet now points at the phase' },
                { done: true, label: '<b>Deploy previews count too</b> &mdash; decided, not overlooked',
                  note: `Your call: you test against production anyway, and there should be enough
                         real traffic to dilute it. It also keeps the check above doable on the PR&rsquo;s
                         preview URL rather than only after a merge. A
                         <span class="path">CONTEXT</span> gate was written and reverted, and a test
                         now asserts the build output is identical on every host, so nobody re-adds
                         one quietly. <span class="path">#toggle-goatcounter</span> on any page opts
                         one browser out for good, if a stretch of testing ever does get noisy.` },
                { done: true, label: '<b>A counted play is a floor, not a count</b>',
                  note: `GoatCounter&rsquo;s beacon is an <span class="path">&lt;img&gt;</span>, and a
                         browser may cancel it when the click navigates away &mdash; most likely when
                         the tap opens the Spotify app. Waiting for the beacon would mean delaying the
                         tap, which is a worse trade.` },
            ],
        },
    },
    {
        n: 'Phase 5', title: 'Offline &amp; service worker', chip: 'waiting-c', status: 'Decision gate',
        blurb: `I will not start this without an explicit yes. If the answer is no, that gets recorded
                in <span class="path">pwa.md</span> with the date and the phase closes &mdash; which is
                a perfectly good outcome.`,
        tasks: [
            { id: 'p5-decide', label: '<b>Say yes or no</b>',
              note: `For: the works and movements data is all static, ~280 routes, and genuinely useful
                     offline; an iOS install with no service worker opens to a blank error with no
                     network. Against: the core content is Spotify embeds and outbound links, useless
                     offline anyway, and Chrome no longer requires a service worker for installability.` },
        ],
    },
    {
        n: 'Phase 6', title: 'Dark mode', chip: 'waiting-c', status: 'Decision gate',
        blurb: `Explicitly optional, and real design work &mdash; the theme colours are extracted from
                the portrait SVGs, so it is not a token swap.`,
        tasks: [
            { id: 'p6-decide', label: '<b>Say yes or no</b>',
              note: `If yes: <span class="path">prefers-color-scheme</span> overrides, a
                     <span class="path">.dark</span> class mirror for testing, AA contrast in both
                     modes, a second theme-color meta, and color-scheme flipped to
                     <span class="path">light dark</span>.` },
        ],
    },
    {
        n: 'Filed', title: 'Open issues from Phase 1', chip: 'idle', status: 'Backlog',
        blurb: `Both were provisional calls made to unblock Phase 1. They share a prerequisite:
                work-page cards and any new type on the site card both need a vendored, embedded font,
                because everything today is pure path data with no font dependency at all.`,
        tasks: [
            { id: 'i39', label: `<a href="${REPO}/issues/39">#39</a> &mdash; revisit the site-wide card&rsquo;s design`,
              note: `Hard-coded portrait choice, crops that do not agree, an invented tagline, and type
                     set in a system font stack that silently changes on a machine without it.` },
            { id: 'i40', label: `<a href="${REPO}/issues/40">#40</a> &mdash; give every work page its own card`,
              note: `Composer pages already have their own. The 256 work pages reuse them. Costs roughly
                     +11&nbsp;MB committed unless the cards get lighter or move to on-demand generation.` },
        ],
    },
];

const BLOCKING = [
    { tag: 'Decide', body: `<b>Phase 5 &mdash; service worker: yes or no?</b> The honest case against is
        in <span class="path">pwa.md</span>: the core content is Spotify embeds and outbound links,
        which are useless offline anyway. The case for is that an iOS home-screen install with no
        service worker opens to a blank error on a plane.` },
    { tag: 'Decide', body: `<b>Phase 6 &mdash; dark mode: yes or no?</b> Real design work, because the
        theme colours come out of the portrait SVGs. Explicitly optional.` },
];

// ---------------------------------------------------------------- rendering

function task(t) {
    const input = t.done
        ? '<input type="checkbox" checked disabled/>'
        : `<input type="checkbox" id="${t.id}"/>`;
    return `<li class="task">`
        + `<label>${input}<span class="box" aria-hidden="true"></span>`
        + `<span class="label">${t.label}</span></label>`
        + (t.note ? `<p class="note">${t.note}</p>` : '')
        + (t.children ? `<ul class="tasks nested">${t.children.map(task).join('')}</ul>` : '')
        + '</li>';
}

const tasklist = (ts, cls = '') => `<ul class="tasks ${cls}">${ts.map(task).join('')}</ul>`;

// Every composer card in static/og/, discovered rather than listed, so a new
// composer shows up here the moment `npm run og` makes its card.
function sharecards() {
    const cards = readdirSync(path.join(root, 'static', 'og'))
        .filter(f => f.startsWith('og-') && f.endsWith('.png'))
        .sort();
    const tiles = cards.map(f => {
        const name = cap(f.replace('og-', '').replace('.png', ''));
        return `<figure class="card"><img src="${uri('static/og/' + f)}" loading="lazy"`
            + ` alt="Share card for ${name}"/><figcaption>${name}</figcaption></figure>`;
    }).join('');

    return `<div class="proof">
  <h3>The card behind home, about and 404</h3>
  <figure class="hero-card card">
    <img src="${uri('static/og/og.png')}" alt="Site-wide share card: roulette icon, wordmark, tagline, four portraits"/>
    <figcaption>Its design is deliberately provisional &mdash; that is
      <a href="${REPO}/issues/39">issue #39</a>. Worth an opinion while you are looking: the four
      portraits are hard-coded and arbitrary, the crops do not quite agree, and the tagline is my
      paraphrase of your about page.</figcaption>
  </figure>
  <details class="more">
    <summary>All ${cards.length} composer cards</summary>
    <div class="gallery">${tiles}</div>
    <p class="note flush">Every work page reuses its composer&rsquo;s card &mdash;
      <a href="${REPO}/issues/40">issue #40</a> is about giving each of the 256 its own.</p>
  </details>
</div>`;
}

// The launcher crops and the black iOS tile are CSS, not baked images: the
// browser clips the real shipped PNG, so these proofs cannot go stale.
function icons() {
    return `<div class="proof">
  <h3>What your homescreen tile should change from &rarr; to</h3>
  <div class="tiles">
    <figure><div class="tile on-black"><img src="${uri('static/icon.png')}" alt="Transparent icon on a black tile"/></div>
      <figcaption><b>Before</b> &mdash; transparent icon, which iOS fills with black</figcaption></figure>
    <figure><div class="tile"><img src="${uri('static/icons/icon-180x180.png')}" alt="Flattened icon on an off-white tile"/></div>
      <figcaption><b>After</b> &mdash; flattened onto the site&rsquo;s own off-white</figcaption></figure>
  </div>
</div>

<div class="proof">
  <h3>Maskable icon, under the crops Android actually applies</h3>
  <div class="tiles">
    <figure><div class="crop checker"><img src="${uri('static/icons/icon-512x512-maskable.png')}" alt="Maskable icon, uncropped"/></div>
      <figcaption>Full 512, art inset to the 80% safe zone</figcaption></figure>
    <figure><div class="crop checker circle"><img src="${uri('static/icons/icon-512x512-maskable.png')}" alt="Maskable icon cropped to a circle"/></div>
      <figcaption>Circle crop &mdash; <b>rim survives</b></figcaption></figure>
    <figure><div class="crop checker squircle"><img src="${uri('static/icons/icon-512x512-maskable.png')}" alt="Maskable icon cropped to a squircle"/></div>
      <figcaption>Squircle crop &mdash; <b>rim survives</b></figcaption></figure>
    <figure><div class="crop checker circle"><img src="${uri('static/icon.png')}" alt="Old icon cropped to a circle, rim clipped"/></div>
      <figcaption>Old icon, same circle crop &mdash; <b>rim and ball marker clipped</b></figcaption></figure>
  </div>
</div>`;
}

const sections = PHASES.map(p => `<section class="phase">
  <div class="phase-head">
    <span class="num">${p.n}</span>
    <h2>${p.title}</h2>
    <span class="chip ${p.chip}">${p.status}</span>
  </div>
  <p class="blurb">${p.blurb}</p>
  ${tasklist(p.tasks)}
  ${p.more ? `<details class="more"><summary>${p.more.summary}</summary>${tasklist(p.more.tasks, 'inset')}</details>` : ''}
  ${p.after ? p.after() : ''}
</section>`).join('\n');

const blocking = BLOCKING.map(b =>
    `<li><span class="tag${b.muted ? ' is-blocked' : ''}">${b.tag}</span><span>${b.body}</span></li>`).join('');

const html = `<title>Quartet Roulette PWA</title>
<style>
:root {
  /* Marusya's palette, pulled from the portrait SVGs -- the same values
     src/components/layout.module.css documents. The green is the fifth colour
     that file's own comment nominated. */
  --ink:       #111011;
  --ink-soft:  #56534f;
  --ink-faint: #8a8681;
  --ground:    #f7f7f3;
  --surface:   #ffffff;
  --line:      #e2e0d9;
  --line-soft: #eceae4;
  --cyan:      #2596c9;
  --red:       #b82327;
  --green:     #4e8f5c;
  --shadow:    0 1px 2px rgba(17,16,17,.05), 0 8px 24px rgba(17,16,17,.06);

  --serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ink:       #f2f1ed;
    --ink-soft:  #a8a49d;
    --ink-faint: #77736c;
    --ground:    #141314;
    --surface:   #1d1c1e;
    --line:      #302e31;
    --line-soft: #262427;
    --cyan:      #5dcbf5;
    --red:       #e2585c;
    --green:     #7fc48a;
    --shadow:    0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25);
  }
}
:root[data-theme="dark"] {
  --ink:       #f2f1ed;
  --ink-soft:  #a8a49d;
  --ink-faint: #77736c;
  --ground:    #141314;
  --surface:   #1d1c1e;
  --line:      #302e31;
  --line-soft: #262427;
  --cyan:      #5dcbf5;
  --red:       #e2585c;
  --green:     #7fc48a;
  --shadow:    0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25);
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0; background: var(--ground); color: var(--ink);
  font-family: var(--sans); font-size: 16px; line-height: 1.6;
  -webkit-text-size-adjust: 100%;
}
.wrap { max-width: 61rem; margin: 0 auto; padding: 3.5rem 1.5rem 6rem; }

.mast { border-bottom: 2px solid var(--ink); padding-bottom: 1.25rem; margin-bottom: 2.5rem; }
.kicker {
  font-family: var(--mono); font-size: .72rem; letter-spacing: .14em;
  text-transform: uppercase; color: var(--ink-faint); margin: 0 0 .6rem;
}
h1 {
  font-family: var(--serif); font-weight: 600; font-size: clamp(2rem, 5vw, 2.9rem);
  line-height: 1.1; margin: 0 0 .5rem; letter-spacing: -.01em;
}
h1, h2, h3 { text-wrap: balance; }
.dek { margin: 0; color: var(--ink-soft); max-width: 42rem; }

.waiting {
  border: 1px solid var(--line); border-left: 3px solid var(--red);
  background: var(--surface); border-radius: 3px; padding: 1.5rem 1.75rem;
  margin: 0 0 3rem; box-shadow: var(--shadow);
}
.waiting h2 { font-size: .78rem; margin: 0 0 1rem; color: var(--red); }
.waiting ul { margin: 0; padding: 0; list-style: none; display: grid; gap: .9rem; }
.waiting li { display: grid; grid-template-columns: auto 1fr; gap: .75rem; align-items: baseline; }
.tag {
  font-family: var(--mono); font-size: .68rem; letter-spacing: .06em; text-transform: uppercase;
  color: var(--red); border: 1px solid currentColor; border-radius: 2px;
  padding: .1rem .4rem; white-space: nowrap;
}
.tag.is-blocked { color: var(--ink-soft); }

.phase { margin: 0 0 3.25rem; }
.phase-head {
  display: flex; align-items: baseline; gap: .85rem; flex-wrap: wrap;
  border-bottom: 1px solid var(--line); padding-bottom: .6rem; margin-bottom: 1.25rem;
}
.num { font-family: var(--mono); font-size: .8rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; }
.phase h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: 600; margin: 0; letter-spacing: -.005em; }
.chip {
  font-family: var(--mono); font-size: .66rem; letter-spacing: .08em; text-transform: uppercase;
  padding: .18rem .5rem; border-radius: 2px; border: 1px solid currentColor; white-space: nowrap;
}
.chip.shipped { color: var(--green); }
.chip.review { color: var(--cyan); }
.chip.waiting-c { color: var(--red); }
.chip.idle { color: var(--ink-faint); }
.blurb { color: var(--ink-soft); margin: 0 0 1.1rem; max-width: 40rem; }

ul.tasks { list-style: none; margin: 0 0 1.25rem; padding: 0; display: grid; gap: .55rem; }
ul.nested, ul.inset {
  margin: .55rem 0 .25rem 1.6rem; padding-left: .9rem;
  border-left: 1px solid var(--line-soft);
}
ul.inset { margin-top: 1rem; }
.task > label { display: grid; grid-template-columns: auto 1fr; gap: .65rem; align-items: start; cursor: pointer; }
.task input { position: absolute; opacity: 0; width: 0; height: 0; }
.box {
  width: 1.05rem; height: 1.05rem; margin-top: .28rem; border: 1.5px solid var(--ink-faint);
  border-radius: 3px; display: block; position: relative;
  transition: border-color .12s, background .12s;
}
.task input:checked + .box { background: var(--green); border-color: var(--green); }
.task input:checked + .box::after {
  content: ""; position: absolute; left: .3rem; top: .1rem; width: .3rem; height: .58rem;
  border: solid var(--surface); border-width: 0 2px 2px 0; transform: rotate(42deg);
}
.task input:focus-visible + .box { outline: 2px solid var(--cyan); outline-offset: 2px; }
.task input:checked ~ .label { color: var(--ink-faint); text-decoration: line-through; text-decoration-thickness: 1px; }
.task input:disabled ~ .label { cursor: default; }
.task > label:hover .box { border-color: var(--cyan); }
.label { min-width: 0; }
.note {
  margin: .3rem 0 0 1.7rem; font-size: .87rem; color: var(--ink-soft);
  border-left: 2px solid var(--line); padding-left: .7rem; max-width: 38rem;
}
.note.flush { margin-left: 0; }

code, .path {
  font-family: var(--mono); font-size: .86em; background: var(--line-soft);
  padding: .1em .35em; border-radius: 2px; word-break: break-word;
}
a { color: var(--cyan); text-underline-offset: 2px; }
a:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; border-radius: 2px; }

.proof { margin: 1.5rem 0 1.75rem; }
.proof h3 {
  font-family: var(--mono); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink-faint); margin: 0 0 .9rem; font-weight: 400;
}
.tiles { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
figure { margin: 0; }
.tiles figure { width: 8.5rem; }
figcaption { font-size: .78rem; color: var(--ink-soft); margin-top: .5rem; line-height: 1.4; }
figcaption b { color: var(--ink); font-weight: 600; }

/* the launcher masks: real PNGs, clipped by CSS, so they cannot go stale */
.tile, .crop { width: 100%; aspect-ratio: 1; overflow: hidden; }
.tile img, .crop img { width: 100%; height: 100%; display: block; }
.tile { border-radius: 22%; box-shadow: var(--shadow); background: var(--ground); }
.tile.on-black { background: #000000; }
.crop { border-radius: 3px; }
.crop.circle { border-radius: 50%; }
.crop.squircle { border-radius: 23%; }
.checker {
  background-image:
    linear-gradient(45deg, var(--line) 25%, transparent 25%, transparent 75%, var(--line) 75%),
    linear-gradient(45deg, var(--line) 25%, transparent 25%, transparent 75%, var(--line) 75%);
  background-size: 14px 14px; background-position: 0 0, 7px 7px;
}

.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1.1rem; margin: 1.25rem 0 0; }
.card img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 3px; }
.card figcaption { font-size: .8rem; }
.hero-card { max-width: 34rem; margin-bottom: 1.5rem; }

details.more { border-top: 1px solid var(--line); margin-top: 1.5rem; padding-top: 1rem; }
details.more summary {
  cursor: pointer; font-family: var(--mono); font-size: .74rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-soft);
}
details.more summary:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }

.foot {
  border-top: 1px solid var(--line); margin-top: 3.5rem; padding-top: 1.25rem;
  font-size: .84rem; color: var(--ink-faint);
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}
.reset {
  font-family: var(--mono); font-size: .74rem; background: none; border: 1px solid var(--line);
  color: var(--ink-soft); padding: .3rem .6rem; border-radius: 2px; cursor: pointer;
}
.reset:hover { border-color: var(--red); color: var(--red); }
.reset:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>

<div class="wrap">

<header class="mast">
  <p class="kicker">quartetroulette.com &middot; pwa workstream</p>
  <h1>What&rsquo;s left for you to do</h1>
  <p class="dek">Every phase in <span class="path">pwa.md</span>, reduced to the things that need
  <em>your</em> hands or eyes &mdash; a device, a decision, or a judgement call I cannot make from a
  terminal. Boxes remember themselves in this browser.</p>
</header>

<section class="waiting">
  <h2 class="kicker">Blocking &mdash; nothing moves until you answer</h2>
  <ul>${blocking}</ul>
</section>

${sections}

<footer class="foot">
  <span>Generated from <span class="path">scripts/make-checklist.mjs</span> &middot;
    rerun with <span class="path">npm run checklist</span></span>
  <button class="reset" type="button" id="reset">Clear all checkboxes</button>
</footer>

</div>

<script>
(function () {
  var KEY = 'qr-pwa-checklist';
  var boxes = [].slice.call(document.querySelectorAll('.task input[type=checkbox]:not(:disabled)'));
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }

  function load() {
    if (!store) return {};
    try { return JSON.parse(store.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function save(state) {
    if (!store) return;
    try { store.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();
  boxes.forEach(function (b) {
    if (state[b.id]) b.checked = true;
    b.addEventListener('change', function () { state[b.id] = b.checked; save(state); });
  });
  document.getElementById('reset').addEventListener('click', function () {
    boxes.forEach(function (b) { b.checked = false; });
    state = {};
    save(state);
  });
})();
</script>
`;

writeFileSync(out, html);
console.log(`wrote pwa-checklist.html (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`republish it in place at:\n  ${ARTIFACT}`);
