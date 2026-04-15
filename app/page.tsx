'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Nav ────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e8ecf0',
      padding: '0 16px', height: '52px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '30px', height: '30px', background: '#1a6b3c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>📊</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            real<span style={{ color: '#1a6b3c' }}>return</span>.in
          </div>
          <div style={{ fontSize: '10px', color: '#8896a8', lineHeight: 1 }}>Real returns after tax &amp; inflation</div>
        </div>
      </Link>
      <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ background: '#1a6b3c', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
        Calculator →
      </Link>
    </nav>
  )
}

// ─── Hook Widget ────────────────────────────────────────────────
function HookWidget() {
  const [fdRate, setFdRate] = useState(7)
  const [taxSlab, setTaxSlab] = useState(30)
  const [inflation, setInflation] = useState(6)

  const postTaxRate = fdRate * (1 - taxSlab / 100)
  const realReturn = ((1 + postTaxRate / 100) / (1 + inflation / 100) - 1) * 100
  const isNeg = realReturn < 0

  const row = (label: string, val: number, set: (v: number) => void, min: number, max: number, step: number, suffix: string) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#4a5568' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f1923', fontFamily: 'DM Mono, monospace' }}>{val}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(parseFloat(e.target.value))} />
    </div>
  )

  return (
    <div style={{ background: '#f7f8fa', border: '1px solid #e8ecf0', borderRadius: '14px', padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a6b3c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
        Quick check — your FD real return
      </div>
      {row('FD Interest Rate', fdRate, setFdRate, 5, 10, 0.25, '%')}
      {row('Your Tax Slab', taxSlab, setTaxSlab, 0, 30, 5, '%')}
      {row('Inflation Rate', inflation, setInflation, 4, 10, 0.5, '%')}
      <div style={{ background: '#fff', border: `1px solid ${isNeg ? '#fca5a5' : '#bbf7d0'}`, borderRadius: '10px', padding: '16px', marginTop: '4px' }}>
        <div style={{ fontSize: '11px', color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Your real return</div>
        <div style={{ fontSize: '36px', fontWeight: 700, color: isNeg ? '#c0392b' : '#1a6b3c', fontFamily: 'DM Mono, monospace', letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>
          {realReturn >= 0 ? '+' : ''}{realReturn.toFixed(2)}%
        </div>
        <div style={{ fontSize: '11px', color: '#8896a8', marginBottom: '10px' }}>
          per year · after {taxSlab}% tax &amp; {inflation}% inflation
        </div>
        <div style={{ background: isNeg ? '#fdecea' : '#e8f5ee', color: isNeg ? '#c0392b' : '#1a6b3c', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 500, lineHeight: 1.5 }}>
          {isNeg
            ? '⚠️ Your FD is losing purchasing power every year. The bank grows your balance but inflation shrinks what it buys.'
            : '✅ Your FD is building real wealth — but compare with SIP to see how much more you could earn.'}
        </div>
      </div>
      <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ display: 'block', textAlign: 'center', background: '#1a6b3c', color: '#fff', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, marginTop: '14px' }}>
        Compare FD vs RD vs Mutual Funds →
      </Link>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────
export default function Home() {

  const tools = [
    {
      icon: '⚖️',
      title: 'FD vs RD vs MF Returns Calculator',
      desc: 'Compare Fixed Deposit, Recurring Deposit and Mutual Funds after tax and inflation. See what each actually earns in real terms.',
      tag: 'Live now', tagGreen: true, href: '/fd-vs-rd-vs-mf-returns-calculator', cta: 'Open Calculator →',
    },
    {
      icon: '🎯',
      title: 'Get Your Financial Plan in 3 Minutes',
      desc: 'Insurance gaps, goal SIPs, emergency fund — your complete financial health score with a prioritised action plan.',
      tag: 'Live now', tagGreen: true, href: '/personal-financial-planner', cta: 'Get My Plan →',
    },
    {
      icon: '🏖️',
      title: 'Retirement Corpus Calculator',
      desc: 'Know exactly how much you need to retire. Enter your assets, SIPs and expenses — see the gap and three ways to close it.',
      tag: 'Live now', tagGreen: true, href: '/retirement-corpus-calculator', cta: 'Calculate Now →',
    },
  ]

  const facts = [
    'At 30% tax slab, your 7% FD earns −1.04% real return after 6% inflation',
    'A ₹10K SIP for 15 years at 12% CAGR builds ₹12.4L more than FD in real terms',
    '₹1 lakh today needs ₹3.2L in 20 years to buy the same things at 6% inflation',
    'PPF at 7.1% tax-free beats a 9% FD for anyone in the 20% or 30% slab',
  ]

  return (
    <div>
      {/* Schema markup for calculator */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'Real Return Calculator — FD vs SIP after Tax & Inflation',
                url: 'https://www.realreturn.in/calculator',
                applicationCategory: 'FinanceApplication',
                operatingSystem: 'Web Browser',
                description: 'Free calculator showing real returns on FD, RD and Mutual Funds after tax and inflation for Indian investors',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
                audience: { '@type': 'Audience', audienceType: 'Indian investors' },
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What is real return on FD in India?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Real return on FD is the actual return after adjusting for tax and inflation. For example, a 7% FD for someone in the 30% tax slab gives a post-tax return of 4.9%. After 6% inflation, the real return is approximately -1.04% per year — meaning the investment is actually losing purchasing power.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Is FD better than SIP in India?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'For most investors in the 20% or 30% tax slab, SIP in equity mutual funds delivers significantly higher real returns than FD over a 5+ year horizon. A 12% CAGR mutual fund at 6% inflation gives approximately +5.66% real return compared to -1.04% for a 7% FD at 30% tax. However, FD is safer for short-term goals.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How do I calculate real return on investment in India?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Real return is calculated using the Fisher Equation: Real Return = ((1 + Post-Tax Nominal Return) / (1 + Inflation Rate)) - 1. For FD: first deduct tax from the interest rate (post-tax rate = FD rate × (1 - tax slab)), then apply inflation adjustment using the Fisher equation.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What is the real return on FD after tax and inflation in India 2025?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'In 2025, with average FD rates around 7%, inflation at 5-6%, and 30% tax slab, the real return on FD is approximately -0.5% to -1% per year. This means FD investors in the highest tax slab are losing purchasing power, not gaining it.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <Nav />

      {/* ── HERO ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '36px 16px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#e8f5ee', color: '#1a6b3c', fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '16px' }}>
          India&apos;s Real Return Calculator
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 7vw, 44px)', fontWeight: 700, color: '#0f1923', lineHeight: 1.2, letterSpacing: '-0.8px', marginBottom: '12px' }}>
          What does your investment<br />
          <span style={{ color: '#1a6b3c' }}>actually</span> return?
        </h1>
        <p style={{ fontSize: '15px', color: '#4a5568', lineHeight: 1.7, marginBottom: '28px', maxWidth: '420px', margin: '0 auto 28px' }}>
          After tax. After inflation. The real number — not what your bank tells you.
        </p>
        <HookWidget />
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#0f1923', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: '−1.04%', label: 'Real return: 7% FD, 30% tax slab' },
            { val: '+5.66%', label: 'Real return: 12% MF CAGR, 6% inflation' },
            { val: '12 yrs', label: 'For ₹1L to halve at 6% inflation' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', fontFamily: 'DM Mono, monospace' }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section style={{ padding: '40px 16px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Free Tools</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.4px' }}>Built for Indian investors</h2>
          <p style={{ fontSize: '13px', color: '#4a5568', marginTop: '6px' }}>No login. No ads on tools. Just honest numbers.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tools.map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', background: '#e8f5ee', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f1923' }}>{t.title}</div>
                  <span style={{ fontSize: '10px', fontWeight: 600, background: t.tagGreen ? '#e8f5ee' : '#fef3dc', color: t.tagGreen ? '#1a6b3c' : '#d4860a', padding: '2px 8px', borderRadius: '999px' }}>{t.tag}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6, marginBottom: '10px' }}>{t.desc}</div>
                {t.href !== '#' ? (
                  <Link href={t.href} style={{ fontSize: '13px', fontWeight: 600, color: '#1a6b3c' }}>{t.cta}</Link>
                ) : (
                  <span style={{ fontSize: '13px', color: '#8896a8' }}>{t.cta}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSIGHTS ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e8ecf0', borderBottom: '1px solid #e8ecf0', padding: '32px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', textAlign: 'center' }}>Did you know?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {facts.map((f, i) => (
              <div key={i} style={{ background: '#f7f8fa', border: '1px solid #e8ecf0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#4a5568', lineHeight: 1.6, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#1a6b3c', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>→</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO TEXT SECTION — indexable content for Google ── */}
      <section style={{ padding: '48px 16px', maxWidth: '760px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.4px', marginBottom: '16px' }}>
          What is real return on investment in India?
        </h2>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          Real return is the actual return on your investment after adjusting for both tax and inflation. Most Indians focus on the nominal interest rate — the number their bank advertises. But this number is misleading because it does not account for two major deductions: the tax you pay on the interest earned, and the purchasing power lost to inflation.
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          For example, a 7% Fixed Deposit sounds attractive. But if you are in the 30% income tax slab, your post-tax return drops to 4.9%. After adjusting for 6% inflation using the Fisher Equation, your real return is approximately <strong style={{ color: '#c0392b' }}>−1.04% per year</strong>. Your bank balance grows, but your purchasing power actually shrinks every year.
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '32px' }}>
          In contrast, a Systematic Investment Plan (SIP) in an equity mutual fund at 12% CAGR — after 12.5% LTCG tax with ₹1.25 lakh exemption and 6% inflation — delivers approximately <strong style={{ color: '#1a6b3c' }}>+5.66% real return per year</strong>. Over 10 to 15 years, this difference compounds dramatically.
        </p>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.4px', marginBottom: '16px' }}>
          FD vs SIP — which gives better real returns in India?
        </h2>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          The comparison between Fixed Deposits and Mutual Fund SIPs is not straightforward because it depends on your tax slab, investment horizon, and the prevailing inflation rate. For investors in the 20% or 30% tax slab with a horizon of 5 years or more, equity mutual funds consistently deliver higher real returns than FDs.
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          FD interest is taxed at your income slab rate (up to 30%), while Mutual Fund Long Term Capital Gains (LTCG) are taxed at only 12.5% with a ₹1.25 lakh annual exemption under the Union Budget 2024. This tax efficiency makes mutual funds significantly more advantageous for long-term wealth creation.
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '32px' }}>
          However, FDs are safer and more predictable for short-term goals (under 3 years), emergency funds, and for investors who cannot tolerate market volatility. The right answer depends on your specific situation — which is exactly what our free calculator helps you determine.
        </p>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.4px', marginBottom: '16px' }}>
          How to use the real return calculator
        </h2>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          Our Financial Reality Engine compares FD, RD (Recurring Deposit), and Mutual Funds side by side showing three layers of returns: the nominal corpus (what your statement shows), the post-tax corpus (after income tax or LTCG), and the real value in today&apos;s money (after inflation adjustment).
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '16px' }}>
          Simply enter your investment amount, duration, interest rate or expected CAGR, your income tax slab, and the expected inflation rate. The calculator uses the Fisher Equation for mathematically accurate real return calculations — the same method used by economists and financial planners.
        </p>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9 }}>
          The tool is completely free, requires no login, and all calculations happen instantly in your browser. No data is stored or shared.
        </p>
      </section>

      {/* ── FAQ SECTION ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e8ecf0', padding: '40px 16px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.4px', marginBottom: '24px' }}>
            Frequently asked questions
          </h2>
          {[
            {
              q: 'What is the real return on a 7% FD in India?',
              a: 'For someone in the 30% tax slab with 6% inflation, a 7% FD gives a real return of approximately −1.04% per year. Post-tax return is 4.9% (7% × 0.7), and after adjusting for 6% inflation using the Fisher Equation, the real return is negative. You are losing purchasing power despite earning interest.',
            },
            {
              q: 'Is FD safe after adjusting for inflation?',
              a: 'FD is capital-safe but not inflation-safe for investors in the 20-30% tax bracket. With current FD rates of 6.5-7.5% and inflation at 5-6%, most FD investors earn zero or negative real returns. For capital safety with better real returns, consider PPF (tax-free) or short-duration debt mutual funds.',
            },
            {
              q: 'How is LTCG calculated on mutual funds in India 2025?',
              a: 'As per Union Budget 2024, Long Term Capital Gains (LTCG) on equity mutual funds held for more than 1 year are taxed at 12.5% (reduced from 10%). The annual exemption limit is ₹1.25 lakh (increased from ₹1 lakh). LTCG above ₹1.25 lakh per year is taxed at 12.5% without indexation benefit.',
            },
            {
              q: 'What is the Fisher Equation for real return calculation?',
              a: 'The Fisher Equation calculates real return as: Real Return = ((1 + Nominal Return) / (1 + Inflation Rate)) − 1. This is more accurate than the simple approximation of subtracting inflation from nominal return. For example, 7% FD at 30% tax (post-tax 4.9%) with 6% inflation: Real Return = (1.049 / 1.06) − 1 = −1.04%.',
            },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e8ecf0', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f1923', marginBottom: '8px', lineHeight: 1.4 }}>{faq.q}</h3>
              <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f1923', padding: '28px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          real<span style={{ color: '#34d399' }}>return</span>.in
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
          Real returns after tax &amp; inflation · Free forever · No login required
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
          <Link href="/about" style={{ color: 'rgba(255,255,255,0.4)' }}>About</Link>
          <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.4)' }}>Privacy</Link>
          <Link href="/disclaimer" style={{ color: 'rgba(255,255,255,0.4)' }}>Disclaimer</Link>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
          Not investment advice. Results are illustrative. Consult a SEBI-registered advisor. LTCG rates as per Union Budget 2024.
        </div>
      </footer>
    </div>
  )
}
