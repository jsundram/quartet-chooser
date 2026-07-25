// Re-randomize the composer-page 🔀 links on every page view. Their static
// href is a build-time choice that would otherwise be frozen until the next
// deploy; React hydration used to re-run choose_one() in the browser. The
// candidate slugs are baked into the data-shuffle attribute by the SSG.
function shuffle() {
    document.querySelectorAll('[data-shuffle]').forEach(function (a) {
        var targets = a.getAttribute('data-shuffle').split(' ');
        a.href = targets[Math.floor(Math.random() * targets.length)];
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
