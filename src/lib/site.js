// Site metadata, formerly in gatsby-config.js siteMetadata.
export const SITE_URL = "https://quartetroulette.com";
export const SITE_TITLE = "Quartet Roulette";

// Share cards (og:image). Generated into static/og/ by scripts/make-og.mjs and
// committed, because Netlify has neither rsvg-convert nor pngquant; the build
// re-checks their size. Every card is exactly these dimensions -- scrapers use
// og:image:width/height to reserve the preview box before the image arrives, so
// they must match the file or the preview reflows.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// The one card that stands for the whole site: home, about, 404.
export const OG_SITE_CARD = "/og/og.png";

// Who is on that card, left to right -- chosen in og-tool.html (issue #39).
// make-og.mjs draws it from this list and the alt text below is derived from
// the same one, so they cannot name different people. The card is a committed
// PNG, so **editing this means rerunning `npm run og`** -- the build fails if
// you forget. An entry may be `{ name, flip }` to mirror that portrait.
export const OG_SITE_QUARTET = ["Boccherini", "Haydn", "Beethoven", "Bartok"];

const and_list = xs => xs.length < 2
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

export const OG_SITE_CARD_ALT = "Quartet Roulette, over illustrated portraits of "
    + and_list(OG_SITE_QUARTET.map(c => typeof c === "string" ? c : c.name));

// Analytics: hosted GoatCounter (pwa.md Phase 4). Cookie-free, so no consent
// banner; the site code is `quartet-roulette`, hyphenated, which is not what
// pwa.md's task list guessed.
//
// Nothing on the site may depend on this loading: count.js is blocked by every
// list an adblocker ships, and the page has to be exactly as good when it is.
// That is also why it is exempt from Phase 5's no-uncached-CDN rule.
export const GC_ENDPOINT = "https://quartet-roulette.goatcounter.com/count";
// GoatCounter's own snippet is protocol-relative (//gc.zgo.at/count.js); the
// site is https-only, so the scheme is not in question and saying so avoids a
// protocol-relative fetch from a page opened over file:.
export const GC_SCRIPT = "https://gc.zgo.at/count.js";

// The event a click on a recording link counts as. GoatCounter groups events by
// this string, so it stays a constant, low-cardinality label: no movement name,
// no work slug, nothing that could identify a visitor. Which work was playing
// is already answered by that page's own hit count.
export const GC_PLAY_EVENT = "play-recording";
