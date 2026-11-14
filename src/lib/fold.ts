/**
 * Case-insensitive text matching shared by the database search and result
 * highlighting, so both always agree.
 *
 * Each character is folded on its own: decomposed (NFD, so "İ" and "i" + a
 * combining dot become the same sequence) and then upper-cased (avoiding
 * context-dependent lower-casing such as Greek final sigma). Because folding
 * is per character, folded positions map back to the original text.
 */

const foldChar = (ch: string) => ch.normalize('NFD').toUpperCase();

export function fold(text: string) {
    let out = '';
    for (const ch of text) out += foldChar(ch);
    return out;
}

/** Folded text plus, for each folded code unit, the original index it came from. */
function foldWithMap(text: string) {
    let folded = '';
    const starts: number[] = [];
    const ends: number[] = [];
    let i = 0;
    for (const ch of text) {
        const f = foldChar(ch);
        for (let k = 0; k < f.length; k++) {
            starts.push(i);
            ends.push(i + ch.length);
        }
        folded += f;
        i += ch.length;
    }
    return { folded, starts, ends };
}

/** Non-overlapping [start, end) ranges in `text` that match `query`. */
export function findMatches(text: string, query: string): [number, number][] {
    const needle = fold(query);
    if (!needle) return [];
    const { folded, starts, ends } = foldWithMap(text);
    const ranges: [number, number][] = [];
    let from = 0;
    for (let at = folded.indexOf(needle, from); at !== -1; at = folded.indexOf(needle, from)) {
        const range: [number, number] = [starts[at], ends[at + needle.length - 1]];
        const last = ranges[ranges.length - 1];
        if (last && range[0] < last[1]) last[1] = Math.max(last[1], range[1]);
        else ranges.push(range);
        from = at + needle.length;
    }
    return ranges;
}
