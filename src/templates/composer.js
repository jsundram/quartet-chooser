import * as React from "react"
import { Link } from 'gatsby'
import {get_work_title, slugify, get_image, choose_one} from  "../lib/utils"

export default function Composer({ pageContext }) {
    console.log(pageContext);
    let composer = pageContext.node;
    const works = pageContext.data.filter(w => w.composer === composer.name);
    console.log(works)
    let image = get_image(composer.name);

    let nick = w => w.work_nickname ? ( <i>&nbsp;&mdash;&nbsp;{w.work_nickname}</i> ) : null;

    return (
        <main >
            <h1><a href={composer.wikipedia}>{composer.name}</a></h1>

            <img
                alt={composer.full_name}
                src={image}
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
