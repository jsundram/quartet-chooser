#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "spotipy",
#   "python-dotenv",
# ]
# ///
"""
Find every recording of every Boccherini quartet on Spotify, and keep a record.

Reads every track on every album Spotify credits to Luigi Boccherini, plus
albums and tracks found by searching, and attributes a track to a quartet in
one of two ways:

  G number         the track title carries the quartet's Gérard number.
                   G159-G249 are all quartets, so these are reliable -- and
                   the G number is often the only thing a label gets right
                   (the Guilet G172 is sold as "Op. 10 No. 2" on an album
                   called "Op. 1").
  movement titles  a quartet track with no G number whose movement titles
                   match this quartet's better than any other's. Check these
                   by ear.

The record is docs/boccherini-recordings.csv, one row per track. Rows are only
ever added, so a recording Spotify drops stays on record. A *recording* is a
quartet played by one set of performers: the same performance reissued on a
compilation adds rows but is not new.

Recall is checked on every run: each track the sheet already uses must be
found again, under its quartet. One that isn't either no longer plays (gone)
or was missed by the search.

Two kinds of GitHub issue come out of a run, written to the JSON file given by
--issues FILE for the weekly workflow (.github/workflows/find-recordings.yml):

  - one per recording new since the record was last written (the first run,
    with no record yet, writes it and reports nothing new). It stays open if
    the sheet has no recording of that quartet; otherwise it is for
    information, so it is closed as soon as it is filed;
  - one per quartet whose sheet recording is gone, listing every recording of
    it that still plays.

Both show each recording against the sheet's movements, with a block of track
links in movement order to paste into the Spotify Track ID column. Then

    uv run scripts/find_recordings.py --file-issues FILE

opens them, skipping any whose title matches an open issue -- so a gone
recording is asked about once, not weekly. Tracks the search missed go to
--lost FILE as markdown; the workflow fails on them, since that is a bug here.

Album track lists are cached in .cache/spotify/, so after the first run (a few
minutes, ~3,000 albums) only new albums are fetched. Delete it to start over.

Credentials come from .env at the repo root (see .env.example):
    uv run scripts/find_recordings.py
"""
import collections
import csv
import datetime
import difflib
import itertools
import json
import re
import sys
import unicodedata
from pathlib import Path

import spotipy
from dotenv import load_dotenv
from spotipy.cache_handler import MemoryCacheHandler
from spotipy.oauth2 import SpotifyClientCredentials

sys.path.insert(0, str(Path(__file__).resolve().parent))
from update import GIDS, get_sheet_contents  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / '.cache' / 'spotify' / 'albums'
RECORD = ROOT / 'docs' / 'boccherini-recordings.csv'
FIELDS = ['g', 'opus', 'number', 'key', 'performers', 'album', 'released', 'disc', 'track_number',
          'track', 'track_url', 'album_url', 'matched_by', 'first_seen']
BOCCHERINI = '2l4vGfFV7e46yO8lxfxR76'  # Luigi Boccherini's Spotify artist id
MARKET = 'US'  # where a sheet track must still play

ALBUM_QUERIES = ['quartet', 'quartets', 'string quartets', 'quartetti', 'quartetto', 'cuartetos',
                 'quatuors', 'Streichquartette', 'quartettini', 'opera piccola', 'opera grande']
TRACK_QUERIES = ['string quartet', 'quartetto', 'quartet', 'cuarteto', 'quatuor', 'Streichquartett']

G_NUMBER = re.compile(r'\bG\.?\s?(\d{2,3})\b')
QUARTET = re.compile(r'quart|cuarteto|quatuor', re.I)
NOT_A_QUARTET = re.compile(r'quint|trio|sextet|concert|sonata|symphon|guitar|chitarra|fandango|flute|oboe', re.I)


