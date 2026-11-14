# The Google Sheet: column reference

Every quartet, composer and movement on the site comes from
[this Google Sheet](https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/).
`python3 scripts/update.py` reads its "Publish to web" CSV export into `src/data/data.json`.

## Who reads it, and how a rename breaks them

Two repos read the sheet, both **by header name**:

- **This repo** — `scripts/update.py`, all three tabs. It is strict. A header it does not know, or a
  known header that has gone missing, stops the import with an error naming it. So renaming *any*
  column, even an ignored one, fails loudly here until `COLUMNS` (or `IGNORED`) is updated.
- **[boccherini-quartet-data](https://github.com/jsundram/boccherini-quartet-data)** —
  `scripts/sheets_to_quartets.py` and `scripts/sheets_to_movements.py`, the Quartets and Movements
  tabs, Boccherini rows only. Its output feeds quartets.boccherini.org. It mostly reads with
  `row.get("Header", "")`, so **a renamed column there usually fails silently**: the field just
  comes back empty. Columns marked **B** below are the ones it reads. Check them by hand before
  renaming.

Both repos also hard-code the tab gids (Quartets `0`, Movements `1782733196`) and the published-sheet
URL. Recreating a tab, rather than editing it, changes its gid.

In the tables, **Required** means:

- **enforced** — something fails if it is blank.
- **yes** — nothing checks, but the site renders wrongly without it.
- **no** — blank is normal.

Counts are from the sheet as of 2026-11-13.

## Quartets tab (gid `0`, `greats` in data.json)

One row per work: 275 rows, 165 standard and 110 extra.

| Column | data.json key | Holds, and its format | Required | Read by |
|---|---|---|---|---|
| Extra | `extra` | `TRUE`/`FALSE` checkbox. TRUE puts a quartet outside the standard repertoire: it gets a page and is listed under "Other quartets", but the Quartet 🔀 never picks it and the quartet counts leave it out. All of Boccherini is TRUE. | enforced: `update.py` rejects anything but TRUE/FALSE, and the build fails on a row without it | site |
| Composer | `composer` | Short name, exactly as in the Composers tab's Name (`Dvorak`, `Bartok`: no diacritics). A new composer also needs an entry in `DISPATCHER` in `src/lib/utils.js`. | yes | site, **B** (filters on `Boccherini`) |
| Title | `title` | The quartet's number (`12`), or its name when it has none (`Grosse Fuge`, `Cypresses, B. 152`). A name becomes the page title. For Bartók, Britten, Prokofiev, Schumann, Shostakovich and Tchaikovsky the number is also the page URL (`/bartok-3/`), so changing it moves the page. | yes | site |
| Catalog Number | `catalog` | Catalog or opus number: `Opus 18`, `K. 465`, `Sz 85`, `BWV 1080`, Boccherini's Gérard numbers `G159`–`G249`. With Composer and Work Number, it identifies the work and links it to its movements. For the other composers it is part of the page URL, apart from Debussy, Ravel and Grieg's Op. 27 (`/debussy-quartet/`). | yes | site, **B** |
| Other Catalog | `other_catalog` | A second catalog number, shown in brackets after the title: Dvořák's Burghauser numbers (`B121`), Schubert's posthumous opus numbers (`Opus post. 161`). Never part of a URL, so it can change freely. 16 rows. | no | site |
| Completed | `completed` | Year completed, four digits (`1785`). The work page says how old the composer was. | yes | site, **B** |
| Nickname | `opus_nickname` | Name of the set the work belongs to: `Razumovsky`, `Tost III`, `Prussian`. For Boccherini it holds the opus (`Opus 8`). Shown as "Group nickname" and used to group works on composer pages. | no | site, **B** (parses the opus number from it) |
| Work Number | `work_number` | Position within the opus (`1`–`6`), blank for a work published alone. Part of the work's identity and its URL, and must match the Movements tab. | when the opus holds more than one work | site, **B** |
| Work Nickname | `work_nickname` | The quartet's own nickname: `Emperor`, `American`, `la tiranna`. | no | site, **B** |
| Key | `key` | Home key, written `B-flat major`, `c minor` (minor keys mostly take a lower-case tonic). "Major" and "major" are both in use. Free text: `g minor / B-flat major` is allowed. | yes: it is in the page heading | site, **B** (parses tonic and mode) |
| Notes | `notes` | A sentence or two about the work, shown on its page, sentence-cased. For Boccherini it starts with the category and movement count (`Opera Grande (3 movements)`). | no | site, **B** (parses the category) |
| Wikipedia | `wikipedia` | URL of the work's article, or of a list or opus article. Not every work has one (Grieg's unfinished No. 2). | no | site |
| IMSLP | `imslp` | URL of the work's score on IMSLP. | no | site, **B** |
| Opus IMSLP | `opus_imslp` | URL for the whole set. Usually IMSLP, sometimes Wikipedia (Mozart's Haydn and Prussian sets). Used when IMSLP is blank. | no | site, **B** |
| Opus Notes | `opus_notes` | Prose about the set. Imported but not shown on the site. Boccherini's dedications are taken from it ("Dedicated to …"). | no | **B** |
| Nickname Notes | — | Editor's notes on where a nickname came from, or doubts about it. Ignored by both repos. | no | — |

## Composers tab (gid `1606524218`, `composers` in data.json)

One row per composer: 18 rows. Only this repo reads it.

| Column | data.json key | Holds, and its format | Required |
|---|---|---|---|
| Name | `name` | Short name, the join key for both other tabs. It also names the portrait files (`static/<Name>.svg`, `-Original.svg`, `-Signature.svg`) and the composer page URL. | yes |
| Birth | `birth` | `D Month YYYY` (`17 December 1770`). Shown on the composer page and used to compute age at completion. | yes |
| Death | `death` | Same format as Birth. | yes |
| Full Name | `full name` | Full name with diacritics (`Antonín Dvořák`). Used in headings, alt text and share-card descriptions. | yes |
| Wikipedia Link | `wikipedia` | URL of the composer's article. | yes |
| Portrait | `portrait` | `TRUE`/`FALSE`, currently FALSE on every row. Imported as a string and not used. | no |
| Extra Link | `extra link` | URL of a related project, linked from the composer page. | no |
| Extra Link Title | `extra link title` | Link text for Extra Link. The link only shows when this is filled in. | with Extra Link |

## Movements tab (gid `1782733196`, `movements` in data.json)

One row per movement: 985 rows. A movement belongs to the work with the same Composer, Catalog Number
and Work Number. All three must match the Quartets tab exactly, or the movement does not appear.

| Column | data.json key | Holds, and its format | Required | Read by |
|---|---|---|---|---|
| Composer | `composer` | As in the Quartets tab. | yes | site, **B** |
| Title | — | The work's Title, repeated so the tab is readable on its own. Ignored by both repos: a movement's `title` in data.json comes from Movement Title. | no | — |
| Catalog Number | `catalog` | As in the Quartets tab. | yes | site, **B** |
| Grouping | `grouping` | The set the work belongs to, filled for Boccherini, Haydn and some Mozart and Mendelssohn. Usually the opus (`Opus 20`), even where Nickname holds a name (`Sun`), and sometimes a set name (`Prussian`). Imported but not used yet. | no | — |
| Work Number | `work_number` | As in the Quartets tab. Blank exactly where the work's is blank. | when the work has one | site |
| Movement Number | `movement_number` | Position in the work, an integer from `1`. Sets the playing order and the Roman numeral. Blank only for Beethoven's Grosse Fuge, a single movement. | yes | site, **B** |
| Movement Title | `title` | Tempo marking or title as printed: `Allegro con brio`, `Menuetto: Allegretto`. | yes, except the Grosse Fuge | site, **B** (skips rows without it) |
| Movement Key | `key` | The movement's key, in the same style as Key. Free text: `?`, `F major --> F minor` and modes (`E Phrygian`) all occur. Shown only as a hover tooltip in Bach's movement list. | no | site |
| Spotify Track ID | `spotify` | **A full track URL, despite the column name**: `https://open.spotify.com/track/<22-character id>`. The site uses it as the play link as-is, and makes the embed URL by inserting `/embed`. So a bare track ID would produce a broken link. A share-link `?si=…` suffix is harmless (one row has one). Blank for 65 movements with no recording, all Boccherini; those show "—". | no | site, **B** |
| Notes | `notes` | Remarks on the movement. Imported but not shown. | no | — |

`scripts/find_tracks.py`, which drafts rows for this tab from a Spotify album, already writes full
URLs.
