import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import { defaultLocale, isLocale, localeMeta } from '@/i18n/config';
import { ThemeScript } from '@/components/shell/theme-script';
import { getSiteConfig } from '@/lib/content-source';

const site = getSiteConfig();
import './globals.css';

/**
 * Fonts are self-hosted. No third-party origin is on the critical path —
 * see docs/PERFORMANCE.md and public/fonts/README.md.
 */
const geist = localFont({
  src: [
    { path: '../../public/fonts/Geist-Variable.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
});

const geistMono = localFont({
  src: [{ path: '../../public/fonts/GeistMono-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
  preload: false,
});

const vazirmatn = localFont({
  src: [{ path: '../../public/fonts/Vazirmatn-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-vazirmatn',
  display: 'swap',
  fallback: ['Tahoma', 'system-ui', 'sans-serif'],
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name.en} — ${site.headline.en}`,
    template: `%s — ${site.name.en}`,
  },
  applicationName: site.name.en,
  authors: [{ name: site.name.en, url: site.url }],
  creator: site.name.en,
  manifest: '/site.webmanifest',
  // Every entry here has a real file in public/. tests/unit/assets.test.ts
  // asserts that, because a 404ing icon is invisible until someone installs
  // the app and gets a blank square.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  // Zoom is never disabled.
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05070a' },
    { media: '(prefers-color-scheme: light)', color: '#f7f9fb' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const raw = headerList.get('x-locale') ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const nonce = headerList.get('x-nonce') ?? '';
  const { dir, htmlLang } = localeMeta[locale];

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="dark"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${vazirmatn.variable}`}
      data-html-lang={htmlLang}
    >
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body>{children}</body>
    </html>
  );
}
