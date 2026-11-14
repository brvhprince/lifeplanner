/**
 * Project: lifeplanner-webapp
 * File: use-is-mounted
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during server rendering and hydration, true once on the client. */
export function useIsMounted() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
}
