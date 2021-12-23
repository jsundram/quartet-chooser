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
            <h1><a href={work.composer}>{work.composer}</a>: {title} in {work.key} {nick(work)}</h1>

            <img
                alt={composerInfo.full_name}
                src={image}
                height={300}
            />

            <p><i>{work.notes}</i></p>
            <p>Completed in {work.completed}</p>
            <p>Opus nickname: {work.opus_nickname}</p>

            <p>Read more on <a href={work.wikipedia}>wikipedia</a></p>
            <p>Check out the score on  <a href={work.opus_imslp}>IMSLP</a></p>
            <p>See other quartets by <a href={work.composer}>{work.composer}</a></p>

        </main>
    )

}
