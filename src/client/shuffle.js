// Point every 🔀 link at a random target on every page view: the two nav
// links on all pages, plus the per-group links on composer pages. The static
// href is a fixed fallback so the link is real before this runs.
//
// Two sources, because the two kinds of list have opposite economics
// (pwa.md Phase 7):
//
//   data-shuffle-key  the nav's Quartet 🔀 and Composer 🔀. The same ~3.9 KB
//                     of route paths on every page of the site, twice — so the
//                     lists are baked into this file instead, once, and the
//                     markup carries only the name of the one it wants.
//                     SHUFFLE_TARGETS is injected by scripts/build.mjs
//                     (esbuild define) from the same random_targets() the nav
//                     and the /random redirect pages are built from.
//
//   data-shuffle      the per-group links on composer pages. Different on
//                     every page and only a handful of slugs each, so there is
//                     nothing to share and they stay inline.
function pick(targets) {
    return targets[Math.floor(Math.random() * targets.length)];
}

function shuffle() {
    document.querySelectorAll('[data-shuffle-key]').forEach(function (a) {
        var targets = SHUFFLE_TARGETS[a.getAttribute('data-shuffle-key')];
        // an unknown key would give pick(undefined) and throw, taking the
        // composer-page links below down with it; leaving the href alone
        // means the 🔀 still goes somewhere sensible, via /random
        if (targets && targets.length) a.href = pick(targets);
    });

    document.querySelectorAll('[data-shuffle]').forEach(function (a) {
        a.href = pick(a.getAttribute('data-shuffle').split(' '));
    });
}

shuffle();

// Going back restores the page from the bfcache: the DOM comes back with the
// href we already mutated and scripts do not re-run, so without this the 🔀
// stays frozen on the quartet you just visited. pageshow is the one event
// that fires on a bfcache restore; persisted tells it apart from a real load,
// which shuffle() above has already handled.
window.addEventListener('pageshow', function (e) {
    if (e.persisted) shuffle();
});
