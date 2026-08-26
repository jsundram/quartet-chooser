import * as React from "react"
import { OG_HEIGHT, OG_WIDTH, SITE_TITLE, SITE_URL } from "../lib/site"

// The whole share/preview tag set for one page, so no page can ship with half
// of it. Every page's Head export renders exactly this; the per-page values are
// its props.
//
// The rules that are easy to get wrong, and why they live here rather than in
// five Head exports:
//   * og:image must be an absolute https URL to a *raster*. iMessage, WhatsApp
//     and Slack all ignore SVG and all ignore relative paths -- that pair is
//     what made work-page previews come up blank (TODO.md, "iMessage doesn't
//     like SVGs").
//   * og:url must be absolute too, and must be the page's own URL.
//   * description is real prose, distinct from the title: a preview that reads
//     the title twice tells a reader nothing.
//
// `title` is the *bare* page name ("Joseph Haydn"). The document <title> gets
// the " | Quartet Roulette" suffix appended here; og:title deliberately does
// not, because og:site_name already carries the site name and a preview that
// says it twice just wastes the one line iMessage gives you.
export default function Meta({ title, description, path, image, image_alt }){
    const url = SITE_URL + path;
    const card = SITE_URL + image;
    const document_title = title === SITE_TITLE ? title : title + " | " + SITE_TITLE;

    return (
        <>
            <title>{document_title}</title>
            <meta name="description" content={description} />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_TITLE} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={card} />
            <meta property="og:image:width" content={String(OG_WIDTH)} />
            <meta property="og:image:height" content={String(OG_HEIGHT)} />
            <meta property="og:image:alt" content={image_alt} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={card} />
        </>
    )
}
