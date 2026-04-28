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

  // Page-specific unique insights (optional — if not set, generic text is used)
  breakEvenInsight?: {
    title: string         // heading of the insight card
    body: string          // body text (can include HTML <strong> tags)
  }

  // Page-specific editorial sections (optional overrides)
  editorialSections?: {
    h: string             // section heading
    p: string             // section body
  }[]

  // Page-specific FAQs (optional — if not set, auto-generated from inputs)
  faqs?: {
    q: string
    a: string
  }[]

  // Unique callout text in "What's the difference" section
  differenceCallout?: string

  // Unique framing in "When FD wins" section intro
  whenFdWinsIntro?: string
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

// ── Page configs ──────────────────────────────────────────────────────────
export const PAGE_CONFIGS: PageConfig[] = [

  // ── PAGE 1: ₹10,000/month · 10 years ────────────────────────────────────
  {
    slug: ['10000-per-month', '10-years'],
    inputs: {
      ...DEFAULTS,
      monthlyAmount: 10000,
      durationYears: 10,
    },
    title: '₹10,000/Month SIP vs FD for 10 Years — Real Returns India',
    metaDescription:
      '₹10,000/month SIP gives ₹22.4L vs FD\'s ₹17.4L over 10 years. After 30% tax and 6% inflation, SIP real return is +5.1%/yr vs FD\'s −1.0%/yr. See year-by-year breakdown.',
    h1: '₹10,000/Month SIP vs FD for 10 Years',
    relatedSlugs: [
      '5000-per-month/10-years',
      '10000-per-month/5-years',
      '10000-per-month/15-years',
      '20000-per-month/10-years',
    ],
    // Generic break-even insight (default used if breakEvenInsight not set)
  },

  // ── PAGE 2: ₹5,000/month · 10 years ────────────────────────────────────
  {
    slug: ['5000-per-month', '10-years'],
    inputs: {
      ...DEFAULTS,
      monthlyAmount: 5000,
      durationYears: 10,
    },
    title: '₹5,000/Month SIP vs FD for 10 Years — Real Returns India',
    metaDescription:
      '₹5,000/month SIP gives ₹11.2L vs FD\'s ₹8.7L over 10 years. After 30% tax and 6% inflation, SIP real return is +5.2%/yr vs FD\'s −1.0%/yr. Even a small SIP beats FD — see the real numbers.',
    h1: '₹5,000/Month SIP vs FD for 10 Years',
    relatedSlugs: [
      '10000-per-month/10-years',
      '5000-per-month/5-years',
      '5000-per-month/15-years',
      '20000-per-month/10-years',
    ],

    // UNIQUE: Break-even insight specific to ₹5K
    breakEvenInsight: {
      title: 'The amount doesn\'t change when SIP overtakes FD',
      body: 'Whether you invest ₹5,000 or ₹50,000 a month, SIP overtakes FD at the <strong>same point — around year 4</strong>. Break-even depends on return rates and time, not the amount. The gap then grows to <strong>₹2.5L by year 10</strong> — roughly <strong>4.7 years of your ₹5,000 SIP</strong> sitting extra in your pocket. At 0% tax, the break-even shifts to around year 6.',
    },

    // UNIQUE: "What's the difference" callout
    differenceCallout: '₹5,000 might feel like a small amount — but over 10 years, <em>where</em> you put it matters more than <em>how much</em>. SIP gives you <strong>₹2.5L extra</strong> — nearly 5 years of your own monthly contribution, created purely by compounding.',

    // UNIQUE: "When FD wins" intro
    whenFdWinsIntro: 'At ₹5,000/month, you\'re likely building your first financial safety net. Fixed Deposit genuinely makes more sense when:',

    // UNIQUE: Editorial sections
    editorialSections: [
      {
        h: 'The LTCG exemption disproportionately benefits smaller SIPs',
        p: 'On ₹5,000/month SIP, your gains after 10 years are about ₹5.2L. The ₹1.25L LTCG exemption covers 24% of those gains tax-free. At ₹10,000/month, the exemption covers only 12% of gains. Smaller SIPs get proportionally more tax relief — an often-overlooked advantage.',
      },
      {
        h: 'Why FD feels "safer" but isn\'t — at this scale',
        p: '₹8.7L in your FD statement feels solid. But ₹4.4L in today\'s purchasing power after 10 years means your ₹6L lost ₹1.6L of real value. FD\'s "safety" protects the rupee number, not what those rupees can actually buy.',
      },
      {
        h: 'The smart ₹5,000 split — if you\'re risk-averse',
        p: '₹3,500 in SIP (equity mutual funds) + ₹1,500 in recurring FD. You build wealth through SIP while the FD creates a psychological floor that keeps you from stopping during a market dip. Consistency in SIP matters more than the exact split ratio.',
      },
    ],

    // UNIQUE: FAQs specific to ₹5K scenario
    faqs: [
      {
        q: 'Is ₹5,000/month SIP better than Fixed Deposit for 10 years?',
        a: 'At a 30% tax slab, yes. ₹5,000/month SIP for 10 years gives ₹11.2L at 12% CAGR vs FD\'s ₹8.7L at 7%. After tax and 6% inflation, SIP\'s real return is +5.2%/yr vs FD\'s −1.0%/yr. Even at 0% tax, SIP outperforms by year 6. Use the tax slider above to see your bracket.',
      },
      {
        q: 'Is ₹5,000/month SIP enough to build real wealth?',
        a: 'Yes — at 12% CAGR, ₹5,000/month grows to ₹11.2L in 10 years, ₹22.4L in 15 years, and over ₹49L in 20 years. The longer you stay, the more compounding does the heavy lifting. ₹5,000 today is a more powerful start than ₹10,000 ten years from now.',
      },
      {
        q: 'What is ₹5,000/month Fixed Deposit (FD) worth after 10 years?',
        a: 'At 7% interest, ₹5,000/month FD for 10 years gives approximately ₹8.7L on ₹6L invested. After 30% income tax, approximately ₹7.9L. With 6% inflation, that has the purchasing power of only ₹4.4L in today\'s money — less than your total investment in real terms.',
      },
      {
        q: 'Why does the break-even year not change with the SIP amount?',
        a: 'Break-even depends on the ratio of returns, not the absolute amount. Whether you invest ₹5,000 or ₹50,000/month, SIP grows at 12% and FD at 7%. The crossover point — around year 4 — is set by these rates and time alone. Once SIP overtakes FD, the gap scales proportionally with the amount.',
      },
      {
        q: 'Should I split ₹5,000 between SIP and FD, or go all-in on one?',
        a: 'If you don\'t have an emergency fund yet, keep 2–3 months of expenses in FD first (₹15–30K), then put ₹5,000/month fully into SIP. If you already have an emergency fund, going all-in on SIP for a 10-year goal maximises your outcome. A split like ₹3,500 SIP + ₹1,500 FD works if market volatility would cause you to exit SIP during a crash.',
      },
    ],
  },

  // ── PHASE 3 (uncomment when ready) ───────────────────────────────────────

  // {
  //   slug: ['10000-per-month', '5-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 10000, durationYears: 5 },
  //   title: '₹10,000/Month SIP vs FD for 5 Years — Short-Term Returns India',
  //   metaDescription: '₹10,000/month SIP for 5 years gives ₹8.2L vs FD\'s ₹7.1L. After tax and inflation, SIP real return is +2.8%/yr vs FD\'s −1.0%/yr. Is 5 years enough for SIP?',
  //   h1: '₹10,000/Month SIP vs FD for 5 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '5000-per-month/5-years', '10000-per-month/15-years', '20000-per-month/5-years'],
  // },

  // {
  //   slug: ['10000-per-month', '15-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 10000, durationYears: 15 },
  //   title: '₹10,000/Month SIP vs FD for 15 Years — The Wealth Gap Widens',
  //   metaDescription: '₹10,000/month SIP for 15 years gives ₹50L vs FD\'s ₹32L. After tax and inflation, SIP real return is +6.1%/yr. The 15-year compounding story.',
  //   h1: '₹10,000/Month SIP vs FD for 15 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '10000-per-month/20-years', '5000-per-month/15-years', '20000-per-month/15-years'],
  // },

  // {
  //   slug: ['20000-per-month', '10-years'],
  //   inputs: { ...DEFAULTS, monthlyAmount: 20000, durationYears: 10 },
  //   title: '₹20,000/Month SIP vs FD for 10 Years — Real Returns India',
  //   metaDescription: '₹20,000/month SIP gives ₹44.8L vs FD\'s ₹34.8L over 10 years. After 30% tax and inflation, SIP real return is +5.1%/yr vs FD\'s −1.0%/yr.',
  //   h1: '₹20,000/Month SIP vs FD for 10 Years',
  //   relatedSlugs: ['10000-per-month/10-years', '5000-per-month/10-years', '20000-per-month/5-years', '20000-per-month/15-years'],
  // },

]

// ── Lookup helper ─────────────────────────────────────────────────────────
export function getConfig(params: string[]): PageConfig | undefined {
  const key = params.join('/')
  return PAGE_CONFIGS.find(c => c.slug.join('/') === key)
}