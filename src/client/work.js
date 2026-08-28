// What a click on a play control does (pwa.md Phase 7).
//
// The page arrives with a play control per recording and no Spotify iframe
// anywhere -- see the player() comment in src/templates/work.js for why. This
// script does nothing at load: no DOM rewriting, no class swapping, no frames
// created or destroyed. It attaches one listener and waits.
//
// On a touch device the control stays exactly what the markup says it is: a
// link to the track, which opens the Spotify app. That was already the
// behaviour, and it is better than an 80px embed on a phone.
//
// On anything else, a plain left click swaps the control for the real embed,
// in place, and widens the Recording column to fit it. That costs a second
// click to actually start playback -- the embed cannot autoplay from a gesture
// outside its own frame -- which is the price of not loading seven
// third-party frames on a page most people open to read.
//
// TABLE_PLAYING and PLAY_ICON are injected by scripts/build.mjs (esbuild
// define) with the hashed CSS-module class names; PLAY_EVENT with the
// GoatCounter event name from src/lib/site.js.
(function () {
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // pwa.md Phase 4: count a click through to a recording as an event.
    //
    // Guarded on purpose. count.js is on every adblock list there is, and it is
    // loaded async, so window.goatcounter is undefined when it is blocked, when
    // the network is gone, and for the first moments of any page load. In all
    // three cases this does nothing and the click still works -- the site
    // never depends on analytics being there.
    //
    // This used to fire only on touch devices, because touch was the only
    // place a recording was a link rather than an iframe, and a play inside a
    // cross-origin frame is not observable from here at all. Now that every
    // device has to ask for the player, the ask is observable everywhere, and
    // the event counts it everywhere. So the numbers step up when this ships:
    // it is wider coverage, not more listening. What it counts is unchanged --
    // a constant event name, no movement title, no work slug, nothing that
    // could identify anybody.
    //
    // GoatCounter sends its beacon as an <img>, which the browser may cancel
    // when the click navigates away; a click that opens the Spotify app is the
    // likeliest to be lost. So this floor-counts real interest rather than
    // measuring it exactly, which is the right trade against holding up a tap.
    function count_play(){
        var gc = window.goatcounter;
        if (!gc || typeof gc.count !== 'function') return;
        try {
            // "opened on Spotify" was accurate when a play was only ever a
            // link out; on desktop the same click now opens a player in
            // place, so the label describes the click instead of the
            // destination. The path is what GoatCounter groups by and it is
            // unchanged, so the existing series continues.
            gc.count({ path: PLAY_EVENT, title: 'Play requested for a recording', event: true });
        } catch (e) {
            // count() is not as safe as the guard above implies: it calls
            // goatcounter.filter(), whose last check reads localStorage without
            // catching anything, and merely *touching* localStorage throws a
            // SecurityError in a browser set to block all site data. That would
            // put an uncaught error in the console on every single click. The
            // click itself would still work -- a throwing listener does not
            // cancel the navigation -- but "the site never depends on
            // analytics" has to mean the console too.
        }
    }

    function embed(link){
        var frame = document.createElement('iframe');
        frame.src = link.getAttribute('data-embed');
        // the control's accessible name is "Play <movement>"; the frame that
        // replaces it is the movement's player, so it keeps the movement name
        frame.title = (link.getAttribute('aria-label') || '').replace(/^Play /, '');
        frame.width = '100%';
        frame.height = '80';
        frame.frameBorder = '0';
        frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        frame.allowFullscreen = true;

        // widen the Recording column, once, the first time a player appears --
        // at rest it is sized for a 24px glyph, which an 80px player would
        // spill out of. The list and single-player layouts have no table.
        var table = link.closest('table');
        if (table) table.className = TABLE_PLAYING;

        link.parentNode.replaceChild(frame, link);
        // the click that summoned it was on the link, so focus went nowhere a
        // keyboard user can find; the frame is the thing they asked for
        frame.focus();
    }

    // One listener on the document rather than one per control: a work page
    // has up to seven, and this way nothing is bound on a page where nobody
    // ever plays anything.
    document.addEventListener('click', function (e){
        var link = e.target.closest ? e.target.closest('.' + PLAY_ICON) : null;
        if (!link) return;

        count_play();

        // Let the browser do what the markup says for touch (open the app),
        // and for every click that means "somewhere else, please": a new tab,
        // a new window, a download, a middle click. Only a plain left click
        // is ours to take over.
        if (touch) return;
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        e.preventDefault();
        embed(link);
    }, false);

    // auxclick as well as click: a middle-click opens the recording in a new
    // tab, which is a play, and it is the one case where the beacon reliably
    // survives. But auxclick fires for *every* non-primary button, the right
    // one included -- so without the button check, right-clicking a play link
    // to copy its address and then dismissing the menu counts as a play.
    document.addEventListener('auxclick', function (e){
        if (e.button !== 1) return;
        var link = e.target.closest ? e.target.closest('.' + PLAY_ICON) : null;
        if (link) count_play();
    }, false);
})();
