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


export default function Composer({ pageContext }) {
    console.log(pageContext);

    let composer = pageContext.node;
    const works = pageContext.data.filter(w => w.composer === composer.name);
    const siblings = groupby(works, w => w.catalog); // {catalog => list of works with that catalog number}
    let wrap = s => ( <i>&nbsp;&mdash;&nbsp;{s}</i> );
    let dash = s => s !== "" ? wrap(s) : null;
    let nick = w => dash(work_nickname(w, siblings[w.catalog]));

    return (
        <main>
            <h1><a href={composer.wikipedia}>
                <img src={get_signature(composer.name)} alt={composer.full_name} style={{height: "100px"}} />
            </a></h1>

            <img
                alt={composer.full_name}
                src={get_portrait(composer.name)}
                height={600}
            />

            <p>{composer.birth} &ndash; {composer.death}</p>
            { works.length > 1 ?
                (<p>Pick a <Link to={slugify(choose_one(works))}>random quartet</Link></p>) :
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
                                <i>{group_name(group)}</i>
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
        </main>
    )
}
