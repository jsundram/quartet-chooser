// Route discovery over a built dist/, shared by the test suite and
// scripts/update-fixtures.mjs so the fixture generator and the fixture
// checker cannot drift apart.
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function walk(dir, out = []){
    for (const name of readdirSync(dir)){
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

function routes_in(dir){
    return walk(dir)
        .filter(p => path.basename(p) === 'index.html')
        .map(p => {
            const rel = path.relative(dir, path.dirname(p));
            return rel === '' ? '/' : '/' + rel.split(path.sep).join('/') + '/';
        })
        .sort();
}

export { routes_in, walk };
