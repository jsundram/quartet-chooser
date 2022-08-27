## TODO
* Font / Design / CSS / 
    * Composer Layout
    * Composer signatures under portraits on main page
    * Jackpot style "random" page animation?
    * Move SVG styling to css? SVG Animations?
    * Make all composers face the same way?
* Link to daily composers for each birth/death date
* get a domain: https://domains.google.com/registrar/search?searchTerm=quartet%20chooser&hl=en#
    * quartetpicker.com?
    * selectquartets.com
    * quartetoracle.com
* Remove some Dvoraks?
* Add composer number and work total to About Page
* Features that require data work:
    * Random practice -- what measures?
    * Link to Spotify / YouTube recordings?
    * Link to IMSLP scores 


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
