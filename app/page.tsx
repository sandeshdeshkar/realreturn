'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Script from 'next/script'

/**
 * realreturn.in — Homepage
 *
 * All numbers verified mathematically (Fisher Equation):
 *   Real = ((1 + post-tax rate) / (1 + inflation)) − 1
 *
 * Defaults: 7% FD, 30% tax, 6% inflation → −1.04% real return
 * Investment table figures all verified at 30% tax, 6% inflation.
 */

type Preset = { label: string; sub: string; tax: number }

const PRESETS: Preset[] = [
  { label: 'Salaried', sub: '30% slab', tax: 30 },
  { label: 'Mid-slab', sub: '20% slab', tax: 20 },
  { label: 'Senior / 0%', sub: '0% slab', tax: 0 },
]

const PROOF_STATS = [
  { num: '−1.04%', tone: 'red', text: 'Real return on a 7% FD at 30% tax + 6% inflation' },
  { num: '+4.34%', tone: 'green', text: 'Real return on 12% MF SIP after LTCG & inflation' },
  { num: '8.6%', tone: 'amber', text: 'FD rate needed to break even after tax & inflation' },
  { num: '12 yrs', tone: 'ink', text: 'For ₹1 lakh to halve in purchasing power at 6% inflation' },
] as const

const TOOLS = [
  {
    href: '/fd-vs-sip',
    icon: '📊',
    question: '"Is my FD actually beating inflation?"',
    name: 'FD vs SIP Calculator',
    status: 'live' as const,
  },
  {
    href: '/fd-vs-rd-vs-mf-returns-calculator',
    icon: '⚖️',
    question: '"Where should I park my monthly savings — FD, RD or SIP?"',
    name: 'FD vs RD vs MF Calculator',
    status: 'live' as const,
  },
  {
    href: '/personal-financial-planner',
    icon: '🎯',
    question: '"Am I financially okay?"',
    name: '3-Minute Financial Plan',
    status: 'live' as const,
  },
  {
    href: '/retirement-corpus-calculator',
    icon: '🏖️',
    question: '"Can I afford to retire when I want?"',
    name: 'Retirement Reality Check',
    status: 'live' as const,
  },
  {
    href: '#',
    icon: '🏠',
    question: '"Should I prepay my home loan or invest the EMI?"',
    name: 'Prepay vs Invest',
    status: 'coming' as const,
  },
  {
    href: '#',
    icon: '🛡️',
    question: '"Is my family actually protected if I\'m gone?"',
    name: 'Term Insurance Adequacy',
    status: 'coming' as const,
  },
  {
    href: '#',
    icon: '💰',
    question: '"What SIP gets me to ₹1 crore — in today\'s money?"',
    name: 'Goal SIP Reality',
    status: 'coming' as const,
  },
]

const INSTRUMENTS = [
  { icon: '🏦', name: 'Savings Account', nominal: '3.0%', postTax: '2.1%', real: '−3.7%', realTone: 'red', verdict: 'Losing', verdictTone: 'lose', bestFor: 'Daily-use cash only' },
  { icon: '💰', name: 'Fixed Deposit (5yr)', nominal: '7.0%', postTax: '4.9%', real: '−1.0%', realTone: 'red', verdict: 'Losing', verdictTone: 'lose', bestFor: '0–3 year goals, capital safety' },
  { icon: '📅', name: 'Recurring Deposit', nominal: '6.5%', postTax: '4.6%', real: '−1.4%', realTone: 'red', verdict: 'Losing', verdictTone: 'lose', bestFor: 'Forced monthly saving habit' },
  { icon: '🇮🇳', name: 'PPF (15yr)', nominal: '7.1%', postTax: '7.1%', real: '+1.0%', realTone: 'amber', verdict: 'Modest', verdictTone: 'modest', bestFor: 'Long-term tax-free debt allocation' },
  { icon: '🥇', name: 'Gold (10yr avg)', nominal: '9.5%', postTax: '8.3%', real: '+2.2%', realTone: 'amber', verdict: 'Modest', verdictTone: 'modest', bestFor: '5–10% of portfolio as hedge' },
  { icon: '📈', name: 'NPS (Equity heavy)', nominal: '11.0%', postTax: '10.0%', real: '+3.8%', realTone: 'green', verdict: 'Strong', verdictTone: 'modest', bestFor: 'Tax-saver retirement (locked-in)' },
  { icon: '⚡', name: 'Equity Mutual Fund (SIP)', nominal: '12.0%', postTax: '10.6%', real: '+4.3%', realTone: 'green', verdict: 'Best', verdictTone: 'strong', bestFor: '5+ year wealth creation goals' },
] as const

const SCENARIOS = [
  { href: '/fd-vs-sip/10000-per-month/10-years', text: '₹10,000/month SIP vs FD for 10 years' },
  { href: '#', text: '₹5,000/month SIP vs FD for 15 years' },
  { href: '#', text: '₹25,000/month SIP vs FD for 20 years' },
  { href: '#', text: 'How much SIP for ₹1 crore in 15 years?' },
  { href: '#', text: 'Can I retire at 50 with ₹3 crore?' },
  { href: '#', text: 'Is FD better than SIP for senior citizens?' },
  { href: '#', text: "What's the real return on PPF?" },
  { href: '#', text: 'Old vs new tax regime — which saves more?' },
]

