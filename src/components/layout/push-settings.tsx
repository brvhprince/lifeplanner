'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import { removePushSubscriptionByEndpoint, savePushSubscription, sendTestPush } from '@/server/push-actions';

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

function detectSupport(): Support {
    if (!window.isSecureContext) return 'insecure';
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    if (ios && !standalone) return 'ios-not-installed';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return 'unsupported';
    return 'supported';
}

/** Turn push notifications on/off for this browser, and send a test. */
const noSubscribe = () => () => {};

export default function PushSettings({ publicKey }: { publicKey: string }) {
    // Browser capabilities don't change while the page is open.
    const browserSupport = useSyncExternalStore<Support>(noSubscribe, detectSupport, () => 'checking');
    const [lookup, setLookup] = useState<'loading' | 'done' | 'failed'>('loading');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (browserSupport !== 'supported') return;
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => reg.pushManager.getSubscription())
            .then((sub) => {
                setSubscription(sub);
                setLookup('done');
            })
            .catch(() => setLookup('failed'));
    }, [browserSupport]);

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
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) });
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
