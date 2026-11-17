/**
 * Push services browsers use. Subscriptions pointing anywhere else are
 * rejected, so the server never makes push requests to arbitrary hosts
 * (e.g. services on the local network). Extra hosts can be allowed with
 * PUSH_ALLOWED_HOSTS (comma-separated) for unusual browsers.
 */
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'push.apple.com', 'push.services.mozilla.com', 'notify.windows.com'];

function matches(host: string, allowed: string) {
    return host === allowed || host.endsWith(`.${allowed}`);
}

export function isAllowedPushEndpoint(endpoint: string, extraHosts: string[] = []) {
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        return false;
    }
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return [...PUSH_HOSTS, ...extraHosts].some((allowed) => matches(host, allowed.trim().toLowerCase()));
}
