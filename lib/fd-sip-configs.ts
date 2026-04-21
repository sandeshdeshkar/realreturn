// lib/fd-sip-configs.ts
// Single source of truth for every programmatic page.
// Add a new page = add one object to PAGE_CONFIGS.
// generateStaticParams() reads this and pre-builds every page at deploy time.

import type { CalcInputs } from './fd-sip-calculator'

export interface PageConfig {
  // URL: /fd-vs-sip/[...params] — params joined by "/"
  slug: string[]

  // Calculator pre-fill values
  inputs: CalcInputs

  // SEO
  title: string           // <title> tag
  metaDescription: string // meta description
  h1: string              // page H1

  // Content overrides (optional — falls back to auto-generated)
  bankName?: string       // e.g. "SBI" for bank-specific pages
  bankRate?: number       // FD rate for that bank

  // Internal link context
  relatedSlugs?: string[] // slugs to show in "Try other combinations"
}

// ── Default calculator values ─────────────────────────────────────────────
const DEFAULTS = {
  fdRate:        7.0,
  sipCagr:       12.0,
  taxSlab:       30,
  inflationRate: 6.0,
  ltcgRate:      12.5,
  ltcgExemption: 125000,
}

// ── Phase 1: 1 page (expand to 5 → then full matrix) ─────────────────────
export const PAGE_CONFIGS: PageConfig[] = [

  // ── PHASE 1 LAUNCH ──────────────────────────────────────────────────────

  {
    slug: ['10000-per-month', '10-years'],
    inputs: {
      ...DEFAULTS,
      monthlyAmount: 10000,
      durationYears: 10,
    },
    title: '₹10,000/Month SIP vs FD for 10 Years — Real Returns India 2025',
    metaDescription:
      '₹10,000/month SIP gives ₹23.2L vs FD\'s ₹17.1L over 10 years. After 30% tax and 6% inflation, SIP real return is 5.8% vs FD\'s 0.6%. See year-by-year breakdown.',
    h1: '₹10,000/Month SIP vs FD for 10 Years',
    relatedSlugs: [
      '10000-per-month/5-years',
      '10000-per-month/20-years',
      '5000-per-month/10-years',
      '20000-per-month/10-years',
    ],
  },

  // ── PHASE 2 (add these after first page is indexed) ──────────────────────

  // {
  //   slug: ['5000-per-month', '10-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 5000, durationYears: 10 },
  //   title: '₹5,000/Month SIP vs FD for 10 Years — Real Returns India 2025',
  //   metaDescription: '₹5,000/month SIP gives ₹11.6L vs FD\'s ₹8.6L over 10 years...',
  //   h1: '₹5,000/Month SIP vs FD for 10 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '5000-per-month/5-years'],
  // },

  // {
  //   slug: ['10000-per-month', '5-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 10000, durationYears: 5 },
  //   title: '₹10,000/Month SIP vs FD for 5 Years — Short-Term Returns India',
  //   metaDescription: '₹10,000/month SIP for 5 years gives ₹8.2L vs FD\'s ₹7.1L...',
  //   h1: '₹10,000/Month SIP vs FD for 5 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '5000-per-month/5-years'],
  // },

  // {
  //   slug: ['10000-per-month', '20-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 10000, durationYears: 20 },
  //   title: '₹10,000/Month SIP vs FD for 20 Years — The Wealth Gap',
  //   metaDescription: '₹10,000/month SIP for 20 years gives ₹91L vs FD\'s ₹53L...',
  //   h1: '₹10,000/Month SIP vs FD for 20 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '10000-per-month/30-years'],
  // },

  // {
  //   slug: ['sbi-fd-vs-sip'],  // note: this lives at /fd-vs-sip/sbi but
  //   // bank pages will likely get their own route: /sbi-fd-vs-sip
  //   inputs: { ...DEFAULTS, monthlyAmount: 10000, durationYears: 10, fdRate: 7.1 },
  //   title: 'SBI FD vs SIP — Which is Better in 2025?',
  //   metaDescription: 'SBI FD at 7.1% vs SIP at 12% for 10 years. After tax and inflation, SIP gives 5.7% real return vs SBI FD\'s 0.7%.',
  //   h1: 'SBI FD vs SIP — Which Gives Better Returns?',
  //   bankName: 'SBI',
  //   bankRate: 7.1,
  // },

]

// ── Lookup helper ─────────────────────────────────────────────────────────
export function getConfig(params: string[]): PageConfig | undefined {
  const key = params.join('/')
  return PAGE_CONFIGS.find(c => c.slug.join('/') === key)
}