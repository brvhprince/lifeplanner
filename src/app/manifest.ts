import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'LifePlanner',
        short_name: 'LifePlanner',
        description: 'A private, self-hosted planner for your money, goals and life.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#16192C',
        theme_color: '#4C6FFF',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
