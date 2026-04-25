'use client'

// components/FdVsSipHub.tsx
// Hub page for /fd-vs-sip — final version with all SEO fixes

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ── Constants ─────────────────────────────────────────────────────────────
const POPULAR_PAGES = [
  { href: '/fd-vs-sip/10000-per-month/10-years', tag: 'Live ✓',      title: '₹10,000/month · 10 years', nums: 'SIP (MF) ₹22.4L vs FD ₹17.4L', live: true  },
  { href: '#',                                   tag: 'Coming soon', title: '₹5,000/month · 10 years',  nums: 'Available soon',                live: false },
  { href: '#',                                   tag: 'Coming soon', title: '₹10,000/month · 5 years',  nums: 'Available soon',                live: false },
  { href: '#',                                   tag: 'Coming soon', title: '₹10,000/month · 20 years', nums: 'Available soon',                live: false },
]

const RELATED_TOOLS = [
  { href: '/fd-vs-rd-vs-mf-returns-calculator', label: 'FD vs RD vs MF Calculator' },
  { href: '/retirement-corpus-calculator',       label: 'Retirement Corpus Calculator' },
  { href: '/personal-financial-planner',         label: 'Financial Plan in 3 Minutes' },
  { href: '#',                                   label: 'Does FD beat inflation?' },
]

const RELATED_GUIDES = [
  { href: '#',                                   title: 'Does FD beat inflation in India?',    sub: 'After 30% tax, FD real return is often negative' },
  { href: '/fd-vs-rd-vs-mf-returns-calculator', title: 'FD vs RD vs Mutual Funds Calculator', sub: 'Compare all three with fully adjustable inputs' },
  { href: '/retirement-corpus-calculator',       title: 'How much SIP do I need for retirement?', sub: 'Retirement corpus calculator with inflation adjustment' },
]

const FAQS = [
  {
    q: 'Is SIP in Equity Mutual Funds better than Fixed Deposit for all investors?',
    a: 'Not necessarily. Based on estimated returns, SIP (MF) tends to deliver higher real returns for investors in the 20–30% tax bracket investing for 5+ years. Fixed Deposit may be more suitable for goals under 3 years, emergency funds, or lower tax brackets. Actual SIP (MF) returns are not guaranteed.',
  },
  {
    q: 'Why does Fixed Deposit show a negative real return after tax?',
    a: 'At 30% tax: Fixed Deposit at 7% gives ~4.9% after tax. With 6% inflation, the estimated real return is around −1.0%/yr — purchasing power falls even as the balance grows. At 0% tax, FD estimated real return is approximately +0.9%/yr. Use the calculator above to see your specific numbers.',
  },
  {
    q: 'What is SIP in Equity Mutual Funds exactly?',
    a: 'SIP (MF) = Systematic Investment Plan in a Mutual Fund. You invest a fixed amount every month into a diversified equity mutual fund. Returns are market-linked and not guaranteed — unlike a Fixed Deposit which gives guaranteed returns. The "(MF)" distinguishes it from stock SIPs.',
  },
  {
    q: 'What happens to Equity Mutual Fund SIP if markets fall?',
    a: 'Portfolio value falls temporarily. In 2020, equity mutual fund portfolios fell approximately 35% before recovering. Historically, diversified equity SIPs held for 10+ years in India have not delivered negative returns — but past performance is not a guarantee of future results. Fixed Deposits are unaffected by market movements.',
  },
  {
    q: 'Can I invest in both Fixed Deposit and Equity Mutual Fund SIP?',
    a: 'Yes. A common approach: keep 3–6 months of expenses in Fixed Deposit as an emergency fund, invest additional savings via SIP in Equity Mutual Funds for longer-term goals. The appropriate split depends on individual goals, risk comfort, and time horizon.',
  },
]

// ── Calc helpers ──────────────────────────────────────────────────────────
function calcSIP(pmt: number, yrs: number, rate: number): number {
  const n  = yrs * 12
  const mr = Math.pow(1 + rate / 100, 1 / 12) - 1
  return pmt * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
}

function calcFD(pmt: number, yrs: number, rate: number): number {
  const n  = yrs * 12
  const mr = Math.pow(1 + rate / 400, 1 / 3) - 1
  let c    = 0
  for (let i = 0; i < n; i++) c = (c + pmt) * (1 + mr)
  return c
}

