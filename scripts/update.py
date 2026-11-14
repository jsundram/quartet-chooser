#!/usr/bin/env python3
"""
The purpose of this script is to pull tabs from the Standard Rep spreadsheet:
https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/

into src/data/data.json for easy use from javascript.

It reads the sheet's "Publish to web" CSV export, so it needs no credentials
and no dependencies beyond the standard library.

Columns are matched by their header, not their position, so they can be
reordered in the sheet freely. A header this script does not know is an error
rather than silently dropped: add it to COLUMNS (or IGNORED) below.

docs/sheet.md describes every column, and which ones other repos read by name.
"""

import csv
import http.client
import io
import json
import os
import urllib.request


PUBLISHED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYXHouw6c6EVOG7Igmew_QMp3Hdg0-WelKZ4kpAKcbb748wByrjSmmrJBi6WK7I_3vb5gF7DB1QIGh/pub'

# Tab gids, from the published sheet's links.
GIDS = {
    'greats': 0,
    'composers': 1606524218,
    'movements': 1782733196,
}

# sheet header -> data.json key, per tab, in the order keys are written.
COLUMNS = {
    'greats': {
        'Composer': 'composer',
        'Title': 'title',
        'Catalog Number': 'catalog',
        'Other Catalog': 'other_catalog',
        'Extra': 'extra',
        'Completed': 'completed',
        'Nickname': 'opus_nickname',
        'Work Number': 'work_number',
        'Work Nickname': 'work_nickname',
        'Key': 'key',
        'Notes': 'notes',
        'Wikipedia': 'wikipedia',
        'IMSLP': 'imslp',
        'Opus IMSLP': 'opus_imslp',
        'Opus Notes': 'opus_notes',
    },
    'composers': {
        'Name': 'name',
        'Birth': 'birth',
        'Death': 'death',
        'Full Name': 'full name',
        'Wikipedia Link': 'wikipedia',
        'Portrait': 'portrait',
        'Extra Link': 'extra link',
        'Extra Link Title': 'extra link title',
    },
    'movements': {
        'Composer': 'composer',
        # the work's Title is not carried: a movement's `title` is its own.
        # Listed here, out of sheet order, where data.json has always had it.
        'Movement Title': 'title',
        'Catalog Number': 'catalog',
        'Grouping': 'grouping',
        'Work Number': 'work_number',
        'Movement Number': 'movement_number',
        'Movement Key': 'key',
        'Spotify Track ID': 'spotify',
        'Notes': 'notes',
    },
}

# headers that exist in the sheet but are not used by the site
IGNORED = {
    'greats': {'Nickname Notes'},
    'composers': set(),
    'movements': {'Title'},
}

# columns holding TRUE/FALSE checkboxes, converted to JSON booleans
BOOLEANS = {
    'greats': {'Extra'},
    'composers': set(),
    'movements': set(),
}


def get_sheet_contents(gid, attempts=3):
    url = '%s?gid=%d&single=true&output=csv' % (PUBLISHED, gid)
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(url) as response:
                # An unpublished sheet answers with an HTML page, not an error.
                content_type = response.headers.get('Content-Type', '')
                if not content_type.startswith('text/csv'):
                    raise RuntimeError("expected CSV from %s, got %r" % (url, content_type))
                text = response.read().decode('utf-8')
            return list(csv.reader(io.StringIO(text)))
        except http.client.IncompleteRead:
            # the export sometimes drops mid-download; a retry gets it whole
            if attempt == attempts:
                raise


def to_bool(value, where):
    v = value.strip().upper()
    if v in ('TRUE', 'FALSE'):
        return v == 'TRUE'
    raise ValueError("%s: expected TRUE or FALSE, got %r" % (where, value))


def records(key, values):
    header = [h.strip() for h in values[0]]
    columns = COLUMNS[key]

    unknown = [h for h in header if h and h not in columns and h not in IGNORED[key]]
    missing = [h for h in columns if h not in header]
    if unknown or missing:
        raise RuntimeError("sheet '%s': unknown columns %r, missing columns %r"
                           % (key, unknown, missing))

    index = {h: header.index(h) for h in columns}
    out = []
    for n, row in enumerate(values[1:], start=2):
        row = row + [''] * (len(header) - len(row))  # short rows: pad
        record = {}
        for h, field in columns.items():
            value = row[index[h]]
            if h in BOOLEANS[key]:
                value = to_bool(value, "sheet '%s' row %d, %s" % (key, n, h))
            record[field] = value
        out.append(record)
    return out


def main():
    data = {}
    for key, gid in GIDS.items():
        data[key] = records(key, get_sheet_contents(gid))
        print("got %d records for sheet '%s'" % (len(data[key]), key))

    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/data/data.json")
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)


if __name__ == '__main__':
    main()
