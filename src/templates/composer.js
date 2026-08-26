import * as React from "react"
import {
    get_card,
    get_card_alt,
    get_portrait,
    get_signature,
    get_work_title,
    group_name,
    groupby,
    grouper,
    slugify,
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
    let title = "See composers born on this day!";

    return (
        <Layout>
            <h1><a href={composer.wikipedia}>
                <img src={get_signature(composer.name)} alt={composer.full_name} className={signature} />
            </a></h1>

            <img
                alt={composer.full_name}
                src={get_portrait(composer.name)}
                className={image}
            />

            <p>
                <a title={title} href={day(composer.birth)}>{composer.birth}</a> &ndash;&nbsp;
                <a title={title} href={day(composer.death)}>{composer.death}</a>
            </p>
            {composer.extra_link_title !== "" ? <p>Check out <a href={composer.extra_link}>{composer.extra_link_title}</a>!</p> : null}
            { works.length > 1 ?
                (<p>Pick a <a className={button} {...shuffle(works)}>random quartet 🔀</a></p>) :
                null
            }

            <ul>
            {

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
                                <a className={button} {...shuffle(group)}>🔀</a>
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
            }
          </ul>
        </Layout>
    )
}

function getDescription(pageContext){
    let composer = pageContext.node;
    if (composer.quartets === 1){
        return `The one ${composer.full_name} work in Quartet Roulette's standard string `
            + `quartet repertoire, with its key, movements and recordings.`;
    }
    return `All ${composer.quartets} ${composer.full_name} quartets in Quartet Roulette's `
        + `standard repertoire, with their keys, movements and recordings — or roll for a `
        + `random one.`;
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
