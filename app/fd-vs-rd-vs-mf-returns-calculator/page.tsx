'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Res {
  corpus: number; invested: number; gains: number; taxPaid: number
  postTax: number; realValue: number; realReturn: number; postTaxRate: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}
const fmtShort = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(1) + 'Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(1) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}
const pct = (n: number) => (!isFinite(n) || isNaN(n)) ? '0%' : (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
const fisher = (nom: number, inf: number) => ((1 + nom / 100) / (1 + inf / 100) - 1) * 100

const BRAND = '#1a6b3c'
const TAX_STEPS = [0, 5, 20, 30]

const COLOR = {
  fd:  { accent: '#854F0B', light: '#FAC775', dark: '#854F0B', bg: '#FAEEDA', text: '#633806', label: '#854F0B' },
  rd:  { accent: '#0F6E56', light: '#9FE1CB', dark: '#0F6E56', bg: '#E1F5EE', text: '#085041', label: '#0F6E56' },
  sip: { accent: '#534AB7', light: '#CECBF6', dark: '#534AB7', bg: '#EEEDFE', text: '#3C3489', label: '#534AB7' },
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '0 20px', height: '52px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{ width: '28px', height: '28px', background: BRAND, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>📊</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            real<span style={{ color: BRAND }}>return</span>.in
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>Real returns after tax & inflation</div>
        </div>
      </Link>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link href="/personal-financial-planner" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Financial Plan</Link>
        <Link href="/retirement-corpus-calculator" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Retirement</Link>
      </div>
    </nav>
  )
}