def ascii(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()


def words(s):
    return re.sub(r'[^a-z ]', ' ', ascii(s).lower()).split()


def sheet():
    """Boccherini's works; each one's movements in order (number, title, track id);
    the works with a movement unrecorded; and track id -> work for every track used."""
    def rows(gid):
        header, *values = get_sheet_contents(gid)
        return [dict(zip([h.strip() for h in header], r)) for r in values]

    works = {r['Catalog Number']: r for r in rows(GIDS['greats']) if r['Composer'] == 'Boccherini'}
    movements = collections.defaultdict(list)
    missing = set()
    chosen = {}  # track id -> quartet, for every recording the sheet already uses
    for r in rows(GIDS['movements']):
        if r['Composer'] != 'Boccherini':
            continue
        g = r['Catalog Number']
        track = re.search(r'/track/(\w+)', r['Spotify Track ID'])
        movements[g].append({'number': r['Movement Number'], 'title': r['Movement Title'],
                             'track': track.group(1) if track else None})
        if track:
            chosen[track.group(1)] = g
        else:
            missing.add(g)
    for ms in movements.values():
        ms.sort(key=lambda m: int(m['number'] or 0))
    return works, movements, missing, chosen


def spotify():
    load_dotenv(ROOT / '.env')
    creds = SpotifyClientCredentials(cache_handler=MemoryCacheHandler())
    return spotipy.Spotify(auth_manager=creds, retries=10, status_forcelist=(429, 500, 502, 503, 504))


def pages(sp, r):
    while r:
        yield from (i for i in r['items'] if i)
        r = sp.next(r) if r['next'] else None


def search(sp, q, kind):
    # Spotify stops at offset 1,000 whatever the total says
    for offset in range(0, 1000, 50):
        r = sp.search(q=q, type=kind, limit=50, offset=offset)[kind + 's']
        yield from (i for i in r['items'] if i)
        if not r['next']:
            break


def album_ids(sp, works):
    ids = {a['id'] for a in pages(sp, sp.artist_albums(
        BOCCHERINI, include_groups='album,single,compilation,appears_on', limit=50))}
    print(f'{len(ids)} albums credited to Boccherini', file=sys.stderr)
    for q in ALBUM_QUERIES:
        ids |= {a['id'] for a in search(sp, 'Boccherini ' + q, 'album')}
    queries = ['Boccherini ' + q for q in TRACK_QUERIES]
    for g in works:
        queries += [f'Boccherini G. {g[1:]}', f'Boccherini {g}']
    for q in queries:
        ids |= {t['album']['id'] for t in search(sp, q, 'track')}
    print(f'{len(ids)} albums after searching', file=sys.stderr)
    return sorted(ids)


def tracks(sp, ids):
    """Every track on these albums, each carrying its album's name, date and id."""
    CACHE.mkdir(parents=True, exist_ok=True)
    fresh = [i for i in ids if not (CACHE / f'{i}.json').exists()]
    print(f'reading {len(fresh)} new albums ({len(ids) - len(fresh)} cached)', file=sys.stderr)
    for n in range(0, len(fresh), 20):
        for a in sp.albums(fresh[n:n + 20])['albums']:
            if not a:
                continue
            keep = ('name', 'id', 'track_number', 'disc_number', 'artists')
            album = {
                'id': a['id'], 'name': a['name'], 'release_date': a['release_date'],
                'tracks': [{k: t[k] for k in keep} for t in pages(sp, a['tracks'])],
            }
            (CACHE / f"{a['id']}.json").write_text(json.dumps(album))
    for i in ids:
        path = CACHE / f'{i}.json'
        if path.exists():  # an album Spotify no longer returns has no file
            album = json.loads(path.read_text())
            for t in album['tracks']:
                yield dict(t, album=album)


def by_boccherini(t):
    return (any(a['id'] == BOCCHERINI for a in t['artists'])
            or 'Boccherini' in t['name'] or 'Boccherini' in t['album']['name'])


def movement_title(name):
    # "String Quartet No. 1, (2. Minuetto-Trio)", "...G. 172: I. Grave, allegro"
    return re.sub(r'^.*?(?:[:(]\s*|\b[IVX]+\.\s)', '', name)


def match(all_tracks, works, movements):
    """(g, track, matched_by) for every track attributable to one of these quartets."""
    unlabelled = collections.defaultdict(list)
    for t in all_tracks:
        if not by_boccherini(t):
            continue
        name = ascii(t['name'])
        gs = {f'G{n}' for n in G_NUMBER.findall(name)}
        for g in gs & works.keys():
            yield g, t, 'G number'
        credited = any(a['id'] == BOCCHERINI for a in t['artists'])
        if (not gs and credited and QUARTET.search(name + ' ' + t['album']['name'])
                and not NOT_A_QUARTET.search(name)):
            label = re.split(r':|\(|\s-\s', name)[0].strip()
            unlabelled[(t['album']['id'], label)].append(t)

    def similarity(a, b):
        return difflib.SequenceMatcher(None, ' '.join(a), ' '.join(b)).ratio()

    # A lone "Adagio" matches half the catalogue, and an excerpt matches
    # whichever quartet shares its tempo marking. Only a whole work counts:
    # as many tracks as the quartet has movements.
    for ts in unlabelled.values():
        titles = [words(movement_title(t['name'])) for t in ts]
        score = {g: sum(max(similarity(x, words(m['title'])) for m in ms) for x in titles) / len(titles)
                 for g, ms in movements.items()}
        best = max(score, key=score.get)
        if score[best] >= 0.8 and len(ts) == len(movements[best]) > 1:
            for t in ts:
                yield best, t, 'movement titles'


def row(g, t, matched_by, works, today):
    w = works[g]
    return {
        'g': g, 'opus': w['Nickname'], 'number': w['Work Number'], 'key': w['Key'],
        'performers': ', '.join(a['name'] for a in t['artists'] if a['id'] != BOCCHERINI),
        'album': t['album']['name'], 'released': t['album']['release_date'],
        'disc': t['disc_number'], 'track_number': t['track_number'], 'track': t['name'],
        'track_url': f"https://open.spotify.com/track/{t['id']}",
        'album_url': f"https://open.spotify.com/album/{t['album']['id']}",
        'matched_by': matched_by, 'first_seen': today,
    }


def recording(r):
    return r['g'], r['performers']


def same_performers(p, q):
    """Labels credit one ensemble differently ("Folies francoises, Les", "Les
    Folies Françoises") and list its players on one release but not the next,
    so compare by words: the same if either's are all among the other's."""
    a, b = set(words(p)), set(words(q))
    return bool(a and b) and (a <= b or b <= a)


def sort_key(r):
    return int(r['g'][1:]), r['performers'], r['released'], r['album_url'], int(r['disc']), int(r['track_number'])


def heading(works, g):
    w = works[g]
    return f"{g}: {w['Nickname']} No. {w['Work Number']} in {w['Key']}"


def cell(s):
    return str(s).replace('|', '\\|')


def paste_block(rs, ms, note=''):
    """One recording on one album, set against the sheet's movements, and the links to paste."""
    rs = sorted(rs, key=lambda r: (int(r['disc']), int(r['track_number'])))
    first = rs[0]
    lines = [f"### {first['performers'] or 'Performers not credited'}{note}",
             f"*{first['album']}* ({first['released'][:4]}), {first['album_url']}", '']
    if len(rs) != len(ms):
        lines += [f'**Check:** {len(rs)} tracks for {len(ms)} movements.', '']
    if any(r['matched_by'] == 'movement titles' for r in rs):
        lines += ['**Check by ear:** matched by movement titles, not G number.', '']
    lines += ['| Movement | In the sheet | On Spotify |', '|---|---|---|']
    for m, r in itertools.zip_longest(ms, rs):
        lines.append(f"| {m['number'] if m else ''} | {cell(m['title']) if m else ''} | {cell(r['track']) if r else ''} |")
    return lines + ['', '```', *(r['track_url'] for r in rs), '```', '']


def albums_of(rows):
    """Each recording's tracks on its most complete, newest album: {performers: [rows]}."""
    by = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rows:
        by[r['performers']][r['album_url']].append(r)
    return {p: max(albums.values(), key=lambda rs: (len(rs), rs[0]['released']))
            for p, albums in by.items()}


PASTE = ("Copy a block of links and paste it into the Spotify Track ID cell of the quartet's "
         'first movement; Sheets fills the rows below.')


def new_recording_issues(new, works, movements, missing):
    """One issue per new recording: a quartet by performers not on record before."""
    for g in sorted({r['g'] for r in new}, key=lambda g: int(g[1:])):
        for performers, rs in sorted(albums_of([r for r in new if r['g'] == g]).items()):
            if g in missing:
                lines = ['**The sheet has no recording of this quartet yet.**', '', PASTE, '']
            else:
                # nothing to do, so it is filed closed: the notification
                # arrives, and nothing is left open waiting on anyone
                lines = ['For information: the sheet already has a recording of this quartet, so nothing '
                         'needs doing. To switch to this one, paste its links as below.', '', PASTE, '']
            lines += paste_block(rs, movements[g])
            lines.append(f'Every recording found: `{RECORD.relative_to(ROOT)}`. '
                         'From `scripts/find_recordings.py`.')
            yield {'title': f"New recording of {heading(works, g)}, by {performers or 'uncredited performers'}",
                   'body': '\n'.join(lines), 'close': g not in missing}


def playable(sp, ids):
    ok = set()
    for n in range(0, len(ids), 50):
        batch = ids[n:n + 50]
        ok |= {i for i, t in zip(batch, sp.tracks(batch, market=MARKET)['tracks']) if t and t.get('is_playable')}
    return ok


def replacement_issue(sp, g, gone, found, works, movements):
    """gone: [(sheet track id, Spotify's track or None)] for one quartet."""
    ms = movements[g]
    lost = {i for i, _ in gone}
    was = {', '.join(a['name'] for a in t['artists'] if a['id'] != BOCCHERINI) for _, t in gone if t}
    album = next((t['album']['name'] for _, t in gone if t), None)
    rows = [r for (h, _), r in found.items() if h == g and r['track_url'].rsplit('/', 1)[1] not in lost]
    alive = playable(sp, [r['track_url'].rsplit('/', 1)[1] for r in rows])
    candidates = albums_of([r for r in rows if r['track_url'].rsplit('/', 1)[1] in alive])

    affected = [m['number'] for m in ms if m['track'] in lost]
    lines = [f"The sheet's recording of this quartet no longer plays on Spotify in the {MARKET}"
             + (f": {', '.join(sorted(was))}, *{album}*." if was else '.'),
             f"{'All' if len(affected) == len(ms) else 'Some'} of its movements are affected "
             f"({', '.join(affected)}).", '']
    if candidates:
        lines += ['## Recordings that still play', '', PASTE, '']
        def reissue(p):
            return any(same_performers(p, w) for w in was)

        for p in sorted(candidates, key=lambda p: (not reissue(p), len(candidates[p]) != len(ms), p)):
            note = ' (same performers: probably the same performance, reissued)' if reissue(p) else ''
            lines += paste_block(candidates[p], ms, note)
    else:
        lines += ['No other recording of this quartet plays on Spotify. Clear its Spotify Track ID cells, '
                  'so the site shows no play button for it.', '']
    lines += ['<details><summary>The links that stopped playing</summary>', '']
    lines += [f'- Movement {m["number"]}: https://open.spotify.com/track/{m["track"]}' for m in ms if m['track'] in lost]
    lines += ['', '</details>', '', f'From `scripts/find_recordings.py`.']
    return {'title': f'Replace the recording of {heading(works, g)}', 'body': '\n'.join(lines)}


def recall(sp, chosen, found):
    """Check every track the sheet uses was found again: ({g: [(id, track)]} gone, markdown or None for missed)."""
    lost = sorted(i for i, g in chosen.items() if (g, i) not in found)
    # Most of the sheet's links are to album variants Spotify has since
    # withdrawn; it relinks them to a current copy of the same recording, and
    # the copy is what the search finds. Ask for the track in a market to learn
    # which copy plays there.
    gone = collections.defaultdict(list)
    missed = []
    for n in range(0, len(lost), 50):
        batch = lost[n:n + 50]
        for i, t in zip(batch, sp.tracks(batch, market=MARKET)['tracks']):
            g = chosen[i]
            if not t or not t.get('is_playable'):
                gone[g].append((i, t))
            elif (g, t['id']) not in found:
                artists = ', '.join(a['name'] for a in t['artists'])
                missed.append(f"- {g}: {t['name']} ({artists}) on \"{t['album']['name']}\", "
                              f'https://open.spotify.com/track/{i}')
    print(f'recall: {len(chosen) - len(lost)} of {len(chosen)} sheet tracks found directly, '
          f'{len(lost) - len(missed) - sum(map(len, gone.values()))} through relinking, '
          f'{sum(map(len, gone.values()))} gone, {len(missed)} missed', file=sys.stderr)
    if not missed:
        return gone, None
    return gone, '\n'.join(['### Sheet tracks the search missed', '',
                            'These still play, so the search needs improving.', ''] + missed)


def file_issues(path):
    """Open each issue in the JSON file whose title no open issue has, closing those marked 'close'."""
    import subprocess
    gh = ['gh', 'issue']
    open_titles = {i['title'] for i in json.loads(subprocess.run(
        gh + ['list', '--state', 'open', '--limit', '1000', '--json', 'title'],
        check=True, capture_output=True, text=True).stdout)}
    for issue in json.loads(Path(path).read_text()):
        if issue['title'] in open_titles:
            print('already open:', issue['title'], file=sys.stderr)
            continue
        url = subprocess.run(gh + ['create', '--assignee', 'jsundram', '--title', issue['title'],
                                   '--body', issue['body']],
                             check=True, capture_output=True, text=True).stdout.strip()
        print('opened:', url, issue['title'], file=sys.stderr)
        if issue.get('close'):
            subprocess.run(gh + ['close', url, '--reason', 'not planned'], check=True)


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def main():
    if arg('--file-issues'):
        return file_issues(arg('--file-issues'))
    today = datetime.date.today().isoformat()

    works, movements, missing, chosen = sheet()
    sp = spotify()
    found = {}
    for g, t, matched_by in match(tracks(sp, album_ids(sp, works)), works, movements):
        found.setdefault((g, t['id']), row(g, t, matched_by, works, today))

    gone, missed = recall(sp, chosen, found)
    if missed:
        print(missed, file=sys.stderr)
        if arg('--lost'):
            Path(arg('--lost')).write_text(missed)

    old = list(csv.DictReader(RECORD.open())) if RECORD.exists() else []
    known = {(r['g'], r['track_url']) for r in old}
    added = [r for (g, _), r in found.items() if (g, r['track_url']) not in known]
    recorded = collections.defaultdict(set)
    for r in old:
        recorded[r['g']].add(r['performers'])
    new = [r for r in added if not any(same_performers(r['performers'], q) for q in recorded[r['g']])]
    new = new if old else []

    rows = sorted(old + added, key=sort_key)
    with RECORD.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} tracks of {len({r['g'] for r in rows})} of {len(works)} quartets on record, "
          f'{len(added)} added, {len({recording(r) for r in new})} new recordings', file=sys.stderr)

    issues = list(new_recording_issues(new, works, movements, missing))
    issues += [replacement_issue(sp, g, gone[g], found, works, movements)
               for g in sorted(gone, key=lambda g: int(g[1:]))]
    for issue in issues:
        print(f"\n# {issue['title']}\n\n{issue['body']}")
    if arg('--issues') and issues:
        Path(arg('--issues')).write_text(json.dumps(issues, indent=1))


if __name__ == '__main__':
    main()
