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
export const OG_SITE_CARD_ALT =
    "Quartet Roulette, over illustrated portraits of Haydn, Beethoven, Debussy and Bartok";
