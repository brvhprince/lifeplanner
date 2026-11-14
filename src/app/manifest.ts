import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'LifePlanner',
        short_name: 'LifePlanner',
        description: 'A private, self-hosted planner for your money, goals and life.',
        start_url: '/',
        display: 'standalone',
        background_color: '#16192C',
        theme_color: '#4C6FFF',
        icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
    };
}
