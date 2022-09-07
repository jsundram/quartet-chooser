## TODO
* initial zoom on mobile is a little too close -- zooming out actually fixes it; but should be right at first.
* Google analytics -- unique visitors and link clicks
* [SEO](https://www.google.com/search?q=quartet+roulette&rlz=1CDGOYI_enUS706US707&oq=quartet+roulette&aqs=chrome..69i57j0i546l2j69i60l3.4068j0j4&hl=en-US&sourceid=chrome-mobile&ie=UTF-8#ip=1)
    * submit to [search console](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Aquartetroulette.com&id=U9CVkf14ftj9UhnBOC4McA)
* create background color for header bar to make hierarchy clearer.
    * todo: what should the width be?
* Features that require data work:
    * Random practice -- what measures?
    * Link to Spotify / YouTube recordings?
    * Link to IMSLP scores 
    * Add movement titles 


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
* fix preview on site, shows up as "Home<!-- -->" on iMessage. 
    * attempted to change title for main to just show the site title, we shall see.
    * may need to play around with [opengraph meta tags](https://stackoverflow.com/questions/50161794/using-gatsby-js-how-do-i-add-a-route-specific-ogimage-meta-tag)
* Add attribution for site icon from https://www.flaticon.com/free-icon/roulette_1254318
* Create a rep submission form for people to suggest quartets to add and link it from About page
* Add link to the Haydn Dashboard http://viz.runningwithdata.com/haydn-dashboard/ 
* Link to Haydn enthusiasts 
* Add sitemap
