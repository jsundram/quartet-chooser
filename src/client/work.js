// On touch devices, swap each Spotify embed for a tap-to-play link and
// switch the movement table to its mobile layout. This replaces what
// React hydration used to do via Utils.is_mobile() in work.js — with one
// deliberate change: is_mobile read navigator.maxtouchpoints (wrong case,
// always undefined), so only 'ontouchstart' ever fired. We use the real
// maxTouchPoints, so touch-capable desktops without ontouchstart now get
// play links instead of embeds.
// TABLE_MOBILE and PLAY_ICON are injected by scripts/build.mjs (esbuild
// define) with the hashed CSS-module class names.
(function () {
    var mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!mobile) return;

    var table = document.querySelector('table');
    if (table) table.className = TABLE_MOBILE;

    document.querySelectorAll('iframe').forEach(function (frame) {
        var link = document.createElement('a');
        link.href = frame.src.replace('/embed/track/', '/track/');
        link.className = PLAY_ICON;

        var img = document.createElement('img');
        img.src = '/play.png';
        img.alt = 'play';
        img.className = PLAY_ICON;

        link.appendChild(img);
        frame.parentNode.replaceChild(link, frame);
    });
})();
