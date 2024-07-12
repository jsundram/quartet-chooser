## TODO
* Boccherini -- handle opus numbers better 
    * (on /Boccherini lists Opus 2 / G Numbers)
    * create slugs for e.g. boccherini-opus-2-1 as well as by G number
    * create redirects for wrong peters opus numbers?
* Update og: images on work and composer pages. iMessage doesn't like SVGs so ignores them.
    * need to either transcode manually or use Image plugin from gatsby ...
* Update layout to be iPad friendly
* Make quartet composer viz mobile friendly?
* shuffle icon on composer page groups of works has a weird gray oval around it on mobile chrome (but not mobile safari)
    * using `-webkit-tap-highlight-color: rgba(0,0,0,0)` doesn't fix this
* random work and random composer interstitial page has flashy rendering. (get rid of interstitial?)
* Add Playlist / Album links to composer pages
* Timelines
    * Make a timeline visualization of all the quartets / composers
    * Make a timeline visualization for each composer
    * Inspo:
        * https://observablehq.com/@tezzutezzu/world-history-timeline
        * https://observablehq.com/@mbostock/a-timeline-of-democratic-presidential-candidates
        * https://observablehq.com/@mbostock/a-timeline-of-apple-products
        * https://observablehq.com/@aias/patient-timeline
        * https://observablehq.com/@agware/timeline-in-office (linked visualizations with brushing)
        * https://user-images.githubusercontent.com/230541/130283717-71d42637-89e4-4794-82e6-9a8570bb527d.png from [here](https://github.com/observablehq/plot/blob/main/CHANGELOG.md)
* fix [security problem with got](https://github.com/jsundram/quartet-chooser/security/dependabot/1) via upgrading ... somehow? 
* Google analytics -- unique visitors and link clicks
* [SEO](https://www.google.com/search?q=quartet+roulette)
    * submit to [search console](https://search.google.com/search-console?resource_id=sc-domain:quartetroulette.com)
    * Gatsby [HEAD / SEO stuff ](https://www.gatsbyjs.com/docs/how-to/adding-common-features/adding-seo-component/)
* create background color for header bar to make hierarchy clearer?
    * todo: what should the width be?
* Features that require data work:
    * Bach -- comment on movements of Art of Fugue with ordering in the Klemm/Weymar edition?
    * YouTube recording links?
    * Random practice -- what measures?
    * Link to IMSLP scores (directly; pick the best-looking ones)


## Instructions for adding a new composer and their works
* Commission portrait
* convert eps to svg as detailed in ./portraits/credit.md
* Make sure the works and composer info are added to the [backing google sheet](https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/edit#gid=0) on the appropriate tabs (starting with "The")
* run `./update.py -c 0` to pull in the latest data 
* edit `./gatsby-node.js` to add composer names to `counts` and `idf`
* go to `./src/lib/utils.js` and update `DISPATCHER` and `HIDDEN`
* update `src/pages/index.module.css` to change the number of rows/cols.
* update  `components/layout.module.css` to match changes made in `index.module.css`


## Done
* Hide random quartet button on composer page if only 1 quartet
* hide opus nickname header if it doesn't apply
* reformat work details.
* hide "see more quartets by COMPOSER" if there aren't any...
* Deal with opus / work nicknames better (Serioso, Quartetsatz)
* Separate composer signature from drawings
    * 1) create copy. Rename the original to COMPOSER-Original
    * 2) open copy in boxy-svg
    * 3) press "edit" button on left
    * 4) hold down shift and select a letter at a time
    * 5) cut and paste into new document
        * if you need to do this multiple times (name split over lines)
        * press - multiple times to zoom out
        * press view (left side, bottom button)
        * expand the view to accomodate paste
        * ... paste
        * if necessary, enter "transform" mode (left, top) to move the signature parts into alignment
            * check ascenders / descenders to match first part
        * when done pasting, resize view to fit objects
    * 6) save as COMPOSER-signature.svg
    * --    
    * 1) go to tab with copy in it
    * 2) Generators (control on the right margin, 2 from bottom)
    * 3) Resize view to fit objects. 
        * If this doesn't work, you may have to find a large object and delete it
        * Go to elements on the bottom, and search for a big element, then click delete
    * 4) rename copy to COMPOSER.svg
* Add Composer Signatures to top of composer pages
    * needed to move to the static folder, there may be a better solution? https://www.gatsbyjs.com/docs/how-to/images-and-media/static-folder/
* svg sizing was a bit weird; needed to edit the actual svgs
    * https://css-tricks.com/scale-svg/
