import * as React from "react"
import * as Utils from "../lib/utils"
import Layout from '../components/layout'
import Meta from '../components/meta'

import {
    tableBig,
} from './work.module.css'

// the work's movements in playing order. Both the page and its share-card
// description need this list, and they must not drift: a description that
// promises four movements next to a page showing three is worse than no
// description.
function movements_of(data, work){
    return data.movements.filter(m =>
        m.composer === work.composer &&
        m.catalog === work.catalog &&
        m.work_number === work.work_number
    ).sort((x, y) => x.movement_number - y.movement_number);
}

function age(completed, birth){
    // https://stackoverflow.com/a/24181701/2683
    return new Date(new Date(completed) - new Date(birth)).getFullYear() - 1969;
}

export default function Work({ pageContext }) {
    const work = pageContext.node;
    const title = Utils.get_work_title(work);
    const composerInfo = pageContext.data.composers.find(c => c.name === work.composer);
    const siblings = pageContext.data.greats.filter(w => w.catalog === work.catalog && w.composer === work.composer);
    const image = Utils.get_image(work.composer);
    let nickname = Utils.work_nickname(work, siblings);
    let nick = nickname ? ( <i>&nbsp;&mdash;&nbsp;{nickname}</i> ) : null;
    let imslp = w => w.imslp ? w.imslp : w.opus_imslp ? w.opus_imslp : null;
    let composer_url = Utils.composer_url(work.composer);
    let aged = age(work.completed, composerInfo.birth);

    const mvmts = movements_of(pageContext.data, work);

    let style = function(composer, work){
        if (composer.name === "Bach"){
            return "bullets";
        }
        if (work.catalog === "Opus 133" && composer.name === "Beethoven"){
            return "none";
        }
        return "table"; // return "numerals";
    }

    // desktop rendering; /js/work.js swaps in the mobile play links and
    // table layout on touch devices.
    //
    // 70 of the 916 movements have no recording (all Boccherini). They used to
    // render an iframe with no src: an empty 80px box on desktop, and on touch
    // a play link whose href resolved to the current page -- a button that
    // silently reloads. Nothing to play, nothing to render.
    let player = function (m){
        if (!m.spotify) return null;
        return (<iframe
            src={m.spotify.replace("/track/", "/embed/track/")}
            title={m.title}
            width="100%" height="80" frameBorder="0" allowFullScreen=""
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" >
        </iframe>);
    }

    const items = mvmts.map(m => (
        <li key={m.movement_number} title={m.key}>
            {m.title}
            {player(m)}
        </li>
    ));

    // mvmt #, mvmt title, link
    const mvmt_table = (
        <table className={tableBig}>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Movement</th>
                    <th>Recording</th>
                </tr>
            </thead>
            <tbody>
                {
                    mvmts.map(m => (
                        <tr key={m.movement_number}>
                            <td>{Utils.to_roman(m.movement_number)}</td>
                            <td title={m.title}>{m.title}</td>
                            {/* 29 works (all Boccherini) have no recording
                                linked. An empty cell under a "Recording"
                                header reads as broken; a dash reads as an
                                answer. */}
                            <td>{player(m) || "—"}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    );

    return (
        <Layout>
            <a href={composer_url}>
                <img
                    alt={composerInfo.full_name}
                    src={image}
                    height={300}
                />
            </a>

            <h1><a href={composer_url}>{work.composer}</a>: {title} in {work.key} {nick}</h1>
            {(work.opus_nickname !== "") ?
                (<p>Group nickname: {work.opus_nickname}</p>) : null
            }

            <p>
                Completed in {work.completed}, the year he turned {aged}.
                &nbsp;{Utils.sentence_case(work.notes)}
                &nbsp;Read more on <a href={work.wikipedia}>wikipedia</a>.
            </p>

            {
                {
                    "bullets": (
                        <ul>
                            {items}
                        </ul>
                    ),
                    "numerals": (
                        <ol type="I" start={mvmts[0].movement_number}>
                            {items}
                        </ol>
                    ),
                    "table": (
                        mvmt_table
                    ),
                    "none": player(mvmts[0])
                }[style(composerInfo, work)]
            }

            <p>
            {composerInfo.quartets > 1 ?
                (<i>See other quartets by <a href={composer_url}>{work.composer}</a>. </i>) : null
            }

            {imslp(work) ?
                (<i>Check out the score on  <a href={imslp(work)}>IMSLP</a>.</i>) : null
            }
            </p>
        </Layout>
    )
}

// "Haydn: Quartet Opus 76#3 in C major" -- the same name the page's <h1> uses,
// so a shared link and the page it opens agree.
function getTitle(pageContext){
    const work = pageContext.node;
    return work.composer + ": " + Utils.get_work_title(work) + " in " + work.key;
}

function composer_of(pageContext){
    return pageContext.data.composers.find(c => c.name === pageContext.node.composer);
}

function getDescription(pageContext){
    const work = pageContext.node;
    const composerInfo = composer_of(pageContext);
    const siblings = pageContext.data.greats.filter(w =>
        w.catalog === work.catalog && w.composer === work.composer);
    // work_nickname falls back to the work's own title (Bach's "Art of Fugue"),
    // which get_work_title already used -- saying it twice reads like a bug
    const nickname = Utils.work_nickname(work, siblings);
    const title = Utils.get_work_title(work);
    const named = (nickname && !title.includes(nickname)) ? ` — “${nickname}” — ` : " ";
    // Describe what the page actually shows. This used to promise "keys and
    // recordings" everywhere, and did so twice over: the movement table has no
    // key column at all (only Bach's bulleted list carries a key, in a hover
    // title), and 29 works have no recording linked -- which was survivable
    // while those pages rendered empty iframes, and flatly false once
    // player() stopped rendering anything for them.
    const mvmts = movements_of(pageContext.data, work);
    const n = mvmts.length;
    const recorded = mvmts.filter(m => m.spotify).length;
    const movements = n === 1
        ? (recorded ? "a single movement, with a recording."
                    : "a single movement; no recording linked yet.")
        : recorded === n ? `${n} movements, with recordings.`
        : recorded === 0 ? `${n} movements; no recordings linked yet.`
        : `${n} movements, ${recorded} of them with recordings.`;

    return `${title} in ${work.key}${named}by ${composerInfo.full_name}, `
        + `completed in ${work.completed}: ${movements}`;
}

export const Head = ({ path, pageContext }) => (
    <Meta
        title={getTitle(pageContext)}
        description={getDescription(pageContext)}
        path={path}
        image={Utils.get_card(pageContext.node.composer)}
        image_alt={Utils.get_card_alt(composer_of(pageContext).full_name)}
    />
)
