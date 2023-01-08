const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async function ({ actions, graphql }) {
    const { data } = await graphql(`
        query {
            dataJson {
                composers {
                    name
                    full_name
                    birth
                    death
                    wikipedia
                    extra_link
                    extra_link_title
                }
                greats {
                    composer
                    catalog
                    completed
                    imslp
                    key
                    notes
                    opus_imslp
                    opus_nickname
                    opus_notes
                    title
                    wikipedia
                    work_nickname
                    work_number
                }
            }
        }
    `)

    // add a count of quartets by each composer to their entry. Don't hard code work counts
    // because e.g. schubert and mendelssohn could get more quartets added ...
    let counts = {
        'Bach': 0,
        'Bartok': 0,
        'Beethoven': 0,
        'Boccherini': 0,
        'Brahms': 0,
        'Britten': 0,
        'Debussy': 0,
        'Dvorak': 0,
        'Grieg': 0,
        'Haydn': 0,
        'Mendelssohn': 0,
        'Mozart': 0,
        'Prokofiev': 0,
        'Ravel': 0,
        'Schubert': 0,
        'Schumann': 0,
        'Shostakovich': 0,
        'Tchaikovsky': 0,
    }

    data.dataJson.greats.forEach(node => {
        counts[node.composer] += 1;
    });
    data.dataJson.composers.forEach(node => node.quartets = counts[node.name]);
    // console.log(JSON.stringify(data.dataJson, null, 4))

    // console.log(JSON.stringify(data.dataJson, null, 4))
    // https://jonsully.net/blog/trailing-slashes-and-gatsby/
    data.dataJson.composers.forEach(node => {
        // console.log(node);
        actions.createPage({
            path: node.name + '/',
            component: require.resolve(`./src/templates/composer.js`),
            context: { node: node, data: data.dataJson.greats },
        })
    })

    let slugify = function(node){
        let catalog = n => n.catalog.toLowerCase().split(" ").join("-") + (n.work_number ? '-' + n.work_number : '');
        let number = n => n.title;
        let singular = n => 'quartet';
        let mozart = n => "k-" + n.catalog.replace("K", ""); // K387 -> k-387
        let boccherini = n => n.catalog.toLowerCase();

        // each composer's quartes are commonly identified a bit differently.
        // let the slug reflect that.
        let idf = {
            'Bach': catalog,
            'Bartok': number,
            'Beethoven': catalog,
            'Boccherini': boccherini,
            'Brahms': catalog,
            'Britten': number,
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
            'Tchaikovsky': number,
        }
        return  '/' + node.composer.toLowerCase()  +
                '-' + idf[node.composer](node) + '/';
    }

    data.dataJson.greats.forEach(node => {
        // console.log(JSON.stringify(node));
        // console.log(slugify(node));
        const slug = slugify(node);
        actions.createPage({
            path: slug,
            component: require.resolve(`./src/templates/work.js`),
            context: { node: node, data: data.dataJson },
        })
    })

    actions.createPage({
        path: "/random",
        component: require.resolve(`./src/templates/random.js`),
        context: { node: data.dataJson },
    })

    actions.createPage({
        path: "/random-composer",
        component: require.resolve(`./src/templates/random-composer.js`),
        context: { node: data.dataJson },
    })
}
