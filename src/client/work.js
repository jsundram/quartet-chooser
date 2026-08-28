// On touch devices, swap each Spotify embed for a tap-to-play link and
// switch the movement table to its mobile layout. This replaces what
// React hydration used to do via Utils.is_mobile() in work.js — with one
// deliberate change: is_mobile read navigator.maxtouchpoints (wrong case,
// always undefined), so only 'ontouchstart' ever fired. We use the real
// maxTouchPoints, so touch-capable desktops without ontouchstart now get
// play links instead of embeds.
// TABLE_MOBILE and PLAY_ICON are injected by scripts/build.mjs (esbuild
// define) with the hashed CSS-module class names; PLAY_EVENT with the
// GoatCounter event name from src/lib/site.js.
(function () {
    var mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!mobile) return;

    // pwa.md Phase 4: count a click through to Spotify as an event.
    //
    // Guarded on purpose. count.js is on every adblock list there is, and it is
    // loaded async, so window.goatcounter is undefined when it is blocked, when
    // the network is gone, and for the first moments of any page load. In all
    // three cases this does nothing and the link still navigates -- the site
    // never depends on analytics being there.
    //
    // Only touch devices reach this code, so this counts only the surface where
    // a recording IS a link. On desktop the recording is a cross-origin Spotify
    // iframe, and a play inside it is not observable from here at all.
    //
    // GoatCounter sends its beacon as an <img>, which the browser may cancel
    // when the click navigates away; a click that opens the Spotify app is the
    // likeliest to be lost. So this floor-counts real interest rather than
    // measuring it exactly, which is the right trade against holding up a tap.
    function count_play(){
        var gc = window.goatcounter;
        if (!gc || typeof gc.count !== 'function') return;
        try {
            // A constant event name: no movement title, no work slug, nothing
            // that could identify anybody. Which work was playing is already
            // answered by that page's own hit count.
            gc.count({ path: PLAY_EVENT, title: 'Recording opened on Spotify', event: true });
        } catch (e) {
            // count() is not as safe as the guard above implies: it calls
            // goatcounter.filter(), whose last check reads localStorage without
            // catching anything, and merely *touching* localStorage throws a
            // SecurityError in a browser set to block all site data. That would
            // put an uncaught error in the console on every single tap. The tap
            // itself would still work -- a throwing listener does not cancel the
            // navigation -- but "the site never depends on analytics" has to
            // mean the console too.
        }
    }

    var table = document.querySelector('table');
    if (table) table.className = TABLE_MOBILE;

    document.querySelectorAll('iframe').forEach(function (frame) {
        // an iframe with no src would give link.href = '', which resolves to
        // the current page: a play button that reloads. The template no longer
        // emits one, and this makes sure a future one cannot become a link.
        if (!frame.src) return;

        var link = document.createElement('a');
        link.href = frame.src.replace('/embed/track/', '/track/');
        link.className = PLAY_ICON;

        var img = document.createElement('img');
        img.src = '/play.png';
        // the whole link is this icon, so its alt is the control's accessible
        // name: "play" on every row of a table says nothing about which row.
        // The iframe's title is the movement name the row shows.
        img.alt = frame.title ? 'Play ' + frame.title : 'Play';
        img.className = PLAY_ICON;

        // auxclick as well as click: a middle-click opens the recording in a new
        // tab, which is a play, and it is the one case where the beacon
        // reliably survives. But auxclick fires for *every* non-primary button,
        // the right one included -- so without the button check, right-clicking
        // a play link to copy its address and then dismissing the menu counts as
        // a play. Not hypothetical here: this code runs wherever
        // maxTouchPoints > 0, which includes touchscreen laptops that have a
        // real right mouse button.
        link.addEventListener('click', count_play, false);
        link.addEventListener('auxclick', function (e){
            if (e.button === 1) count_play();
        }, false);

        link.appendChild(img);
        frame.parentNode.replaceChild(link, frame);
    });
})();
