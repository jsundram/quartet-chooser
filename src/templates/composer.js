import * as React from "react"
import { Link } from 'gatsby'
import {
    choose_one,
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

import {
    image,
    signature,
} from './composer.module.css'

import {
    button
} from '../components/layout.module.css'

export default function Composer({ pageContext }) {
    console.log(pageContext);

    let composer = pageContext.node;
    const works = pageContext.data.filter(w => w.composer === composer.name);
    const siblings = groupby(works, w => w.catalog); // {catalog => list of works with that catalog number}
    let wrap = s => ( <i> &mdash;&nbsp;{s}</i> );
    let dash = s => s !== "" ? wrap(s) : null;
    let nick = w => dash(work_nickname(w, siblings[w.catalog]));

    let day = function(s){
        let d = new Date(s);
        return "https://dailycomposersmain.gatsbyjs.io/" + (d.getMonth() + 1) + "-" + d.getDate();
    }
    let title = "See composers born on this day!";

    return (
        <Layout pageTitle={composer.full_name}>
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
                (<p>Pick a <Link className={button} to={slugify(choose_one(works, false))}>random quartet 🔀</Link></p>) :
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
                                <Link className={button} to={slugify(choose_one(group, false))}>🔀</Link>
                                <ul>
                                {
                                    group.map(work => (
                                        <li key={get_work_title(work)}>
                                                <Link key={get_work_title(work)} to={slugify(work)}>{get_work_title(work)}</Link>
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
