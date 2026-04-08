import './globals.css'
import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ErrorBoundary from '@/app/components/ErrorBoundary'
import MobileNav from '@/app/components/MobileNav'

export const metadata: Metadata = {
  title: 'Afterglow Music — Artist Portal',
  description: 'Distribute your music worldwide. Submit releases to Spotify, Apple Music, YouTube Music, and 120+ platforms through Afterglow Music.',
  keywords: ['music distribution', 'music label', 'release management', 'Spotify distribution', 'Apple Music distribution'],
  authors: [{ name: 'Afterglow Music' }],
  creator: 'Afterglow Music',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://afterglowmusic.vercel.app',
    siteName: 'Afterglow Music',
    title: 'Afterglow Music — Artist Portal',
    description: 'Distribute your music worldwide to 120+ platforms.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Afterglow Music' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Afterglow Music — Artist Portal',
    description: 'Distribute your music worldwide to 120+ platforms.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/logos/logo-afterglowmusic.png" />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <MobileNav />
        <SpeedInsights />
      </body>
    </html>
  )
}
