import * as React from "react"
import { Link } from 'gatsby'
import {get_work_title, work_nickname, slugify, get_image, choose_one, groupby} from  "../lib/utils"


export default function Composer({ pageContext }) {
    console.log(pageContext);
    let composer = pageContext.node;
    const works = pageContext.data.filter(w => w.composer === composer.name);
    console.log(works)
    let portrait = "/" + composer.name + ".svg";
    let signature = "/" + composer.name + "-Signature.svg";

    const groups = groupby(works, w => w.catalog); // {catalog => list of works with that catlog number}
    let nick = w => work_nickname(w, groups[w.catalog]) ?
        ( <i>&nbsp;&mdash;&nbsp;{work_nickname(w, groups[w.catalog])}</i> ) : null;


    return (
        <main >
            <h1><a href={composer.wikipedia}>{composer.name}</a></h1>

            <img src={signature} alt={composer.full_name} />


            <img
                alt={composer.full_name}
                src={portrait}
                height={600}
            />

            <p>{composer.birth} &ndash; {composer.death}</p>
            { works.length > 1 ?
                (<p>Pick a <Link to={slugify(choose_one(works))}>random quartet</Link></p>) :
                null
            }

            <ul>
            {
                works.map(work => (
                    <li key={get_work_title(work)}>
                            <a key={get_work_title(work)} href={slugify(work)}>{get_work_title(work)}</a>
                            &nbsp;in {work.key}
                            {nick(work)}
                    </li>
                ))
            }
          </ul>
        </main>
    )

}
