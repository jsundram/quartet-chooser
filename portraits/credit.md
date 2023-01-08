# Portraits

by Marusya Chaika  (@marusyachaika)  -- http://maru.tilda.ws/

Licensed existing portraits of:

* Johann Sebastian Bach
* Ludwig van Beethoven
* Johannes Brahms
* Antonin Dvorak
* Edvard Grieg
* Joseph Haydn
* Wolfgang Amadeus Mozart
* Sergei Prokofiev
* Maurice Ravel
* Franz Schubert
* Dmitri Shostakovich
* Pyotr Illych Tchaikovsky

Commissioned portraits:

* Bela Bartok
* Benjamin Britten
* Luigi Boccherini
* Robert Schumann
* Claude Debussy
* Felix Mendelssohn


## EPS -> SVG
converted the source eps files to svg via [InkScape](https://inkscape.org/) at the command line:

```inkscape --export-plain-svg Pyotr_Ilyich_Tchaikovsky_Color.eps -o Pyotr_Ilyich_Tchaikovsky_Color.svg```

This pops open an inkscape window that I initially didn't see, which had a prompt about determining page orientation from text direction. I chose "All". This is apparently an unfixed bug [#3524](https://gitlab.com/inkscape/inkscape/-/issues/3524)


## Adding to the site

Once the files have been converted to SVG, they need to get moved into the `/static` folder.

1. copy svg file from `/portraits` to `/static/<composer_last_name>-Original.svg`.
2. open the original file in inkscape and go to Layers | Layers and Objects ...
    1. Select the signature elements (have to use guess/check)
    2.  Edit | Cut
3. Create Signature
    1. Signature (File | New ...)
    2. Paste
    3. If necessary, re-arrange signature to be on a single line
    3. File | Document Properties | Resize to content ...
    4. View | Zoom | Zoom Page (5)
    5. File | Export | Plain SVG
    6. <ComposerLastName>-Signature.svg
4. Create Portrait without Signature
    1. Return to the original file window
    2. Remove a large rectangular canvas element (Layers and Objects) if it exists.
    3. File | Document Properties | Resize to content ...
    4. File | Save As | Plain SVG.
    5. <ComposerLastName>.svg
5. Now you should have 3 files: Composer-Original.svg, Composer.svg, Composer-Signature.svg in `/static`
