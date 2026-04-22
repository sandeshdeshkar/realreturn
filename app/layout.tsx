import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Real Return Calculator India — FD vs SIP After Tax & Inflation | realreturn.in',
    template: '%s | realreturn.in',
  },
  description: 'Find out what your FD, RD, and Mutual Fund investments actually earn after tax and inflation. Free real return calculator for Indian investors. No login required.',
  keywords: [
    'real return calculator india',
    'fd vs sip calculator',
    'fd real return after tax inflation',
    'mutual fund vs fd comparison india',
    'sip vs fd which is better',
    'inflation adjusted return calculator',
    'fd interest after tax india',
    'real return on fd india',
    'fd vs mutual fund real return',
    'investment calculator india',
  ],
  authors: [{ name: 'realreturn.in' }],
  creator: 'realreturn.in',
  publisher: 'realreturn.in',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.realreturn.in',
    siteName: 'realreturn.in',
    title: 'Real Return Calculator India — FD vs SIP After Tax & Inflation',
    description: 'Your 7% FD gives -1.04% real return after 30% tax and 6% inflation. See what your investments actually earn. Free calculator, no login.',
    images: [
      {
        url: 'https://www.realreturn.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'realreturn.in — Real return calculator for Indian investors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Return Calculator India — FD vs SIP After Tax & Inflation',
    description: 'Your 7% FD gives -1.04% real return after 30% tax and 6% inflation. Free calculator for Indian investors.',
    images: ['https://www.realreturn.in/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.realreturn.in',
  },
  verification: {
    google: 'add-your-google-search-console-verification-code-here',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="canonical" href="https://www.realreturn.in" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'realreturn.in',
              url: 'https://www.realreturn.in',
              description: 'Free real return calculator for Indian investors — compare FD, RD, and Mutual Funds after tax and inflation',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.realreturn.in/calculator',
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
