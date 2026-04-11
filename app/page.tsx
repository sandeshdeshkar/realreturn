'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [fdRate, setFdRate] = useState(7)
  const [taxSlab, setTaxSlab] = useState(30)
  const [inflation, setInflation] = useState(6)

  const postTaxRate = fdRate * (1 - taxSlab / 100)
  const realReturn = ((1 + postTaxRate / 100) / (1 + inflation / 100) - 1) * 100
  const isNegative = realReturn < 0

  return (
    <div>
      {/* NAV */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#1a6b3c',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>📊</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f1923', letterSpacing: '-0.3px' }}>
              real<span style={{ color: '#1a6b3c' }}>return</span>.in
            </div>
            <div style={{ fontSize: '10px', color: '#8896a8', lineHeight: 1 }}>
              Real returns after tax &amp; inflation
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px', background: '#e8f5ee', color: '#1a6b3c',
            padding: '4px 10px', borderRadius: '999px', fontWeight: '500'
          }}>Free · No login</span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        padding: '52px 24px 40px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#e8f5ee', color: '#1a6b3c',
          fontSize: '11px', fontWeight: '600',
          padding: '4px 12px', borderRadius: '999px',
          letterSpacing: '0.8px', textTransform: 'uppercase',
          marginBottom: '18px',
        }}>
          India&apos;s Real Return Calculator
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: '700',
          color: '#0f1923',
          lineHeight: '1.2',
          letterSpacing: '-1px',
          marginBottom: '14px',
          maxWidth: '680px',
          margin: '0 auto 14px',
        }}>
          What does your investment<br />
          <span style={{ color: '#1a6b3c' }}>actually</span> return?
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#4a5568',
          maxWidth: '480px',
          margin: '0 auto 36px',
          lineHeight: '1.7',
        }}>
          After tax. After inflation. The real number —<br />not what your bank tells you.
        </p>

        {/* HOOK WIDGET */}
        <div style={{
          maxWidth: '540px',
          margin: '0 auto',
          background: '#f7f8fa',
          border: '1px solid #e8ecf0',
          borderRadius: '14px',
          padding: '24px 28px',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a6b3c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '18px' }}>
            Quick Check — Your FD Real Return
          </div>

          {/* FD Rate Slider */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#4a5568' }}>FD Interest Rate</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f1923', fontFamily: 'DM Mono, monospace' }}>{fdRate}%</span>
            </div>
            <input type="range" min="5" max="10" step="0.25" value={fdRate}
              onChange={e => setFdRate(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#1a6b3c' }} />
          </div>

          {/* Tax Slider */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#4a5568' }}>Your Tax Slab</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f1923', fontFamily: 'DM Mono, monospace' }}>{taxSlab}%</span>
            </div>
            <input type="range" min="0" max="30" step="5" value={taxSlab}
              onChange={e => setTaxSlab(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#1a6b3c' }} />
          </div>

          {/* Inflation Slider */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#4a5568' }}>Inflation Rate</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f1923', fontFamily: 'DM Mono, monospace' }}>{inflation}%</span>
            </div>
            <input type="range" min="4" max="10" step="0.5" value={inflation}
              onChange={e => setInflation(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#1a6b3c' }} />
          </div>

          {/* Result */}
          <div style={{
            background: '#fff',
            border: `1px solid ${isNegative ? '#fca5a5' : '#bbf7d0'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Your Real Return
              </div>
              <div style={{
                fontSize: '32px', fontWeight: '700',
                color: isNegative ? '#c0392b' : '#1a6b3c',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '-1px',
              }}>
                {realReturn >= 0 ? '+' : ''}{realReturn.toFixed(2)}%
              </div>
              <div style={{ fontSize: '11px', color: '#8896a8', marginTop: '2px' }}>
                per year · after {taxSlab}% tax &amp; {inflation}% inflation
              </div>
            </div>
            <div style={{
              background: isNegative ? '#fdecea' : '#e8f5ee',
              color: isNegative ? '#c0392b' : '#1a6b3c',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '12px', fontWeight: '500',
              maxWidth: '160px', lineHeight: '1.5',
              textAlign: 'center',
            }}>
              {isNegative
                ? '⚠️ Losing purchasing power every year'
                : '✅ Building real wealth'}
            </div>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <a href="/calculator" style={{
              display: 'inline-block',
              background: '#1a6b3c', color: '#fff',
              padding: '11px 28px', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600',
              letterSpacing: '0.2px',
            }}>
              See Full Comparison — FD vs RD vs MF →
            </a>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{
        background: '#0f1923',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '48px',
        flexWrap: 'wrap',
      }}>
        {[
          { val: '−1.04%', label: 'Real return on 7% FD at 30% tax slab' },
          { val: '+5.66%', label: 'Real return on 12% MF at 6% inflation' },
          { val: '12 yrs', label: 'For ₹1L to halve in value at 6% inflation' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#34d399', fontFamily: 'DM Mono, monospace' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', maxWidth: '180px' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* TOOLS SECTION */}
      <section style={{ padding: '56px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8896a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Free Tools
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f1923', letterSpacing: '-0.5px' }}>
            Built for Indian investors
          </h2>
          <p style={{ fontSize: '14px', color: '#4a5568', marginTop: '8px' }}>
            No login. No ads on tools. Just honest numbers.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {[
            {
              icon: '⚖️',
              title: 'FD vs RD vs Mutual Funds',
              desc: 'Compare all three side by side after tax and inflation. See what each actually returns in today\'s money.',
              tag: 'Most Popular',
              tagColor: '#1a6b3c',
              tagBg: '#e8f5ee',
              href: '/calculator',
              cta: 'Open Calculator →',
            },
            {
              icon: '🎯',
              title: 'Goal Planner',
              desc: 'Want ₹1 Crore in 10 years? Find out exactly how much SIP you need — inflation-adjusted.',
              tag: 'Coming Soon',
              tagColor: '#d4860a',
              tagBg: '#fef3dc',
              href: '#',
              cta: 'Notify Me',
            },
            {
              icon: '📊',
              title: 'Tax Regime Comparator',
              desc: 'Old vs New tax regime — which saves you more this year? Personalised to your income and deductions.',
              tag: 'Coming Soon',
              tagColor: '#d4860a',
              tagBg: '#fef3dc',
              href: '#',
              cta: 'Notify Me',
            },
          ].map((tool, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e8ecf0',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '40px', height: '40px',
                  background: '#e8f5ee', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  {tool.icon}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  background: tool.tagBg, color: tool.tagColor,
                  padding: '3px 8px', borderRadius: '999px',
                  letterSpacing: '0.5px',
                }}>{tool.tag}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f1923', marginBottom: '8px' }}>
                {tool.title}
              </div>
              <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.6', flex: 1, marginBottom: '18px' }}>
                {tool.desc}
              </div>
              <a href={tool.href} style={{
                display: 'inline-block',
                fontSize: '13px', fontWeight: '600',
                color: tool.href === '#' ? '#8896a8' : '#1a6b3c',
                borderTop: '1px solid #e8ecf0',
                paddingTop: '14px',
              }}>
                {tool.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* INSIGHT STRIP */}
      <section style={{
        background: '#f7f8fa',
        borderTop: '1px solid #e8ecf0',
        borderBottom: '1px solid #e8ecf0',
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8896a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', textAlign: 'center' }}>
            Did you know?
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}>
            {[
              'At 30% tax slab, your 7% FD earns a real return of −1.04% after 6% inflation',
              'A ₹10K SIP for 15 years at 12% CAGR beats a ₹18L FD by ₹12.4L in real terms',
              '₹1 lakh today needs ₹3.2L in 20 years to buy the same things at 6% inflation',
              'PPF at 7.1% tax-free beats a 9% FD for anyone in the 20% or 30% tax slab',
            ].map((insight, i) => (
              <div key={i} style={{
                background: '#fff',
                border: '1px solid #e8ecf0',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '12px',
                color: '#4a5568',
                lineHeight: '1.6',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#1a6b3c', fontWeight: '700', flexShrink: 0 }}>→</span>
                {insight}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section style={{ padding: '56px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f1923', letterSpacing: '-0.5px', marginBottom: '12px' }}>
          Why most Indians don&apos;t know their real return
        </h2>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.8', marginBottom: '32px' }}>
          Banks advertise 7% FD rates. Mutual funds show 12% CAGR. But nobody tells you what 
          you actually keep after the government takes its share and inflation erodes the rest. 
          realreturn.in shows you that number — clearly, honestly, in seconds.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          textAlign: 'left',
        }}>
          {[
            { icon: '🔒', title: 'No login required', desc: 'Everything calculated in your browser. Nothing stored.' },
            { icon: '🇮🇳', title: 'Built for India', desc: 'Indian tax rules, LTCG, TDS, slab rates — all accurate.' },
            { icon: '⚡', title: 'Instant results', desc: 'Real-time calculations as you move the sliders.' },
            { icon: '🎯', title: 'Unbiased', desc: 'No product recommendations. Just honest math.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e8ecf0',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f1923', marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.5' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #e8ecf0',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f1923', marginBottom: '6px' }}>
          real<span style={{ color: '#1a6b3c' }}>return</span>.in
        </div>
        <div style={{ fontSize: '12px', color: '#8896a8', marginBottom: '12px' }}>
          Real returns after tax &amp; inflation · Free forever · No login required
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '12px', color: '#8896a8' }}>
          <a href="/about" style={{ color: '#8896a8' }}>About</a>
          <a href="/privacy" style={{ color: '#8896a8' }}>Privacy</a>
          <a href="/disclaimer" style={{ color: '#8896a8' }}>Disclaimer</a>
        </div>
        <div style={{ fontSize: '11px', color: '#c0ccd8', marginTop: '12px' }}>
          Not investment advice. Calculations are illustrative. Consult a SEBI-registered advisor.
        </div>
      </footer>
    </div>
  )
}