const FAQS = [
  {
    q: 'What is the real return on a 7% FD in India?',
    a: 'For someone in the 30% tax slab with 6% inflation, a 7% FD gives a real return of approximately −1.04% per year. Post-tax return is 4.9% (7% × 0.7), and after adjusting for 6% inflation using the Fisher Equation, the real return is negative. You are losing purchasing power despite earning interest.',
  },
  {
    q: 'Is FD safe after adjusting for inflation?',
    a: 'FD is capital-safe but not inflation-safe for investors in the 20-30% tax bracket. With current FD rates of 6.5-7.5% and inflation at 5-6%, most FD investors earn zero or negative real returns. For capital safety with better real returns, consider PPF (tax-free) or short-duration debt mutual funds.',
  },
  {
    q: 'How is LTCG calculated on mutual funds in India?',
    a: 'As per Union Budget 2024, Long Term Capital Gains (LTCG) on equity mutual funds held for more than 1 year are taxed at 12.5% (reduced from 10%). The annual exemption limit is ₹1.25 lakh (increased from ₹1 lakh). LTCG above ₹1.25 lakh per year is taxed at 12.5% without indexation benefit.',
  },
  {
    q: 'What is the Fisher Equation for real return?',
    a: 'The Fisher Equation calculates real return as: Real Return = ((1 + Nominal Return) / (1 + Inflation Rate)) − 1. This is more accurate than simply subtracting inflation from nominal return. For example, 7% FD at 30% tax (post-tax 4.9%) with 6% inflation: Real Return = (1.049 / 1.06) − 1 = −1.04%.',
  },
]

