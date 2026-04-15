'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────
interface Res {
  corpus: number; invested: number; gains: number; taxPaid: number
  postTax: number; realValue: number; realReturn: number; postTaxRate: number
}

// ─── Helpers ─────────────────────────────────────────────────────
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
const pct = (n: number) => (!isFinite(n) || isNaN(n)) ? '0.00%' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
const fisher = (nom: number, inf: number) => ((1 + nom / 100) / (1 + inf / 100) - 1) * 100
const rrCol = (v: number) => v > 0.5 ? '#16a34a' : v < 0 ? '#dc2626' : '#d97706'

// ─── Nav ─────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e8ecf0',
      padding: '0 16px', height: '52px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{ width: '28px', height: '28px', background: '#1a6b3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>📊</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            real<span style={{ color: '#1a6b3c' }}>return</span>.in
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>Real returns after tax & inflation</div>
        </div>
      </Link>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Link href="/personal-financial-planner" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Financial Plan</Link>
        <Link href="/retirement-corpus-calculator" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Retirement</Link>
      </div>
    </nav>
  )
}

// ─── Slider ──────────────────────────────────────────────────────
function Slider({ label, val, set, min, max, step, disp, hint }: {
  label: string; val: number; set: (v: number) => void
  min: number; max: number; step: number; disp: string; hint?: string
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'DM Mono, monospace', background: '#f1f5f9', padding: '2px 10px', borderRadius: '6px' }}>{disp}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ width: '100%', accentColor: '#1a6b3c', cursor: 'pointer' }} />
      {hint && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────
function Toggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }} onClick={onToggle}>
      <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>{label}</span>
      <div style={{ width: '36px', height: '20px', borderRadius: '999px', background: on ? '#1a6b3c' : '#e2e8f0', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: '2px', left: on ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  )
}

// ─── Seg control ─────────────────────────────────────────────────
function Seg({ opts, val, set }: { opts: { v: string; l: string }[]; val: string; set: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => set(o.v)} style={{
          flex: 1, padding: '10px 4px', fontSize: '13px', fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
          background: val === o.v ? '#1a6b3c' : '#f8fafc',
          color: val === o.v ? '#fff' : '#64748b',
          transition: 'all 0.15s',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '22px 0 14px' }}>
      {children}
    </div>
  )
}

