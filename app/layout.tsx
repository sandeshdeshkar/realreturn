import type { Metadata } from 'next'
import { Sora, DM_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

/**
 * realreturn.in — Root Layout
 *
 * Metadata, fonts, and global schema for the entire site.
 * Page-specific metadata can override these via per-page exports.
 */

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const SITE_URL = 'https://www.realreturn.in'
const SITE_NAME = 'realreturn.in'
const SITE_DESCRIPTION =
  'What your money actually earns after tax and inflation. Free tools to compare FD, RD, SIP, PPF and more — in real terms.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Find the Real Return on Your Investment | realreturn.in',
    template: '%s | realreturn.in',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'real return calculator',
    'real return on investment',
    'fd vs sip',
    'fd vs sip calculator',
    'real return after tax and inflation',
    'inflation adjusted return india',
    'fisher equation calculator',
    'mutual fund real return',
    'fd real return india',
    'ppf real return',
    'retirement corpus calculator india',
    'personal financial planner india',
    'post tax return calculator',
  ],
  authors: [{ name: 'realreturn.in' }],
  creator: 'realreturn.in',
  publisher: 'realreturn.in',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Find the Real Return on Your Investment',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'realreturn.in — Real returns after tax and inflation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find the Real Return on Your Investment',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // Replace with your actual GSC verification code if you use the meta-tag method.
    // Currently using DNS verification, so this can be omitted — leaving as placeholder.
    // google: 'YOUR_GSC_VERIFICATION_CODE',
  },
  category: 'finance',
}

// ───── Site-wide structured data (WebSite schema for sitelinks searchbox + entity recognition) ─────
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: 'en-IN',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
}

// Organization schema — supports E-E-A-T without requiring a personal byline
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
  },
  description:
    'realreturn.in builds free tools that show Indian investors what their money actually earns after tax and inflation.',
  knowsAbout: [
    'Real Return Calculation',
    'Fisher Equation',
    'Indian Income Tax',
    'Long Term Capital Gains (LTCG)',
    'Fixed Deposits',
    'Mutual Funds',
    'PPF',
    'NPS',
    'Retirement Planning',
    'Inflation Adjustment',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${dmMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1a6b3c" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {/* Site-wide structured data */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {children}
      </body>
    </html>
  )
}
