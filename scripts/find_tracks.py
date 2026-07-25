#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "spotipy",
#   "python-dotenv",
# ]
# ///
"""
Data-entry accelerator for the Standard Rep spreadsheet's Spotify column.

Queries a Spotify album (by artist+title or URL), parses the classical track
titles into opus / work number / movement, and writes a <composer>.csv whose
columns match the sheet that update.py pulls into data.json. Used to enter
e.g. the Brahms quartets and Bach's Art of Fugue; mostly driven interactively
(see the comments throughout).

Credentials come from .env at the repo root (see .env.example):
    uv run scripts/find_tracks.py
"""
import csv
from pathlib import Path
from urllib.parse import quote

import spotipy
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv(Path(__file__).resolve().parent.parent / '.env')
creds = SpotifyClientCredentials()  # reads SPOTIPY_CLIENT_ID / SPOTIPY_CLIENT_SECRET
sp = spotipy.Spotify(auth_manager=creds)

PREFIXES = ["Op.", "K.", "Sz.", "D. ", "BWV "]
# Beethoven: tracks = find_tracks.query("Emerson String Quartet", "Beethoven:The String Quartets")
def name(t):
    name = t['name']

    if ', MWV' in name: # mendelssohn
        name = name[:name.find(', MWV')] + name[name.find(':'):]

    candidates = []
    for p in PREFIXES:
        op = name.find(p)
        colon = max(name.rfind(':'), 0) # if there are multiple colons, we have problems ..
        mvmt = name[colon+1:]
        cat = name[op:colon]
        candidates.append((cat, mvmt))
    return sorted(candidates, key=lambda kv: len(kv[0]), reverse=True)[0]


def catalog_opus_number(s):
    opus, number = '', ''
    # I mean, I may as well use a regex at this point
    if s:
        if 'No. ' in s:
            number = int(s[s.index('No. ')+4])
        elif 'No.' in s:
            number = int(s[s.index('No.')+3])

        op = s.index('Op.')
        if 0 <= op:
            ix = op + 3
            try:
                end = s.index(' ', ix+1)
            except ValueError:
                # no space found
                end = None

            opus = int(''.join(c for c in s[ix:end] if c.isdigit()))

    return opus, number


def mvmt_no(s):
    s = s.strip()
    no = s[:s.find('.')]
    roman = dict(zip("I.II.III.IV.V.VI.VII".split("."), range(1, 8)))
    try:
        return int(no)
    except ValueError:
        pass

    try:
        return roman[no]
    except KeyError:
        pass
    return None


def mvmt_title(s):
    dot = max(s.find('.')+1, 0)
    return s[dot:].strip().removesuffix(" - Live")

# String Quartet No. 1 in C Major, Op. 49: I. Moderato - Live
def catalog(s):
    """Pull out catalog number, if applicable """
    opus, number = 0, ''
    if s:
        for p in PREFIXES:
            op = s.find(p)
            if 0 <= op:
                ix = op + len(p)
                try:
                    end = s.index(':', ix)
                except ValueError:
                    # no space found
                    end = None

                opus = int(''.join(c for c in s[ix:end] if c.isdigit()))

    return opus, number


def key(t):
    cat, mvmt = name(t)
    mvmt = mvmt_no(mvmt) or t.get('track_number', 0)
    opus, number = catalog(cat)
    opus = opus if isinstance(opus, int) else 0
    number = number if isinstance(number, int) else 0
    mvmt = mvmt if isinstance(mvmt, int) else 0
    return (opus, number, mvmt)

