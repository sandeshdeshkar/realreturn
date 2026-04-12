'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface CalcResult {
  corpus: number; invested: number; gains: number; taxPaid: number
  postTax: number; realValue: number; realReturn: number
  postTaxRate: number; inflationErosion: number; breakEvenInflation?: number
}

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const abs = Math.abs(n), pre = n < 0 ? '-' : ''
  if (abs >= 1e7) return pre + '₹' + (abs / 1e7).toFixed(2) + 'Cr'
  if (abs >= 1e5) return pre + '₹' + (abs / 1e5).toFixed(2) + 'L'
  return pre + '₹' + Math.round(abs).toLocaleString('en-IN')
}
function fmtP(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '0.00%'
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}
function fisher(nom: number, inf: number): number {
  return ((1 + nom / 100) / (1 + inf / 100) - 1) * 100
}
function rrColor(v: number): string {
  return v > 0.5 ? '#1a6b3c' : v < 0 ? '#c0392b' : '#d4860a'
}

function SliderRow({ label, val, set, min, max, step, display, note }: {
  label: string; val: number; set: (v: number) => void
  min: number; max: number; step: number; display: string; note?: string
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#4a5568' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f1923', fontFamily: 'DM Mono, monospace' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))} />
      {note && <div style={{ fontSize: '10px', color: '#8896a8', marginTop: '3px' }}>{note}</div>}
    </div>
  )
}

