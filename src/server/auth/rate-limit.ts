import 'server-only';

/**
 * In-memory limiter for failed sign-in attempts. One process serves the whole
 * app, so memory is enough; a restart clears it, which is acceptable here.
 */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;

const failures = new Map<string, number[]>();

function recent(key: string) {
    const cutoff = Date.now() - WINDOW_MS;
    const list = (failures.get(key) ?? []).filter((t) => t > cutoff);
    if (list.length) failures.set(key, list);
    else failures.delete(key);
    return list;
}

export function isRateLimited(key: string) {
    return recent(key).length >= MAX_FAILURES;
}

export function recordFailure(key: string) {
    failures.set(key, [...recent(key), Date.now()]);
}

export function clearFailures(key: string) {
    failures.delete(key);
}
