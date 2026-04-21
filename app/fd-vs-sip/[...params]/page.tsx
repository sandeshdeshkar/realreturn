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

function buildSchemas(config: any, result: any, slugStr: string) {
  const url  = `https://www.realreturn.in/fd-vs-sip/${slugStr}`
  const sipL = fmtL(result.sip.postTaxCorpus)
  const fdL  = fmtL(result.fd.postTaxCorpus)
  const { durationYears, fdRate, sipCagr, taxSlab, inflationRate } = config.inputs

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
      mainEntity: [
        {
          '@type': 'Question',
          name: `Is SIP better than FD for ${durationYears} years?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `SIP at ${sipCagr}% gives ${sipL} vs FD's ${fdL} over ${durationYears} years. After ${taxSlab}% tax and ${inflationRate}% inflation, real returns are SIP ${fmtPct(result.sip.realReturnPct)}/yr vs FD ${fmtPct(result.fd.realReturnPct)}/yr.`,
          },
        },
        {
          '@type': 'Question',
          name: 'In which year does SIP overtake FD?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `SIP overtakes FD around year ${result.breakEvenYear}. SIP finishes ${fmtL(result.gapAmount)} ahead by year ${durationYears}.`,
          },
        },
        {
          '@type': 'Question',
          name: 'What is the real return on FD after tax and inflation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Just ${fmtPct(result.fd.realReturnPct)} per year. After ${taxSlab}% income tax and ${inflationRate}% inflation, FD's ${fdRate}% rate leaves almost no real gain.`,
          },
        },
      ],
    },
  ]
}