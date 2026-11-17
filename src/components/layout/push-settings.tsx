'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import { pushRegistrationStatus, removePushSubscriptionByEndpoint, savePushSubscription, sendTestPush } from '@/server/push-actions';

type Support = 'checking' | 'supported' | 'insecure' | 'ios-not-installed' | 'unsupported';

function base64UrlToBytes(value: string) {
    const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function describeDevice() {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'device';
    return `${browser} on ${device}`;
}

/**
 * Whether the subscription was made with this server's current signing key,
 * or null when the browser doesn't expose the key it used.
 */
function sameKey(subscription: PushSubscription, publicKey: string): boolean | null {
    const key = subscription.options?.applicationServerKey;
    if (!key) return null;
    const expected = base64UrlToBytes(publicKey);
    const actual = new Uint8Array(key);
    return actual.length === expected.length && actual.every((b, i) => b === expected[i]);
}

/**
 * A browser subscription is usable when the server has it under the current
 * key and the browser doesn't report a different key.
 */
async function isActive(subscription: PushSubscription, publicKey: string) {
    if (sameKey(subscription, publicKey) === false) return false;
    return (await pushRegistrationStatus(subscription.endpoint)) === 'current';
}

function detectSupport(): Support {
    if (!window.isSecureContext) return 'insecure';
    // iPadOS Safari in desktop mode reports itself as a Mac; touch support gives it away.
    const ipadDesktop = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || ipadDesktop;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    if (ios && !standalone) return 'ios-not-installed';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return 'unsupported';
    return 'supported';
}

/** Turn push notifications on/off for this browser, and send a test. */
const noSubscribe = () => () => {};

export default function PushSettings({ publicKey }: { publicKey: string | null }) {
    // Browser capabilities don't change while the page is open.
    const browserSupport = useSyncExternalStore<Support>(noSubscribe, detectSupport, () => 'checking');
    const [lookup, setLookup] = useState<'loading' | 'done' | 'failed'>('loading');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (browserSupport !== 'supported' || !publicKey) return;
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => reg.pushManager.getSubscription())
            .then(async (sub) => {
                // "On" only if the server knows this browser and the keys still match
                // (e.g. not after removing the device in Settings or losing vapid.json).
                const active = sub ? await isActive(sub, publicKey!) : false;
                setSubscription(active ? sub : null);
                setLookup('done');
            })
            .catch(() => setLookup('failed'));
    }, [browserSupport, publicKey]);

    const support: Support =
        browserSupport !== 'supported' ? browserSupport : lookup === 'loading' ? 'checking' : lookup === 'failed' ? 'unsupported' : 'supported';

    async function enable() {
        setBusy(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Notifications are blocked. Allow them in your browser settings and try again.');
                return;
            }
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            // Reuse the browser's subscription only when it's certainly made with
            // the current key (browser says so, or the server has it under that
            // key). Otherwise replace it, e.g. after the server's keys changed.
            let sub = await reg.pushManager.getSubscription();
            const reusable = sub && (sameKey(sub, publicKey!) === true || (await pushRegistrationStatus(sub.endpoint)) === 'current');
            if (sub && !reusable) {
                await removePushSubscriptionByEndpoint(sub.endpoint);
                await sub.unsubscribe();
                sub = null;
            }
            sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey!) });
            const saved = await savePushSubscription(sub.toJSON(), describeDevice());
            if (!saved.ok) throw new Error('save failed');
            setSubscription(sub);
            toast.success('Notifications are on for this device');
        } catch {
            toast.error('Couldn’t turn on notifications on this device');
        } finally {
            setBusy(false);
        }
    }

    async function disable() {
        if (!subscription) return;
        setBusy(true);
        try {
            await removePushSubscriptionByEndpoint(subscription.endpoint);
            await subscription.unsubscribe();
            setSubscription(null);
            toast.success('Notifications are off for this device');
        } finally {
            setBusy(false);
        }
    }

    async function test() {
        setBusy(true);
        try {
            const { sent, failed } = await sendTestPush();
            if (sent) toast.success(`Test sent to ${sent} device${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}`);
            else toast.error(failed ? 'The test couldn’t be delivered' : 'No devices have notifications turned on');
        } finally {
            setBusy(false);
        }
    }

    if (!publicKey) {
        return (
            <p className="text-body-2 text-body-muted">
                Push notifications are unavailable because the server couldn’t load its push keys. Delete <code>vapid.json</code> in the data
                folder (or fix the <code>VAPID_*</code> settings) and restart, then turn notifications on again on each device.
            </p>
        );
    }
    if (support === 'checking') return <p className="text-body-2 text-body-muted">Checking this browser…</p>;
    if (support === 'insecure') {
        return <p className="text-body-2 text-body-muted">Push notifications need HTTPS. Open LifePlanner through its https:// address to turn them on.</p>;
    }
    if (support === 'ios-not-installed') {
        return (
            <div className="space-y-2 text-body-2">
                <p>On iPhone and iPad, notifications work once LifePlanner is on your Home Screen (iOS 16.4 or later):</p>
                <ol className="list-decimal space-y-1 pl-5">
                    <li>Tap the Share button in Safari.</li>
                    <li>Choose <strong>Add to Home Screen</strong>.</li>
                    <li>Open LifePlanner from the Home Screen, come back here and turn notifications on.</li>
                </ol>
            </div>
        );
    }
    if (support === 'unsupported') return <p className="text-body-2 text-body-muted">This browser doesn’t support push notifications.</p>;

    return (
        <div className="flex flex-wrap items-center gap-3">
            {subscription ? (
                <>
                    <span className="text-body-2 font-semibold text-success-dark">On for this device</span>
                    <Button variant="outline" className="text-sm" onClick={test} disabled={busy}>
                        Send a test
                    </Button>
                    <Button variant="text" className="text-sm" onClick={disable} disabled={busy}>
                        Turn off here
                    </Button>
                </>
            ) : (
                <Button className="text-sm" onClick={enable} isLoading={busy} disabled={busy}>
                    Turn on notifications on this device
                </Button>
            )}
        </div>
    );
}
