// this is dumb but I don't know how you are supposed to do it?
import bach from "../images/Bach.svg"
import bartok from "../images/Bartok.svg"
import beethoven from "../images/Beethoven.svg"
import brahms from "../images/Brahms.svg"
import debussy from "../images/Debussy.svg"
import dvorak from "../images/Dvorak.svg"
import grieg from "../images/Grieg.svg"
import haydn from "../images/Haydn.svg"
import mendelssohn from "../images/Mendelssohn.svg"
import mozart from "../images/Mozart.svg"
import prokofiev from "../images/Prokofiev.svg"
import ravel from "../images/Ravel.svg"
import schubert from "../images/Schubert.svg"
import schumann from "../images/Schumann.svg"
import shostakovich from "../images/Shostakovich.svg"

export const name = 'utils';

function choose_one(a){
    // for an array a, return a random element
    const ix = Math.floor(Math.random() * a.length);
    return a[ix];
}

function get_image(composer_name) {
    // again, stupid, but what else to do?
    let image_map = {
         'Bach': bach,
         'Bartok': bartok,
         'Beethoven': beethoven,
         'Brahms': brahms,
         'Debussy': debussy,
         'Dvorak': dvorak,
         'Grieg': grieg,
         'Haydn': haydn,
         'Mendelssohn': mendelssohn,
         'Mozart': mozart,
         'Prokofiev': prokofiev,
         'Ravel': ravel,
         'Schubert': schubert,
         'Schumann': schumann,
         'Shostakovich': shostakovich
    }

    let image = image_map[composer_name];
    return image;
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
            '-' + idf[work.composer](work);
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

export {get_image, get_work_title, slugify, COMPOSERS, choose_one};