# catalog = catalog_opus_number
key=lambda t: t['track_number']
def test(t, header=True):

    def print_header():
        print("Original\t\t\tCatalog, No. Mvmt, title, trackId")

    if isinstance(t, list):
        print_header() if header else None

        for track in sorted(t, key=key):
            test(track, header=False)
    elif isinstance(t, dict):
        cat, mvmt = name(t)
        mvmt_num = mvmt_no(mvmt) or t['track_number']
        opus, number = catalog(cat)
        opus = opus if isinstance(opus, int) else 0
        number = number if isinstance(number, int) else 0
        mvmt_num = mvmt_num if isinstance(mvmt_num, int) else 0

        print_header() if header else None
        print(opus, number, mvmt_num, f'{mvmt_title(mvmt):<50}', t['id'], "\t|\t", t['name'])


def write_tracks(tracks, composer, header=False):
    fields = "Composer;Title;Catalog Number;Grouping;Work Number;Movement Number;Movement Title;Movement Key;Spotify Track ID;Notes".split(';')
    rows = []

    title, prev = 0, None
    for t in sorted(tracks, key=key):
        cat, mvmt = name(t)
        opus, number = catalog(cat)
        if  (opus, number) != prev:
            title += 1
            prev = (opus, number)

        rows.append({
            'Composer': composer.title(),
            'Title': title,
            'Catalog Number': 'Opus %d' % opus, # 'Opus %s' % opus,
            'Grouping': '',
            'Work Number': number,
            'Movement Number': mvmt_no(mvmt),
            'Movement Title': mvmt_title(mvmt),
            'Movement Key': '',
            'Spotify Track ID': "https://open.spotify.com/track/" + t['id'],
            'Notes': ''
        })

    filename = "%s.csv" % composer.lower()
    with open(filename, 'w') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader() if header else None
        w.writerows(rows)
        print("Wrote %d movements to %s" % (len(rows), filename))

# each track object looks like this:
"""
{
    'album':
    {
        'album_type': 'album',
        'artists': [{'external_urls': {'spotify': 'https://open.spotify.com/artist/3jOstUTkEu2JkjvRdBA5Gu'}, 'href': 'https://api.spotify.com/v1/artists/3jOstUTkEu2JkjvRdBA5Gu', 'id': '3jOstUTkEu2JkjvRdBA5Gu', 'name': 'Weezer', 'type': 'artist', 'uri': 'spotify:artist:3jOstUTkEu2JkjvRdBA5Gu'}],
        'available_markets': ['CA', 'JP', 'MX', 'US'],
        'external_urls': {'spotify': 'https://open.spotify.com/album/6v8wNjiQDhDijoapXXZ9mZ'},
        'href': 'https://api.spotify.com/v1/albums/6v8wNjiQDhDijoapXXZ9mZ',
        'id': '6v8wNjiQDhDijoapXXZ9mZ',
        'images': [{'height': 640, 'url': 'https://i.scdn.co/image/ab67616d0000b273464da76fa0e1570e1844b622', 'width': 640}, {'height': 300, 'url': 'https://i.scdn.co/image/ab67616d00001e02464da76fa0e1570e1844b622', 'width': 300}, {'height': 64, 'url': 'https://i.scdn.co/image/ab67616d00004851464da76fa0e1570e1844b622', 'width': 64}],
        'name': 'Weezer (Red Album)',
        'release_date': '2008-01-01',
        'release_date_precision': 'day',
        'total_tracks': 14,
        'type': 'album',
        'uri': 'spotify:album:6v8wNjiQDhDijoapXXZ9mZ'
    },

    'artists': [{'external_urls': {'spotify': 'https://open.spotify.com/artist/3jOstUTkEu2JkjvRdBA5Gu'}, 'href': 'https://api.spotify.com/v1/artists/3jOstUTkEu2JkjvRdBA5Gu', 'id': '3jOstUTkEu2JkjvRdBA5Gu', 'name': 'Weezer', 'type': 'artist', 'uri': 'spotify:artist:3jOstUTkEu2JkjvRdBA5Gu'}],
    'available_markets': ['CA', 'JP', 'MX', 'US'],
    'disc_number': 1,
    'duration_ms': 164693,
    'explicit': False,
    'external_ids': {'isrc': 'USUM70811684'},
    'external_urls': {'spotify': 'https://open.spotify.com/track/4r53Y7uKvyXCU7a9dsnb58'},
    'href': 'https://api.spotify.com/v1/tracks/4r53Y7uKvyXCU7a9dsnb58',
    'id': '4r53Y7uKvyXCU7a9dsnb58',
    'is_local': False,
    'name': 'Troublemaker',
    'popularity': 52,
    'preview_url': 'https://p.scdn.co/mp3-preview/123015d876a1ba2616ac16b5e689a82b47966433?cid=9c4d88ab97ac4bb7979f398627c764c3',
    'track_number': 1,
    'type': 'track',
    'uri': 'spotify:track:4r53Y7uKvyXCU7a9dsnb58'
}
"""
def to_q(d):
    return " ".join("'%s': %s" % (k, quote(v)) for (k, v) in d.items())