function formatINR(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function formatPct(n: number): string {
  const s = n >= 0 ? '+' : '−'
  return s + Math.abs(n).toFixed(2) + '%'
}

export default function HomePage() {
  const [fdRate, setFdRate] = useState(7)
  const [tax, setTax] = useState(30)
  const [inflation, setInflation] = useState(6)

  // Fisher Equation
  const realReturn = useMemo(() => {
    const postTax = fdRate * (1 - tax / 100)
    return ((1 + postTax / 100) / (1 + inflation / 100) - 1) * 100
  }, [fdRate, tax, inflation])

  // 10-year projection of ₹1 lakh
  const projectedValue = useMemo(() => {
    return 100000 * Math.pow(1 + realReturn / 100, 10)
  }, [realReturn])

  const isPositive = realReturn >= 0
  const activePresetTax = tax

  // JSON-LD structured data for AEO/SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'realreturn.in',
    url: 'https://www.realreturn.in',
    description:
      'Find the real return on your investment after tax and inflation. Free tools for Indian personal finance — FD vs SIP, retirement, financial planning.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      <div className="page">
        {/* ───────── NAV ───────── */}
        <nav>
          <div className="container nav-inner">
            <Link href="/" className="logo">
              <div className="logo-icon">📊</div>
              <div className="logo-text">
                <span className="logo-name">realreturn.in</span>
                <span className="logo-tag">Real returns after tax &amp; inflation</span>
              </div>
            </Link>
            <div className="nav-links">
              <Link href="/personal-financial-planner">Financial Plan</Link>
              <Link href="/retirement-corpus-calculator">Retirement</Link>
              <Link href="/fd-vs-rd-vs-mf-returns-calculator" className="nav-cta">
                Open calculator →
              </Link>
            </div>
          </div>
        </nav>

        {/* ───────── HERO ───────── */}
        <header className="hero">
          <div className="container">
            <div className="hero-grid">
              <div>
                <h1>
                  Find the real return on <span className="accent">your investment.</span>
                </h1>
                <p className="hero-subheadline">
                  What your money <span className="accent">actually</span> earns. After tax. After
                  inflation. The real number — not the one your bank quotes you.
                </p>
              </div>

              <div className="calc-card">
                <div className="calc-header">
                  <span className="pulse" />
                  <span>Quick check · your FD&apos;s real return</span>
                </div>
                <div className="calc-body">
                  <div className="calc-presets" role="group" aria-label="Tax slab presets">
                    {PRESETS.map((p) => (
                      <button
                        key={p.tax}
                        type="button"
                        className={`preset-chip ${activePresetTax === p.tax ? 'active' : ''}`}
                        onClick={() => setTax(p.tax)}
                      >
                        <span className="preset-chip-label">{p.label}</span>
                        <span className="preset-chip-tax">{p.sub}</span>
                      </button>
                    ))}
                  </div>

                  <div className="calc-input-group">
                    <div className="calc-label">
                      <span className="calc-label-text">FD interest rate</span>
                      <span className="calc-label-val">
                        {fdRate.toFixed(1).replace(/\.0$/, '')}%
                      </span>
                    </div>
                    <input
                      type="range"
                      className="calc-slider"
                      min={3}
                      max={10}
                      step={0.1}
                      value={fdRate}
                      onChange={(e) => setFdRate(parseFloat(e.target.value))}
                      aria-label="FD interest rate"
                    />
                  </div>

                  <div className="calc-input-group">
                    <div className="calc-label">
                      <span className="calc-label-text">Your tax slab</span>
                      <span className="calc-label-val">{tax}%</span>
                    </div>
                    <input
                      type="range"
                      className="calc-slider"
                      min={0}
                      max={30}
                      step={5}
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value))}
                      aria-label="Income tax slab"
                    />
                  </div>

                  <div className="calc-input-group">
                    <div className="calc-label">
                      <span className="calc-label-text">Inflation rate</span>
                      <span className="calc-label-val">
                        {inflation.toFixed(1).replace(/\.0$/, '')}%
                      </span>
                    </div>
                    <input
                      type="range"
                      className="calc-slider"
                      min={2}
                      max={10}
                      step={0.1}
                      value={inflation}
                      onChange={(e) => setInflation(parseFloat(e.target.value))}
                      aria-label="Inflation rate"
                    />
                  </div>

                  <div className="calc-result">
                    <div className="calc-result-label">Your real return</div>
                    <div className={`calc-result-num ${isPositive ? 'positive' : ''}`}>
                      {formatPct(realReturn)}
                    </div>
                    <div className="calc-result-meta">
                      per year · after {tax}% tax &amp;{' '}
                      {inflation.toFixed(1).replace(/\.0$/, '')}% inflation
                    </div>

                    <div className={`calc-projection ${isPositive ? 'positive' : ''}`}>
                      Over 10 years, <strong>₹1 lakh</strong>{' '}
                      <span className="proj-arrow">→</span>{' '}
                      <span className="real">{formatINR(projectedValue)}</span> in today&apos;s money
                    </div>

                    <div className={`calc-warning ${isPositive ? 'positive' : ''}`}>
                      {isPositive
                        ? 'Your FD is keeping pace with inflation — but equity instruments would likely earn more in real terms over long horizons.'
                        : 'Your FD is losing purchasing power every year. The bank grows your balance, but inflation shrinks what it buys.'}
                    </div>

                    <details className="calc-formula">
                      <summary>Show the formula</summary>
                      <div className="calc-formula-body">
                        Post-tax = Rate × (1 − tax)
                        <br />
                        <span className="formula">
                          Real = ((1 + post-tax) / (1 + inflation)) − 1
                        </span>
                        <br />
                        This is the Fisher Equation. You can verify any result on this site by hand.
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ───────── ANSWER SUMMARY ───────── */}
        <div className="answer-summary">
          <div className="container">
            <div className="answer-summary-inner">
              <div className="answer-summary-eyebrow">The short answer</div>
              <p>
                In India, a 7% FD delivers approximately{' '}
                <span className="loss">−1.04% real return per year</span> for a 30% tax-bracket
                investor at 6% inflation. After tax and inflation, most fixed-income instruments
                lose purchasing power — while equity SIPs at 12% CAGR deliver{' '}
                <strong>+4.34% real return.</strong> This page explains why, with the math.
              </p>
            </div>
          </div>
        </div>

        {/* ───────── PROOF STRIP ───────── */}
        <div className="proof">
          <div className="container">
            <div className="proof-grid">
              {PROOF_STATS.map((stat) => (
                <div className="proof-item" key={stat.text}>
                  <div className={`proof-num ${stat.tone}`}>{stat.num}</div>
                  <div className="proof-text">{stat.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───────── 01 START HERE ───────── */}
        <section id="tools">
          <div className="container">
            <div className="section-eyebrow">
              <span className="num">01</span>
              <span>Start here</span>
            </div>
            <h2 className="section-title">
              What do you want to <span className="accent">figure out?</span>
            </h2>
            <p className="section-intro">
              Each tool answers one decision. Pick the question that sounds most like the one in
              your head.
            </p>

            <div className="tools-list">
              {TOOLS.map((tool) => {
                const className = `tool-row ${tool.status === 'coming' ? 'coming' : ''}`
                const content = (
                  <>
                    <div className="tool-icon">{tool.icon}</div>
                    <div className="tool-content">
                      <div className="tool-question">{tool.question}</div>
                      <div className="tool-name">{tool.name}</div>
                    </div>
                    <div
                      className={`tool-status ${tool.status === 'coming' ? 'coming-tag' : ''}`}
                    >
                      {tool.status === 'coming' ? 'Coming' : 'Live'}
                    </div>
                    <div className="tool-arrow">→</div>
                  </>
                )

                if (tool.status === 'coming') {
                  return (
                    <div key={tool.name} className={className}>
                      {content}
                    </div>
                  )
                }

                return (
                  <Link key={tool.name} href={tool.href} className={className}>
                    {content}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ───────── 02 WHY ───────── */}
        <section className="why-section">
          <div className="container">
            <div className="section-eyebrow">
              <span className="num">02</span>
              <span>Why this exists</span>
            </div>
            <h2 className="section-title">
              The number your bank shows you <span className="accent">isn&apos;t</span> the number
              you keep.
            </h2>

            <div className="why-grid">
              <div>
                <p className="why-statement">
                  A 7% FD becomes 4.9% after tax. At 6% inflation, that&apos;s a{' '}
                  <span className="loss">−1% real return.</span> You&apos;re not earning.
                  You&apos;re slowly <em>losing.</em>
                </p>
                <p className="why-prose">
                  Most Indians don&apos;t have a money problem — they have a clarity problem. Banks
                  quote nominal returns. Mutual fund ads show 12% CAGR without tax or inflation.
                  The result: confident decisions built on incomplete math.
                </p>
                <p className="why-prose" style={{ marginTop: '14px' }}>
                  We call this difference between what you&apos;re told and what you keep{' '}
                  <span className="gap-coin">The Real Return Gap</span>. Every tool on this site
                  exists to make that gap visible — for FDs, RDs, mutual funds, PPF, NPS, and every
                  other Indian instrument.
                </p>
              </div>

              <div className="why-math">
                <div className="why-math-title">The math, line by line</div>
                <div className="math-row">
                  <span className="math-label">Quoted FD rate</span>
                  <span className="math-val">+7.00%</span>
                </div>
                <div className="math-row">
                  <span className="math-label">Tax (30% slab)</span>
                  <span className="math-val minus">−2.10%</span>
                </div>
                <div className="math-line" />
                <div className="math-row">
                  <span className="math-label">Post-tax return</span>
                  <span className="math-val">+4.90%</span>
                </div>
                <div className="math-row">
                  <span className="math-label">Inflation</span>
                  <span className="math-val minus">−6.00%</span>
                </div>
                <div className="math-final">
                  <div className="math-row">
                    <span className="math-label">Real return</span>
                    <span className="math-val">−1.04%</span>
                  </div>
                </div>
                <div className="math-caption">
                  That&apos;s not earning. That&apos;s a slow, polite loss of purchasing power —
                  disguised as a &quot;safe&quot; investment.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── 03 INVESTMENT TABLE ───────── */}
        <section>
          <div className="container">
            <div className="section-eyebrow">
              <span className="num">03</span>
              <span>Real returns at a glance</span>
            </div>
            <h2 className="section-title">
              Where Indian instruments <span className="accent">actually stand.</span>
            </h2>
            <p className="section-intro">
              Historical real returns across common Indian investment options after tax and 6%
              inflation. The &quot;Best for&quot; column shows what each instrument is genuinely
              useful for.
            </p>

            <div className="table-wrap">
              <table className="investment-table">
                <caption className="visually-hidden">
                  Real returns on Indian investment instruments after tax and 6% inflation
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Instrument</th>
                    <th scope="col" className="num-col hide-mobile">Nominal</th>
                    <th scope="col" className="num-col">Post-tax</th>
                    <th scope="col" className="num-col">Real return</th>
                    <th scope="col">Verdict</th>
                    <th scope="col" className="hide-mobile">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {INSTRUMENTS.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <div className="instrument">
                          <span className="instrument-icon">{row.icon}</span>
                          {row.name}
                        </div>
                      </td>
                      <td className="num hide-mobile">{row.nominal}</td>
                      <td className="num">{row.postTax}</td>
                      <td className={`num real-num ${row.realTone}`}>{row.real}</td>
                      <td>
                        <span className={`verdict ${row.verdictTone}`}>{row.verdict}</span>
                      </td>
                      <td className="best-for hide-mobile">{row.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footnote">
              Based on 10-year averages · 30% tax bracket · 6% CPI inflation · LTCG at 12.5% above
              ₹1.25L exemption (Budget 2024) · Past performance does not guarantee future results.
            </div>

            <div className="playbook">
              <div className="playbook-title">
                If your money is losing real returns, here&apos;s the standard playbook
              </div>
              <div className="playbook-steps">
                <div className="playbook-step">
                  <div className="playbook-step-num">1</div>
                  <div>
                    <h4>Keep only emergency cash in FD</h4>
                    <p>
                      3–6 months of expenses. FDs are for capital safety, not growth. Anything
                      beyond emergency needs is losing real value.
                    </p>
                  </div>
                </div>
                <div className="playbook-step">
                  <div className="playbook-step-num">2</div>
                  <div>
                    <h4>Move long-term debt to PPF or NPS</h4>
                    <p>
                      15-year horizon? PPF is tax-free at 7.1%. Want equity exposure with tax
                      savings? NPS Tier-1 with 75% equity allocation.
                    </p>
                  </div>
                </div>
                <div className="playbook-step">
                  <div className="playbook-step-num">3</div>
                  <div>
                    <h4>Use SIPs for any goal &gt; 5 years</h4>
                    <p>
                      Equity mutual funds via SIP are the only Indian instrument that consistently
                      beats inflation in real terms over long horizons.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── 04 WORKED EXAMPLES ───────── */}
        <section className="scenarios-section">
          <div className="container">
            <div className="section-eyebrow">
              <span className="num">04</span>
              <span>Worked examples</span>
            </div>
            <h2 className="section-title">
              The math, <span className="accent">already done.</span>
            </h2>
            <p className="section-intro">
              Common amounts, durations, and goals — each with the breakdown worked out and a clear
              verdict. Open any one to read the full reasoning.
            </p>

            <div className="scenarios-grid">
              {SCENARIOS.map((s) => (
                <Link key={s.text} href={s.href} className="scenario-link">
                  <span className="text">{s.text}</span>
                  <span className="arrow">→</span>
                </Link>
              ))}
            </div>

            <Link href="#" className="scenarios-cta">
              See all worked examples <span>→</span>
            </Link>
          </div>
        </section>

        {/* ───────── 05 LONG-FORM SEO ───────── */}
        <section id="methodology">
          <div className="container">
            <div className="longform">
              <div className="section-eyebrow">
                <span className="num">05</span>
                <span>The basics, properly explained</span>
              </div>

              <div className="longform-block">
                <h2>
                  What is real return on investment in <span className="accent">India?</span>
                </h2>
                <p>
                  Real return is the actual return on your investment after adjusting for both tax
                  and inflation. Most Indians focus on the nominal interest rate — the number their
                  bank advertises. But this number is misleading because it does not account for
                  two major deductions: the tax you pay on the interest earned, and the purchasing
                  power lost to inflation.
                </p>
                <p>
                  For example, a 7% Fixed Deposit sounds attractive. But if you are in the 30%
                  income tax slab, your post-tax return drops to 4.9%. After adjusting for 6%
                  inflation using the Fisher Equation, your real return is approximately{' '}
                  <strong>−1.04% per year</strong>. Your bank balance grows, but your purchasing
                  power actually shrinks every year.
                </p>
                <p>
                  In contrast, a Systematic Investment Plan (SIP) in an equity mutual fund at 12%
                  CAGR — after 12.5% LTCG tax with ₹1.25 lakh exemption and 6% inflation — delivers
                  approximately <strong>+4.34% real return per year</strong>. Over 10 to 15 years,
                  this difference compounds dramatically.
                </p>
              </div>

              <div className="longform-block">
                <h2>FD vs SIP — which gives better real returns in India?</h2>
                <p>
                  The comparison between Fixed Deposits and Mutual Fund SIPs is not straightforward
                  because it depends on your tax slab, investment horizon, and the prevailing
                  inflation rate. For investors in the 20% or 30% tax slab with a horizon of 5
                  years or more, equity mutual funds consistently deliver higher real returns than
                  FDs.
                </p>
                <p>
                  FD interest is taxed at your income slab rate (up to 30%), while Mutual Fund Long
                  Term Capital Gains (LTCG) are taxed at only 12.5% with a ₹1.25 lakh annual
                  exemption under the Union Budget 2024. This tax efficiency makes mutual funds
                  significantly more advantageous for long-term wealth creation.
                </p>
                <p>
                  However, FDs are safer and more predictable for short-term goals (under 3 years),
                  emergency funds, and for investors who cannot tolerate market volatility. The
                  right answer depends on your specific situation — which is exactly what our free
                  calculator helps you determine.
                </p>
              </div>

              <div className="longform-block">
                <h2>
                  How to use the <span className="accent">real return calculator</span>
                </h2>
                <p>
                  Our Financial Reality Engine compares FD, RD (Recurring Deposit), and Mutual
                  Funds side by side showing three layers of returns: the nominal corpus (what your
                  statement shows), the post-tax corpus (after income tax or LTCG), and the real
                  value in today&apos;s money (after inflation adjustment).
                </p>
                <p>
                  Simply enter your investment amount, duration, interest rate or expected CAGR,
                  your income tax slab, and the expected inflation rate. The calculator uses the
                  Fisher Equation for mathematically accurate real return calculations — the same
                  method used by economists and financial planners.
                </p>
                <p>
                  The tool is completely free and all calculations happen instantly in your
                  browser.
                </p>
              </div>

              <div className="longform-block">
                <h2>
                  Frequently asked <span className="accent">questions</span>
                </h2>
                <div className="faq-list">
                  {FAQS.map(({ q, a }) => (
                    <details key={q} className="faq-item">
                      <summary className="faq-q">
                        <span>{q}</span>
                        <span className="faq-toggle">+</span>
                      </summary>
                      <div className="faq-a">{a}</div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FINAL CTA ───────── */}
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="final-cta">
              <div className="final-cta-inner">
                <h2>
                  Now run it on <span className="accent">your money.</span>
                </h2>
                <p>Pick a typical monthly amount or open the full calculator with your own numbers.</p>

                <div className="quick-starts">
                  {[5000, 10000, 25000, 50000].map((amt) => (
                    <Link
                      key={amt}
                      href={`/fd-vs-rd-vs-mf-returns-calculator?amount=${amt}`}
                      className="quick-start-btn"
                    >
                      <span className="amt">₹{amt.toLocaleString('en-IN')}</span> /month
                    </Link>
                  ))}
                </div>

                <div className="final-cta-secondary">
                  Or{' '}
                  <Link href="/fd-vs-rd-vs-mf-returns-calculator">open the full calculator</Link>{' '}
                  with custom inputs
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FOOTER ───────── */}
        <footer>
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <Link href="/" className="logo">
                  <div className="logo-icon">📊</div>
                  <div className="logo-text">
                    <span className="logo-name">realreturn.in</span>
                    <span className="logo-tag">Real returns after tax &amp; inflation</span>
                  </div>
                </Link>
                <p className="footer-tagline" style={{ marginTop: '14px' }}>
                  Free tools for Indian personal finance.
                </p>
              </div>
              <div className="footer-col">
                <h4>Tools</h4>
                <Link href="/fd-vs-sip">FD vs SIP</Link>
                <Link href="/fd-vs-rd-vs-mf-returns-calculator">FD vs RD vs MF</Link>
                <Link href="/personal-financial-planner">Financial Plan</Link>
                <Link href="/retirement-corpus-calculator">Retirement</Link>
              </div>
              <div className="footer-col">
                <h4>Examples</h4>
                <Link href="/fd-vs-sip/10000-per-month/10-years">FD vs SIP</Link>
                <Link href="#">Retirement plans</Link>
                <Link href="#">Tax regime</Link>
              </div>
              <div className="footer-col">
                <h4>About</h4>
                <Link href="/methodology">Methodology</Link>
                <Link href="/about">About</Link>
                <Link href="/disclaimer">Disclaimer</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <div>© {new Date().getFullYear()} realreturn.in</div>
              <div>Not investment advice · Consult a SEBI-registered advisor</div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        :global(:root) {
          --green: #1a6b3c;
          --green-deep: #134a29;
          --green-soft: #e8f5ed;
          --green-tint: #f3faf5;
          --red: #dc2626;
          --red-soft: #fef2f2;
          --amber: #d97706;
          --amber-soft: #fef3e7;
          --ink: #0f1a14;
          --ink-2: #2d3a32;
          --ink-3: #5a6960;
          --ink-4: #8a958e;
          --rule: #e5ebe7;
          --rule-soft: #f1f4f2;
          --bg: #ffffff;
          --bg-soft: #fafbfa;
        }

        .page {
          font-family: 'Sora', -apple-system, system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          line-height: 1.55;
          -webkit-font-smoothing: antialiased;
        }

        :global(.visually-hidden) {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        :global(.container) {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
        }
        @media (max-width: 640px) {
          :global(.container) {
            padding: 0 16px;
          }
        }

        /* NAV */
        nav {
          border-bottom: 1px solid var(--rule);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.92);
        }
        .nav-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--ink);
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--green);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .logo-name {
          font-weight: 600;
          font-size: 15px;
        }
        .logo-tag {
          font-size: 11px;
          color: var(--ink-3);
        }
        @media (max-width: 480px) {
          .logo-tag {
            display: none;
          }
        }
        .nav-links {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .nav-links :global(a) {
          color: var(--ink-2);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-links :global(a:hover) {
          background: var(--rule-soft);
        }
        @media (max-width: 720px) {
          .nav-links :global(a:not(.nav-cta)) {
            display: none;
          }
        }
        .nav-links :global(a.nav-cta) {
          background: var(--green);
          color: white;
          padding: 9px 16px;
        }
        .nav-links :global(a.nav-cta:hover) {
          background: var(--green-deep);
        }

        /* HERO */
        .hero {
          padding: 56px 0 40px;
        }
        @media (max-width: 640px) {
          .hero {
            padding: 28px 0 24px;
          }
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .hero h1 {
          font-size: clamp(32px, 4.6vw, 50px);
          line-height: 1.05;
          font-weight: 600;
          letter-spacing: -0.025em;
          margin-bottom: 14px;
          color: var(--ink);
        }
        .hero h1 .accent {
          color: var(--green);
          font-style: italic;
          font-weight: 500;
        }
        .hero-subheadline {
          font-size: clamp(17px, 1.8vw, 21px);
          color: var(--ink-2);
          line-height: 1.4;
          margin-bottom: 0;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .hero-subheadline .accent {
          color: var(--green);
          font-style: italic;
        }
        @media (max-width: 900px) {
          .hero h1 {
            font-size: clamp(26px, 6vw, 34px);
            margin-bottom: 10px;
          }
          .hero-subheadline {
            font-size: 15px;
          }
        }

        /* CALC CARD */
        .calc-card {
          background: var(--bg);
          border: 1px solid var(--rule);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 0 rgba(15, 26, 20, 0.02), 0 16px 40px -20px rgba(15, 26, 20, 0.12);
        }
        .calc-header {
          background: var(--green-tint);
          border-bottom: 1px solid var(--rule);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--green-deep);
        }
        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 4px var(--green-soft);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .calc-body {
          padding: 20px 22px 22px;
        }
        @media (max-width: 480px) {
          .calc-body {
            padding: 16px 16px 18px;
          }
        }
        .calc-presets {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .preset-chip {
          flex: 1;
          min-width: 0;
          padding: 8px 6px;
          background: var(--bg-soft);
          border: 1px solid var(--rule);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-2);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
          font-family: 'Sora', sans-serif;
        }
        .preset-chip:hover {
          border-color: var(--green);
          color: var(--green-deep);
        }
        .preset-chip.active {
          background: var(--green-soft);
          border-color: var(--green);
          color: var(--green-deep);
        }
        .preset-chip-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
        }
        .preset-chip-tax {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          margin-top: 1px;
          color: var(--ink-4);
          font-weight: 500;
        }
        .preset-chip.active .preset-chip-tax {
          color: var(--green);
        }

        .calc-input-group {
          margin-bottom: 14px;
        }
        .calc-label {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .calc-label-text {
          font-size: 13px;
          color: var(--ink-3);
          font-weight: 500;
        }
        .calc-label-val {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 500;
          color: var(--ink);
        }
        .calc-slider {
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: var(--rule);
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .calc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--green);
          cursor: pointer;
          border: 3px solid var(--bg);
          box-shadow: 0 0 0 1px var(--green), 0 2px 6px rgba(26, 107, 60, 0.3);
          transition: transform 0.15s;
        }
        .calc-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .calc-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--green);
          cursor: pointer;
          border: 3px solid var(--bg);
          box-shadow: 0 0 0 1px var(--green);
        }

        .calc-result {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed var(--rule);
        }
        .calc-result-label {
          font-size: 11px;
          color: var(--ink-4);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .calc-result-num {
          font-family: 'DM Mono', monospace;
          font-size: clamp(36px, 5.5vw, 48px);
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--red);
          margin-bottom: 4px;
          transition: color 0.3s;
        }
        .calc-result-num.positive {
          color: var(--green);
        }
        .calc-result-meta {
          font-size: 12px;
          color: var(--ink-4);
          font-family: 'DM Mono', monospace;
          margin-bottom: 10px;
        }
        .calc-projection {
          background: var(--bg-soft);
          border: 1px solid var(--rule);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .calc-projection strong {
          color: var(--ink);
          font-family: 'DM Mono', monospace;
          font-weight: 500;
        }
        .calc-projection .proj-arrow {
          color: var(--ink-4);
          font-family: 'DM Mono', monospace;
          margin: 0 4px;
        }
        .calc-projection .real {
          color: var(--red);
          font-family: 'DM Mono', monospace;
          font-weight: 500;
        }
        .calc-projection.positive .real {
          color: var(--green);
        }
        .calc-warning {
          background: var(--red-soft);
          border-left: 3px solid var(--red);
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .calc-warning.positive {
          background: var(--green-soft);
          border-left-color: var(--green);
        }
        .calc-formula {
          border-top: 1px solid var(--rule-soft);
          padding-top: 10px;
        }
        .calc-formula summary {
          font-size: 12px;
          color: var(--ink-3);
          cursor: pointer;
          font-weight: 500;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
        }
        .calc-formula summary::-webkit-details-marker {
          display: none;
        }
        .calc-formula summary::before {
          content: '+';
          color: var(--green);
          font-family: 'DM Mono', monospace;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .calc-formula[open] summary::before {
          transform: rotate(45deg);
        }
        .calc-formula summary:hover {
          color: var(--green-deep);
        }
        .calc-formula-body {
          margin-top: 10px;
          padding: 12px;
          background: var(--bg-soft);
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--ink-2);
          line-height: 1.6;
        }
        .calc-formula-body .formula {
          color: var(--green-deep);
          font-weight: 500;
        }

        /* ANSWER SUMMARY */
        .answer-summary {
          background: var(--bg-soft);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          padding: 28px 0;
        }
        .answer-summary-inner {
          max-width: 880px;
          margin: 0 auto;
          text-align: center;
        }
        .answer-summary-eyebrow {
          font-size: 11px;
          font-weight: 600;
          color: var(--ink-4);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }
        .answer-summary p {
          font-size: clamp(15px, 1.6vw, 17px);
          color: var(--ink-2);
          line-height: 1.6;
          font-weight: 500;
        }
        .answer-summary p strong {
          color: var(--green-deep);
          font-weight: 600;
        }
        .answer-summary p .loss {
          color: var(--red);
          font-weight: 600;
        }

        /* PROOF STRIP */
        .proof {
          background: var(--bg);
          border-bottom: 1px solid var(--rule);
          padding: 28px 0;
        }
        .proof-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .proof-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .proof-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        .proof-item {
          background: var(--bg-soft);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .proof-num {
          font-family: 'DM Mono', monospace;
          font-size: 24px;
          font-weight: 500;
          line-height: 1;
          flex-shrink: 0;
          min-width: 80px;
        }
        .proof-num.red {
          color: var(--red);
        }
        .proof-num.green {
          color: var(--green);
        }
        .proof-num.amber {
          color: var(--amber);
        }
        .proof-num.ink {
          color: var(--ink);
        }
        .proof-text {
          font-size: 12px;
          color: var(--ink-3);
          line-height: 1.4;
        }

        /* SECTIONS */
        section {
          padding: 80px 0;
        }
        @media (max-width: 640px) {
          section {
            padding: 56px 0;
          }
        }
        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--green-deep);
          background: var(--green-soft);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .section-eyebrow .num {
          font-family: 'DM Mono', monospace;
          color: var(--green);
          font-weight: 500;
        }
        .section-title {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 600;
          line-height: 1.12;
          letter-spacing: -0.025em;
          margin-bottom: 16px;
          color: var(--ink);
          max-width: 760px;
        }
        .section-title .accent {
          color: var(--green);
          font-style: italic;
          font-weight: 500;
        }
        .section-intro {
          font-size: 16px;
          color: var(--ink-3);
          max-width: 600px;
          margin-bottom: 48px;
          line-height: 1.55;
        }

        /* TOOLS */
        .tools-list {
          border-top: 1px solid var(--rule);
        }
        .tools-list :global(.tool-row) {
          display: grid;
          grid-template-columns: 36px 1fr auto auto;
          gap: 18px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          color: var(--ink);
          transition: padding 0.25s ease, background 0.25s ease;
        }
        .tools-list :global(.tool-row:hover) {
          padding-left: 12px;
          background: var(--green-tint);
        }
        .tools-list :global(.tool-row.coming) {
          opacity: 0.55;
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .tools-list :global(.tool-row) {
            grid-template-columns: 30px 1fr auto;
            gap: 12px;
            padding: 18px 0;
          }
        }
        .tools-list :global(.tool-icon) {
          font-size: 22px;
          line-height: 1;
          text-align: center;
        }
        @media (max-width: 640px) {
          .tools-list :global(.tool-icon) {
            font-size: 18px;
          }
        }
        .tools-list :global(.tool-content) {
          min-width: 0;
        }
        .tools-list :global(.tool-question) {
          font-size: clamp(16px, 1.9vw, 20px);
          font-weight: 500;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .tools-list :global(.tool-name) {
          font-size: 12px;
          color: var(--ink-3);
          font-weight: 500;
        }
        @media (max-width: 640px) {
          .tools-list :global(.tool-name) {
            font-size: 11.5px;
          }
        }
        .tools-list :global(.tool-status) {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--green-soft);
          color: var(--green-deep);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          flex-shrink: 0;
        }
        .tools-list :global(.tool-status.coming-tag) {
          background: var(--rule);
          color: var(--ink-4);
        }
        .tools-list :global(.tool-arrow) {
          font-family: 'DM Mono', monospace;
          font-size: 18px;
          color: var(--ink-4);
          transition: color 0.2s, transform 0.2s;
        }
        .tools-list :global(.tool-row:hover .tool-arrow) {
          color: var(--green);
          transform: translateX(4px);
        }
        @media (max-width: 480px) {
          .tools-list :global(.tool-status) {
            display: none;
          }
        }

        /* WHY */
        .why-section {
          background: var(--bg-soft);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
          margin-top: 32px;
        }
        @media (max-width: 860px) {
          .why-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .why-statement {
          font-size: clamp(20px, 2.4vw, 26px);
          line-height: 1.35;
          color: var(--ink);
          font-weight: 500;
          margin-bottom: 20px;
          letter-spacing: -0.015em;
        }
        .why-statement strong {
          color: var(--green-deep);
          font-weight: 600;
        }
        .why-statement .loss {
          color: var(--red);
          font-weight: 600;
        }
        .why-statement em {
          font-style: italic;
          color: var(--green);
          font-weight: 500;
        }
        .why-prose {
          font-size: 15px;
          color: var(--ink-3);
          line-height: 1.6;
        }
        .gap-coin {
          background: var(--green);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.92em;
          white-space: nowrap;
        }
        .why-math {
          background: var(--bg);
          border: 1px solid var(--rule);
          border-radius: 14px;
          padding: 28px;
          font-family: 'DM Mono', monospace;
        }
        .why-math-title {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .why-math-title::before {
          content: '';
          width: 16px;
          height: 1px;
          background: var(--green);
        }
        .math-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 7px 0;
          font-size: 14px;
        }
        .math-label {
          color: var(--ink-3);
        }
        .math-val {
          color: var(--ink);
          font-weight: 500;
          font-size: 16px;
        }
        .math-val.minus {
          color: var(--red);
        }
        .math-line {
          height: 1px;
          background: var(--rule);
          margin: 6px 0;
        }
        .math-final {
          margin-top: 8px;
          padding-top: 14px;
          border-top: 2px solid var(--ink);
        }
        .math-final .math-row {
          padding: 4px 0;
        }
        .math-final .math-val {
          font-size: 24px;
          color: var(--red);
        }
        .math-caption {
          margin-top: 18px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: var(--ink-3);
          line-height: 1.5;
          padding-top: 16px;
          border-top: 1px solid var(--rule-soft);
        }

        /* TABLE */
        .table-wrap {
          background: var(--bg);
          border: 1px solid var(--rule);
          border-radius: 14px;
          overflow: hidden;
        }
        .investment-table {
          width: 100%;
          border-collapse: collapse;
        }
        .investment-table thead {
          background: var(--bg-soft);
          border-bottom: 1px solid var(--rule);
        }
        .investment-table th {
          font-size: 11px;
          font-weight: 600;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: left;
          padding: 14px 18px;
        }
        .investment-table th.num-col {
          text-align: right;
        }
        .investment-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--rule);
          font-size: 14px;
          color: var(--ink-2);
        }
        .investment-table tr:last-child td {
          border-bottom: none;
        }
        .investment-table tr:hover td {
          background: var(--bg-soft);
        }
        .investment-table .instrument {
          font-weight: 600;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .instrument-icon {
          width: 28px;
          height: 28px;
          background: var(--green-soft);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .investment-table td.num {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          text-align: right;
          font-size: 14px;
        }
        .real-num.red {
          color: var(--red);
        }
        .real-num.green {
          color: var(--green);
        }
        .real-num.amber {
          color: var(--amber);
        }
        .verdict {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: inline-block;
        }
        .verdict.lose {
          background: var(--red-soft);
          color: var(--red);
        }
        .verdict.modest {
          background: var(--green-soft);
          color: var(--green-deep);
        }
        .verdict.strong {
          background: var(--green);
          color: white;
        }
        .investment-table td.best-for {
          font-size: 13px;
          color: var(--ink-3);
          line-height: 1.4;
        }
        @media (max-width: 800px) {
          .investment-table {
            font-size: 13px;
          }
          .investment-table th,
          .investment-table td {
            padding: 10px 12px;
          }
          .hide-mobile {
            display: none;
          }
        }
        .table-footnote {
          margin-top: 16px;
          font-size: 12px;
          color: var(--ink-4);
          line-height: 1.5;
        }

        /* PLAYBOOK */
        .playbook {
          margin-top: 32px;
          background: var(--green-tint);
          border: 1px solid var(--green-soft);
          border-radius: 14px;
          padding: 28px;
        }
        .playbook-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--green-deep);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .playbook-title::before {
          content: '↳';
          font-family: 'DM Mono', monospace;
          color: var(--green);
          font-size: 18px;
        }
        .playbook-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 720px) {
          .playbook-steps {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        .playbook-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .playbook-step-num {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 500;
          color: var(--green);
          background: var(--bg);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid var(--green-soft);
        }
        .playbook-step h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .playbook-step p {
          font-size: 13px;
          color: var(--ink-3);
          line-height: 1.5;
        }

        /* SCENARIOS */
        .scenarios-section {
          background: var(--bg-soft);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .scenarios-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (max-width: 720px) {
          .scenarios-grid {
            grid-template-columns: 1fr;
          }
        }
        .scenarios-grid :global(.scenario-link) {
          background: var(--bg);
          border: 1px solid var(--rule);
          border-radius: 10px;
          padding: 16px 20px;
          color: var(--ink);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: all 0.15s;
        }
        .scenarios-grid :global(.scenario-link:hover) {
          border-color: var(--green);
          background: var(--green-tint);
          color: var(--green-deep);
        }
        .scenarios-grid :global(.scenario-link .text) {
          font-style: italic;
          font-weight: 500;
        }
        .scenarios-grid :global(.scenario-link .arrow) {
          color: var(--ink-4);
          font-family: 'DM Mono', monospace;
          transition: transform 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .scenarios-grid :global(.scenario-link:hover .arrow) {
          color: var(--green);
          transform: translateX(3px);
        }
        :global(.scenarios-cta) {
          margin-top: 32px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--green-deep);
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: gap 0.2s;
        }
        :global(.scenarios-cta:hover) {
          gap: 12px;
        }

        /* LONGFORM */
        .longform {
          max-width: 760px;
          margin: 0 auto;
        }
        .longform-block {
          margin-bottom: 48px;
        }
        .longform-block:last-child {
          margin-bottom: 0;
        }
        .longform h2 {
          font-size: clamp(22px, 2.8vw, 28px);
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 18px;
          color: var(--ink);
        }
        .longform h2 .accent {
          color: var(--green);
          font-style: italic;
          font-weight: 500;
        }
        .longform p {
          font-size: 16px;
          color: var(--ink-2);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .longform p strong {
          font-weight: 600;
          color: var(--ink);
        }
        .faq-list {
          margin-top: 16px;
        }
        .faq-item {
          border: 1px solid var(--rule);
          border-radius: 10px;
          margin-bottom: 8px;
          overflow: hidden;
          background: var(--bg);
          transition: border-color 0.15s;
        }
        .faq-item[open] {
          border-color: var(--green);
        }
        .faq-q {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          padding: 16px 20px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          list-style: none;
        }
        .faq-q::-webkit-details-marker {
          display: none;
        }
        .faq-toggle {
          font-family: 'DM Mono', monospace;
          font-size: 18px;
          color: var(--green);
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .faq-item[open] .faq-toggle {
          transform: rotate(45deg);
        }
        .faq-a {
          padding: 0 20px 18px 20px;
          font-size: 14px;
          color: var(--ink-3);
          line-height: 1.65;
        }

        /* FINAL CTA */
        .final-cta {
          background: var(--green);
          color: white;
          text-align: center;
          padding: 56px 24px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        .final-cta::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, var(--green-deep) 0%, transparent 70%);
          opacity: 0.4;
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .final-cta {
            padding: 44px 20px;
            border-radius: 14px;
          }
        }
        .final-cta-inner {
          position: relative;
          z-index: 1;
        }
        .final-cta h2 {
          font-size: clamp(24px, 3.2vw, 32px);
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .final-cta h2 .accent {
          font-style: italic;
          font-weight: 500;
          opacity: 0.85;
        }
        .final-cta p {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 28px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }
        .quick-starts {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .quick-starts :global(.quick-start-btn) {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 11px 18px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }
        .quick-starts :global(.quick-start-btn:hover) {
          background: white;
          color: var(--green-deep);
          border-color: white;
          transform: translateY(-1px);
        }
        .quick-starts :global(.amt) {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
        }
        .final-cta-secondary {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }
        .final-cta-secondary :global(a) {
          color: white;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
        }

        /* FOOTER */
        footer {
          padding: 48px 0 32px;
          border-top: 1px solid var(--rule);
          background: var(--bg);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 36px;
        }
        @media (max-width: 720px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }
        }
        .footer-brand .logo {
          margin-bottom: 12px;
        }
        .footer-tagline {
          font-size: 14px;
          color: var(--ink-3);
          max-width: 280px;
          line-height: 1.5;
        }
        .footer-col h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .footer-col :global(a) {
          display: block;
          padding: 5px 0;
          color: var(--ink-2);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s;
        }
        .footer-col :global(a:hover) {
          color: var(--green-deep);
        }
        .footer-bottom {
          border-top: 1px solid var(--rule);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: var(--ink-4);
        }
      `}</style>
    </>
  )
}
