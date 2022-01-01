import * as React from "react"
import * as Utils from "../lib/utils"


export default function Work({ pageContext }) {
    console.log(pageContext);
    const work = pageContext.node;
    const title = Utils.get_work_title(work);
    const composerInfo = pageContext.data.composers.find(c => c.name === work.composer);
    const siblings = pageContext.data.greats.filter(w => w.catalog === work.catalog && w.composer === work.composer);
    const image = Utils.get_image(work.composer);
    let nickname = Utils.work_nickname(work, siblings);
    let nick = nickname ? ( <i>&nbsp;&mdash;&nbsp;{nickname}</i> ) : null;
    let imslp = w => w.imslp ? w.imslp : w.opus_imslp ? w.opus_imslp : null;
    let composer_url = "/" + work.composer;

    /*
        catalog: "Opus 33"
        completed: "1781"
        composer: "Haydn"
        imslp: ""
        key: "G major"
        notes: "dedicated to Grand Duke Paul of Russia; the quartets were premiered in his wife's Vienna apartments on Christmas, 1781. Provoked Mozart's \"Haydn\" quartets."
        opus_imslp: ""
        opus_nickname: "Russian"
        opus_notes: ""
        title: "33"
        wikipedia: "https://en.wikipedia.org/wiki/String_Quartets,_Op._33_(Haydn)"
        work_nickname: "How do you do?"
        work_number: "5"
    */
    return (
        <main >
            <a href={composer_url}>
                <img
                    alt={composerInfo.full_name}
                    src={image}
                    height={300}
                />
            </a>

            <h1><a href={composer_url}>{work.composer}</a>: {title} in {work.key} {nick}</h1>
            {(siblings.length > 1 && work.opus_nickname !== "") ?
                (<p>Opus nickname: {work.opus_nickname}</p>) : null
            }

            <p>
                Completed in {work.completed}.
                &nbsp;{Utils.sentence_case(work.notes)}
                &nbsp;Read more on <a href={work.wikipedia}>wikipedia</a>.
            </p>

            {composerInfo.quartets > 1 ?
                (<p>See other quartets by <a href={composer_url}>{work.composer}</a></p>) : null
            }

            {imslp(work) ?
                (<p>Check out the score on  <a href={imslp(work)}>IMSLP</a>.</p>) : null
            }
        </main>
    )

}
