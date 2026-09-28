import type { Metadata, Viewport } from 'next'
import './globals.css'

// Deliberately no next/font/google: it fetches at build time, and system fonts
// cost zero bytes on a metered connection.

export const metadata: Metadata = {
  title: 'Kansai 2026',
  description: 'Osaka · Arima Onsen · Kyoto — 19–26 September 2026',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Kansai',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  )
}
