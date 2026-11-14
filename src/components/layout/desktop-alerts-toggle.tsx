'use client';

import { useSyncExternalStore } from 'react';
import Button from '@/components/ui/button';

type State = 'unsupported' | NotificationPermission;

const listeners = new Set<() => void>();
const getState = (): State => (typeof Notification === 'undefined' || !window.isSecureContext ? 'unsupported' : Notification.permission);
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

export default function DesktopAlertsToggle() {
    const state = useSyncExternalStore(subscribe, getState, () => 'default' as State);

    if (state === 'unsupported') {
        return (
            <p className="text-body-2 text-body-muted">
                Desktop alerts need HTTPS (or localhost). Notifications still appear here and on the bell.
            </p>
        );
    }
    if (state === 'granted') return <p className="text-body-2">Desktop alerts are on while LifePlanner is open in a tab.</p>;
    if (state === 'denied') return <p className="text-body-2 text-body-muted">Desktop alerts are blocked in your browser settings.</p>;

    return (
        <Button
            variant="outline"
            className="text-sm"
            onClick={async () => {
                await Notification.requestPermission();
                listeners.forEach((l) => l());
            }}
        >
            Turn on desktop alerts
        </Button>
    );
}
