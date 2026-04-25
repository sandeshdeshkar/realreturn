// app/fd-vs-sip/page.tsx
// Server component — metadata + JSON-LD schemas + renders client component

import type { Metadata } from 'next'
import FdVsSipHub from '@/components/FdVsSipHub'

export const metadata: Metadata = {
  title: 'FD vs SIP: Fixed Deposit vs Mutual Fund SIP Calculator — realreturn.in',
  description: 'Compare Fixed Deposit (FD) vs SIP in Equity Mutual Funds — see estimated real returns after tax and inflation. Enter your amount, duration and tax slab. FD at 7% vs SIP at 12% — who wins after 30% tax and 6% inflation?',
  alternates: { canonical: 'https://www.realreturn.in/fd-vs-sip' },
  openGraph: {
    title: 'FD vs SIP: Which is Better? — realreturn.in',
    description: 'See estimated FD vs SIP returns after tax and inflation. Free calculator for Indian investors.',
    url: 'https://www.realreturn.in/fd-vs-sip',
    siteName: 'realreturn.in',
    type: 'website',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',                              item: 'https://www.realreturn.in' },
      { '@type': 'ListItem', position: 2, name: 'FD vs SIP (Equity Mutual Funds)',   item: 'https://www.realreturn.in/fd-vs-sip' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FD vs SIP Calculator — Fixed Deposit vs Equity Mutual Fund SIP',
    url: 'https://www.realreturn.in/fd-vs-sip',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    description: 'Calculate and compare estimated returns from Fixed Deposit (FD) vs SIP in Equity Mutual Funds after tax and inflation. Adjust monthly amount, duration, FD rate, SIP return, and income tax slab.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is SIP in Equity Mutual Funds better than Fixed Deposit for all investors?',
        acceptedAnswer: { '@type': 'Answer', text: 'Not necessarily. Based on estimated returns, SIP in Equity Mutual Funds tends to deliver higher real returns for investors in the 20–30% tax bracket investing for 5+ years. Fixed Deposit may be more suitable for goals under 3 years, emergency funds, or lower tax brackets. Actual SIP returns are not guaranteed and depend on market performance.' },
      },
      {
        '@type': 'Question',
        name: 'Why does Fixed Deposit show a negative real return after tax?',
        acceptedAnswer: { '@type': 'Answer', text: 'For a 30% tax bracket investor: Fixed Deposit at 7% gives approximately 4.9% after tax. With 6% annual inflation, the estimated real return is around -1.0% per year — purchasing power falls even as the balance grows. At 0% tax, FD estimated real return is approximately +0.9% per year.' },
      },
      {
        '@type': 'Question',
        name: 'What is SIP in Equity Mutual Funds?',
        acceptedAnswer: { '@type': 'Answer', text: 'SIP (Systematic Investment Plan) in Equity Mutual Funds means investing a fixed amount every month into a diversified equity mutual fund. Returns are market-linked and not guaranteed, unlike a Fixed Deposit which offers guaranteed returns. SIPs benefit from rupee cost averaging and compounding over long periods.' },
      },
      {
        '@type': 'Question',
        name: 'What happens to Equity Mutual Fund SIP if markets fall?',
        acceptedAnswer: { '@type': 'Answer', text: 'Portfolio value falls temporarily when markets drop. In 2020, equity mutual fund portfolios fell approximately 35% before recovering. Historically, diversified equity SIPs held for 10+ years in India have not delivered negative returns — but past performance is not a guarantee of future results. Fixed Deposits are unaffected by market movements.' },
      },
      {
        '@type': 'Question',
        name: 'Can I invest in both Fixed Deposit and Equity Mutual Fund SIP?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. A common approach: keep 3–6 months of expenses in Fixed Deposit as an emergency fund, and invest additional savings via SIP in Equity Mutual Funds for longer-term goals. The appropriate split depends on individual goals, risk comfort, and time horizon.' },
      },
    ],
  },
]

export default function FdVsSipPage() {
  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <FdVsSipHub />
    </>
  )
}
