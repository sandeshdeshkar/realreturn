'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────
interface Res {
  corpus: number; invested: number; gains: number; taxPaid: number
  postTax: number; realValue: number; realReturn: number
  postTaxRate: number; breakEvenInflation?: number
}

// ─── Pure helpers ────────────────────────────────────────────
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + 'Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}
const pct = (n: number) => (!isFinite(n) || isNaN(n)) ? '0.00%' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
const fisher = (nom: number, inf: number) => ((1 + nom / 100) / (1 + inf / 100) - 1) * 100
const rrCol = (v: number) => v > 0.5 ? '#1a6b3c' : v < 0 ? '#c0392b' : '#d4860a'

// ─── Slider ──────────────────────────────────────────────────
function Slider({ label, val, set, min, max, step, disp, note }: {
  label: string; val: number; set: (v: number) => void
  min: number; max: number; step: number; disp: string; note?: string
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'DM Mono, monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px' }}>{disp}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ width: '100%', height: '6px', accentColor: '#1a6b3c', cursor: 'pointer' }} />
      {note && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{note}</p>}
    </div>
  )
}

// ─── Seg ─────────────────────────────────────────────────────
function Seg({ opts, val, set, col }: {
  opts: { v: string; l: string }[]; val: string; set: (v: string) => void; col: string
}) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${col}30`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => set(o.v)} style={{
          flex: 1, padding: '10px 6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
          background: val === o.v ? col : '#f9fafb',
          color: val === o.v ? '#fff' : '#6b7280',
          transition: 'all 0.15s',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

// ─── Section label ───────────────────────────────────────────
function SecLabel({ col, txt }: { col: string; txt: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: col, display: 'inline-block', flexShrink: 0 }} />
      {txt}
    </div>
  )
}

// ─── Result card ─────────────────────────────────────────────
function Card({ label, col, d, winner, inclTax, inclInf, tax, inf }: {
  label: string; col: string; d: Res; winner: boolean
  inclTax: boolean; inclInf: boolean; tax: number; inf: number
}) {
  const rr = inclInf ? d.realReturn : d.postTaxRate
  const sub = inclInf && inclTax ? `after ${tax}% tax & ${inf}% inflation`
    : inclTax ? `after ${tax}% tax` : inclInf ? `after ${inf}% inflation` : 'no adjustments'

  return (
    <div style={{
      background: '#fff',
      border: winner ? `2px solid ${col}` : '1px solid #e5e7eb',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: winner ? `0 0 0 4px ${col}18` : '0 1px 3px rgba(0,0,0,0.06)',
      marginBottom: '12px',
    }}>
      {/* top stripe */}
      <div style={{ height: '4px', background: col }} />
      {winner && (
        <div style={{ background: col, color: '#fff', textAlign: 'center', fontSize: '10px', fontWeight: 700, padding: '4px', letterSpacing: '1px' }}>
          🏆 BEST REAL RETURN
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '34px', fontWeight: 800, fontFamily: 'DM Mono, monospace', color: rrCol(rr), letterSpacing: '-1.5px', lineHeight: 1 }}>
              {pct(rr)}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Real Value</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#1a6b3c' }}>{fmt(d.realValue)}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', margin: '12px 0' }} />

        {/* 4-row breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { l: 'Invested', v: fmt(d.invested), c: '#6b7280' },
            { l: 'Gross Corpus', v: fmt(d.corpus), c: '#6b7280' },
            { l: 'Post-Tax', v: fmt(d.postTax), c: '#d97706' },
            { l: 'Real Value', v: fmt(d.realValue), c: '#1a6b3c' },
          ].map((r, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>{r.l}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: r.c }}>{r.v}</div>
            </div>
          ))}
        </div>

        {/* Losses */}
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#e53e3e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💸 Lost to</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#fc8181' }}>Tax</span>
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#e53e3e' }}>{fmt(d.taxPaid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#fc8181' }}>Inflation erosion</span>
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#e53e3e' }}>{inclInf ? fmt(d.postTax - d.realValue) : '—'}</span>
          </div>
          {d.breakEvenInflation !== undefined && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fed7d7', fontSize: '11px', color: '#d97706' }}>
              FD breaks even at <strong>{d.breakEvenInflation.toFixed(1)}%</strong> inflation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function Calculator() {
  // tab (mobile)
  const [tab, setTab] = useState<'inputs' | 'results' | 'insights'>('inputs')

  // inputs
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
  const [tView, setTView] = useState<'fd' | 'rd' | 'mf'>('mf')

  // calcs
  const calcFD = useCallback((y = years): Res => {
    const r = fdRate / 100, tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (fdType === 'lumpsum') { invested = fdLs; corpus = invested * Math.pow(1 + r, y) }
    else {
      const n = y * 12; invested = fdMo * n; corpus = 0
      for (let i = 0; i < n; i++) corpus += fdMo * Math.pow(1 + r, (n - i) / 12)
    }
    const gains = corpus - invested, taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = fdRate * (1 - tR)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate, breakEvenInflation: postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, y) }
  }, [fdType, fdLs, fdMo, fdRate, years, tax, inf, inclTax, inclInf])

  const calcRD = useCallback((y = years): Res => {
    const mr = (rdRate / 100) / 12, n = y * 12
    const tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus = 0
    for (let i = 1; i <= n; i++) corpus += rdAmt * Math.pow(1 + mr, i)
    const invested = rdAmt * n, gains = corpus - invested, taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - tR)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, y) }
  }, [rdAmt, rdRate, years, tax, inf, inclTax, inclInf])

  const calcMF = useCallback((y = years): Res => {
    const r = mfRate / 100, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (mfType === 'sip') {
      const mr = r / 12, n = y * 12
      corpus = mfSip * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr); invested = mfSip * n
    } else { invested = mfLs; corpus = invested * Math.pow(1 + r, y) }
    const gains = corpus - invested, taxableGain = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = taxableGain * 0.125, postTax = corpus - taxPaid
    const effTax = gains > 0 ? taxPaid / gains : 0, postTaxRate = mfRate * (1 - effTax)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0),
      realValue: postTax / Math.pow(1 + iR, y) }
  }, [mfType, mfSip, mfLs, mfRate, years, tax, inf, inclTax, inclInf])

  const fd = calcFD(), rd = calcRD(), mf = calcMF()

  const items = [
    { id: 'fd', name: fdType === 'lumpsum' ? 'FD' : 'FD Monthly', rr: fd.realReturn, col: '#3b82f6', lbl: fdType === 'lumpsum' ? 'Fixed Deposit' : 'FD (Monthly)', d: fd },
    { id: 'rd', name: 'RD', rr: rd.realReturn, col: '#8b5cf6', lbl: 'Recurring Deposit', d: rd },
    { id: 'mf', name: mfType === 'sip' ? 'SIP' : 'MF', rr: mf.realReturn, col: '#1a6b3c', lbl: mfType === 'sip' ? 'Mutual Funds (SIP)' : 'Mutual Funds', d: mf },
  ].sort((a, b) => b.rr - a.rr)
  const winner = items[0]

  let be: number | null = null
  for (let y = 1; y <= 40; y++) { if (calcMF(y).realValue > calcFD(y).realValue) { be = y; break } }

  const rows = Array.from({ length: years }, (_, i) => {
    const y = i + 1
    const d = tView === 'fd' ? calcFD(y) : tView === 'rd' ? calcRD(y) : calcMF(y)
    return { y, ...d }
  })
  const maxN = Math.max(fd.corpus, rd.corpus, mf.corpus)

  const insights = [
    mf.realReturn > 2 && { icon: '🚀', txt: `SIP at ${mfRate}% CAGR delivers <strong>${pct(mf.realReturn)}/yr</strong> real return. Your money genuinely grows in purchasing power.` },
    fd.realReturn < 0 && { icon: '⚠️', txt: `FD is losing purchasing power at <strong>${pct(fd.realReturn)}/yr</strong>. Your balance grows but each rupee buys less every year.` },
    fd.realReturn >= 0 && fd.realReturn < 1.5 && { icon: '😐', txt: `FD real return is just <strong>${pct(fd.realReturn)}/yr</strong> — ${(mf.realReturn - fd.realReturn).toFixed(1)} percentage points below SIP. This gap compounds significantly.` },
    be !== null && years >= be && { icon: '✅', txt: `SIP overtook FD at <strong>Year ${be}</strong>. You're ${years - be} year${years - be !== 1 ? 's' : ''} past the crossover — that's <strong>${fmt(mf.realValue - fd.realValue)}</strong> extra real wealth.` },
    be !== null && years < be && { icon: '⏱️', txt: `SIP overtakes FD in real terms at <strong>Year ${be}</strong>. Just ${be - years} more year${be - years !== 1 ? 's' : ''} to the crossover.` },
    inclTax && { icon: '🧾', txt: `FD gives <strong>${fd.gains > 0 ? (fd.taxPaid / fd.gains * 100).toFixed(0) : 0}%</strong> of gains to tax. MF gives only <strong>${mf.gains > 0 ? (mf.taxPaid / mf.gains * 100).toFixed(0) : 0}%</strong> (12.5% LTCG + ₹1.25L exempt). MF is dramatically more tax-efficient.` },
    inclInf && { icon: '📊', txt: `At ${inf}% inflation, purchasing power halves every <strong>${(72 / inf).toFixed(0)} years</strong>. Any investment below ${inf}% post-tax is eroding your real wealth.` },
    years >= 15 && { icon: '⚡', txt: `${years}-year horizon is your biggest advantage. At ${mfRate}% CAGR, every ₹1 becomes <strong>₹${(Math.pow(1 + mfRate / 100, years)).toFixed(1)}</strong>. Time in market beats everything.` },
    years <= 3 && { icon: '🛡️', txt: `For ${years}-year horizons, equity MFs carry volatility risk. FD and RD offer more predictable outcomes in the short term.` },
  ].filter(Boolean) as { icon: string; txt: string }[]

  // ─ shared input panel content ─
  const InputsContent = (
    <div style={{ padding: '16px' }}>
      <SecLabel col="#f59e0b" txt="General" />
      <Slider label="Duration" val={years} set={setYears} min={1} max={40} step={1} disp={`${years} yrs`} />
      <Slider label="Tax Slab" val={tax} set={setTax} min={0} max={42} step={5} disp={`${tax}%`} />
      <Slider label="Inflation" val={inf} set={setInf} min={3} max={12} step={0.5} disp={`${inf}%`} />

      <SecLabel col="#3b82f6" txt="Fixed Deposit" />
      <Seg opts={[{ v: 'lumpsum', l: 'Lump Sum' }, { v: 'monthly', l: 'Monthly' }]} val={fdType} set={v => setFdType(v as any)} col="#3b82f6" />
      {fdType === 'lumpsum'
        ? <Slider label="Amount" val={fdLs} set={setFdLs} min={10000} max={5000000} step={10000} disp={fmt(fdLs)} />
        : <Slider label="Monthly Deposit" val={fdMo} set={setFdMo} min={500} max={200000} step={500} disp={`${fmt(fdMo)}/mo`} />}
      <Slider label="Interest Rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} disp={`${fdRate}%`} />

      <SecLabel col="#8b5cf6" txt="Recurring Deposit" />
      <Slider label="Monthly Amount" val={rdAmt} set={setRdAmt} min={500} max={200000} step={500} disp={`${fmt(rdAmt)}/mo`} />
      <Slider label="Interest Rate" val={rdRate} set={setRdRate} min={4} max={9} step={0.25} disp={`${rdRate}%`} />

      <SecLabel col="#1a6b3c" txt="Mutual Funds" />
      <Seg opts={[{ v: 'sip', l: 'SIP Monthly' }, { v: 'lumpsum', l: 'Lump Sum' }]} val={mfType} set={v => setMfType(v as any)} col="#1a6b3c" />
      {mfType === 'sip'
        ? <Slider label="Monthly SIP" val={mfSip} set={setMfSip} min={500} max={200000} step={500} disp={`${fmt(mfSip)}/mo`} />
        : <Slider label="Amount" val={mfLs} set={setMfLs} min={10000} max={5000000} step={10000} disp={fmt(mfLs)} />}
      <Slider label="Expected CAGR" val={mfRate} set={setMfRate} min={6} max={18} step={0.5} disp={`${mfRate}%`} note="Nifty 50 long-run average: ~12% CAGR" />
    </div>
  )

  // ─ results content ─
  const ResultsContent = (
    <div>
      {/* Winner summary strip */}
      <div style={{ background: '#1a6b3c', borderRadius: '14px', padding: '16px', marginBottom: '14px', color: '#fff' }}>
        <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '6px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Best real return over {years} years</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'DM Mono, monospace', letterSpacing: '-1px' }}>{pct(winner.rr)}</div>
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>🏆 {winner.name} wins</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>Real corpus</div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{fmt(winner.d.realValue)}</div>
          </div>
        </div>
      </div>

      {/* Quick stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {[
          { l: 'Total Invested', v: fmt(fd.invested + rd.invested + mf.invested), c: '#374151' },
          { l: 'Best Nominal', v: fmt(Math.max(fd.corpus, rd.corpus, mf.corpus)), c: '#374151' },
          { l: 'Best Real Value', v: fmt(Math.max(fd.realValue, rd.realValue, mf.realValue)), c: '#1a6b3c' },
          { l: 'Lost to Inflation', v: fmt(Math.max(fd.postTax, rd.postTax, mf.postTax) - Math.max(fd.realValue, rd.realValue, mf.realValue)), c: '#c0392b' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>{s.l}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Erosion warning */}
      {fd.realReturn < 0 && inclInf && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '12px', padding: '14px', marginBottom: '14px', display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: '13px', color: '#c0392b', lineHeight: 1.6 }}>
            <strong>Wealth Erosion Alert</strong><br />
            Your FD delivers {pct(fd.realReturn)}/yr after {tax}% tax &amp; {inf}% inflation. You are losing purchasing power every year.
          </div>
        </div>
      )}

      {/* Cards */}
      {[
        { id: 'fd', col: '#3b82f6', lbl: fdType === 'lumpsum' ? 'Fixed Deposit' : 'FD (Monthly)', d: fd },
        { id: 'rd', col: '#8b5cf6', lbl: 'Recurring Deposit', d: rd },
        { id: 'mf', col: '#1a6b3c', lbl: mfType === 'sip' ? 'Mutual Funds (SIP)' : 'Mutual Funds', d: mf },
      ].map(c => (
        <Card key={c.id} label={c.lbl} col={c.col} d={c.d}
          winner={winner.id === c.id} inclTax={inclTax} inclInf={inclInf} tax={tax} inf={inf} />
      ))}

      {/* Bar chart */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Expected vs Reality</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>Nominal → Post-Tax → Real</div>
        {[
          { l: 'FD', nom: fd.corpus, ptx: fd.postTax, rl: fd.realValue, col: '#3b82f6' },
          { l: 'RD', nom: rd.corpus, ptx: rd.postTax, rl: rd.realValue, col: '#8b5cf6' },
          { l: 'MF', nom: mf.corpus, ptx: mf.postTax, rl: mf.realValue, col: '#1a6b3c' },
        ].map(b => (
          <div key={b.l} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: b.col }}>{b.l}</span>
              <span style={{ fontSize: '11px', color: b.col, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{fmt(b.rl)}</span>
            </div>
            {[
              { val: b.nom, bg: '#e5e7eb', fill: '#9ca3af', lbl: fmt(b.nom) },
              { val: b.ptx, bg: '#fef3dc', fill: '#f59e0b', lbl: fmt(b.ptx) },
              { val: b.rl, bg: `${b.col}18`, fill: b.col, lbl: fmt(b.rl) },
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <div style={{ flex: 1, height: '10px', background: bar.bg, borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(3, (bar.val / maxN) * 100)}%`, background: bar.fill, borderRadius: '999px', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '10px', color: bar.fill, fontFamily: 'DM Mono, monospace', width: '60px', flexShrink: 0, textAlign: 'right' }}>{bar.lbl}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Year table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Year by Year</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['fd', 'rd', 'mf'] as const).map(v => (
              <button key={v} onClick={() => setTView(v)} style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600,
                background: tView === v ? '#e8f5ee' : '#f9fafb',
                border: `1px solid ${tView === v ? '#1a6b3c' : '#e5e7eb'}`,
                color: tView === v ? '#1a6b3c' : '#9ca3af',
              }}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '440px', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                {['Yr', 'Invested', 'Corpus', 'Tax', 'Post-Tax', 'Real', 'Gain'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Yr' ? 'left' : 'right', color: '#9ca3af', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const g = r.realValue - r.invested
                return (
                  <tr key={r.y} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#6b7280' }}>{r.y}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#6b7280' }}>{fmt(r.invested)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#6b7280' }}>{fmt(r.corpus)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#e53e3e' }}>{fmt(r.taxPaid)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#d97706' }}>{fmt(r.postTax)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#1a6b3c', fontWeight: 700 }}>{fmt(r.realValue)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: g >= 0 ? '#1a6b3c' : '#e53e3e', fontWeight: 700 }}>{g >= 0 ? '+' : ''}{fmt(g)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ─ insights content ─
  const InsightsContent = (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{ins.icon}</span>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.7, margin: 0 }} dangerouslySetInnerHTML={{ __html: ins.txt }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#d1d5db', lineHeight: 1.7, textAlign: 'center' }}>
        Fisher Equation used for real returns. FD/RD taxed at income slab. MF: 12.5% LTCG + ₹1.25L exemption (Budget 2024). Not investment advice. Consult a SEBI-registered advisor.
      </p>
    </div>
  )

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>

      {/* ── Global styles ── */}
      <style>{`
        /* Desktop: 2-col layout, no tabs */
        @media (min-width: 768px) {
          .mob-tabs { display: none !important; }
          .mob-content { display: block !important; }
          .desk-layout { display: grid !important; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
          .desk-sidebar { display: block !important; position: sticky; top: 60px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow-y: auto; max-height: calc(100vh - 80px); }
          .desk-results { display: block !important; }
        }
        @media (max-width: 767px) {
          .desk-layout { display: block !important; }
          .desk-sidebar { display: none; }
          .desk-results { display: none; }
          .mob-content[data-active='true'] { display: block !important; }
          .mob-content { display: none; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        height: '52px', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 300,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1a6b3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📊</div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>real<span style={{ color: '#1a6b3c' }}>return</span>.in</span>
        </Link>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ k: 'tax', l: 'Tax', v: inclTax }, { k: 'inf', l: 'Inflation', v: inclInf }].map(t => (
            <button key={t.k}
              onClick={() => t.k === 'tax' ? setInclTax(!inclTax) : setInclInf(!inclInf)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: t.v ? '#e8f5ee' : '#f9fafb',
                border: `1px solid ${t.v ? '#1a6b3c' : '#e5e7eb'}`,
                color: t.v ? '#1a6b3c' : '#9ca3af',
                borderRadius: '999px', padding: '5px 10px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.v ? '#1a6b3c' : '#d1d5db', display: 'inline-block' }} />
              {t.l}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MOBILE TABS ── */}
      <div className="mob-tabs" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 16px', position: 'sticky', top: '52px', zIndex: 200 }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { k: 'inputs', l: '⚙️ Inputs' },
            { k: 'results', l: '📊 Results' },
            { k: 'insights', l: '💡 Insights' },
          ].map(t => (
            <button key={t.k}
              onClick={() => setTab(t.k as any)}
              style={{
                flex: 1, padding: '12px 4px', fontSize: '13px', fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: tab === t.k ? '#1a6b3c' : '#9ca3af',
                borderBottom: tab === t.k ? '2px solid #1a6b3c' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '16px' }}>
        <div className="desk-layout">

          {/* Desktop sidebar */}
          <div className="desk-sidebar">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>Configure</span>
              <span style={{ fontSize: '10px', background: '#e8f5ee', color: '#1a6b3c', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>● Live</span>
            </div>
            {InputsContent}
          </div>

          {/* Desktop results */}
          <div className="desk-results">
            {ResultsContent}
            {InsightsContent}
          </div>

          {/* Mobile: show active tab content */}
          <div className="mob-content" data-active={tab === 'inputs' ? 'true' : 'false'}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>Configure</span>
                <span style={{ fontSize: '10px', background: '#e8f5ee', color: '#1a6b3c', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>● Live</span>
              </div>
              {InputsContent}
            </div>
            {/* After inputs on mobile — show winner summary */}
            <div style={{ marginTop: '12px', background: '#1a6b3c', borderRadius: '14px', padding: '14px 16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Best real return</div>
                <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'DM Mono, monospace' }}>{pct(winner.rr)}/yr</div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>🏆 {winner.name} wins</div>
              </div>
              <button onClick={() => setTab('results')} style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', borderRadius: '10px', padding: '10px 14px',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}>
                See Results →
              </button>
            </div>
          </div>

          <div className="mob-content" data-active={tab === 'results' ? 'true' : 'false'} style={{ marginTop: '4px' }}>
            {ResultsContent}
          </div>

          <div className="mob-content" data-active={tab === 'insights' ? 'true' : 'false'} style={{ marginTop: '4px' }}>
            {InsightsContent}
          </div>

        </div>
      </div>
    </div>
  )
}
