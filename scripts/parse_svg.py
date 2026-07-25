#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "svg.path",
#   "svgpathtools",
# ]
# ///
"""
Extracts a composer's signature from their portrait SVG (the tool that made
the static/*-Signature.svg files, Dec 2021). Finds the leftmost path element,
then chains in every path whose bounding box overlaps the chain within a
buffer (100, determined experimentally), and displays the result.

    uv run scripts/parse_svg.py
"""
from collections import Counter
from pathlib import Path
from xml.dom import minidom
from svg.path import parse_path # doesn't interop with svgpathtools
from svgpathtools import parse_path as parse_path2
from svgpathtools import disvg as display_svg

STATIC = Path(__file__).resolve().parent.parent / 'static'


color = lambda p: p.getAttribute('style').split(';')[0][5:]
length = lambda parsed: parsed.length(error=.1)
name = lambda p: p.getAttribute('id')


def intersects(r1, r2, buffer=0):
    """takes two readable paths and figures out if their bounding boxes intersect"""
    e1, e2 = r1['extent'], r2['extent']

    def within(x, y, extent):
        """true if (x, y) contained in the rect defined by extent"""
        x0, y0, x1, y1 = [extent.get(s) for s in 'x0,y0,x1,y1'.split(',')]
        return x0 - buffer <= x <= x1 + buffer and y0-buffer <= y <= y1 + buffer

    return within(e1['x0'], e1['y0'], e2) or within(e1['x1'], e1['y1'], e2) or \
           within(e2['x0'], e2['y0'], e1) or within(e2['x1'], e2['y1'], e1)

def extent(parsed, n=10):
    samples = [parsed.point(i / n) for i in range(n+1)]
    return dict(
        x0=min(samples, key=lambda p: p.real).real,
        y0=min(samples, key=lambda p: p.imag).imag,
        x1=max(samples, key=lambda p: p.real).real,
        y1=max(samples, key=lambda p: p.imag).imag,
    )

def transform(path, abcdef):
    # width="581.84003"
    # height="688.20001"
    # viewBox="0 0 581.84003 688.20001"
    # <g id="g8" transform="matrix(1.3333333,0,0,-1.3333333,0,688.2)">
    # from https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
    # matrix(a,b,c,d,e,f) is equivalent to applying the transformation matrix:
    # a c e
    # b d f
    # 0 0 1
    #
    # 1.3  0.0   0.0
    # 0.0 -1.3 688.2
    # 0.0  0.0   1.0
    #
    # transforms a point (x, y) via:
    #
    # 1.3 * x +   0 * y + 0
    # 0   * x - 1.3 * y + 688.2
    pass


def get_chain(start, readable, buffer=0):
    """Gets all elements in readable whose bounding boxes overlap start,
        and all elements tangent to them, etc...
    """
    chain = {start['name']: start}
    prev_len = 0
    while len(chain) != prev_len:
        prev_len = len(chain)
        to_add = []
        for e in readable:
            name = e['name']
            if name not in chain:
                for ec in chain.values():
                    if intersects(ec, e, buffer):
                        to_add.append((name, e))
                        print(prev_len, "appending: ", name)
        for (name, e) in to_add:
            chain[name] = e
    return sorted(chain.values(), key=lambda e: e['name'])


def read(filename=STATIC / 'Bach.svg'):
    doc = minidom.parse(str(filename))
    paths = doc.getElementsByTagName('path')
    colors = Counter(map(color, paths))
    print("Colors:", colors)

    # names = list(map(name, paths))
    # lengths = list(map(length, paths))

    readable = []
    for p in paths:
        parsed = parse_path(p.getAttribute('d'))
        # TODO: could use parse_path2 and get p.length and p.bbox
        # to replace length / extent below.
        readable.append(dict(
            name=name(p),
            color=color(p),
            length=length(parsed),
            extent=extent(parsed),
            path=p,
        ))
    return readable


def main():
    # pull the signature out of the Bach image by finding the beginning (leftmost element)
    # and getting everything pretty close (100, determined experimentally) to it.
    r = read()
    letter = min(r, key=lambda p: p['extent']['x0'])
    chain = get_chain(letter, r, 100)

    p, c = zip(*[(parse_path2(e['path'].getAttribute('d')), e['color']) for e in chain])
    display_svg(p) # opens inkscape

if __name__ == '__main__':
    main()
