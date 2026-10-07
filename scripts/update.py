#!/usr/bin/env python3
"""
The purpose of this script is to pull tabs from the Standard Rep spreadsheet:
https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/

into src/data/data.json for easy use from javascript.

It reads the sheet's "Publish to web" CSV export, so it needs no credentials
and no dependencies beyond the standard library.
"""

import csv
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


def pad(r, n):
    """ pad short rows to the expected length so that every row has the
        same shape.
    """
    diff = n - len(r)
    return r + diff * [u""]


def get_sheet_contents(gid):
    url = '%s?gid=%d&single=true&output=csv' % (PUBLISHED, gid)
    with urllib.request.urlopen(url) as response:
        # An unpublished sheet answers with an HTML page, not an error.
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('text/csv'):
            raise RuntimeError("expected CSV from %s, got %r" % (url, content_type))
        text = response.read().decode('utf-8')
    return list(csv.reader(io.StringIO(text)))


def main():
    fields = {
        'greats': ["composer", "title", "catalog", "completed", "opus_nickname", "work_number", "work_nickname", "key", "notes", "wikipedia", "imslp", "opus_imslp", "opus_notes"],
        'composers': ["name", "birth", "death", "full name", "wikipedia", "portrait", "extra link", "extra link title"],
        'movements': ['composer', 'title', 'catalog', 'grouping', 'work_number', 'movement_number', 'title', 'key', 'spotify', 'notes'],
    }

    data = {}
    for key, gid in GIDS.items():
        values = get_sheet_contents(gid)
        n = len(fields[key])

        # values is csv-formatted, we want dicts.
        # use values[1:] to skip the header row.
        # could probably put some assertion in there
        data[key] = [dict(zip(fields[key], pad(row, n))) for row in values[1:]]
        print("got %d records for sheet '%s'" % (len(data[key]), key))

    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/data/data.json")
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)


if __name__ == '__main__':
    main()
