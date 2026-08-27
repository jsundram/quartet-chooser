// The bits scripts/make-og.mjs and scripts/make-icons.mjs both need to talk to
// rsvg-convert and pngquant. Shared rather than copied because the exit-code
// handling below is a magic number with a footgun attached, and two copies of
// that would drift.
import { execFileSync } from 'node:child_process'

// pngquant's exit status when --skip-if-larger declines to write, i.e. when
// quantizing this image would not actually make it smaller.
const PNGQUANT_SKIPPED = 98;

// Compress in place, and treat "I left it alone" as success.
//
// The trap: --skip-if-larger is the *right* flag -- it stops us shipping a
// palettized file bigger than the original -- but pngquant signals the skip
// with a NON-ZERO exit, and execFileSync throws on non-zero. So the flag that
// exists to make the pipeline safe is the one that aborts it, part-way through
// a run, on whichever image happened not to benefit. The rsvg output already
// sitting at `file` is the correct result in that case; keep it and move on.
//
// Returns true if the file was actually quantized, false if pngquant declined.
function quantize(file){
    try {
        execFileSync('pngquant', ['--force', '--skip-if-larger', '--speed', '1',
                                  '--output', file, file]);
        return true;
    } catch (e) {
        if (e.status === PNGQUANT_SKIPPED) return false;
        throw e;
    }
}

function rasterize_svg(svg_path, { width, height, out }){
    execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height),
                                  svg_path, '-o', out]);
}

function require_tools(){
    for (const tool of ['rsvg-convert', 'pngquant']){
        try {
            execFileSync(tool, ['--version'], { stdio: 'ignore' });
        } catch (e) {
            if (e.code !== 'ENOENT') continue; // it ran; a nonzero --version is its business
            throw new Error(`${tool} not found: brew install librsvg pngquant`);
        }
    }
}

export { PNGQUANT_SKIPPED, quantize, rasterize_svg, require_tools };
