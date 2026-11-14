import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import AppProviders from '@/components/providers/app-providers';
import { APP_NAME } from '@/config';

const inter = Inter({ subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: 'A private, self-hosted planner for your money, goals and life.',
    robots: { index: false, follow: false },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#16192C' },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