// ─── Slider — smooth native range ─────────────────────────────────────────────
function Slider({ label, val, set, min, max, step, disp, hint }: {
  label: string; val: number; set: (v: number) => void
  min: number; max: number; step: number; disp: string; hint?: string
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'DM Mono, monospace',
          background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px', minWidth: '72px', textAlign: 'center',
        }}>{disp}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ width: '100%', accentColor: BRAND, cursor: 'pointer' }} />
      {hint && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  // stopPropagation prevents the parent AdjustRow div onClick from also firing,
  // which would double-toggle and immediately revert the state back.
  return (
    <div
      onClick={e => { e.stopPropagation(); onToggle() }}
      style={{
        width: '40px', height: '22px', borderRadius: '999px',
        background: on ? BRAND : '#e2e8f0', position: 'relative', flexShrink: 0, cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px', left: on ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ─── Tax slab slider — smooth with snap-to-steps ──────────────────────────────
// Full range 0-30, snaps to nearest valid value on release/change
function TaxSlabSlider({ tax, setTax }: { tax: number; setTax: (v: number) => void }) {
  const snap = (raw: number) => {
    const closest = TAX_STEPS.reduce((a, b) => Math.abs(b - raw) < Math.abs(a - raw) ? b : a)
    setTax(closest)
  }
  return (
    <div style={{ padding: '14px 16px 16px', background: '#f8fafc', borderTop: '0.5px solid #e8ecf0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>Your income tax slab</span>
        <span style={{ fontSize: '22px', fontWeight: 700, color: BRAND, fontFamily: 'DM Mono, monospace' }}>{tax}%</span>
      </div>
      <input type="range" min={0} max={30} step={1} value={tax}
        onChange={e => snap(+e.target.value)}
        style={{ width: '100%', accentColor: BRAND, cursor: 'pointer' }} />
      {/* clickable stop labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {TAX_STEPS.map(s => (
          <span key={s} onClick={() => setTax(s)} style={{
            fontSize: '12px', fontFamily: 'DM Mono, monospace', cursor: 'pointer',
            color: s === tax ? BRAND : '#94a3b8', fontWeight: s === tax ? 700 : 400,
          }}>{s}%</span>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '7px',
        marginTop: '12px', padding: '8px 10px', background: '#EEEDFE', borderRadius: '8px',
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#534AB7', flexShrink: 0, marginTop: '4px' }} />
        <span style={{ fontSize: '11px', color: '#3C3489', lineHeight: 1.5 }}>
          SIP (MF) taxed at 12.5% LTCG — not at your income slab rate
        </span>
      </div>
    </div>
  )
}

// ─── Adjustment row with expandable child ─────────────────────────────────────
function AdjustRow({ label, sub, on, onToggle, children }: {
  label: string; sub: string; on: boolean; onToggle: () => void; children?: React.ReactNode
}) {
  return (
    <div style={{ borderRadius: '12px', border: '0.5px solid #e2e8f0', overflow: 'hidden', marginBottom: '10px', background: '#fff' }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', cursor: 'pointer', background: on ? '#f8fafc' : '#fff',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{label}</div>
          <div style={{ fontSize: '11px', color: on ? BRAND : '#94a3b8', marginTop: '2px' }}>{sub}</div>
        </div>
        <ToggleSwitch on={on} onToggle={onToggle} />
      </div>
      {on && children}
    </div>
  )
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ k, shortName, d, isWinner, adjusted }: {
  k: keyof typeof COLOR; shortName: string; d: Res; isWinner: boolean; adjusted: boolean
}) {
  const c = COLOR[k]
  const estRet = d.postTax - d.invested
  const pctRet = d.invested > 0 ? (estRet / d.invested) * 100 : 0
  return (
    <div style={{
      background: '#fff', border: isWinner ? `2px solid ${c.accent}` : '0.5px solid #e2e8f0',
      borderRadius: '14px', padding: '14px 12px', position: 'relative', flex: 1, minWidth: 0,
    }}>
      {isWinner && (
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: c.accent, color: '#fff', fontSize: '10px', fontWeight: 600,
          padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap' as const,
        }}>Best returns</div>
      )}
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: c.label, marginBottom: '6px' }}>{shortName}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', fontFamily: 'DM Mono, monospace', lineHeight: 1.1 }}>{fmtShort(estRet)}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', marginBottom: '10px' }}>{adjusted ? 'post-tax returns' : 'est. returns'}</div>
      <div style={{ height: '0.5px', background: '#f1f5f9', marginBottom: '8px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total value</span>
        <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: '#0f172a' }}>{fmtShort(d.postTax)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Invested</span>
        <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: '#0f172a' }}>{fmtShort(d.invested)}</span>
      </div>
      <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: c.bg, color: c.label }}>
        {pct(pctRet)}
      </div>
    </div>
  )
}

// ─── Bar row ──────────────────────────────────────────────────────────────────
function BarRow({ k, name, d, maxVal }: { k: keyof typeof COLOR; name: string; d: Res; maxVal: number }) {
  const c = COLOR[k]
  const total = d.postTax, inv = d.invested, gain = total - inv
  const invW  = maxVal > 0 ? (inv  / maxVal) * 100 : 0
  const gainW = maxVal > 0 ? (gain / maxVal) * 100 : 0
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{name}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: '#0f172a' }}>{fmtShort(total)}</span>
      </div>
      <div style={{ height: '26px', borderRadius: '6px', display: 'flex', overflow: 'hidden', border: '0.5px solid #f1f5f9' }}>
        <div style={{ width: `${invW}%`, background: c.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: c.text, overflow: 'hidden' }}>
          {invW > 20 ? `${fmtShort(inv)} invested` : ''}
        </div>
        <div style={{ width: `${gainW}%`, background: c.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#fff', overflow: 'hidden' }}>
          {gainW > 16 ? `${fmtShort(gain)} returns` : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Calculator() {
  const [tab, setTab]           = useState<'monthly' | 'lumpsum'>('monthly')
  const [monthly, setMonthly]   = useState(10000)
  const [lumpsum, setLumpsum]   = useState(100000)
  const [years, setYears]       = useState(10)
  const [fdRate, setFdRate]     = useState(7.0)
  const [rdRate, setRdRate]     = useState(6.5)
  const [mfRate, setMfRate]     = useState(12.0)
  const [tax, setTax]           = useState(30)    // default 30%
  const inf                     = 6               // fixed 6%
  const [inclTax, setInclTax]   = useState(true)  // default ON
  const [inclInf, setInclInf]   = useState(true)  // default ON

  // ── Calculations (unchanged logic) ───────────────────────────────────────
  const calcFD = useCallback((): Res => {
    const r = fdRate / 100, tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (tab === 'lumpsum') { invested = lumpsum; corpus = invested * Math.pow(1 + r, years) }
    else {
      const effectiveMr = Math.pow(1 + r / 4, 1 / 3) - 1
      const n = years * 12; invested = monthly * n; corpus = 0
      for (let i = 1; i <= n; i++) corpus += monthly * Math.pow(1 + effectiveMr, n - i + 1)
    }
    const gains = corpus - invested, taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = fdRate * (1 - tR)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years) }
  }, [tab, lumpsum, monthly, fdRate, years, tax, inclTax, inclInf])

  const calcRD = useCallback((): Res => {
    const r = rdRate / 100, effectiveMr = Math.pow(1 + r / 4, 1 / 3) - 1
    const n = years * 12, tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    const amt = tab === 'lumpsum' ? lumpsum / n : monthly
    let corpus = 0
    for (let i = 1; i <= n; i++) corpus += amt * Math.pow(1 + effectiveMr, n - i + 1)
    const invested = amt * n, gains = corpus - invested
    const taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - tR)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years) }
  }, [tab, lumpsum, monthly, rdRate, years, tax, inclTax, inclInf])

  const calcMF = useCallback((): Res => {
    const r = mfRate / 100, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (tab === 'lumpsum') { invested = lumpsum; corpus = invested * Math.pow(1 + r, years) }
    else {
      const mr = Math.pow(1 + r, 1 / 12) - 1, n = years * 12
      corpus = monthly * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
      invested = monthly * n
    }
    const gains = corpus - invested
    const txble = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = txble * 0.125, postTax = corpus - taxPaid
    const effTax = gains > 0 ? taxPaid / gains : 0
    const postTaxRate = mfRate * (1 - effTax)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years) }
  }, [tab, lumpsum, monthly, mfRate, years, tax, inclTax, inclInf])

  const fd = calcFD(), rd = calcRD(), mf = calcMF()
  const adjusted  = inclTax || inclInf
  const maxCorpus = Math.max(fd.postTax, rd.postTax, mf.postTax)
  const winnerKey = [
    { key: 'fd' as const, v: fd.postTax },
    { key: 'rd' as const, v: rd.postTax },
    { key: 'sip' as const, v: mf.postTax },
  ].reduce((a, b) => b.v > a.v ? b : a).key

  const mfOverFd  = fd.postTax > 0 ? mf.postTax / fd.postTax : 1
  const chipBg    = adjusted ? '#FAEEDA' : '#EEEDFE'
  const chipDot   = adjusted ? '#854F0B' : '#534AB7'
  const chipColor = adjusted ? '#633806' : '#3C3489'
  const chipText  = adjusted
    ? `After ${inclTax ? `${tax}% tax` : ''}${inclTax && inclInf ? ' + ' : ''}${inclInf ? 'inflation' : ''}, SIP still gives ${mfOverFd.toFixed(1)}× more than FD`
    : `SIP gives ${mfOverFd.toFixed(1)}× more than FD over ${years} years`

  const faqs = [
    { q: 'How is real return different from nominal return?', a: 'Nominal return is the interest rate your bank or fund advertises — 7% FD, 12% CAGR. Real return is what you actually keep after paying tax on the gains and adjusting for inflation. A 7% FD at 30% tax slab gives a 4.9% post-tax return. After 6% inflation, the real return is −1.04%. This is calculated using the Fisher Equation: Real Return = ((1 + Post-Tax Return) / (1 + Inflation)) − 1.' },
    { q: 'What is LTCG tax on mutual funds in India 2025?', a: 'As per Union Budget 2024, equity mutual fund gains held for more than 12 months are classified as Long Term Capital Gains (LTCG). The tax rate is 12.5% on gains above ₹1.25 lakh per financial year. This makes equity mutual funds significantly more tax-efficient than FDs for investors in the 20% or 30% slab.' },
    { q: 'Is RD better than FD for monthly savings?', a: 'For monthly savings, RD is a better structure than FD because it is designed for monthly contributions and compounds quarterly (standard Indian bank formula). However, both are taxed at your income slab rate on the interest earned, so the net tax drag is similar.' },
    { q: 'What FD rate beats inflation after tax?', a: 'For an investor in the 30% tax slab with 6% inflation, an FD would need to offer approximately 8.6% interest to deliver a zero real return. Most Indian banks offer 6.5–7.5%, which means FD investors in the highest tax bracket are consistently losing purchasing power.' },
    { q: 'How long should I stay invested in mutual funds to beat FD?', a: 'Equity mutual funds typically begin outperforming FDs in real terms from Year 3–5 onwards. Over 10–15 year periods, the combination of higher CAGR and lower LTCG tax makes equity mutual funds significantly superior to FDs for long-term wealth creation.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
      <Nav />

      {/* Global responsive styles */}
      <style>{`
        .calc-outer { max-width: 1200px; margin: 0 auto; padding: 0 20px 80px; }
        .calc-header { max-width: 1200px; margin: 0 auto; padding: 28px 20px 8px; }
        .calc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (min-width: 860px) {
          .calc-grid { grid-template-columns: 360px 1fr; }
          .inputs-sticky { position: sticky; top: 68px; }
        }
        .seo-section { max-width: 760px; margin-top: 48px; }
      `}</style>

      {/* Page header */}
      <div className="calc-header">
        <div style={{ fontSize: '11px', color: BRAND, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Returns calculator
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.25, marginBottom: '6px' }}>
          FD vs RD vs Mutual Funds
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
          See what each actually earns after tax and inflation.
        </p>

        {/* Tabs */}
        <div style={{ display: 'inline-flex', background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '4px' }}>
          {([['monthly', 'Monthly (SIP / RD / FD)'], ['lumpsum', 'Lumpsum (FD / MF)']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '11px 24px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
              background: tab === v ? BRAND : '#fff',
              color: tab === v ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="calc-outer">
        <div className="calc-grid">

          {/* ── LEFT: Inputs ── */}
          <div className="inputs-sticky">
            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '14px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '16px' }}>
                Investment details
              </div>
              {tab === 'monthly'
                ? <Slider label="Monthly amount" val={monthly} set={setMonthly} min={1000} max={100000} step={500} disp={fmt(monthly) + '/mo'} />
                : <Slider label="Lumpsum amount" val={lumpsum} set={setLumpsum} min={10000} max={5000000} step={10000} disp={fmt(lumpsum)} />
              }
              <Slider label="Time period" val={years} set={setYears} min={1} max={30} step={1} disp={`${years} yr${years > 1 ? 's' : ''}`} />
              <div style={{ height: '0.5px', background: '#f1f5f9', margin: '4px 0 16px' }} />
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '14px' }}>
                Expected rates
              </div>
              {tab === 'monthly' ? (
                <>
                  <Slider label="FD rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} disp={`${fdRate}%`} />
                  <Slider label="RD rate" val={rdRate} set={setRdRate} min={4} max={9}  step={0.25} disp={`${rdRate}%`} />
                  <Slider label="SIP expected CAGR" val={mfRate} set={setMfRate} min={6} max={20} step={0.5} disp={`${mfRate}%`} hint="Nifty 50 delivered ~13% CAGR over 20 years" />
                </>
              ) : (
                <>
                  <Slider label="FD rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} disp={`${fdRate}%`} />
                  <Slider label="MF expected CAGR" val={mfRate} set={setMfRate} min={6} max={20} step={0.5} disp={`${mfRate}%`} hint="Nifty 50 delivered ~13% CAGR over 20 years" />
                </>
              )}
            </div>

            {/* Adjustments */}
            <AdjustRow label="Adjust for inflation" sub={inclInf ? '6% p.a. · ON' : '6% p.a.'} on={inclInf} onToggle={() => setInclInf(v => !v)} />
            <AdjustRow label="Show post-tax returns" sub={inclTax ? `${tax}% slab · ON` : 'Slide to pick your tax slab'} on={inclTax} onToggle={() => setInclTax(v => !v)}>
              <TaxSlabSlider tax={tax} setTax={setTax} />
            </AdjustRow>
          </div>

          {/* ── RIGHT: Results ── */}
          <div>
            {/* Insight chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              background: chipBg, borderRadius: '10px', padding: '11px 14px', marginBottom: '18px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: chipDot, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: chipColor, lineHeight: 1.4 }}>{chipText}</span>
            </div>

            {/* Cards */}
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
              {adjusted ? 'Post-tax returns' : 'Est. returns'}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', marginTop: '10px' }}>
              {tab === 'monthly' ? (
                <>
                  <ResultCard k="fd"  shortName="FD" d={fd} isWinner={winnerKey === 'fd'}  adjusted={adjusted} />
                  <ResultCard k="rd"  shortName="RD" d={rd} isWinner={winnerKey === 'rd'}  adjusted={adjusted} />
                  <ResultCard k="sip" shortName="MF" d={mf} isWinner={winnerKey === 'sip'} adjusted={adjusted} />
                </>
              ) : (
                <>
                  <ResultCard k="fd"  shortName="FD" d={fd} isWinner={winnerKey === 'fd'}  adjusted={adjusted} />
                  <ResultCard k="sip" shortName="MF" d={mf} isWinner={winnerKey === 'sip'} adjusted={adjusted} />
                </>
              )}
            </div>

            {/* Bar chart */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '18px', border: '0.5px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '14px' }}>
                Return breakdown
              </div>
              {tab === 'monthly' ? (
                <>
                  <BarRow k="fd"  name="Monthly FD"        d={fd} maxVal={maxCorpus} />
                  <BarRow k="rd"  name="Recurring Deposit" d={rd} maxVal={maxCorpus} />
                  <BarRow k="sip" name="SIP (MF)"          d={mf} maxVal={maxCorpus} />
                </>
              ) : (
                <>
                  <BarRow k="fd"  name="Fixed Deposit" d={fd} maxVal={maxCorpus} />
                  <BarRow k="sip" name="MF Lumpsum"    d={mf} maxVal={maxCorpus} />
                </>
              )}
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                Light = invested · Dark = {adjusted ? 'post-tax returns' : 'est. returns'}
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center' }}>
              Fisher Equation · FD/RD taxed at slab rate · MF: 12.5% LTCG above ₹1.25L (Budget 2024) · Not investment advice
            </p>
          </div>
        </div>

        {/* SEO content */}
        <div className="seo-section">
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '40px', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
              FD vs RD vs Mutual Fund — which gives better returns in India?
            </h2>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              The comparison between Fixed Deposits, Recurring Deposits, and Mutual Funds is one of the most common questions Indian investors ask — and the answer is rarely straightforward. The key variable that most calculators ignore is the real return: what you actually earn after paying income tax and adjusting for inflation.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              A 7% FD looks attractive. But for a salaried investor in the 30% tax slab, the post-tax return drops to 4.9%. After adjusting for 6% inflation using the Fisher Equation, the real return is approximately <strong style={{ color: '#dc2626' }}>−1.04% per year</strong>. The bank balance grows, but the purchasing power of that money shrinks every year.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '28px' }}>
              Mutual funds, specifically equity funds held for over one year, benefit from a significantly more favourable tax structure. Under the Union Budget 2024, Long Term Capital Gains (LTCG) above ₹1.25 lakh per year are taxed at just 12.5%. A 12% CAGR equity fund after this tax and 6% inflation delivers approximately <strong style={{ color: BRAND }}>+5.66% real return per year</strong>.
            </p>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
              When does FD make more sense than Mutual Funds?
            </h2>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              FDs are not always the wrong choice. For short-term goals under 3 years, emergency funds, or investors who cannot tolerate any volatility, FDs provide guaranteed capital protection that mutual funds cannot match.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '40px' }}>
              The RD is best suited for building a disciplined savings habit with a 1–3 year horizon where capital safety is essential. For anything beyond 3–5 years, a SIP in equity mutual funds typically delivers better real returns.
            </p>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '20px' }}>
              Frequently asked questions
            </h2>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>{faq.q}</h3>
                <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', paddingBottom: '20px' }}>
            Not investment advice · Returns are illustrative · Consult a SEBI-registered advisor · LTCG rates as per Union Budget 2024
          </p>
        </div>
      </div>
    </div>
  )
}
