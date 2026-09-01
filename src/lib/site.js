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

// Who is on that card, left to right -- chosen in og-tool.html (issue #39):
// the quartet form's early masters running into the twentieth century.
// scripts/make-og.mjs draws the card from this list and the alt text below is
// derived from it, so the two agree by construction. They did drift once: the
// card changed and the alt text kept naming Debussy, which no test could see
// because the only assertion on it is that it is non-empty.
//
// Editing this list is therefore only half of the change -- the card itself is
// a committed PNG and has to be redrawn with `npm run og`. make-og.mjs records
// what it drew in assets/og-quartet.json and check_og_cards() in build.mjs
// fails the build when that record and this list disagree, so forgetting is
// loud rather than silent.
//
// An entry may be `{ name, flip }` to mirror a portrait.
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