* Group multiples by opus number on composer page
* Add a header (Home | Random Work | Random Composer | About)
* Create About Page
* Create Random Composer Page
* back button bug
    * Repro steps: 
    * 1) load http://localhost:8000/ 
    * 2) click on a composer
    * 3) Click on a quartet
    * 4) Press Back (returns to composer page)
    * 5) click back again (should return home), instead
        * `Error in function WS.send in http://localhost:`
    * attempted to fix via adding slashes to every page route and link... doesn't seem to kill it.
    * attempting to fix via `window.location.replace(random)` instead of `window.location.href = random`
        * this appears to have worked!
* Make Quartet Chooser header link to Home (but don't underline)
* About Page 
    * Link to quartet composers viz 
    * Link to feedback / ideas
        * mailing list?
* Fix Beethoven nicknames 
* Random per opus 
* Composer pages have portraits that are too big 
* Main Page: Composer Layout
* Main Page: Composer signatures under portraits on main page
* Sitewide: pull theme colors out of svgs and apply.
* favicon that isn't Gatsby's 
    * attempt to convert a portrait: https://gist.github.com/azam/3b6995a29b9f079282f3
        * doesn't look great
    * next button from flaticon; would maybe like to change colors to match site; need a photo editor...
    * qc (quality control!) from flaticon. keeping for now?
* Add composer count to About Page
* Add a note about submitting nicknames to about page
* Add opus numbers to work listings for Debussy, Grieg, Prokofiev, Shostakovich
* Add catalog numbers to work listings for Bartok, Ravel, Schubert,
* move Random Work to Random Quartet and remove sentence from landing page
* don't wrap Random Quartet / Random Composer
* Link to how to make a chamber music log
* Rename to quartet roulette
    * Get a roulette icon. trying [this](https://www.flaticon.com/free-icon/roulette_1254429)
    * get a domain: quartetroulette.com won over the otheroptions:
        * quartetpicker.com?
        * selectquartets.com
        * quartetoracle.com
* Link to daily composers for each birth/death date
* Add work total to About Page 
* Style site icon to be smaller on mobile.
* Add attribution for site icon from https://www.flaticon.com/free-icon/roulette_1254318
* Create a rep submission form for people to suggest quartets to add and link it from About page
* Add link to the Haydn Dashboard http://viz.runningwithdata.com/haydn-dashboard/ 
* Link to Haydn enthusiasts 
* Add sitemap
* Update Broken Survey Link (and style surveys to match each other and the site theme)
* Add Boccherini
* Add Britten
* Add Tchaikovsky
* Attribution for casino icon should go to https://www.flaticon.com/authors/smalllikeart
* Add references to Peters Volumes for Haydn
* Add movements to work pages
    * [x] use roman numerals for movement numbers
    * [x] grosse fuge (needs fixing? No actual tempo indications)
    * [x] art of fugue (would be better to skip numerals)
    * [x] Schubert d-703 (quartetsatz)
    * [x] haydn 103 (mvmts 2 and 3)
* Add recording links to work pages
* Change movement presentation table
    * movement titles wrap
    * minimize padding
    * colors? (changed to use alpha 88/FF)
    * mobile friendliness?
* use [ngrok](https://ngrok.com/) to do mobile debugging? [github oauth]
* Work Page - text wrap is weird (mozart k575)
* Spotify links on mobile play 30 second previews; even after logging into spotify in another tab.
    * I think this is a [3rd party cookies problem](https://stackoverflow.com/questions/52280122/spotify-play-button-is-not-working-playing-only-previews-in-recent-chrome); 
    * There [doesn't seem to be a workaround](https://community.spotify.com/t5/Music-Discussion/Embedded-playlists-play-only-30-seconds-on-mobile-phone-browser/td-p/4986711)
    * replace with links to the tracks directly on mobile. (add play button)
* fix overlapping composers on main page
* Mobile: initial zoom is a little too close -- zooming out actually fixes it; but should be right at first.
    * Index.js
    * Work page (menu on top isn't shown fully)
    * Composer page (menu on top isn't shown fully, and some signatures cut off)
* Use shuffle icon for pick random quartet by composer
* shuffle icon hard to touch on mobile. Expanded touch area
* fix nitpicky bug on key wrap on composer page (prokofiev 2) with nickname.
* show mozart quartet group titles
* fix preview on site, shows up as "Home<!-- -->" on iMessage. 
    * first attempted to change title for main to just show the site title. didn't work
    * now using gatsby Head API and og: tags ... will deploy and find out.
* Show composer's age when pieces were written programmatically.
