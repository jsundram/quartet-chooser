# Idea: composer-anniversary banners (unshipped, Feb 2023)

**The idea:** when it's a special time for a composer — birthday, deathday, birth week, death
week — show a banner on the site.

**Why it didn't ship:** with 18 composers × 2 dates each, the calendar is crowded. The
exploratory work below was done to figure out how many days/weeks would end up with *multiple*
banners, which would probably be both confusing and bad UX. That collision problem was never
resolved, so the idea was shelved. Logged here because the exploration is worth keeping and may
be useful when picking this up again.

## The exploration

![Birthdays (left, red) and deathdays (right, dark) across the calendar year; gray bars are
7-day windows](birthdays-deathdays-calendar.png)

The chart plots every composer's birthday (left column, red) and deathday (right column, dark)
on a single calendar year, with gray bars marking 7-day windows — so a bar containing several
dots is a week that would need several banners. Source notebook (Observable, Feb 2023):

- [Birth / Death dates, with 7-day windows](https://observablehq.com/d/6aa8496df9f40463) — the
  chart above (this PNG is a screenshot of it)

Data is the `birth`/`death` fields in `src/data/data.json` (full dates, e.g. "27 January 1756").

What the chart shows about collisions, day-level alone:

- Bach and Haydn share a birthday (31 March); Brahms and Tchaikovsky share one too (6 May).
- Late March is the worst stretch: Bartók (25th), Bach + Haydn (31st) birthdays *and* Debussy
  (25th), Beethoven (26th) deathdays, with Brahms's deathday (2 April) just behind.
- Other crowded windows: late January (Mozart 27th, Schubert 31st, Mendelssohn 3 Feb birthdays),
  late July (Bach 27th, Schumann 28th deathdays), and early December (Britten 4th, Mozart 5th
  deathdays).

Widening to weeks makes nearly every window multi-composer, so "birth week / death week"
banners can't be naive. July is the one quiet month (no dates at all).

## Related exploration: timelines (`../quartet-chooser-composers/`)

A separate exploration (not in this repo: `~/Dropbox/Code/quartet-chooser-composers/`, plus the
companion Observable notebook "Quartet Roulette Composer Timeline", also Feb 2023) had two
goals:

1. a site-wide chart showing when the music on the site was written, in timeline form;
2. per-composer timelines showing when each composer's works were written relative to each
   other and to the rest of their lives.

Its `plot.py` (last touched Aug 2024) reads this repo's `src/data/data.json` and renders
composer lifespans as bars with works marked along them.