// ─── Instrument breakdown card ────────────────────────────────────
function InstrumentCard({ dot, name, label, rr, nominal, postTax, realVal, taxNote }: {
  dot: string; name: string; label: string; rr: number
  nominal: number; postTax: number; realVal: number; taxNote: string
}) {
  const col = rrCol(rr)
  return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
      {/* Head */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', borderBottom: '1px solid #f8fafc' }}>
        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{label}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: col, fontFamily: 'DM Mono, monospace', letterSpacing: '-0.3px' }}>{pct(rr)}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>per yr · real</div>
        </div>
      </div>
      {/* 3-layer numbers */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Nominal corpus</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'DM Mono, monospace' }}>{fmt(nominal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>After {taxNote}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#d97706', fontFamily: 'DM Mono, monospace' }}>{fmt(postTax)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real value today</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: col, fontFamily: 'DM Mono, monospace' }}>{fmt(realVal)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main calculator ─────────────────────────────────────────────
export default function Calculator() {
  const [screen, setScreen] = useState<'inputs' | 'results'>('inputs')

  // Investment inputs
  const [investType, setInvestType] = useState<'lumpsum' | 'monthly'>('lumpsum')
  const [amount, setAmount] = useState(500000)    // lump sum
  const [monthly, setMonthly] = useState(10000)   // monthly SIP/RD/FD monthly
  const [years, setYears] = useState(10)

  // Rates
  const [fdRate, setFdRate] = useState(7)
  const [rdRate, setRdRate] = useState(6.5)
  const [mfRate, setMfRate] = useState(12)

  // Profile
  const [tax, setTax] = useState(30)
  const [inf, setInf] = useState(6)
  const [inclTax, setInclTax] = useState(true)
  const [inclInf, setInclInf] = useState(true)

  // ── Calculation logic (unchanged from original) ──────────────
  const calcFD = useCallback((): Res => {
    const r = fdRate / 100, tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (investType === 'lumpsum') {
      invested = amount; corpus = invested * Math.pow(1 + r, years)
    } else {
      const n = years * 12; invested = monthly * n; corpus = 0
      for (let i = 0; i < n; i++) corpus += monthly * Math.pow(1 + r, (n - i) / 12)
    }
    const gains = corpus - invested, taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = fdRate * (1 - tR)
    return {
      corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years),
    }
  }, [investType, amount, monthly, fdRate, years, tax, inf, inclTax, inclInf])

  const calcRD = useCallback((): Res => {
    const mr = (rdRate / 100) / 12, n = years * 12
    const tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus = 0
    const amt = investType === 'lumpsum' ? amount / n : monthly
    for (let i = 1; i <= n; i++) corpus += amt * Math.pow(1 + mr, i)
    const invested = amt * n, gains = corpus - invested
    const taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - tR)
    return {
      corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years),
    }
  }, [investType, amount, monthly, rdRate, years, tax, inf, inclTax, inclInf])

  const calcMF = useCallback((): Res => {
    const r = mfRate / 100, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (investType === 'lumpsum') {
      invested = amount; corpus = invested * Math.pow(1 + r, years)
    } else {
      const mr = r / 12, n = years * 12
      corpus = monthly * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
      invested = monthly * n
    }
    const gains = corpus - invested
    const txble = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = txble * 0.125, postTax = corpus - taxPaid
    const effTax = gains > 0 ? taxPaid / gains : 0
    const postTaxRate = mfRate * (1 - effTax)
    return {
      corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, years),
    }
  }, [investType, amount, monthly, mfRate, years, tax, inf, inclTax, inclInf])

  const fd = calcFD(), rd = calcRD(), mf = calcMF()
  const maxReal = Math.max(fd.realValue, rd.realValue, mf.realValue)

  const ranked = [
    { id: 'mf', name: 'Mutual Funds', label: investType === 'monthly' ? 'SIP' : 'Lump sum', dot: '#1a6b3c', d: mf, taxNote: '12.5% LTCG + ₹1.25L exemption' },
    { id: 'rd', name: 'Recurring Deposit', label: 'RD', dot: '#8b5cf6', d: rd, taxNote: `${tax}% slab tax` },
    { id: 'fd', name: 'Fixed Deposit', label: investType === 'monthly' ? 'Monthly' : 'Lump sum', dot: '#3b82f6', d: fd, taxNote: `${tax}% slab tax` },
  ].sort((a, b) => b.d.realReturn - a.d.realReturn)

  const winner = ranked[0]
  const invested = investType === 'lumpsum' ? amount : monthly

  // One-line insight
  const mfVsFd = mf.realValue - fd.realValue
  const insight = mf.realReturn > fd.realReturn
    ? `MF beats FD by ${fmt(mfVsFd)} in real terms over ${years} years.${fd.realReturn < 0 ? ` Your FD is losing purchasing power at ${pct(fd.realReturn)}/yr.` : ''}`
    : `FD and MF deliver similar real returns over ${years} years. Consider a longer horizon for MF to outperform.`

  // ── Inputs screen ─────────────────────────────────────────────
  if (screen === 'inputs') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
        <Nav />
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px 100px' }}>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
              Returns calculator
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.25, marginBottom: '6px' }}>
              FD vs RD vs Mutual Funds
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              See what each actually earns after tax and inflation.
            </p>
          </div>

          {/* Investment */}
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <SL>Investment</SL>
            <div style={{ marginBottom: '6px', fontSize: '11px', color: '#94a3b8' }}>Investment type</div>
            <Seg
              opts={[{ v: 'lumpsum', l: 'Lump sum' }, { v: 'monthly', l: 'Monthly SIP / RD' }]}
              val={investType}
              set={v => setInvestType(v as 'lumpsum' | 'monthly')}
            />
            {investType === 'lumpsum' ? (
              <Slider label="Amount" val={amount} set={setAmount} min={10000} max={10000000} step={10000} disp={fmt(amount)} />
            ) : (
              <Slider label="Monthly amount" val={monthly} set={setMonthly} min={1000} max={500000} step={1000} disp={fmt(monthly) + '/mo'} />
            )}
            <Slider
              label="Duration"
              val={years}
              set={setYears}
              min={1}
              max={40}
              step={1}
              disp={`${years} year${years > 1 ? 's' : ''}`}
            />
          </div>

          {/* Rates */}
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <SL>Interest rates</SL>
            <Slider label="FD interest rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} disp={`${fdRate}%`} hint="Most banks offer 6.5–7.5% for 1–3 yr FD" />
            <Slider label="RD interest rate" val={rdRate} set={setRdRate} min={4} max={9} step={0.25} disp={`${rdRate}%`} />
            <Slider label="MF expected CAGR" val={mfRate} set={setMfRate} min={6} max={20} step={0.5} disp={`${mfRate}%`} hint="Nifty 50 delivered ~13% CAGR over 20 years" />
          </div>

          {/* Profile */}
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
            <SL>Your profile</SL>
            <Slider label="Income tax slab" val={tax} set={setTax} min={0} max={30} step={5} disp={`${tax}%`} hint="FD & RD interest taxed at this rate" />
            <Slider label="Expected inflation" val={inf} set={setInf} min={3} max={10} step={0.5} disp={`${inf}%`} hint="RBI target is 4%. Use 6% to be conservative." />
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '4px' }}>
              <Toggle on={inclTax} label="Include tax in calculation" onToggle={() => setInclTax(v => !v)} />
              <Toggle on={inclInf} label="Adjust for inflation" onToggle={() => setInclInf(v => !v)} />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setScreen('results')}
            style={{ width: '100%', padding: '16px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
          >
            See results →
          </button>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
            Fisher Equation · FD/RD taxed at slab rate · MF: 12.5% LTCG + ₹1.25L exemption (Budget 2024)
          </p>
        </div>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
      {/* Sticky top bar with edit button */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1a6b3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>📊</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            real<span style={{ color: '#1a6b3c' }}>return</span>.in
          </div>
        </div>
        <button
          onClick={() => setScreen('inputs')}
          style={{ fontSize: '13px', fontWeight: 600, color: '#1a6b3c', background: '#f0fdf4', border: '1px solid #dcfce7', padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
        >
          ← Edit inputs
        </button>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Winner card */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '22px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Best real return
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
            {winner.name}
          </div>
          <div style={{ fontSize: '44px', fontWeight: 800, fontFamily: 'DM Mono, monospace', color: '#166534', letterSpacing: '-2px', lineHeight: 1, marginBottom: '6px' }}>
            {pct(winner.d.realReturn)}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>per year · real return</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            After {winner.id === 'mf' ? '12.5% LTCG tax' : `${tax}% tax`} and {inf}% inflation
          </div>
        </div>

        {/* Comparison bars */}
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
            Real value in today's money · {fmt(invested)}{investType === 'monthly' ? '/mo' : ''} · {years} years
          </div>
          {ranked.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < ranked.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#0f172a', width: '80px', flexShrink: 0 }}>{c.name.split(' ')[0]}</div>
              <div style={{ flex: 1, height: '7px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(3, (c.d.realValue / maxReal) * 100)}%`, background: c.dot, borderRadius: '999px' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: c.dot, fontFamily: 'DM Mono, monospace', width: '60px', textAlign: 'right', flexShrink: 0 }}>
                {fmtShort(c.d.realValue)}
              </div>
            </div>
          ))}
        </div>

        {/* Per-instrument breakdown */}
        {ranked.map(c => (
          <InstrumentCard
            key={c.id}
            dot={c.dot}
            name={c.name}
            label={c.label}
            rr={c.d.realReturn}
            nominal={c.d.corpus}
            postTax={c.d.postTax}
            realVal={c.d.realValue}
            taxNote={c.taxNote}
          />
        ))}

        {/* One-line insight */}
        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
          {insight}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', marginBottom: '48px' }}>
          Fisher Equation for real returns · FD & RD taxed at income slab rate · MF: 12.5% LTCG above ₹1.25L exemption (Budget 2024) · Not investment advice
        </p>

        {/* ── SEO Content ── */}
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
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
            Recurring Deposits fare slightly better — interest compounds monthly, which improves the effective yield slightly over FDs. But RD interest is also taxed at your slab rate, so the same tax drag applies. For most investors in the 20–30% bracket, RD real returns hover just above zero or slightly negative.
          </p>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '28px' }}>
            Mutual funds, specifically equity funds held for over one year, benefit from a significantly more favourable tax structure. Under the Union Budget 2024, Long Term Capital Gains (LTCG) above ₹1.25 lakh per year are taxed at just 12.5% — far lower than income slab rates. A 12% CAGR equity fund after this tax and 6% inflation delivers approximately <strong style={{ color: '#1a6b3c' }}>+5.66% real return per year</strong>, meaning your purchasing power genuinely grows.
          </p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
            When does FD make more sense than Mutual Funds?
          </h2>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
            FDs are not always the wrong choice. For short-term goals under 3 years, emergency funds, or investors who cannot tolerate any volatility, FDs provide guaranteed capital protection that mutual funds cannot match. The real return disadvantage matters most over long horizons of 5 years or more.
          </p>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
            Investors in the 0% or 5% tax slab also find FDs more competitive — the tax drag is minimal, and the guaranteed return becomes more attractive relative to the uncertainty of equity returns. Senior citizens with tax exemptions on FD interest also benefit disproportionately from fixed income instruments.
          </p>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '40px' }}>
            The RD is best suited for building a disciplined savings habit when the investment horizon is 1–3 years and capital safety is essential — such as saving for a fixed expense like a car down payment or annual insurance premium. For anything beyond 3–5 years, a SIP in a debt or hybrid mutual fund typically delivers better real returns with similar or lower risk.
          </p>

          {/* FAQ */}
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '20px' }}>
            Frequently asked questions
          </h2>
          {[
            {
              q: 'How is real return different from nominal return?',
              a: 'Nominal return is the interest rate your bank or fund advertises — 7% FD, 12% CAGR. Real return is what you actually keep after paying tax on the gains and adjusting for inflation. A 7% FD at 30% tax slab gives a 4.9% post-tax return. After 6% inflation, the real return is −1.04%. This is calculated using the Fisher Equation: Real Return = ((1 + Post-Tax Return) / (1 + Inflation)) − 1.',
            },
            {
              q: 'What is LTCG tax on mutual funds in India 2025?',
              a: 'As per Union Budget 2024, equity mutual fund gains held for more than 12 months are classified as Long Term Capital Gains (LTCG). The tax rate is 12.5% on gains above ₹1.25 lakh per financial year. The ₹1.25 lakh annual exemption was increased from ₹1 lakh. Gains below ₹1.25 lakh are fully exempt. This makes equity mutual funds significantly more tax-efficient than FDs for investors in the 20% or 30% slab.',
            },
            {
              q: 'Is RD better than FD for monthly savings?',
              a: 'For monthly savings, RD is a better structure than FD because it is designed for monthly contributions and compounds monthly. However, both are taxed at your income slab rate on the interest earned. If you are comparing a monthly SIP in a liquid or debt mutual fund vs RD for a 1–3 year horizon, the tax treatment is similar but mutual funds offer daily liquidity whereas RD has a lock-in until maturity.',
            },
            {
              q: 'What FD rate beats inflation after tax?',
              a: 'For an investor in the 30% tax slab with 6% inflation, an FD would need to offer approximately 8.6% interest to deliver a zero real return. Most Indian banks offer 6.5–7.5% for retail FDs, which means FD investors in the highest tax bracket are consistently losing purchasing power. Only investors with no tax liability (0% slab) or those using tax-exempt instruments like PPF can preserve real purchasing power with fixed income.',
            },
            {
              q: 'How long should I stay invested in mutual funds to beat FD?',
              a: 'Historically, equity mutual funds begin outperforming FDs in real terms from around Year 3–5 onwards, depending on market conditions. In the short run (1–2 years), market volatility can result in mutual fund returns below FD returns. Over 10–15 year periods, the combination of higher CAGR, lower LTCG tax, and inflation-beating returns makes equity mutual funds significantly superior to FDs for wealth creation.',
            },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>{faq.q}</h3>
              <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', paddingBottom: '20px' }}>
          Not investment advice · Returns are illustrative · Consult a SEBI-registered advisor · LTCG rates as per Union Budget 2024
        </p>

      </div>
    </div>
  )
}