function SegToggle({ options, value, onChange, color }: {
  options: { val: string; label: string }[]
  value: string; onChange: (v: string) => void; color: string
}) {
  return (
    <div style={{ display: 'flex', background: '#f7f8fa', border: '1px solid #e8ecf0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
      {options.map(o => (
        <button key={o.val} onClick={() => onChange(o.val)} style={{
          flex: 1, padding: '8px 4px', fontSize: '11px', fontWeight: 600,
          background: value === o.val ? color : 'transparent',
          color: value === o.val ? '#fff' : '#8896a8',
          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function SectionLabel({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8896a8', margin: '16px 0 10px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </div>
  )
}

function ResultCard({ label, color, data, isWinner, inclTax, inclInf, tax, inf }: {
  label: string; color: string; data: CalcResult
  isWinner: boolean; inclTax: boolean; inclInf: boolean; tax: number; inf: number
}) {
  const rr = inclInf ? data.realReturn : data.postTaxRate
  const sublabel = inclInf && inclTax
    ? `real/yr · after ${tax}% tax & ${inf}% inflation`
    : inclTax ? `post-tax/yr · after ${tax}% tax`
    : inclInf ? `real/yr · after ${inf}% inflation`
    : 'stated rate'

  return (
    <div style={{
      background: '#fff',
      border: isWinner ? `2px solid ${color}` : '1px solid #e8ecf0',
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: isWinner ? `0 4px 20px ${color}25` : 'none',
    }}>
      <div style={{ height: '3px', background: color }} />
      {isWinner && (
        <div style={{ background: color, color: '#fff', fontSize: '9px', fontWeight: 700, textAlign: 'center', padding: '3px', letterSpacing: '1px' }}>
          BEST REAL RETURN
        </div>
      )}
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: rrColor(rr), letterSpacing: '-1px', lineHeight: 1 }}>
          {fmtP(rr)}
        </div>
        <div style={{ fontSize: '10px', color: '#8896a8', marginTop: '3px', marginBottom: '14px' }}>{sublabel}</div>
        <div style={{ background: '#f7f8fa', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
          {[
            { dot: '#9ca3af', label: 'Invested', val: fmt(data.invested), vc: '#4a5568' },
            { dot: '#9ca3af', label: 'Gross Corpus', val: fmt(data.corpus), vc: '#4a5568' },
            { dot: '#f59e0b', label: 'Post-Tax', val: fmt(data.postTax), vc: '#d4860a' },
            { dot: '#1a6b3c', label: 'Real Value', val: fmt(data.realValue), vc: '#1a6b3c' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 3 ? '6px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#8896a8' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.dot, display: 'inline-block', flexShrink: 0 }} />
                {row.label}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: row.vc }}>{row.val}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fdecea', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>💸 What you lost</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(192,57,43,0.8)' }}>Tax paid</span>
            <span style={{ fontFamily: 'DM Mono, monospace', color: '#c0392b', fontWeight: 600 }}>{fmt(data.taxPaid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'rgba(192,57,43,0.8)' }}>Inflation erosion</span>
            <span style={{ fontFamily: 'DM Mono, monospace', color: '#c0392b', fontWeight: 600 }}>
              {inclInf ? fmt(data.postTax - data.realValue) : '—'}
            </span>
          </div>
          {data.breakEvenInflation !== undefined && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(192,57,43,0.15)', fontSize: '10px', color: '#d4860a' }}>
              Break-even inflation: <strong>{data.breakEvenInflation.toFixed(2)}%</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Calculator() {
  const [years, setYears] = useState(10)
  const [tax, setTax] = useState(30)
  const [inf, setInf] = useState(6)
  const [inclTax, setInclTax] = useState(true)
  const [inclInf, setInclInf] = useState(true)
  const [fdType, setFdType] = useState<'lumpsum' | 'monthly'>('lumpsum')
  const [fdLs, setFdLs] = useState(500000)
  const [fdMo, setFdMo] = useState(10000)
  const [fdRate, setFdRate] = useState(7)
  const [rdAmt, setRdAmt] = useState(10000)
  const [rdRate, setRdRate] = useState(6.5)
  const [mfType, setMfType] = useState<'sip' | 'lumpsum'>('sip')
  const [mfSip, setMfSip] = useState(10000)
  const [mfLs, setMfLs] = useState(500000)
  const [mfRate, setMfRate] = useState(12)
  const [tableView, setTableView] = useState<'fd' | 'rd' | 'mf'>('mf')
  const [showInputs, setShowInputs] = useState(false)

  const calcFD = useCallback((yrs = years): CalcResult => {
    const r = fdRate / 100, taxR = inclTax ? tax / 100 : 0, inflR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (fdType === 'lumpsum') { invested = fdLs; corpus = invested * Math.pow(1 + r, yrs) }
    else {
      const n = yrs * 12; invested = fdMo * n; corpus = 0
      for (let i = 0; i < n; i++) corpus += fdMo * Math.pow(1 + r, (n - i) / 12)
    }
    const gains = corpus - invested, taxPaid = gains * taxR, postTax = corpus - taxPaid
    const postTaxRate = fdRate * (1 - taxR)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1 + inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate, inflationErosion: postTax - realValue, breakEvenInflation: postTaxRate }
  }, [fdType, fdLs, fdMo, fdRate, years, tax, inf, inclTax, inclInf])

  const calcRD = useCallback((yrs = years): CalcResult => {
    const mr = (rdRate / 100) / 12, n = yrs * 12
    const taxR = inclTax ? tax / 100 : 0, inflR = inclInf ? inf / 100 : 0
    let corpus = 0
    for (let i = 1; i <= n; i++) corpus += rdAmt * Math.pow(1 + mr, i)
    const invested = rdAmt * n, gains = corpus - invested, taxPaid = gains * taxR, postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - taxR)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1 + inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate, inflationErosion: postTax - realValue }
  }, [rdAmt, rdRate, years, tax, inf, inclTax, inclInf])

  const calcMF = useCallback((yrs = years): CalcResult => {
    const r = mfRate / 100, inflR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (mfType === 'sip') {
      const mr = r / 12, n = yrs * 12
      corpus = mfSip * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr); invested = mfSip * n
    } else { invested = mfLs; corpus = invested * Math.pow(1 + r, yrs) }
    const gains = corpus - invested
    const taxableGain = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = taxableGain * 0.125, postTax = corpus - taxPaid
    const effTax = gains > 0 ? taxPaid / gains : 0
    const postTaxRate = mfRate * (1 - effTax)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1 + inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate, inflationErosion: postTax - realValue }
  }, [mfType, mfSip, mfLs, mfRate, years, tax, inf, inclTax, inclInf])

  const fd = calcFD(), rd = calcRD(), mf = calcMF()

  const scores = [
    { id: 'fd', name: fdType === 'lumpsum' ? 'FD' : 'FD Monthly', rr: fd.realReturn, color: '#3b82f6', label: fdType === 'lumpsum' ? 'Fixed Deposit' : 'FD (Monthly)' },
    { id: 'rd', name: 'RD', rr: rd.realReturn, color: '#8b5cf6', label: 'Recurring Deposit' },
    { id: 'mf', name: mfType === 'sip' ? 'SIP' : 'MF', rr: mf.realReturn, color: '#1a6b3c', label: mfType === 'sip' ? 'Mutual Funds (SIP)' : 'Mutual Funds' },
  ].sort((a, b) => b.rr - a.rr)
  const winner = scores[0]

  let breakEven: number | null = null
  for (let y = 1; y <= 40; y++) {
    if (calcMF(y).realValue > calcFD(y).realValue) { breakEven = y; break }
  }

  const tableRows = Array.from({ length: years }, (_, i) => {
    const y = i + 1
    const d = tableView === 'fd' ? calcFD(y) : tableView === 'rd' ? calcRD(y) : calcMF(y)
    return { y, ...d }
  })

  const maxNom = Math.max(fd.corpus, rd.corpus, mf.corpus)

  const insights = [
    mf.realReturn > 2 && { icon: '🚀', text: `SIP at ${mfRate}% CAGR delivers <strong>${fmtP(mf.realReturn)}/yr</strong> real return — genuine purchasing power growth every year.` },
    fd.realReturn < 0 && { icon: '⚠️', text: `FD is losing purchasing power at <strong>${fmtP(fd.realReturn)}/yr</strong>. Bank balance grows but each rupee buys less.` },
    fd.realReturn >= 0 && fd.realReturn < 1.5 && { icon: '😐', text: `FD real return is just <strong>${fmtP(fd.realReturn)}/yr</strong> — ${(mf.realReturn - fd.realReturn).toFixed(1)}pp below SIP. That gap compounds significantly over ${years} years.` },
    breakEven !== null && years >= breakEven && { icon: '✅', text: `SIP overtook FD at <strong>Year ${breakEven}</strong>. You're ${years - breakEven} years past the crossover — <strong>${fmt(mf.realValue - fd.realValue)}</strong> more real wealth.` },
    breakEven !== null && years < breakEven && { icon: '⏱️', text: `SIP overtakes FD at <strong>Year ${breakEven}</strong>. Just ${breakEven - years} more year${breakEven - years > 1 ? 's' : ''} to the crossover — stay invested.` },
    inclTax && { icon: '🧾', text: `Tax takes <strong>${fd.gains > 0 ? (fd.taxPaid / fd.gains * 100).toFixed(0) : 0}%</strong> of FD gains vs only <strong>${mf.gains > 0 ? (mf.taxPaid / mf.gains * 100).toFixed(0) : 0}%</strong> of MF gains. LTCG is far more tax-efficient.` },
    inclInf && { icon: '📊', text: `At ${inf}% inflation, purchasing power halves every <strong>${(72 / inf).toFixed(0)} years</strong>. Any investment below ${inf}% post-tax is shrinking your real wealth.` },
    years >= 15 && { icon: '⚡', text: `${years}-year horizon is a major advantage. At ${mfRate}% CAGR, ₹1 becomes <strong>₹${(Math.pow(1 + mfRate / 100, years)).toFixed(1)}</strong> — compounding does the heavy lifting.` },
    years <= 3 && { icon: '🛡️', text: `Short horizon (${years} years): equity MFs can be volatile. FD and RD offer more predictable returns in this window.` },
  ].filter(Boolean) as { icon: string; text: string }[]

  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh' }}>

      <style>{`
        @media (min-width: 768px) {
          .calc-inputs { max-height: 3000px !important; opacity: 1 !important; overflow: visible !important; }
          .calc-layout { grid-template-columns: 300px 1fr !important; }
          .calc-cards { grid-template-columns: repeat(3, 1fr) !important; }
          .calc-banner { grid-template-columns: repeat(5, 1fr) !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 767px) {
          .calc-layout { grid-template-columns: 1fr !important; }
          .calc-cards { grid-template-columns: 1fr !important; }
          .calc-banner { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1a6b3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📊</div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f1923' }}>real<span style={{ color: '#1a6b3c' }}>return</span>.in</span>
        </Link>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ k: 'tax', label: 'Tax', val: inclTax }, { k: 'inf', label: 'Inflation', val: inclInf }].map(t => (
            <button key={t.k}
              onClick={() => t.k === 'tax' ? setInclTax(!inclTax) : setInclInf(!inclInf)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: t.val ? '#e8f5ee' : '#f7f8fa',
                border: `1px solid ${t.val ? '#1a6b3c' : '#e8ecf0'}`,
                color: t.val ? '#1a6b3c' : '#8896a8',
                borderRadius: '999px', padding: '5px 10px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.val ? '#1a6b3c' : '#c0ccd8', display: 'inline-block' }} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* PAGE TITLE */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '14px 16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f1923', letterSpacing: '-0.3px' }}>Financial Reality Engine</h1>
        <p style={{ fontSize: '12px', color: '#4a5568', marginTop: '2px' }}>FD vs RD vs Mutual Funds — real returns after tax &amp; inflation</p>
      </div>

      {/* MOBILE INPUTS TOGGLE */}
      <div className="mobile-only" style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e8ecf0' }}>
        <button
          onClick={() => setShowInputs(!showInputs)}
          style={{
            width: '100%', padding: '10px 16px',
            background: showInputs ? '#1a6b3c' : '#f7f8fa',
            border: `1px solid ${showInputs ? '#1a6b3c' : '#e8ecf0'}`,
            borderRadius: '8px', color: showInputs ? '#fff' : '#0f1923',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          ⚙️ {showInputs ? 'Hide Settings ▲' : 'Adjust Inputs ▼'}
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '16px' }}>
        <div className="calc-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', alignItems: 'start' }}>

          {/* INPUTS PANEL */}
          <div className="calc-inputs" style={{
            background: '#fff', border: '1px solid #e8ecf0',
            borderRadius: '12px', overflow: 'hidden',
            position: 'sticky', top: '62px',
            maxHeight: showInputs ? '3000px' : '0px',
            opacity: showInputs ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.2s ease',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8896a8' }}>Configure</span>
              <span style={{ fontSize: '10px', background: '#e8f5ee', color: '#1a6b3c', padding: '2px 8px', borderRadius: '999px' }}>● Live</span>
            </div>
            <div style={{ padding: '16px' }}>
              <SectionLabel color="#f59e0b" label="General" />
              <SliderRow label="Duration" val={years} set={setYears} min={1} max={40} step={1} display={`${years} yrs`} />
              <SliderRow label="Tax Slab" val={tax} set={setTax} min={0} max={42} step={5} display={`${tax}%`} />
              <SliderRow label="Inflation" val={inf} set={setInf} min={3} max={12} step={0.5} display={`${inf}%`} />

              <SectionLabel color="#3b82f6" label="Fixed Deposit" />
              <SegToggle options={[{ val: 'lumpsum', label: 'Lump Sum' }, { val: 'monthly', label: 'Monthly' }]} value={fdType} onChange={v => setFdType(v as any)} color="#3b82f6" />
              {fdType === 'lumpsum'
                ? <SliderRow label="Amount" val={fdLs} set={setFdLs} min={10000} max={5000000} step={10000} display={fmt(fdLs)} />
                : <SliderRow label="Monthly" val={fdMo} set={setFdMo} min={500} max={200000} step={500} display={`${fmt(fdMo)}/mo`} />}
              <SliderRow label="Interest Rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} display={`${fdRate}%`} />

              <SectionLabel color="#8b5cf6" label="Recurring Deposit" />
              <SliderRow label="Monthly" val={rdAmt} set={setRdAmt} min={500} max={200000} step={500} display={`${fmt(rdAmt)}/mo`} />
              <SliderRow label="Interest Rate" val={rdRate} set={setRdRate} min={4} max={9} step={0.25} display={`${rdRate}%`} />

              <SectionLabel color="#1a6b3c" label="Mutual Funds" />
              <SegToggle options={[{ val: 'sip', label: 'SIP Monthly' }, { val: 'lumpsum', label: 'Lump Sum' }]} value={mfType} onChange={v => setMfType(v as any)} color="#1a6b3c" />
              {mfType === 'sip'
                ? <SliderRow label="Monthly SIP" val={mfSip} set={setMfSip} min={500} max={200000} step={500} display={`${fmt(mfSip)}/mo`} />
                : <SliderRow label="Amount" val={mfLs} set={setMfLs} min={10000} max={5000000} step={10000} display={fmt(mfLs)} />}
              <SliderRow label="Expected CAGR" val={mfRate} set={setMfRate} min={6} max={18} step={0.5} display={`${mfRate}%`} note="Nifty 50 historical: ~12% CAGR" />
            </div>
          </div>

          {/* RESULTS */}
          <div>

            {/* REALITY BANNER */}
            <div className="calc-banner" style={{
              background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px',
              padding: '14px 16px', marginBottom: '14px',
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
            }}>
              {[
                { val: fmt(fd.invested + rd.invested + mf.invested), label: 'Total Invested', color: '#0f1923' },
                { val: fmt(Math.max(fd.corpus, rd.corpus, mf.corpus)), label: 'Best Nominal', color: '#0f1923' },
                { val: fmt(Math.max(fd.realValue, rd.realValue, mf.realValue)), label: 'Best Real Value', color: '#1a6b3c' },
                { val: fmt(Math.max(fd.postTax, rd.postTax, mf.postTax) - Math.max(fd.realValue, rd.realValue, mf.realValue)), label: 'Lost to Inflation', color: '#c0392b' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: '10px', color: '#8896a8', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #e8ecf0' }}>
                <div style={{ display: 'inline-block', background: '#e8f5ee', border: '1px solid #1a6b3c', color: '#1a6b3c', borderRadius: '999px', padding: '5px 14px', fontSize: '12px', fontWeight: 600 }}>
                  🏆 {winner.name} wins · {fmtP(winner.rr)} real/yr
                </div>
              </div>
            </div>

            {/* EROSION WARNING */}
            {fd.realReturn < 0 && inclInf && (
              <div style={{ background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px', fontSize: '13px', color: '#c0392b', lineHeight: 1.5 }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <div><strong>Wealth Erosion Alert:</strong> Your FD delivers {fmtP(fd.realReturn)}/yr after {tax}% tax and {inf}% inflation. You are losing purchasing power.</div>
              </div>
            )}

            {/* 3 CARDS — 1 col mobile, 3 col desktop */}
            <div className="calc-cards" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '14px' }}>
              {[
                { id: 'fd', data: fd, color: '#3b82f6', label: fdType === 'lumpsum' ? 'Fixed Deposit' : 'FD (Monthly)' },
                { id: 'rd', data: rd, color: '#8b5cf6', label: 'Recurring Deposit' },
                { id: 'mf', data: mf, color: '#1a6b3c', label: mfType === 'sip' ? 'Mutual Funds (SIP)' : 'Mutual Funds' },
              ].map(card => (
                <ResultCard key={card.id} label={card.label} color={card.color} data={card.data}
                  isWinner={winner.id === card.id} inclTax={inclTax} inclInf={inclInf} tax={tax} inf={inf} />
              ))}
            </div>

            {/* BAR CHART */}
            <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Expected vs Reality</div>
              <div style={{ fontSize: '11px', color: '#8896a8', marginBottom: '12px' }}>What you see vs what your money is worth</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[['#9ca3af', 'Nominal'], ['#f59e0b', 'Post-Tax'], ['#1a6b3c', 'Real Value']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#4a5568' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c as string, display: 'inline-block' }} />{l}
                  </div>
                ))}
              </div>
              {[
                { label: 'Fixed Deposit', nom: fd.corpus, postTaxV: fd.postTax, real: fd.realValue, color: '#3b82f6' },
                { label: 'Rec. Deposit', nom: rd.corpus, postTaxV: rd.postTax, real: rd.realValue, color: '#8b5cf6' },
                { label: 'Mutual Funds', nom: mf.corpus, postTaxV: mf.postTax, real: mf.realValue, color: '#1a6b3c' },
              ].map(bar => (
                <div key={bar.label} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '5px', fontWeight: 500 }}>{bar.label}</div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      {[
                        { val: bar.nom, bg: '#e5e7eb', fill: '#9ca3af' },
                        { val: bar.postTaxV, bg: '#fef3dc', fill: '#f59e0b' },
                        { val: bar.real, bg: `${bar.color}15`, fill: bar.color },
                      ].map((b, i) => (
                        <div key={i} style={{ height: '8px', background: b.bg, borderRadius: '999px', overflow: 'hidden', marginBottom: '3px' }}>
                          <div style={{ height: '100%', width: `${Math.max(2, (b.val / maxNom) * 100)}%`, background: b.fill, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ width: '70px', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'DM Mono, monospace' }}>{fmt(bar.nom)}</div>
                      <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>{fmt(bar.postTaxV)}</div>
                      <div style={{ fontSize: '10px', color: bar.color, fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{fmt(bar.real)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* YEAR TABLE */}
            <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '1px' }}>Year-by-Year</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['fd', 'rd', 'mf'] as const).map(v => (
                    <button key={v} onClick={() => setTableView(v)} style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                      background: tableView === v ? '#e8f5ee' : '#f7f8fa',
                      border: `1px solid ${tableView === v ? '#1a6b3c' : '#e8ecf0'}`,
                      color: tableView === v ? '#1a6b3c' : '#8896a8',
                      fontWeight: tableView === v ? 600 : 400, cursor: 'pointer',
                    }}>{v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '280px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ background: '#f7f8fa', position: 'sticky', top: 0 }}>
                      {['Year', 'Invested', 'Gross', 'Tax', 'Post-Tax', 'Real Value', 'Real Gain'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Year' ? 'left' : 'right', color: '#8896a8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(row => {
                      const rg = row.realValue - row.invested
                      return (
                        <tr key={row.y} style={{ borderBottom: '1px solid #f0f2f4' }}>
                          <td style={{ padding: '6px 10px', color: '#4a5568', fontWeight: 500 }}>Y{row.y}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#4a5568' }}>{fmt(row.invested)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#4a5568' }}>{fmt(row.corpus)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#c0392b' }}>{fmt(row.taxPaid)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#d4860a' }}>{fmt(row.postTax)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#1a6b3c', fontWeight: 600 }}>{fmt(row.realValue)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: rg >= 0 ? '#1a6b3c' : '#c0392b', fontWeight: 600 }}>{rg >= 0 ? '+' : ''}{fmt(rg)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INSIGHTS */}
            <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>💡 Smart Insights</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ background: '#f7f8fa', border: '1px solid #e8ecf0', borderRadius: '8px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{ins.icon}</span>
                    <span style={{ fontSize: '12px', color: '#4a5568', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: ins.text }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '14px', fontSize: '11px', color: '#b0bac8', lineHeight: 1.6 }}>
                Fisher Equation used for real returns. FD/RD taxed at slab rate. MF: 12.5% LTCG with ₹1.25L exemption (Budget 2024). Not investment advice. Consult a SEBI-registered advisor.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