function fmtL(v: number): string {
  const l = v / 100000
  if (l >= 100) { const c = Math.round(l / 10) / 10; return `₹${c % 1 === 0 ? c.toFixed(0) : c.toFixed(1)}Cr` }
  const r = Math.round(l * 10) / 10
  return `₹${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}L`
}

function fmtPct(p: number): string { return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%` }

function taxDesc(v: number): string {
  if (v === 0)  return 'No tax — income ≤ ₹7L (new regime)'
  if (v <= 5)   return 'Income ₹7L–₹10L (new regime)'
  if (v <= 10)  return 'Income ₹10L–₹12L (new regime)'
  if (v <= 15)  return 'Income ₹12L–₹15L (new regime)'
  if (v <= 20)  return 'Income ₹15L–₹20L (new regime)'
  return 'Income above ₹20L/yr (new regime)'
}

// ── Design tokens ─────────────────────────────────────────────────────────
const G    = '#1a6b3c'
const GD   = '#0f3d22'
const GL   = '#4ade80'
const GP   = '#f0fdf4'
const GB   = '#bbf7d0'
const AM   = '#d97706'
const AMP  = '#fffbeb'
const BL   = '#2563eb'
const C100 = '#f3f4f6'
const C200 = '#e5e7eb'
const C400 = '#9ca3af'
const C500 = '#6b7280'
const C700 = '#374151'
const C900 = '#111827'

// ── Component ─────────────────────────────────────────────────────────────
export default function FdVsSipHub() {
  const [state,    setState]    = useState<1 | 2>(1)
  const [amount,   setAmount]   = useState(10000)
  const [duration, setDuration] = useState(10)
  const [fdRate,   setFdRate]   = useState(7.0)
  const [mfRate,   setMfRate]   = useState(12.0)
  const [taxVal,   setTaxVal]   = useState(30)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)

  // Derived values
  const inv        = amount * 12 * duration
  const sipNom     = calcSIP(amount, duration, mfRate)
  const fdNom      = calcFD(amount, duration, fdRate)
  const tax        = taxVal / 100
  const sipTax     = Math.max(0, (sipNom - inv) - 125000) * 0.125
  const sipPT      = sipNom - sipTax
  const sipReal    = sipPT / Math.pow(1.06, duration)
  const fdTax      = (fdNom - inv) * tax
  const fdPT       = fdNom - fdTax
  const fdReal     = fdPT / Math.pow(1.06, duration)
  const sipRealPct = ((1 + mfRate * (sipPT / sipNom) / 100) / 1.06 - 1) * 100
  const fdRealPct  = ((1 + fdRate * (1 - tax) / 100) / 1.06 - 1) * 100

  const handleTaxSlider = useCallback((v: number) => setTaxVal(v), [])
  const sliderPct = (val: number, min: number, max: number) =>
    `${((val - min) / (max - min) * 100).toFixed(1)}%`

  // Shared styles
  const SEC: React.CSSProperties     = { padding: '20px 0', borderBottom: `1px solid ${C200}` }
  const SEC_LBL: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: C400, marginBottom: 14, display: 'block' }

  return (
    <>
      <style>{`
        body { background: ${C100} !important; margin: 0; }
        .pw  { max-width: 1280px; margin: 0 auto; padding: 0 48px; box-sizing: border-box; }
        /* Mobile: full width */
        @media (max-width: 899px) { .pw { padding: 0 16px; } }

        /* Desktop: calculator 3-col grid */
        @media (min-width: 900px) {
          .calc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto 1fr;
            min-height: 460px;
          }
          .calc-head-row { grid-column: 1 / -1; }
          .nom-outer     { display: contents; }
          .real-wrap-on  {
            grid-column: 2 / -1;
            display: grid !important;
            grid-template-columns: 1fr 2fr;
            grid-template-rows: auto 1fr auto auto;
          }
          .real-back     { grid-column: 1 / -1; }
          .r-insight-row { grid-column: 1 / -1; }
          .r-assump-row  { grid-column: 1 / -1; }
        }
        @media (max-width: 899px) {
          .calc-grid     { display: block; }
          .nom-outer     { display: block; }
          .real-wrap-on  { display: block !important; }
        }

        /* Content section: 2-col on desktop */
        @media (min-width: 900px) {
          .content-grid {
            max-width: 1280px; margin: 0 auto;
            padding: 40px 48px 64px;
            display: grid;
            grid-template-columns: 240px 1fr;
            gap: 40px; align-items: start;
          }
          .rt-card-sticky { position: sticky; top: 74px; }
          .cta-row { flex-direction: row !important; align-items: center; justify-content: space-between; }
          .cta-btn-wrap { flex-shrink: 0; white-space: nowrap; }
        }
        @media (max-width: 899px) {
          .content-grid  { padding: 20px 16px 48px; display: block; }
          .rt-card-sticky { margin-bottom: 20px; }
        }

        /* Nav links hidden on mobile */
        .nav-links { display: none; }
        @media (min-width: 900px) { .nav-links { display: flex; gap: 28px; } }

        /* Range slider */
        input[type=range] {
          -webkit-appearance: none; width: 100%; height: 5px;
          border-radius: 99px; outline: none; cursor: pointer; margin-top: 8px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
          background: #fff; border: 2.5px solid ${G};
          box-shadow: 0 2px 8px rgba(26,107,60,.25); cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 24px; height: 24px; border-radius: 50%;
          background: #fff; border: 2.5px solid ${G};
          box-shadow: 0 2px 8px rgba(26,107,60,.25); cursor: pointer;
        }
        .slider-light { background: linear-gradient(to right, ${G} var(--p,0%), #e5e7eb var(--p,0%)); }
        .slider-dark  { background: linear-gradient(to right, ${GL} var(--p,0%), rgba(255,255,255,.15) var(--p,0%)); }
        @media (min-width: 900px) {
          .calc-grid input[type=range] { height: 5px; }
          .calc-grid input[type=range]::-webkit-slider-thumb { background: ${GD}; border-color: ${GL}; }
          .calc-grid input[type=range]::-moz-range-thumb { background: ${GD}; border-color: ${GL}; }
        }

        /* FAQ open */
        .fa { display: none; }
        .fi-open .fa { display: block; }
      `}</style>

      <div style={{ fontFamily: "'Sora', sans-serif", color: C900, fontSize: 15, lineHeight: 1.6, minHeight: '100vh' }}>

        {/* NAV */}
        <nav style={{ background: '#fff', borderBottom: `1px solid ${C200}`, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 99 }}>
          <div className="pw" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: G, textDecoration: 'none', letterSpacing: '-.3px' }}>
              real<span style={{ color: C400, fontWeight: 300 }}>return</span>.in
            </Link>
            <div className="nav-links">
              {[
                { label: 'FD vs SIP',    href: '/fd-vs-sip' },
                { label: 'FD vs RD vs MF', href: '/fd-vs-rd-vs-mf-returns-calculator' },
                { label: 'Retirement',   href: '/retirement-corpus-calculator' },
                { label: 'Financial Plan', href: '/personal-financial-planner' },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: 13, color: C500, textDecoration: 'none', fontWeight: 500 }}>{l.label}</Link>
              ))}
            </div>
            <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ fontSize: 12, fontWeight: 600, background: G, color: '#fff', padding: '7px 14px', borderRadius: 6, textDecoration: 'none' }}>
              Full calculator →
            </Link>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${C200}`, padding: '8px 0' }}>
          <div className="pw" style={{ fontSize: 12, color: C400 }}>
            <Link href="/" style={{ color: G, textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 5px', opacity: .4 }}>›</span>
            <span>Fixed Deposit vs SIP (Equity Mutual Funds)</span>
          </div>
        </div>

        {/* HERO */}
        <div style={{ background: GD, padding: '20px 0 18px' }}>
          <div className="pw">
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 7 }}>
              Fixed Deposit vs SIP (Equity Mutual Funds)
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-.3px', marginBottom: 14, ['@media (min-width: 900px)' as string]: { fontSize: 38 } }}>
              FD vs SIP: Which is Better?
            </h1>
            {/* Answer card */}
            <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 14, maxWidth: 760 }}>
              <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, marginBottom: 12 }}>
                Comparing <strong style={{ color: GL }}>Fixed Deposit (FD)</strong> vs <strong style={{ color: GL }}>SIP in Equity Mutual Funds</strong> — based on estimated returns after tax and inflation, SIP (MF) tends to come out ahead for most salaried investors over 5+ years. The numbers shift based on your tax bracket and time horizon.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.85)' }}>
                  <div style={{ fontWeight: 700, color: GL, marginBottom: 4 }}>✓ Consider SIP (MF) if</div>
                  Investing for 5+ years<br />In 20–30% tax bracket<br />Goal is long-term growth
                </div>
                <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.7)' }}>
                  <div style={{ fontWeight: 700, color: 'rgba(255,255,255,.9)', marginBottom: 4 }}>✓ Consider FD if</div>
                  Need money within 3 years<br />Pay 0–5% income tax<br />It's your emergency fund
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CALCULATOR ── */}
        <div style={{ background: GD }}>
          <div className="calc-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>

            {/* Header — spans all 3 cols on desktop */}
            <div className="calc-head-row" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', padding: '20px 48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>FD vs SIP (MF) Calculator</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Adjust inputs — estimated results update live</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textAlign: 'right' }}>
                Assumed inflation: <span style={{ color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>6%/yr</span>
              </div>
            </div>

            {/* Inputs — left col on desktop, full width on mobile */}
            <div style={{ padding: '28px 40px 28px 48px', borderRight: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Monthly investment</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: 'rgba(255,255,255,.5)' }}>₹</span>
                    <input type="number" value={amount} min={500} max={500000} step={500}
                      onChange={e => setAmount(parseFloat(e.target.value) || 10000)}
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 600, color: '#fff', textAlign: 'right', width: 80 }}
                    />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,.4)' }}>/month</span>
                  </div>
                </div>
                <input type="range" min={500} max={100000} step={500} value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value))}
                  className="slider-dark"
                  style={{ '--p': sliderPct(Math.min(amount, 100000), 500, 100000) } as React.CSSProperties}
                />
              </div>

              {/* Duration */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>
                    Duration — <strong style={{ color: '#fff' }}>{duration} years</strong>
                  </span>
                </div>
                <input type="range" min={1} max={30} step={1} value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="slider-dark"
                  style={{ '--p': sliderPct(duration, 1, 30) } as React.CSSProperties}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[3, 5, 10, 15, 20, 30].map(y => (
                    <button key={y} onClick={() => setDuration(y)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                      background: duration === y ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)',
                      borderColor: duration === y ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.15)',
                      color: duration === y ? GL : 'rgba(255,255,255,.6)',
                    }}>{y}Y</button>
                  ))}
                </div>
              </div>

              {/* FD rate */}
              <div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>
                    FD interest rate — <strong style={{ color: '#fff' }}>{fdRate.toFixed(1)}%</strong>
                  </span>
                </div>
                <input type="range" min={4} max={10} step={0.25} value={fdRate}
                  onChange={e => setFdRate(parseFloat(e.target.value))}
                  className="slider-dark"
                  style={{ '--p': sliderPct(fdRate, 4, 10) } as React.CSSProperties}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 5, fontFamily: "'DM Mono', monospace" }}>
                  <span>4%</span><span>6%</span><span>7%</span><span>8%</span><span>10%</span>
                </div>
              </div>

              {/* MF rate */}
              <div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>
                    SIP (MF) expected return — <strong style={{ color: '#fff' }}>{mfRate.toFixed(1)}%</strong>
                  </span>
                </div>
                <input type="range" min={8} max={18} step={0.5} value={mfRate}
                  onChange={e => setMfRate(parseFloat(e.target.value))}
                  className="slider-dark"
                  style={{ '--p': sliderPct(mfRate, 8, 18) } as React.CSSProperties}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 5, fontFamily: "'DM Mono', monospace" }}>
                  <span>8%</span><span>10%</span><span>12%</span><span>15%</span><span>18%</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 5, fontStyle: 'italic' }}>
                  12% = ~30yr historical avg for diversified equity funds
                </div>
              </div>

            </div>

            {/* STATE 1 — nom-outer becomes display:contents on desktop */}
            <div className="nom-outer" id="nom-outer" style={{ display: state === 1 ? undefined : 'none' }}>

              {/* Middle col: results */}
              <div style={{ padding: '28px 32px', borderRight: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>
                  Estimated corpus · before tax &amp; inflation
                </div>
                {/* Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { name: 'SIP (MF)', val: fmtL(sipNom), sip: true },
                    { name: 'FD',       val: fmtL(fdNom),  sip: false },
                  ].map(c => (
                    <div key={c.name} style={{ borderRadius: 14, padding: '20px 22px', background: c.sip ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)', border: `1px solid ${c.sip ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.1)'}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: c.sip ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.4)', marginBottom: 6 }}>{c.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 600, lineHeight: 1, color: c.sip ? '#fff' : 'rgba(255,255,255,.8)' }}>{c.val}</div>
                      <div style={{ fontSize: 12, marginTop: 8, color: c.sip ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.3)' }}>estimated</div>
                    </div>
                  ))}
                </div>
                {/* Gap strip */}
                <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>SIP (MF) est. ahead by</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: GL }}>{fmtL(sipNom - fdNom)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', textAlign: 'right', lineHeight: 1.7 }}>
                    on {fmtL(inv)} invested<br />over {duration} years
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontStyle: 'italic' }}>
                  Estimates only. Actual SIP (MF) returns depend on market performance.
                </div>
              </div>

              {/* Right col: reveal button */}
              <button onClick={() => setState(2)} style={{
                border: 'none', borderLeft: '1px solid rgba(255,255,255,.08)', background: 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 360, padding: '40px 32px', gap: 10, cursor: 'pointer', width: '100%',
              }}>
                <div style={{ fontSize: 36 }}>🔓</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
                  But what's the Real Return?
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textAlign: 'center', lineHeight: 1.5, maxWidth: 220 }}>
                  Tap to see after tax &amp; inflation — most people don't know this number
                </div>
                <div style={{ display: 'inline-block', background: GL, color: GD, fontSize: 12, fontWeight: 700, padding: '6px 20px', borderRadius: 20, letterSpacing: '.03em' }}>
                  TAP TO REVEAL
                </div>
              </button>
            </div>

            {/* STATE 2 — real return */}
            <div
              className={state === 2 ? 'real-wrap-on' : undefined}
              style={{ display: state === 2 ? undefined : 'none', background: 'transparent' }}
            >
              {/* Back button — spans full width */}
              <button className="real-back" onClick={() => setState(1)} style={{
                display: 'flex', alignItems: 'center', gap: 5, width: '100%', border: 'none',
                background: 'rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.08)',
                padding: '11px 40px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.6)',
                cursor: 'pointer', fontFamily: "'Sora', sans-serif",
              }}>
                ← Back
              </button>

              {/* Left: tax slab */}
              <div style={{ padding: '28px 28px', borderRight: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>
                  Income tax slab — <strong style={{ color: GL }}>{taxVal}%</strong>
                </div>
                {/* Continuous slider */}
                <input type="range" min={0} max={30} step={1} value={taxVal}
                  onChange={e => handleTaxSlider(parseInt(e.target.value))}
                  className="slider-dark"
                  style={{ '--p': sliderPct(taxVal, 0, 30) } as React.CSSProperties}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: -8, fontFamily: "'DM Mono', monospace" }}>
                  <span>0%</span><span>10%</span><span>20%</span><span>30%</span>
                </div>
                {/* Quick pick pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[0, 5, 10, 20, 30].map(v => (
                    <button key={v} onClick={() => setTaxVal(v)} style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: '1.5px solid',
                      background: taxVal === v ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)',
                      borderColor: taxVal === v ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.15)',
                      color: taxVal === v ? GL : 'rgba(255,255,255,.6)',
                      fontFamily: "'DM Mono', monospace",
                    }}>{v}%</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{taxDesc(taxVal)}</div>
              </div>

              {/* Right: headline + chips */}
              <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.15)', borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.9)', marginBottom: 6, alignSelf: 'flex-start' }}>
                  ✦ Estimated Real Return
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                  SIP (MF) ahead by {fmtL(sipPT - fdPT)} after tax
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 16 }}>
                  After {taxVal}% tax &amp; 6% inflation on {fmtL(inv)} invested
                </div>

                {/* Two chips with 3 boxes each */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { name: 'SIP (MF)', pct: sipRealPct, nom: fmtL(sipNom), pt: fmtL(sipPT), real: fmtL(sipReal), win: true },
                    { name: 'FD',       pct: fdRealPct,  nom: fmtL(fdNom),  pt: fmtL(fdPT),  real: fmtL(fdReal),  win: false },
                  ].map(chip => (
                    <div key={chip.name} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                        {chip.name}
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: chip.win ? 'rgba(74,222,128,.25)' : 'rgba(251,191,36,.15)', color: chip.win ? GL : '#fbbf24' }}>
                          {fmtPct(chip.pct)}/yr est.
                        </span>
                      </div>
                      {/* 3 boxes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {[
                          { lbl: 'Nominal',    val: chip.nom,  w: false },
                          { lbl: 'After tax',  val: chip.pt,   w: chip.win },
                          { lbl: 'Real value', val: chip.real, w: chip.win },
                        ].map(box => (
                          <div key={box.lbl} style={{ background: box.w ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.05)', border: `1px solid ${box.w ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius: 8, padding: '9px 8px', overflow: 'hidden' }}>
                            <div style={{ fontSize: 9, color: box.w ? 'rgba(74,222,128,.8)' : 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5, whiteSpace: 'nowrap' }}>{box.lbl}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: chip.win && box.w ? '#fff' : box.w ? '#fff' : chip.win ? '#fff' : 'rgba(255,255,255,.5)' }}>{box.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insight — spans full width */}
              <div className="r-insight-row" style={{ padding: '13px 40px', background: 'rgba(74,222,128,.08)', borderTop: '1px solid rgba(74,222,128,.15)', fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
                {fdRealPct < 0
                  ? <>At this tax rate, estimated Fixed Deposit real return is <strong>negative after inflation</strong>. {fmtL(fdNom)} today has the estimated purchasing power of {fmtL(fdReal)} in {duration} years.</>
                  : <>Estimated real returns — Fixed Deposit: <strong>{fmtPct(fdRealPct)}/yr</strong>, SIP (MF): <strong>{fmtPct(sipRealPct)}/yr</strong>. Actual SIP returns vary with markets.</>
                }
              </div>

              {/* Assumptions — spans full width */}
              <div className="r-assump-row" style={{ padding: '11px 40px 18px', background: 'transparent', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 6 }}>Assumptions used</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[`FD ${fdRate.toFixed(1)}%`, `SIP (MF) ${mfRate.toFixed(1)}%`, `Tax ${taxVal}%`, 'Inflation 6%'].map(p => (
                    <span key={p} style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, padding: '2px 8px', color: 'rgba(255,255,255,.5)', fontFamily: "'DM Mono', monospace" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>{/* end calc-grid */}
        </div>{/* end calc bg */}

        {/* CONTENT SECTION */}
        <div className="content-grid">

          {/* Left: related tools */}
          <div className="rt-card-sticky">
            <div style={{ background: '#fff', border: `1px solid ${C200}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: C400, marginBottom: 10 }}>Related tools</div>
              {RELATED_TOOLS.map((t, i) => (
                <Link key={`tool-${i}`} href={t.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < RELATED_TOOLS.length - 1 ? `1px solid #f3f4f6` : 'none', textDecoration: 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: G, fontWeight: 500 }}>{t.label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: content */}
          <div>

            {/* E-E-A-T strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 16px', borderBottom: `1px solid ${C200}`, marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 11, color: C400 }}>
                <span style={{ fontWeight: 600, color: C500 }}>realreturn.in</span> · See what your money actually earns
              </div>
              <div style={{ fontSize: 11, color: C400 }}>
                Estimates only · Not financial advice · Based on current Indian tax laws
              </div>
            </div>

            {/* SEO: Direct answer paragraph */}
            <div style={{ ...SEC, paddingTop: 0 }}>
              <p style={{ fontSize: 14, color: C700, lineHeight: 1.75, padding: '14px 16px', background: '#fff', borderLeft: `3px solid ${G}`, borderRadius: '0 8px 8px 0' }}>
                For a salaried investor in the 30% tax bracket investing ₹10,000/month for 10 years, SIP in Equity Mutual Funds is estimated to deliver ₹22.4L vs Fixed Deposit's ₹17.4L before tax. After 30% tax and 6% inflation, estimated SIP real return is +5.1%/yr vs Fixed Deposit's −1.0%/yr. Fixed Deposit is more suitable for goals under 3 years, emergency funds, or investors in 0–5% tax brackets.
              </p>
            </div>

            {/* AEO block */}
            <div style={SEC}>
              <div style={{ borderLeft: `3px solid ${AM}`, padding: '14px 16px', background: AMP, borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: AM, marginBottom: 6 }}>In plain numbers</div>
                <p style={{ fontSize: 13, color: C700, lineHeight: 1.9, margin: 0 }}>
                  SIP in Equity Mutual Funds at 12% for 10 years on ₹10,000/month → <strong>₹22.4L</strong> estimated (before tax)<br />
                  Fixed Deposit (FD) at 7% for 10 years on ₹10,000/month → <strong>₹17.4L</strong> estimated (before tax)<br />
                  After 30% tax &amp; 6% inflation: SIP (MF) <strong>+5.1%/yr est. real</strong>, Fixed Deposit <strong>−1.0%/yr est. real</strong><br />
                  Estimated gap: SIP (MF) ahead by <strong>~₹5.5L after tax</strong> on the same ₹12L invested
                </p>
              </div>
            </div>

            {/* Gap visual */}
            <div style={SEC}>
              <h2 style={SEC_LBL}>Estimated gap after 10 years</h2>
              <p style={{ fontSize: 13, color: C500, marginBottom: 14 }}>Same ₹10,000/month, same 10 years, same ₹12L invested. Estimated outcomes at assumed rates.</p>
              <div style={{ marginBottom: 14 }}>
                {[
                  { name: 'SIP (MF)', w: 100, corpus: '₹22.4L', pct: '+5.1% est.', green: true  },
                  { name: 'FD',       w: 77,  corpus: '₹17.4L', pct: '−1.0% est.', green: false },
                ].map(bar => (
                  <div key={bar.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: bar.green ? C700 : C400, width: 60, flexShrink: 0 }}>{bar.name}</div>
                    <div style={{ flex: 1, height: 32, background: C100, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${bar.w}%`, height: '100%', background: bar.green ? G : '#93c5fd', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: bar.green ? '#fff' : '#1e3a8a', whiteSpace: 'nowrap' }}>{bar.corpus}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: bar.green ? G : C500, fontWeight: bar.green ? 600 : 400, width: 80, textAlign: 'right', flexShrink: 0 }}>{bar.pct}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: GP, border: `1px solid ${GB}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: C700, lineHeight: 1.6 }}>
                Based on these assumed rates, the estimated ₹5L gap equals <strong>~4 years of your monthly savings</strong>. Actual SIP (MF) returns depend on market performance.
              </div>
            </div>

            {/* When FD wins */}
            <div style={SEC}>
              <h2 style={SEC_LBL}>When does Fixed Deposit make more sense?</h2>
              <div style={{ background: '#fff', border: `1px solid ${C200}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#1e3a8a', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 24 }}>🛡️</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>Fixed Deposit's guarantee is real. Here are scenarios where it may be the better fit.</div>
                </div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: C700, lineHeight: 1.7 }}>
                  <p style={{ marginBottom: 8 }}><strong>1. You need the money at a specific date.</strong> SIP (MF) can fall 30–40% right when you need it. Fixed Deposit gives a fixed amount on a fixed date.</p>
                  <p style={{ marginBottom: 8 }}><strong>2. You're in a 0–5% tax bracket.</strong> At zero tax, FD's estimated real return improves to ~+0.9%/yr. The tax advantage of SIP (MF) shrinks significantly.</p>
                  <p style={{ color: C500 }}><strong>3. It's your emergency fund.</strong> 3–6 months of expenses are generally kept in Fixed Deposit — not in market-linked instruments.</p>
                </div>
              </div>
            </div>

            {/* Comparison table */}
            <div style={SEC}>
              <h2 style={SEC_LBL}>Full comparison — Fixed Deposit vs SIP (Equity Mutual Funds)</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', border: `1px solid ${C200}`, borderRadius: 10, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, borderBottom: `1px solid ${C200}`, textAlign: 'left', color: C500, width: '35%' }}>Factor</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, borderBottom: `1px solid ${C200}`, textAlign: 'left', color: G }}>SIP (MF)</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, borderBottom: `1px solid ${C200}`, textAlign: 'left', color: BL }}>FD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'Est. returns',     s: '10–14% historically',        sg: true,  st: 'Higher est.',  fd: '6–8% fixed',                 fg: false, ft: 'Guaranteed' },
                      { f: 'Tax on gains',     s: '12.5% LTCG above ₹1.25L',    sg: true,  st: 'Lower',        fd: 'At income slab (20–30%)',     fg: false, ft: 'Higher' },
                      { f: 'Risk',             s: 'Can fall 30–40% short term',  sg: false, st: '',             fd: 'Zero — guaranteed',           fg: true,  ft: 'Safer' },
                      { f: 'Beats inflation?', s: 'Est. yes at 30% slab',        sg: true,  st: 'Est. yes',     fd: 'Est. no at 30% slab',         fg: false, ft: '' },
                      { f: 'Liquidity',        s: 'Withdraw anytime',            sg: true,  st: 'Flexible',     fd: 'Penalty for early exit',      fg: false, ft: '' },
                      { f: 'Best for',         s: '5yr+ goals',                  sg: true,  st: 'Long term',    fd: 'Under 3yr, emergency',        fg: true,  ft: 'Short term' },
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: C700, verticalAlign: 'middle' }}>{row.f}</td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: C700, verticalAlign: 'middle' }}>
                          {row.s}{row.st && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, marginLeft: 4, color: G, background: GP }}>{row.st}</span>}
                        </td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: C700, verticalAlign: 'middle' }}>
                          {row.fd}{row.ft && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, marginLeft: 4, color: row.fg ? BL : C500, background: row.fg ? '#eff6ff' : '#f9fafb' }}>{row.ft}</span>}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f9fafb' }}>
                      <td style={{ padding: '9px 12px', color: C700 }}>Common split</td>
                      <td colSpan={2} style={{ padding: '9px 12px', fontSize: 12, color: C700 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, color: AM, background: AMP }}>70% SIP (MF) + 30% FD</span>
                        {' '}— a common approach among investors
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular comparisons */}
            <div style={SEC}>
              <h2 style={SEC_LBL}>Popular comparisons</h2>
              <p style={{ fontSize: 12, color: C400, marginBottom: 12 }}>See detailed Fixed Deposit vs SIP comparison for specific amounts and durations.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {POPULAR_PAGES.map((p, i) => (
                  <Link key={`pop-${i}`} href={p.href} style={{ background: '#fff', border: `1px solid ${C200}`, borderRadius: 8, padding: '12px 14px', textDecoration: 'none', display: 'block' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: p.live ? G : C400, marginBottom: 3 }}>{p.tag}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C900, lineHeight: 1.4, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: p.live ? G : C400 }}>{p.nums}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related guides */}
            <div style={SEC}>
              <h2 style={SEC_LBL}>Related guides</h2>
              {RELATED_GUIDES.map((g, i) => (
                <Link key={`guide-${i}`} href={g.href} style={{ background: '#fff', border: `1px solid ${C200}`, borderRadius: 8, padding: '14px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C900, marginBottom: 2 }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: C500 }}>{g.sub}</div>
                  </div>
                  <div style={{ color: C400, fontSize: 12, flexShrink: 0 }}>→</div>
                </Link>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ ...SEC, borderBottom: 'none' }}>
              <h2 style={SEC_LBL}>Common questions</h2>
              {FAQS.map((faq, i) => (
                <div key={i} className={openFaq === i ? 'fi-open' : ''} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid #f3f4f6` : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '13px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: C900, lineHeight: 1.4, fontFamily: "'Sora', sans-serif" }}>{faq.q}</span>
                    <span style={{ color: C400, fontSize: 18, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className="fa" style={{ paddingBottom: 13, fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{faq.a}</div>
                </div>
              ))}
            </div>

            {/* Full calc CTA */}
            <div className="cta-row" style={{ background: '#fff', border: `1px solid ${C200}`, borderRadius: 10, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div>
                <strong style={{ color: C900, fontSize: 14, display: 'block', marginBottom: 3 }}>Want to compare FD vs RD vs Mutual Funds?</strong>
                <p style={{ fontSize: 12, color: C500, margin: 0 }}>The full calculator compares all three side by side with fully adjustable inputs.</p>
              </div>
              <div className="cta-btn-wrap">
                <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ display: 'inline-block', background: G, color: '#fff', fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, padding: '11px 18px', borderRadius: 8, textDecoration: 'none' }}>
                  Open full calculator →
                </Link>
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end content-grid */}

        {/* FOOTER */}
        <footer style={{ background: '#111827', color: 'rgba(255,255,255,.4)', fontSize: 12, padding: '24px 16px', textAlign: 'center', lineHeight: 1.9 }}>
          <div style={{ marginBottom: 6 }}>
            {[
              { label: 'realreturn.in',  href: '/' },
              { label: 'FD vs SIP (MF)', href: '/fd-vs-sip' },
              { label: 'FD vs RD vs MF', href: '/fd-vs-rd-vs-mf-returns-calculator' },
              { label: 'Financial Plan', href: '/personal-financial-planner' },
              { label: 'Retirement',     href: '/retirement-corpus-calculator' },
            ].map((l, i) => (
              <span key={`footer-${l.href}-${i}`}>
                {i > 0 && <span style={{ margin: '0 6px' }}> · </span>}
                <Link href={l.href} style={{ color: 'rgba(255,255,255,.55)', textDecoration: 'none' }}>{l.label}</Link>
              </span>
            ))}
          </div>
          <div>Free tools for Indian personal finance. No login. No ads. No data stored.</div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,.2)' }}>
            Returns shown are estimates only. SIP (MF) returns not guaranteed. Consult a SEBI-registered advisor before investing.
          </div>
        </footer>

      </div>
    </>
  )
}
