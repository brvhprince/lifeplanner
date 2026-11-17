/*
 * LifePlanner service worker: shows push notifications and opens the app when
 * one is tapped. It deliberately caches nothing, so no private data is stored
 * offline on the device.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: 'LifePlanner', body: event.data ? event.data.text() : '' };
    }
    event.waitUntil(
        self.registration.showNotification(data.title || 'LifePlanner', {
            body: data.body || '',
            tag: data.tag,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-96.png',
            data: { url: data.url || '/notifications' },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            const existing = windows.find((w) => w.url.startsWith(self.location.origin));
            if (existing) return existing.navigate(url).then((w) => (w || existing).focus());
            return self.clients.openWindow(url);
        })
    );
});
