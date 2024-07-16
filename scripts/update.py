#!/usr/bin/env python3
"""
The purpose of this script is to pull tabs from the Standard Rep spreadsheet:
https://docs.google.com/spreadsheets/d/1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4/

into two csvs for easy use from javascript.


Arguably this could be done in JS or in the app itself; but I already knew how
to do it this way.
"""

import argparse
import csv
import json
import os
import sys
import time

from datetime import timedelta
from fastcache import lru_cache

# sheet_utils was developed for my `chamber_music_played` project and copied here.
import sheet_utils


SHEET_ID = '1Q9MVjq5rOm-vZsfmm1ACg47Q4086W_8Obvn2UqjvrP4'
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".sheet_cache")


def pad(r, n):
    """ sheets api returns the first part of a row if last part is empty;
        fix by padding to the expected length so that every row has the
        same shape.
    """
    diff = n - len(r)
    return r + diff * [u""]


def get_sheet_contents(name, cache_days=0):
    """ Hits the google sheets API if cache_days=0 or no cached data found."""
    path = os.path.dirname(os.path.abspath(__file__))
    filename = os.path.join(CACHE_DIR, SHEET_ID + " - " + name + ".json")
    values = None
    if os.path.exists(filename):
        td = time.time() - os.path.getmtime(filename)
        d = timedelta(seconds=td)
        if d.days >= cache_days:
            print("Cached data is %d days old; refreshing" % d.days)
        else:
            print("Cached data is %d days old, re-using since that's less than %d days" % (d.days, cache_days))
            with open(filename) as f:
                values = json.load(f)

    if values is None:
        values = sheet_utils.get_values(SHEET_ID, name)
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(filename, "w") as f:
            json.dump(values, f, indent=4)

    return values


def main(cache_days):
    fields = {
        'greats': ["composer", "title", "catalog", "completed", "opus_nickname", "work_number", "work_nickname", "key", "notes", "wikipedia", "imslp", "opus_imslp", "opus_notes"],
        'composers': ["name", "birth", "death", "full name", "wikipedia", "portrait", "extra link", "extra link title"],
        'movements': ['composer', 'title', 'catalog', 'grouping', 'work_number', 'movement_number', 'title', 'key', 'spotify', 'notes'],
    }

    data = {}
    for sheet_name in ["The Greats", "The Composers", "The Movements"]:
        values = get_sheet_contents(sheet_name, cache_days=cache_days)

        key = sheet_name.split(' ')[1].lower()
        n = len(fields[key])

        # values is csv-formatted, we want dicts.
        # use values[1:] to skip the header row.
        # could probably put some assertion in there
        data[key] = [dict(zip(fields[key], pad(row, n))) for row in values[1:]]
        print("got %d records for sheet '%s'" % (len(data[key]), sheet_name))

    filename = os.path.join("../src/data/data.json")
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Pull Google Sheet to data JSON')
    ap.add_argument("-c", "--cache_days", nargs='?', type=int, default=1,
        help='Days after which to invalidate the cache')
    args = ap.parse_args()
    main(args.cache_days)
