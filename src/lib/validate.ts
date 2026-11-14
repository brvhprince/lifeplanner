/** An absolute http(s) URL with a host, e.g. https://example.com/page. */
export function isHttpUrl(value: string) {
    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
    } catch {
        return false;
    }
}

/** Digits with optional +, spaces, brackets and dashes; at least 5 digits. */
export function isPhone(value: string) {
    return /^\+?[\d\s()-]{5,30}$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 5;
}

/** Search query limits shared by the search box, page and server. */
export const SEARCH_MAX_LENGTH = 100;
export const normalizeQuery = (raw: string) => raw.trim().slice(0, SEARCH_MAX_LENGTH);
