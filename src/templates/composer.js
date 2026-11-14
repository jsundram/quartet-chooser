import * as React from "react"
import {
    get_card,
    get_card_alt,
    get_portrait,
    get_signature,
    get_work_title,
    extras,
    group_name,
    groupby,
    grouper,
    slugify,
    standard,
    work_nickname,
} from  "../lib/utils"
import Layout from '../components/layout'
import Meta from '../components/meta'

import {
    image,
    signature,
} from './composer.module.css'

import {
    button
} from '../components/layout.module.css'


export default function Composer({ pageContext }) {
    let composer = pageContext.node;
    const works = pageContext.data.filter(w => w.composer === composer.name);
    const core = standard(works);
    const more = extras(works);
    // the composer's own 🔀 stays within the standard repertoire, like the
    // nav's -- except for a composer who has none (Boccherini), where it
    // would otherwise vanish from a page of 91 quartets
    const pool = core.length ? core : more;
    const siblings = groupby(works, w => w.catalog); // {catalog => list of works with that catalog number}
    let wrap = s => ( <i> &mdash;&nbsp;{s}</i> );
    let dash = s => s !== "" ? wrap(s) : null;
    let nick = w => dash(work_nickname(w, siblings[w.catalog]));

    // 🔀 links: /js/shuffle.js sets href from data-shuffle on every view and
    // on bfcache restore, so the static href is only a placeholder. Fixed,
    // not random, so the build stays reproducible.
    let shuffle = list => ({
        href: slugify(list[0]),
        'data-shuffle': list.map(slugify).join(' '),
    });

    let day = function(s){
        let d = new Date(s);
        return "https://daily-composers.netlify.app/" + (d.getMonth() + 1) + "-" + d.getDate();
    }
    // daily-composers lists everyone *born* on a calendar day, so "born on this
    // day" is only true of the birth link -- the death link lands on composers
    // born on the anniversary of the death. Harmless in a tooltip nobody reads
    // twice; actively wrong as an accessible name, which reads the year out
    // first. So the wording names the destination rather than the date.
    let title = "See composers born on that day";
    let date_label = (verb, date) => verb + " " + date + " — " + title.toLowerCase();

    return (
        <Layout>
            <h1><a href={composer.wikipedia}>
                <img src={get_signature(composer.name)} alt={composer.full_name} className={signature} />
            </a></h1>

            {/* the <h1> above is the signature, and its alt is already the
                composer's name -- repeating it here would have a screen reader
                say the name twice in a row */}
            <img
                alt={"Portrait of " + composer.full_name}
                src={get_portrait(composer.name)}
                className={image}
            />

            {/* `title` is a hover tooltip, and hover does not exist on touch:
                these two links go somewhere non-obvious (daily-composers) and
                the date alone does not say so. aria-label keeps the date, adds
                the destination, and says which date it is -- sighted readers
                get born-vs-died from the dash, a screen reader gets two bare
                numbers. */}
            <p>
                <a title={title} aria-label={date_label("Born", composer.birth)}
                   href={day(composer.birth)}>{composer.birth}</a> &ndash;&nbsp;
                <a title={title} aria-label={date_label("Died", composer.death)}
                   href={day(composer.death)}>{composer.death}</a>
            </p>
            {composer.extra_link_title !== "" ? <p>Check out <a href={composer.extra_link}>{composer.extra_link_title}</a>!</p> : null}
            { pool.length > 1 ?
                (<p>Pick a <a className={button} {...shuffle(pool)}>random quartet 🔀</a></p>) :
                null
            }

            {core.length ? <ul>{list(core)}</ul> : null}

            {more.length ? (<>
                {core.length ? <h2>Other quartets</h2> : null}
                <p><i>Outside the standard repertoire, so the Quartet 🔀 never picks {core.length ? "these" : "them"}.</i></p>
                <ul>{list(more)}</ul>
            </>) : null}
        </Layout>
    )

    function list(works){
        return (
            Object.entries(groupby(works, grouper(composer.name))).map(([grouping, group]) => {
                let work = group[0];
                if (group.length === 1){
                    return (
                        <li key={get_work_title(work)}>
                                <a key={get_work_title(work)} href={slugify(work)}>{get_work_title(work)}</a>
                                &nbsp;in {work.key}
                                {nick(work)}
                        </li>
                    )
                }
                else {
                    return (
                        <li key={grouping}>
                            <i>{group_name(group)}&nbsp;</i>
                            <a className={button} aria-label={"Random quartet from " + group_name(group)}
                               title={"Random quartet from " + group_name(group)}
                               {...shuffle(group)}>🔀</a>
                            <ul>
                            {
                                group.map(work => (
                                    <li key={get_work_title(work)}>
                                            <a key={get_work_title(work)} href={slugify(work)}>{get_work_title(work)}</a>
                                            &nbsp;in {work.key}
                                            {nick(work)}
                                    </li>
                                ))

                            }
                            </ul>
                        </li>
                    )
                }
            })
        );
    }
}

function getDescription(pageContext){
    let composer = pageContext.node;
    let more = composer.extras;
    if (composer.quartets === 0){
        return `${more} string quartets by ${composer.full_name}, outside the standard `
            + `repertoire, with keys and nicknames, or roll for a random one.`;
    }
    let plus = more === 0 ? "" : ` Plus ${more} more outside it.`;
    if (composer.quartets === 1){
        return `The single ${composer.full_name} work in the standard string quartet `
            + `repertoire, with its key and its movements.` + plus;
    }
    return `Every ${composer.full_name} quartet in the standard repertoire — all `
        + `${composer.quartets}, with keys and nicknames, or roll for a random one.` + plus;
}

export const Head = ({ path, pageContext }) => (
    <Meta
        title={pageContext.node.full_name}
        description={getDescription(pageContext)}
        path={path}
        image={get_card(pageContext.node.name)}
        image_alt={get_card_alt(pageContext.node.full_name)}
    />
)
