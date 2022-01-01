
export const name = 'utils';

function choose_one(a){
    // for an array a, return a random element
    const ix = Math.floor(Math.random() * a.length);
    return a[ix];
}

function groupby(x, key){
    // https://stackoverflow.com/questions/14446511/
    // disabling lint for my copy pasta ...
    // eslint-disable-next-line no-sequences
    return x.reduce((a, b) => ((a[key(b)] ||= []).push(b), a), {});
}


function sentence_case(s){
    s = s.trim();
    return s.charAt(0).toUpperCase() +
           s.slice(1) +
           ((s.length === 0 || s.charAt(s.length-1) === '.') ? '' : '.');
}

function work_nickname(w, siblings){
    if (w.work_nickname !== "")
        return w.work_nickname;
    else if (w.opus_nickname !== "" && siblings.length === 1 && w.composer !== "Mozart")
        return w.opus_nickname;
    else if (w.title !== "Quartet" && isNaN(parseInt(w.title))) // Grosse Fuge vs "12"
        return w.title;

    return "";
}

function get_image(composer_name) {
    return "/" + composer_name + "-Original.svg";
}

function get_portrait(composer_name) {
    return "/" + composer_name + ".svg"; // portrait
}

function get_signature(composer_name) {
    return "/" + composer_name + "-Signature.svg";
}

function get_work_title(work){
    let catalog = n => 'Quartet ' + n.catalog + (n.work_number ? '#' + n.work_number : '');
    let number = n => 'Quartet #' + n.title;
    let singular = n => 'Quartet';

    // each composer's quartes are commonly identified a bit differently.
    // let the title reflect that.
    let idf = {
        'Bach': n => n.title + " (" + n.catalog + ")",
        'Bartok': number,
        'Beethoven': catalog,
        'Brahms': catalog,
        'Debussy': singular,
        'Dvorak': catalog,
        'Grieg': singular,
        'Haydn': catalog,
        'Mendelssohn': catalog,
        'Mozart': n => n.catalog,
        'Prokofiev': number,
        'Ravel': singular,
        'Schubert': catalog,
        'Schumann': number,
        'Shostakovich': number,
    }
    return idf[work.composer](work);
}

// copied from gatsby-node because I don't know how re-use works.
function slugify(work){
    let catalog = n => n.catalog.toLowerCase().split(" ").join("-") + (n.work_number ? '-' + n.work_number : '');
    let number = n => n.title;
    let singular = n => 'quartet';
    let mozart = n => "k-" + n.catalog.replace("K", ""); // K387 -> k-387

    // each composer's quartes are commonly identified a bit differently.
    // let the slug reflect that.
    let idf = {
        'Bach': catalog,
        'Bartok': number,
        'Beethoven': catalog,
        'Brahms': catalog,
        'Debussy': singular,
        'Dvorak': catalog,
        'Grieg': singular,
        'Haydn': catalog,
        'Mendelssohn': catalog,
        'Mozart': mozart,
        'Prokofiev': number,
        'Ravel': singular,
        'Schubert': catalog,
        'Schumann': number,
        'Shostakovich': number,
    }
    return  '/' + work.composer.toLowerCase()  +
            '-' + idf[work.composer](work) + '/';
}

const COMPOSERS = [
    'Bach',
    'Bartok',
    'Beethoven',
    'Brahms',
    'Debussy',
    'Dvorak',
    'Grieg',
    'Haydn',
    'Mendelssohn',
    'Mozart',
    'Prokofiev',
    'Ravel',
    'Schubert',
    'Schumann',
    'Shostakovich'
];

export {
    COMPOSERS,
    choose_one,
    get_portrait,
    get_signature,
    get_image,
    get_work_title,
    groupby,
    sentence_case,
    slugify,
    work_nickname,
};
