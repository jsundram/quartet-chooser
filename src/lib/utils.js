export const name = 'utils';

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
    let nickname = "";
    if (w.work_nickname !== "")
        nickname = w.work_nickname;
    else if (w.opus_nickname !== "" && siblings.length === 1 && w.composer !== "Mozart" && w.composer !== "Beethoven" && w.composer !== "Boccherini")
        nickname = w.opus_nickname;
    else if (w.title !== "Quartet" && isNaN(parseInt(w.title))) // Grosse Fuge vs "12"
        nickname = w.title;

    // an unnumbered work's title is its name ("Cypresses, B. 152"): don't say it twice
    return get_work_title(w).includes(nickname) ? "" : nickname;
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

// The composer's share card: a raster of the portrait + signature above,
// composed by scripts/make-og.mjs. Work pages use their composer's card too --
// the portrait is what identifies the page at preview size, and the alternative
// is 256 near-identical cards. Revisited in issue #40: a preview should be able
// to say *which* Haydn quartet. The SVGs above are for the page, this is for
// scrapers: they ignore SVG.
function get_card(composer_name) {
    return "/og/og-" + composer_name.toLowerCase() + ".png";
}

function get_card_alt(full_name) {
    return "Illustrated portrait and signature of " + full_name;
}

let title_catalog = w => 'Quartet ' + w.catalog + (w.work_number ? '#' + w.work_number : '');
let title_number = w => 'Quartet #' + w.title;
// works with no number (Dvorak's Cypresses, Schubert's D 89) are titled by name
let title_number_catalog = w => isNaN(parseInt(w.title))
    ? w.title + ', ' + w.catalog
    : 'Quartet #' + w.title + ', ' + w.catalog;

// "B. 17" -> "b-17": Dvorak's early quartets have only a Burghauser number
let slugify_catalog = w => w.catalog.toLowerCase().replaceAll(".", "").split(" ").join("-") + (w.work_number ? '-' + w.work_number : '');
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
        // numbered: his opus numbers are out of order (Op. 80 is No. 8, Op. 34 No. 9)
        'title_work': title_number_catalog,
        'group_work': group_catalog,
        'name_works': group_name_default,
    },
    'Grieg': {
        // /grieg-quartet/ predates the unfinished second quartet; keep its URL
        'slugify_work': w => w.catalog === "Opus 27" ? slugify_singular(w) : slugify_catalog(w),
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
    let title = DISPATCHER[w.composer]['title_work'](w);
    return w.other_catalog ? title + ' (' + w.other_catalog + ')' : title;
}

function slugify(w){
    let work_fn = DISPATCHER[w.composer]['slugify_work'];
    return  '/' + w.composer.toLowerCase()  + '-' + work_fn(w) + '/';
}

function composer_url(name){
    return '/' + name.toLowerCase() + '/';
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

// "Extra" quartets (the sheet's Extra column) have pages and are listed, but
// sit outside the standard repertoire: the Quartet 🔀 never picks them and the
// site's quartet counts leave them out. All of Boccherini is extra.
const standard = works => works.filter(w => !w.extra);
const extras = works => works.filter(w => w.extra);

export {
    COMPOSERS,
    composer_url,
    extras,
    get_card,
    get_card_alt,
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
    standard,
    work_nickname,
};