def show_response(tracks, offset=0):
    for i, t in enumerate(sorted(tracks['items'], key=lambda t: t['name'], reverse=False), offset+1):
        if 'track' in t and isinstance(t['track'], dict):
            t = t['track']

        artists = ', '.join([a['name'] for a in  t['artists']])
        print("%d %s - %s - %s [%s]" % (i, t['name'], t['album']['name'], artists, t['id']))


def show_tracks(tracks):
    for i, t in enumerate(tracks, 1):
        if 'track' in t and isinstance(t['track'], dict):
            t = t['track']

        artists = ', '.join([a['name'] for a in  t['artists']])
        print("%d %s - %s - %s [%s]" % (i, t['name'], t.get('album', {}).get('name', ''), artists, t['id']))


# TODO: get Brahms quartets from this playlist:
# https://open.spotify.com/playlist/2hv0Pt3AaYgqE7Lb2bqBtM?si=892d1e9d3bef4c6d
# (Artemis Quartet + Artemis Quartett... 2 different albums, 2001 (#2) and 2015 (1/3)
# can do:
# tracks = sp.playlist_items('https://open.spotify.com/playlist/2hv0Pt3AaYgqE7Lb2bqBtM?si=c7a3c13654a6405c')
# find_tracks.test([t['track'] for t in tracks['items']])
#
# Art of fugue candidates:
# Keller Quartet: https://open.spotify.com/album/1qNCSJJHFZTj7ZNMSu8ypI (20)
# Emerson: https://open.spotify.com/album/6wwT6p37H1xtQzo3MUz0VU?si=I7Rp43ghTOm_yO2WKHKQKg (22)
# Juilliard
def query(artist, album):
    sp = spotipy.Spotify(auth_manager=creds)
    if not album.startswith('http'):
        filters = dict(artist=artist, album=album)
        r = sp.search(q=to_q(filters), limit=50, type="album")
        matches = [a for a in r['albums']['items'] if a['name'] == album and artist in set(ar['name'] for ar in a['artists'])]
        album_id = matches[0]['id']
    else:
        album_id = album.split('/')[-1].split('?')[0]

    r = sp.album_tracks(album_id) # max 50 tracks
    tracks = r['items']
    to_get = r['total']

    while r['next']:
        r = sp.next(r)
        tracks.extend(r['items'])
        print(r['next'], r['offset'], r['total'])

    print("Got %d tracks out of %d promised" % (len(tracks), to_get))
    return sorted(tracks, key=lambda t: t['name'], reverse=False)


def main():
    tracks = query("Keller Quartet", "https://open.spotify.com/album/1qNCSJJHFZTj7ZNMSu8ypI?si=LX1Dcwp9S4uVcr3znUcnoQ")
    test(tracks)
    # debug problems with parsing catalog / opus / numbers out ...
    # print(name(tracks[1]))
    # cat, mvmt = find_tracks.name(tracks[0])
    # mvmt_no(mvmt)
    write_tracks(tracks, "Bach")


if __name__ == '__main__':
    main()
