module.exports = {
    siteMetadata: {
        siteUrl: `https://quartetroulette.com`,
        title: "Quartet Roulette",
    },
    plugins: [
        {
            resolve: "gatsby-plugin-google-analytics",
            options: {
                trackingId: "G-7TZZMJ8149",
            },
        },
        {
            resolve: "gatsby-plugin-manifest",
            options: {
                icon: "./static/icon.png",
            },
        },
        {
            resolve: "gatsby-plugin-sitemap",
            options: {
                resolveSiteUrl: () => `https://quartetroulette.com`,  // not sure why this is needed
                query: `
                    query MyQuery {
                        allSitePage {
                            nodes {
                                path
                            }
                        }
                    }`,
            },
        },
        {
            resolve: "gatsby-source-filesystem",
            options: {
                name: "pages",
                path: "./src/pages/",
            },
            __key: "pages",
        },
        `gatsby-transformer-json`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: `./src/data/`,
            },
        },
    ],
};
