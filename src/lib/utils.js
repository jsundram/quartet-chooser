
export const name = 'utils';

function choose_one(a, hidden=true){
    // For an array a, return a random element ...
    // as long as it wasn't composed by a HIDDEN composer!
    let b = hidden ? a.filter(i => !HIDDEN[i.composer]) : a;
    const ix = Math.floor(Math.random() * b.length);
    return b[ix];
}

function groupby(x, key){
    // https://stackoverflow.com/questions/14446511/
    // disabling lint for my copy pasta ...
    // eslint-disable-next-line no-sequences
    return x.reduce((a, b) => ((a[key(b)] ||= []).push(b), a), {});
}

function to_roman(num) {
    // https://stackoverflow.com/a/9083076/2683
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
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
    else if (w.opus_nickname !== "" && siblings.length === 1 && w.composer !== "Mozart" && w.composer !== "Beethoven" && w.composer !== "Boccherini")
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

let title_catalog = w => 'Quartet ' + w.catalog + (w.work_number ? '#' + w.work_number : '');
let title_number = w => 'Quartet #' + w.title;
let title_number_catalog = w => 'Quartet #' + w.title + ', ' + w.catalog;

let slugify_catalog = w => w.catalog.toLowerCase().split(" ").join("-") + (w.work_number ? '-' + w.work_number : '');
let slugify_number = w => w.title;
let slugify_singular = w => 'quartet';


let group_catalog = w => w.catalog;
let group_nickname = w => w.opus_nickname !== "" ? w.opus_nickname: w.catalog;
let group_none = w => null;

let group_name_default = g => grouper(g[0].composer)(g[0]);
let group_name_nicknames = g => group_name_default(g) + (g[0].opus_nickname !== "" ? " '" + g[0].opus_nickname + "'": "");

let DISPATCHER = {
    'Bach': {
        'slugify_work': slugify_catalog,
        'title_work': w => w.title + " (" + w.catalog + ")",
        'group_work': group_none,
        'name_works': group_name_default,
    },
    'Bartok': {
        'slugify_work': slugify_number,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Beethoven': {
        'slugify_work': slugify_catalog,
        'title_work': title_catalog,
        'group_work': group_nickname,
        'name_works': group_name_default,
    },
    'Boccherini': {
        'slugify_work': w => w.catalog.replace("G", "g"), // G387 -> g387
        'title_work': w => w.catalog,
        'group_work': group_nickname,
        'name_works': group_name_default,
    },
    'Brahms': {
        'slugify_work': slugify_catalog,
        'title_work': title_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Britten': {
        'slugify_work': slugify_number,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Debussy': {
        'slugify_work': slugify_singular,
        'title_work': title_catalog,
        'group_work': group_none,
        'name_works': group_name_default,
    },
    'Dvorak': {
        'slugify_work': slugify_catalog,
        'title_work': title_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Grieg': {
        'slugify_work': slugify_singular,
        'title_work': title_catalog,
        'group_work': group_none,
        'name_works': group_name_default,
    },
    'Haydn': {
        'slugify_work': slugify_catalog,
        'title_work': title_catalog,
        'group_work': group_catalog,
        'name_works': group_name_nicknames,
    },
    'Mendelssohn': {
        'slugify_work': slugify_catalog,
        'title_work': title_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Mozart': {
        'slugify_work': w => w.catalog.replace("K", "k-"), // K387 -> k-387
        'title_work': w => w.catalog,
        'group_work': group_nickname,
        'name_works': group_name_default,
    },
    'Prokofiev': {
        'slugify_work': slugify_number,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Ravel': {
        'slugify_work': slugify_singular,
        'title_work': title_catalog,
        'group_work': group_none,
        'name_works': group_name_default,
    },
    'Schubert': {
        'slugify_work': slugify_catalog,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Schumann': {
        'slugify_work': slugify_number,
        'title_work': title_number,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Shostakovich': {
        'slugify_work': slugify_number,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Tchaikovsky': {
        'slugify_work': slugify_number,
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    }
}

function get_work_title(w){
    return DISPATCHER[w.composer]['title_work'](w);
}

function slugify(w){
    let work_fn = DISPATCHER[w.composer]['slugify_work'];
    return  '/' + w.composer.toLowerCase()  + '-' + work_fn(w) + '/';
}

function grouper(composer) {
    // returns the function that does the grouping over works
    return DISPATCHER[composer]['group_work'];
}

function group_name(group){
    // group is a list of works by the same composer
    // let same_catalog = Object.entries(groupby(group, w => w.catalog)).length == 1;
    let composer = group[0].composer;
    return DISPATCHER[composer]['name_works'](group);
}

const COMPOSERS = Object.keys(DISPATCHER);
const HIDDEN = {"Boccherini": true};

export {
    COMPOSERS,
    choose_one,
    get_image,
    get_portrait,
    get_signature,
    get_work_title,
    group_name,
    groupby,
    grouper,
    to_roman,
    sentence_case,
    slugify,
    work_nickname,
};
