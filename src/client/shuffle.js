// Re-randomize the composer-page 🔀 links on every page view. Their static
// href is a build-time choice that would otherwise be frozen until the next
// deploy; React hydration used to re-run choose_one() in the browser. The
// candidate slugs are baked into the data-shuffle attribute by the SSG.
document.querySelectorAll('[data-shuffle]').forEach(function (a) {
    var targets = a.getAttribute('data-shuffle').split(' ');
    a.href = targets[Math.floor(Math.random() * targets.length)];
});
