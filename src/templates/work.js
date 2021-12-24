import * as React from "react"
import * as Utils from "../lib/utils"


export default function Work({ pageContext }) {
    console.log(pageContext);
    const work = pageContext.node;
    const title = Utils.get_work_title(work);
    const composerInfo = pageContext.data.find(c => c.name === work.composer);
    const image = Utils.get_image(work.composer);
    console.log(composerInfo);
    console.log(Utils);
    let nick = w => w.work_nickname ? ( <i>&nbsp;&mdash;&nbsp;{w.work_nickname}</i> ) : null;
    let imslp = w => w.imslp ? w.imslp : w.opus_imslp ? w.opus_imslp : null;

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
            <img
                alt={composerInfo.full_name}
                src={image}
                height={300}
            />

            <h1><a href={work.composer}>{work.composer}</a>: {title} in {work.key} {nick(work)}</h1>
            {work.opus_nickname !== "" ?
                (<p>Opus nickname: {work.opus_nickname}</p>) : null
            }

            <p>
                Completed in {work.completed}.
                &nbsp;{Utils.sentence_case(work.notes)}
                &nbsp;Read more on <a href={work.wikipedia}>wikipedia</a>.
            </p>

            {composerInfo.quartets > 1 ?
                (<p>See other quartets by <a href={work.composer}>{work.composer}</a></p>) : null
            }

            {imslp(work) ?
                (<p>Check out the score on  <a href={imslp(work)}>IMSLP</a>.</p>) : null
            }
        </main>
    )

}
