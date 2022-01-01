module.exports = {
  siteMetadata: {
    siteUrl: "https://www.yourdomain.tld",
    title: "Quartet Chooser",
  },
  plugins: [
    "gatsby-plugin-image",
    {
      resolve: "gatsby-plugin-google-analytics",
      options: {
        trackingId: "G-7TZZMJ8149",
      },
    },
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        icon: "./static/icon.png",
      },
    },
    "gatsby-plugin-mdx",
    "gatsby-plugin-sharp",
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
