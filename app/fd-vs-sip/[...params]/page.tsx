import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PAGE_CONFIGS, getConfig } from '../../../lib/fd-sip-configs'
import { calculate, fmtL, fmtPct } from '../../../lib/fd-sip-calculator'
import FdVsSipPage from '../../../components/FdVsSipPage'

export async function generateStaticParams() {
  return PAGE_CONFIGS.map(config => ({
    params: config.slug,
  }))
}

export async function generateMetadata(
  props: { params: Promise<{ params: string[] }> }
): Promise<Metadata> {
  const rawParams = await props.params
  const slugParts: string[] = Array.isArray(rawParams)
    ? rawParams
    : (rawParams as any).params ?? Object.values(rawParams)[0]

  const config = getConfig(slugParts)
  if (!config) return {}

  return {
    title: config.title,
    description: config.metaDescription,
    openGraph: {
      title: config.title,
      description: config.metaDescription,
      url: `https://www.realreturn.in/fd-vs-sip/${config.slug.join('/')}`,
      siteName: 'realreturn.in',
      type: 'website',
    },
    alternates: {
      canonical: `https://www.realreturn.in/fd-vs-sip/${config.slug.join('/')}`,
    },
  }
}

export default async function Page(
  props: { params: Promise<{ params: string[] }> }
) {
  const rawParams = await props.params
  const slugParts: string[] = Array.isArray(rawParams)
    ? rawParams
    : (rawParams as any).params ?? Object.values(rawParams)[0]

  const config = getConfig(slugParts)
  if (!config) notFound()

  const result  = calculate(config!.inputs)
  const slugStr = config!.slug.join('/')

  const breadcrumbs = [
    { label: 'Home',      href: '/' },
    { label: 'FD vs SIP', href: '/fd-vs-sip' },
    ...config!.slug.slice(0, -1).map((seg: string, i: number) => ({
      label: seg.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      href:  `/fd-vs-sip/${config!.slug.slice(0, i + 1).join('/')}`,
    })),
    { label: config!.slug[config!.slug.length - 1].replace(/-/g, ' ') },
  ]

  const related = (config!.relatedSlugs ?? []).map((slug: string) => {
    const rc = PAGE_CONFIGS.find(c => c.slug.join('/') === slug)
    if (!rc) return null
    const rr = calculate(rc.inputs)
    return {
      slug,
      title:  rc.h1,
      tag:    deriveTag(config!.slug, rc.slug),
      sipL:   fmtL(rr.sip.postTaxCorpus),
      fdL:    fmtL(rr.fd.postTaxCorpus),
    }
  }).filter(Boolean)

  const schemas = buildSchemas(config!, result, slugStr)

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <FdVsSipPage
        config={config!}
        result={result}
        breadcrumbs={breadcrumbs}
        related={related}
      />
    </>
  )
}

function deriveTag(currentSlug: string[], targetSlug: string[]): string {
  const curAmount    = currentSlug.find(s => s.includes('per-month'))
  const targetAmount = targetSlug.find(s => s.includes('per-month'))
  const curYears     = currentSlug.find(s => s.includes('years'))
  const targetYears  = targetSlug.find(s => s.includes('years'))

  if (curAmount !== targetAmount) {
    const cur = parseInt(curAmount ?? '0')
    const tgt = parseInt(targetAmount ?? '0')
    return tgt > cur ? 'More amount' : 'Less amount'
  }
  if (curYears !== targetYears) {
    const cur = parseInt(curYears ?? '0')
    const tgt = parseInt(targetYears ?? '0')
    return tgt > cur ? 'Longer duration' : 'Shorter duration'
  }
  return 'Similar'
}

// ── FAQPage schema — must mirror the on-page FAQs ──
// Source: components/FdVsSipPage.tsx → faqs array (which falls back to
// auto-generated when config.faqs is not set). Keeping schema in sync
// with visible FAQs is a Google requirement for FAQ rich results.
//
// If a config defines its own faqs[], those are used. Otherwise the same
// 5 auto-generated questions appear here as on-page.
function buildSchemas(config: any, result: any, slugStr: string) {
  const url     = `https://www.realreturn.in/fd-vs-sip/${slugStr}`
  const sipNomL = fmtL(result.sip.nominalCorpus)
  const fdNomL  = fmtL(result.fd.nominalCorpus)
  const sipL    = fmtL(result.sip.postTaxCorpus)
  const fdL     = fmtL(result.fd.postTaxCorpus)
  const fdRealL = fmtL(result.fd.realCorpus)
  const investedL = fmtL(result.sip.totalInvested)
  const gapL    = fmtL(result.gapAmount)
  const sipPct  = fmtPct(result.sip.realReturnPct)
  const fdPct   = fmtPct(result.fd.realReturnPct)
  const { monthlyAmount, durationYears, fdRate, sipCagr, taxSlab, inflationRate } = config.inputs
  const amountStr = monthlyAmount.toLocaleString('en-IN')

  // Use config.faqs if set, else build the same 5 auto-generated questions
  // that FdVsSipPage renders. These two arrays MUST stay in sync.
  const faqList = config.faqs ?? [
    {
      q: `Is ₹${amountStr}/month SIP in Equity Mutual Funds better than Fixed Deposit (FD) for ${durationYears} years?`,
      a: `Based on estimated returns, yes — at a ${taxSlab}% tax slab. At ${sipCagr}% CAGR, SIP gives ${sipNomL} vs FD's ${fdNomL} before tax. After tax and inflation, SIP's estimated real return is ${sipPct}/yr vs FD's ${fdPct}/yr.`,
    },
    {
      q: `What is ₹${amountStr}/month SIP worth after ${durationYears} years?`,
      a: `At ${sipCagr}% CAGR, ₹${amountStr}/month SIP in Equity Mutual Funds for ${durationYears} years gives approximately ${sipNomL} on ${investedL} invested. After 12.5% LTCG tax on gains above ₹1.25L, you get approximately ${sipL}. Actual returns depend on market performance and are not guaranteed.`,
    },
    {
      q: `What is ₹${amountStr}/month Fixed Deposit (FD) interest in ${durationYears} years?`,
      a: `At ${fdRate}% interest, ₹${amountStr}/month FD for ${durationYears} years gives approximately ${fdNomL}. After ${taxSlab}% income tax on interest, approximately ${fdL}. With ${inflationRate}% annual inflation, that has the purchasing power of ${fdRealL} in today's money.`,
    },
    {
      q: `In which year does SIP overtake Fixed Deposit (FD) for ₹${amountStr}/month?`,
      a: `At ${sipCagr}% SIP and ${fdRate}% FD, SIP edges ahead from year 1, but the lead is small in early years. The gap accelerates after year 5 and reaches ${gapL} by year ${durationYears}. If you assume more conservative SIP returns (9–10%) or higher FD rates (8%+), FD can stay ahead through year 4 or 5.`,
    },
    {
      q: `Is SIP in Equity Mutual Funds safe? What if markets crash?`,
      a: `SIP in Equity Mutual Funds does not guarantee your capital — unlike Fixed Deposit. In 2020, equity mutual funds fell ~35% before recovering. Over any 10-year period in Indian market history, patient SIP investors have not had negative returns — but this is not a guarantee. If you need money on a specific date, FD is genuinely safer.`,
    },
  ]

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',      item: 'https://www.realreturn.in' },
        { '@type': 'ListItem', position: 2, name: 'FD vs SIP', item: 'https://www.realreturn.in/fd-vs-sip' },
        { '@type': 'ListItem', position: 3, name: config.h1,   item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqList.map((f: { q: string; a: string }) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
}
