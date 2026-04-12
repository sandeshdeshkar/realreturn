'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── shared nav ────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e8ecf0',
      padding: '0 16px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '30px', height: '30px',
          background: '#1a6b3c',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', flexShrink: 0,
        }}>📊</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            real<span style={{ color: '#1a6b3c' }}>return</span>.in
          </div>
          <div style={{ fontSize: '10px', color: '#8896a8', lineHeight: 1 }}>Real returns after tax &amp; inflation</div>
        </div>
      </Link>
      <Link href="/calculator" style={{
        background: '#1a6b3c', color: '#fff',
        fontSize: '12px', fontWeight: 600,
        padding: '7px 14px', borderRadius: '8px',
        whiteSpace: 'nowrap',
      }}>
        Calculator →
      </Link>
    </nav>
  )
}

// ─── hook widget ────────────────────────────────────────────────
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
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))} />
    </div>
  )

  return (
    <div style={{
      background: '#f7f8fa',
      border: '1px solid #e8ecf0',
      borderRadius: '14px',
      padding: '20px',
      maxWidth: '520px',
      margin: '0 auto',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: '#1a6b3c',
        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px',
      }}>
        Quick check — your FD real return
      </div>

      {row('FD Interest Rate', fdRate, setFdRate, 5, 10, 0.25, '%')}
      {row('Your Tax Slab', taxSlab, setTaxSlab, 0, 30, 5, '%')}
      {row('Inflation Rate', inflation, setInflation, 4, 10, 0.5, '%')}

      {/* Result */}
      <div style={{
        background: '#fff',
        border: `1px solid ${isNeg ? '#fca5a5' : '#bbf7d0'}`,
        borderRadius: '10px',
        padding: '16px',
        marginTop: '4px',
      }}>
        <div style={{ fontSize: '11px', color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
          Your real return
        </div>
        <div style={{
          fontSize: '36px', fontWeight: 700,
          color: isNeg ? '#c0392b' : '#1a6b3c',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '-1px', lineHeight: 1,
          marginBottom: '6px',
        }}>
          {realReturn >= 0 ? '+' : ''}{realReturn.toFixed(2)}%
        </div>
        <div style={{ fontSize: '11px', color: '#8896a8', marginBottom: '10px' }}>
          per year · after {taxSlab}% tax &amp; {inflation}% inflation
        </div>
        <div style={{
          background: isNeg ? '#fdecea' : '#e8f5ee',
          color: isNeg ? '#c0392b' : '#1a6b3c',
          borderRadius: '8px', padding: '10px 12px',
          fontSize: '12px', fontWeight: 500, lineHeight: 1.5,
        }}>
          {isNeg
            ? '⚠️ Your FD is losing purchasing power every year. The bank grows your balance but inflation shrinks what it buys.'
            : '✅ Your FD is building real wealth — but compare with SIP to see how much more you could earn.'}
        </div>
      </div>

      <Link href="/calculator" style={{
        display: 'block', textAlign: 'center',
        background: '#1a6b3c', color: '#fff',
        padding: '13px', borderRadius: '10px',
        fontSize: '14px', fontWeight: 600,
        marginTop: '14px',
        letterSpacing: '0.1px',
      }}>
        Compare FD vs RD vs Mutual Funds →
      </Link>
    </div>
  )
}

// ─── main page ─────────────────────────────────────────────────
export default function Home() {
  const tools = [
    {
      icon: '⚖️',
      title: 'FD vs RD vs Mutual Funds',
      desc: 'Compare all three side by side. See nominal corpus, post-tax corpus, and real inflation-adjusted value — in one view.',
      tag: 'Live now',
      tagGreen: true,
      href: '/calculator',
      cta: 'Open Calculator →',
    },
    {
      icon: '🎯',
      title: 'Goal Planner',
      desc: 'I want ₹1 Crore in 10 years — how much SIP do I need? Inflation-adjusted target, real returns applied.',
      tag: 'Coming soon',
      tagGreen: false,
      href: '#',
      cta: 'Coming soon',
    },
    {
      icon: '📊',
      title: 'Old vs New Tax Regime',
      desc: 'Which tax regime saves you more this year? Personalised to your salary, 80C investments, HRA and home loan.',
      tag: 'Coming soon',
      tagGreen: false,
      href: '#',
      cta: 'Coming soon',
    },
  ]

  const facts = [
    'At 30% tax slab, your 7% FD earns −1.04% real return after 6% inflation',
    'A ₹10K SIP for 15 years at 12% CAGR builds ₹12.4L more than FD in real terms',
    '₹1 lakh today needs ₹3.2L in 20 years to buy the same things at 6% inflation',
    'PPF at 7.1% tax-free beats a 9% FD for anyone in the 20% or 30% slab',
  ]

  const trust = [
    { icon: '🔒', title: 'No login required', desc: 'Everything runs in your browser. Nothing stored or tracked.' },
    { icon: '🇮🇳', title: 'Built for India', desc: 'Indian tax rules, LTCG, TDS, 80C — all accurate.' },
    { icon: '⚡', title: 'Real-time results', desc: 'Results update instantly as you move the sliders.' },
    { icon: '🎯', title: 'Completely unbiased', desc: 'No product recommendations. Just honest math.' },
  ]

  return (
    <div>
      <Nav />

      {/* ── HERO ── */}
      <section style={{
        background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        padding: '36px 16px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#e8f5ee', color: '#1a6b3c',
          fontSize: '11px', fontWeight: 600,
          padding: '4px 12px', borderRadius: '999px',
          letterSpacing: '0.8px', textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          India&apos;s Real Return Calculator
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 7vw, 44px)',
          fontWeight: 700,
          color: '#0f1923',
          lineHeight: 1.2,
          letterSpacing: '-0.8px',
          marginBottom: '12px',
        }}>
          What does your investment<br />
          <span style={{ color: '#1a6b3c' }}>actually</span> return?
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#4a5568',
          lineHeight: 1.7,
          marginBottom: '28px',
          maxWidth: '420px',
          margin: '0 auto 28px',
        }}>
          After tax. After inflation. The real number — not what your bank tells you.
        </p>

        <HookWidget />
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: '#0f1923',
        padding: '24px 16px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          maxWidth: '700px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
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
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e8ecf0',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '40px', height: '40px',
                background: '#e8f5ee', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f1923' }}>{t.title}</div>
                  <span style={{
                    fontSize: '10px', fontWeight: 600,
                    background: t.tagGreen ? '#e8f5ee' : '#fef3dc',
                    color: t.tagGreen ? '#1a6b3c' : '#d4860a',
                    padding: '2px 8px', borderRadius: '999px',
                  }}>{t.tag}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6, marginBottom: '10px' }}>{t.desc}</div>
                {t.href !== '#' ? (
                  <Link href={t.href} style={{
                    fontSize: '13px', fontWeight: 600, color: '#1a6b3c',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>{t.cta}</Link>
                ) : (
                  <span style={{ fontSize: '13px', color: '#8896a8' }}>{t.cta}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSIGHTS ── */}
      <section style={{
        background: '#fff',
        borderTop: '1px solid #e8ecf0',
        borderBottom: '1px solid #e8ecf0',
        padding: '32px 16px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', textAlign: 'center' }}>
            Did you know?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {facts.map((f, i) => (
              <div key={i} style={{
                background: '#f7f8fa',
                border: '1px solid #e8ecf0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#4a5568',
                lineHeight: 1.6,
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#1a6b3c', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>→</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section style={{ padding: '40px 16px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.3px', marginBottom: '10px' }}>
            Why most Indians don&apos;t know their real return
          </h2>
          <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto' }}>
            Banks advertise 7% FD rates. Mutual funds show 12% CAGR. Nobody tells you what you actually keep after tax and inflation. realreturn.in shows that number — clearly, honestly, in seconds.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {trust.map((t, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e8ecf0',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{t.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f1923', marginBottom: '4px' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #e8ecf0',
        padding: '24px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f1923', marginBottom: '6px' }}>
          real<span style={{ color: '#1a6b3c' }}>return</span>.in
        </div>
        <div style={{ fontSize: '12px', color: '#8896a8', marginBottom: '14px' }}>
          Real returns after tax &amp; inflation · Free · No login required
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '12px', color: '#8896a8', marginBottom: '12px' }}>
          <Link href="/about" style={{ color: '#8896a8' }}>About</Link>
          <Link href="/privacy" style={{ color: '#8896a8' }}>Privacy</Link>
          <Link href="/disclaimer" style={{ color: '#8896a8' }}>Disclaimer</Link>
        </div>
        <div style={{ fontSize: '11px', color: '#c0ccd8' }}>
          Not investment advice. Results are illustrative. Consult a SEBI-registered advisor.
        </div>
      </footer>
    </div>
  )
}
