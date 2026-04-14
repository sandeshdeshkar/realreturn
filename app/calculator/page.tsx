'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────
interface Res {
  corpus: number; invested: number; gains: number; taxPaid: number
  postTax: number; realValue: number; realReturn: number
  postTaxRate: number; breakEvenInflation?: number
}
interface Goal { id: string; name: string; amount: number; years: number }

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number, short = false) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(short ? 1 : 2) + 'Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(short ? 1 : 2) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}
const pct = (n: number) => (!isFinite(n) || isNaN(n)) ? '0%' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
const fisher = (nom: number, inf: number) => ((1 + nom / 100) / (1 + inf / 100) - 1) * 100
const rrCol = (v: number) => v > 0.5 ? '#16a34a' : v < 0 ? '#dc2626' : '#d97706'
const rrMsg = (v: number) => v > 3 ? 'Growing your real wealth steadily' : v > 0.5 ? 'Barely beating inflation' : v < 0 ? 'Losing purchasing power every year' : 'Almost flat after inflation'

// ─── Reusable components ─────────────────────────────────────

function Pill({ label, active, onClick, col = '#1a6b3c' }: { label: string; active?: boolean; onClick: () => void; col?: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
      border: `1.5px solid ${active ? col : '#e5e7eb'}`,
      background: active ? col : '#fff',
      color: active ? '#fff' : '#6b7280',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function Slider({ label, val, set, min, max, step, disp, note, col = '#1a6b3c' }: {
  label: string; val: number; set: (v: number) => void
  min: number; max: number; step: number; disp: string; note?: string; col?: string
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'DM Mono, monospace', background: '#f3f4f6', padding: '2px 10px', borderRadius: '6px' }}>{disp}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ width: '100%', height: '6px', accentColor: col, cursor: 'pointer' }} />
      {note && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0' }}>{note}</p>}
    </div>
  )
}

function Seg({ opts, val, set, col }: { opts: { v: string; l: string }[]; val: string; set: (v: string) => void; col: string }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${col}40`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => set(o.v)} style={{
          flex: 1, padding: '10px 4px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
          background: val === o.v ? col : '#f9fafb', color: val === o.v ? '#fff' : '#6b7280', transition: 'all 0.15s',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

function SecLabel({ col, txt }: { col: string; txt: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '22px 0 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#9ca3af' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: col, display: 'inline-block' }} />{txt}
    </div>
  )
}

function ScoreBar({ label, score, col }: { label: string; score: number; col: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: col }}>{score}/100</span>
      </div>
      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: col, borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Main Calculator ─────────────────────────────────────────
export default function Calculator() {
  // Main tab
  const [mainTab, setMainTab] = useState<'calc' | 'planner'>('calc')
  // Calc sub-tab (mobile)
  const [tab, setTab] = useState<'inputs' | 'results' | 'insights'>('inputs')

  // ── Calculator Inputs ──
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

  // ── Life Planner Inputs ──
  const [age, setAge] = useState(30)
  const [income, setIncome] = useState(80000)
  const [expenses, setExpenses] = useState(50000)
  const [savings, setSavings] = useState(200000)
  const [monthlyInvest, setMonthlyInvest] = useState(15000)
  const [hasLife, setHasLife] = useState(false)
  const [lifeCover, setLifeCover] = useState(5000000)
  const [hasHealth, setHasHealth] = useState(false)
  const [healthCover, setHealthCover] = useState(500000)
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', name: 'Retirement', amount: 10000000, years: 30 },
    { id: '2', name: 'Child Education', amount: 3000000, years: 15 },
  ])

  // Quick Start presets
  const applyPreset = (preset: 'sip5k' | 'sip10k' | 'lump1l') => {
    if (preset === 'sip5k') { setMfType('sip'); setMfSip(5000); setFdType('monthly'); setFdMo(5000); setRdAmt(5000); }
    if (preset === 'sip10k') { setMfType('sip'); setMfSip(10000); setFdType('monthly'); setFdMo(10000); setRdAmt(10000); }
    if (preset === 'lump1l') { setMfType('lumpsum'); setMfLs(100000); setFdType('lumpsum'); setFdLs(100000); }
    setTab('results')
  }

  // What If buttons
  const whatIf = (action: 'inflUp' | 'mfDown' | 'yearsUp') => {
    if (action === 'inflUp') setInf(Math.min(12, inf + 1))
    if (action === 'mfDown') setMfRate(Math.max(6, mfRate - 2))
    if (action === 'yearsUp') setYears(Math.min(40, years + 5))
  }

  // ── Calculations ──
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
      realReturn: fisher(postTaxRate, inclInf ? inf : 0), realValue: postTax / Math.pow(1 + iR, y) }
  }, [fdType, fdLs, fdMo, fdRate, years, tax, inf, inclTax, inclInf])

  const calcRD = useCallback((y = years): Res => {
    const mr = (rdRate / 100) / 12, n = y * 12, tR = inclTax ? tax / 100 : 0, iR = inclInf ? inf / 100 : 0
    let corpus = 0
    for (let i = 1; i <= n; i++) corpus += rdAmt * Math.pow(1 + mr, i)
    const invested = rdAmt * n, gains = corpus - invested, taxPaid = gains * tR, postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - tR)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0), realValue: postTax / Math.pow(1 + iR, y) }
  }, [rdAmt, rdRate, years, tax, inf, inclTax, inclInf])

  const calcMF = useCallback((y = years): Res => {
    const r = mfRate / 100, iR = inclInf ? inf / 100 : 0
    let corpus: number, invested: number
    if (mfType === 'sip') {
      const mr = r / 12, n = y * 12
      corpus = mfSip * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr); invested = mfSip * n
    } else { invested = mfLs; corpus = invested * Math.pow(1 + r, y) }
    const gains = corpus - invested, txble = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = txble * 0.125, postTax = corpus - taxPaid
    const effTax = gains > 0 ? taxPaid / gains : 0, postTaxRate = mfRate * (1 - effTax)
    return { corpus, invested, gains, taxPaid, postTax, postTaxRate,
      realReturn: fisher(postTaxRate, inclInf ? inf : 0), realValue: postTax / Math.pow(1 + iR, y) }
  }, [mfType, mfSip, mfLs, mfRate, years, tax, inf, inclTax, inclInf])

  const fd = calcFD(), rd = calcRD(), mf = calcMF()
  const cards = [
    { id: 'fd', lbl: fdType === 'lumpsum' ? 'Fixed Deposit' : 'FD Monthly', col: '#3b82f6', d: fd },
    { id: 'rd', lbl: 'Recurring Deposit', col: '#8b5cf6', d: rd },
    { id: 'mf', lbl: mfType === 'sip' ? 'Mutual Funds (SIP)' : 'Mutual Funds', col: '#16a34a', d: mf },
  ].sort((a, b) => b.d.realReturn - a.d.realReturn)
  const winner = cards[0]

  let be: number | null = null
  for (let y = 1; y <= 40; y++) { if (calcMF(y).realValue > calcFD(y).realValue) { be = y; break } }

  const rows = Array.from({ length: years }, (_, i) => {
    const y = i + 1
    const d = tView === 'fd' ? calcFD(y) : tView === 'rd' ? calcRD(y) : calcMF(y)
    return { y, ...d }
  })
  const maxN = Math.max(fd.corpus, rd.corpus, mf.corpus)

  // ── Life Planner Calcs ──
  const surplus = income - expenses
  const savingsRate = income > 0 ? Math.round(monthlyInvest / income * 100) : 0
  const recommendedLife = income * 12 * 10
  const lifeGap = hasLife ? Math.max(0, recommendedLife - lifeCover) : recommendedLife
  const recommendedHealth = income * 12 * 0.5
  const healthGap = hasHealth ? Math.max(0, recommendedHealth - healthCover) : recommendedHealth

  const goalProjections = goals.map(g => {
    const r = 0.12 / 12, n = g.years * 12
    const corpusAtGoal = monthlyInvest > 0
      ? monthlyInvest * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
      : savings * Math.pow(1.12, g.years)
    const gap = Math.max(0, g.amount - corpusAtGoal)
    const sipNeeded = gap > 0 ? gap * (r / (Math.pow(1 + r, n) - 1)) : 0
    return { ...g, corpusAtGoal, gap, sipNeeded }
  })

  const wealthScore = Math.min(100, Math.round(savingsRate * 2.5 + (mfRate > 10 ? 20 : 10) + (years > 10 ? 20 : 10)))
  const protScore = Math.min(100, Math.round((hasLife ? 40 : 0) + (hasHealth ? 40 : 0) + (lifeGap < recommendedLife * 0.3 ? 20 : 0)))
  const stabScore = Math.min(100, Math.round((surplus > 0 ? 40 : 0) + (savingsRate > 20 ? 30 : savingsRate) + (savings > income * 3 ? 30 : 15)))

  const insights = [
    mf.realReturn > 2 && { icon: '🚀', txt: `SIP at ${mfRate}% CAGR delivers <strong>${pct(mf.realReturn)}/yr</strong> real return — purchasing power genuinely grows every year.` },
    fd.realReturn < 0 && { icon: '⚠️', txt: `FD is losing purchasing power at <strong>${pct(fd.realReturn)}/yr</strong>. Your balance grows but each rupee buys less.` },
    fd.realReturn >= 0 && fd.realReturn < 1.5 && { icon: '😐', txt: `FD real return is just <strong>${pct(fd.realReturn)}/yr</strong>. That's ${(mf.realReturn - fd.realReturn).toFixed(1)}pp below SIP — a gap that compounds over ${years} years.` },
    be !== null && years >= be && { icon: '✅', txt: `SIP overtook FD at <strong>Year ${be}</strong>. You're ${years - be} years past the crossover — <strong>${fmt(mf.realValue - fd.realValue)}</strong> extra real wealth.` },
    be !== null && years < be && { icon: '⏱️', txt: `SIP overtakes FD at <strong>Year ${be}</strong>. ${be - years} more year${be - years !== 1 ? 's' : ''} to the crossover — stay invested.` },
    years <= 3 && { icon: '🛡️', txt: `Short ${years}-year horizon: equity MFs carry volatility risk. FD/RD offer more predictable returns here.` },
    years >= 15 && { icon: '⚡', txt: `${years}-year horizon is powerful. At ${mfRate}%, every ₹1 becomes <strong>₹${(Math.pow(1 + mfRate / 100, years)).toFixed(1)}</strong>.` },
    inclInf && { icon: '📊', txt: `At ${inf}% inflation, purchasing power halves every <strong>${(72 / inf).toFixed(0)} years</strong>. Any investment below ${inf}% post-tax shrinks your real wealth.` },
  ].filter(Boolean) as { icon: string; txt: string }[]

  // ── Input panel shared ──
  const InputPanel = (
    <div>
      {/* Quick Start */}
      <div style={{ padding: '14px 16px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>⚡ Quick Start</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Pill label="₹5K/month" onClick={() => applyPreset('sip5k')} />
          <Pill label="₹10K/month" onClick={() => applyPreset('sip10k')} />
          <Pill label="₹1L lump sum" onClick={() => applyPreset('lump1l')} />
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <SecLabel col="#f59e0b" txt="General" />
        {/* Duration with snap points */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Duration</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'DM Mono, monospace', background: '#f3f4f6', padding: '2px 10px', borderRadius: '6px' }}>{years} yrs</span>
          </div>
          <input type="range" min={1} max={40} step={1} value={years} onChange={e => setYears(+e.target.value)}
            style={{ width: '100%', height: '6px', accentColor: '#1a6b3c', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {[5, 10, 15, 20, 30].map(y => (
              <button key={y} onClick={() => setYears(y)} style={{
                fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                background: years === y ? '#1a6b3c' : '#f3f4f6',
                color: years === y ? '#fff' : '#9ca3af', border: 'none', cursor: 'pointer',
              }}>{y}Y</button>
            ))}
          </div>
        </div>
        <Slider label="Tax Slab" val={tax} set={setTax} min={0} max={42} step={5} disp={`${tax}%`} />
        <Slider label="Inflation" val={inf} set={setInf} min={3} max={12} step={0.5} disp={`${inf}%`} />

        <SecLabel col="#3b82f6" txt="Fixed Deposit" />
        <Seg opts={[{ v: 'lumpsum', l: 'Lump Sum' }, { v: 'monthly', l: 'Monthly' }]} val={fdType} set={v => setFdType(v as any)} col="#3b82f6" />
        {fdType === 'lumpsum'
          ? <Slider label="Amount" val={fdLs} set={setFdLs} min={10000} max={5000000} step={10000} disp={fmt(fdLs)} col="#3b82f6" />
          : <Slider label="Monthly Deposit" val={fdMo} set={setFdMo} min={500} max={200000} step={500} disp={`${fmt(fdMo)}/mo`} col="#3b82f6" />}
        <Slider label="Interest Rate" val={fdRate} set={setFdRate} min={4} max={10} step={0.25} disp={`${fdRate}%`} col="#3b82f6" />

        <SecLabel col="#8b5cf6" txt="Recurring Deposit" />
        <Slider label="Monthly Amount" val={rdAmt} set={setRdAmt} min={500} max={200000} step={500} disp={`${fmt(rdAmt)}/mo`} col="#8b5cf6" />
        <Slider label="Interest Rate" val={rdRate} set={setRdRate} min={4} max={9} step={0.25} disp={`${rdRate}%`} col="#8b5cf6" />

        <SecLabel col="#16a34a" txt="Mutual Funds" />
        <Seg opts={[{ v: 'sip', l: 'SIP Monthly' }, { v: 'lumpsum', l: 'Lump Sum' }]} val={mfType} set={v => setMfType(v as any)} col="#16a34a" />
        {mfType === 'sip'
          ? <Slider label="Monthly SIP" val={mfSip} set={setMfSip} min={500} max={200000} step={500} disp={`${fmt(mfSip)}/mo`} col="#16a34a" />
          : <Slider label="Amount" val={mfLs} set={setMfLs} min={10000} max={5000000} step={10000} disp={fmt(mfLs)} col="#16a34a" />}
        <Slider label="Expected CAGR" val={mfRate} set={setMfRate} min={6} max={18} step={0.5} disp={`${mfRate}%`} note="Nifty 50 historical: ~12% CAGR" col="#16a34a" />

        {/* What If buttons */}
        <div style={{ marginTop: '4px', padding: '14px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>🤔 What If...</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => whatIf('inflUp')} style={{ padding: '9px 12px', background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
              📈 Inflation goes up 1% → {inf + 1}%
            </button>
            <button onClick={() => whatIf('mfDown')} style={{ padding: '9px 12px', background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
              📉 SIP returns drop 2% → {mfRate - 2}%
            </button>
            <button onClick={() => whatIf('yearsUp')} style={{ padding: '9px 12px', background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
              ⏩ Stay invested 5 more years → {years + 5}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Results panel ──
  const ResultsPanel = (
    <div>
      {/* DECISION OUTPUT — most prominent */}
      <div style={{ background: winner.col, borderRadius: '16px', padding: '20px', marginBottom: '14px', color: '#fff' }}>
        <div style={{ fontSize: '11px', opacity: 0.75, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Best option for {years} years
        </div>
        <div style={{ fontSize: '42px', fontWeight: 900, fontFamily: 'DM Mono, monospace', letterSpacing: '-2px', lineHeight: 1 }}>
          {pct(winner.d.realReturn)}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '6px', opacity: 0.9 }}>🏆 {winner.lbl}</div>
        <div style={{ fontSize: '13px', opacity: 0.75, marginTop: '2px' }}>{rrMsg(winner.d.realReturn)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.65 }}>You invest</div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{fmt(winner.d.invested)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', opacity: 0.65 }}>Nominal value</div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{fmt(winner.d.corpus)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', opacity: 0.65 }}>Real value</div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{fmt(winner.d.realValue)}</div>
          </div>
        </div>
      </div>

      {/* Break-even insight */}
      {be !== null && (
        <div style={{ background: years >= be ? '#f0fdf4' : '#fffbeb', border: `1px solid ${years >= be ? '#bbf7d0' : '#fde68a'}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>{years >= be ? '✅' : '⏱️'}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: years >= be ? '#16a34a' : '#d97706' }}>
              SIP beats FD at Year {be}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {years >= be
                ? `You're ${years - be} years past the crossover — ${fmt(mf.realValue - fd.realValue)} extra real wealth`
                : `${be - years} more year${be - years !== 1 ? 's' : ''} to go. Stay invested.`}
            </div>
          </div>
        </div>
      )}

      {/* 3 KEY BLOCKS */}
      {cards.map((c, i) => {
        const rr = inclInf ? c.d.realReturn : c.d.postTaxRate
        const isWinner = i === 0
        return (
          <div key={c.id} style={{
            background: '#fff', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px',
            border: isWinner ? `2px solid ${c.col}` : '1px solid #e5e7eb',
            boxShadow: isWinner ? `0 0 0 4px ${c.col}15` : '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ height: '3px', background: c.col }} />
            {isWinner && (
              <div style={{ background: c.col, color: '#fff', textAlign: 'center', fontSize: '10px', fontWeight: 700, padding: '3px', letterSpacing: '0.8px' }}>BEST REAL RETURN</div>
            )}
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: c.col, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{c.lbl}</div>

              {/* Block 1: Reality */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'DM Mono, monospace', color: rrCol(rr), letterSpacing: '-1.5px', lineHeight: 1 }}>{pct(rr)}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{rrMsg(rr)}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {inclInf && inclTax ? `after ${tax}% tax & ${inf}% inflation` : inclTax ? `after ${tax}% tax` : inclInf ? `after ${inf}% inflation` : 'no adjustments'}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f3f4f6', margin: '12px 0' }} />

              {/* Block 2: Real Value */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>What you see vs what it's worth</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1, height: '10px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: '#d1d5db', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: '#6b7280', width: '72px', textAlign: 'right' }}>{fmt(c.d.corpus, true)} <span style={{ color: '#9ca3af', fontSize: '10px' }}>nominal</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1, height: '10px', background: '#fef3c7', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.d.postTax / c.d.corpus) * 100}%`, background: '#f59e0b', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: '#d97706', width: '72px', textAlign: 'right' }}>{fmt(c.d.postTax, true)} <span style={{ color: '#9ca3af', fontSize: '10px' }}>post-tax</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '10px', background: `${c.col}18`, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.d.realValue / c.d.corpus) * 100}%`, background: c.col, borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: c.col, width: '72px', textAlign: 'right', fontWeight: 700 }}>{fmt(c.d.realValue, true)} <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 400 }}>real</span></div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#f3f4f6', margin: '12px 0' }} />

              {/* Block 3: Loss */}
              <div style={{ background: '#fff5f5', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>You lost to</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#f87171' }}>🧾 Tax</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#dc2626' }}>{fmt(c.d.taxPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#f87171' }}>📉 Inflation</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#dc2626' }}>{inclInf ? fmt(c.d.postTax - c.d.realValue) : '—'}</span>
                </div>
                {c.d.breakEvenInflation !== undefined && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fecaca', fontSize: '11px', color: '#d97706' }}>
                    FD positive above <strong>{c.d.breakEvenInflation.toFixed(1)}%</strong> inflation
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* FD vs RD vs MF comparison bars */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Expected vs Reality</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>What you see → What you get → What it's worth</div>
        {[
          { l: 'FD', d: fd, col: '#3b82f6' },
          { l: 'RD', d: rd, col: '#8b5cf6' },
          { l: 'MF', d: mf, col: '#16a34a' },
        ].map(b => (
          <div key={b.l} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: b.col }}>{b.l}</span>
              <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: rrCol(b.d.realReturn), fontWeight: 700 }}>{pct(b.d.realReturn)} real</span>
            </div>
            {[
              { v: b.d.corpus, bg: '#e5e7eb', fill: '#9ca3af', lbl: 'Nominal' },
              { v: b.d.postTax, bg: '#fef3c7', fill: '#f59e0b', lbl: 'Post-Tax' },
              { v: b.d.realValue, bg: `${b.col}15`, fill: b.col, lbl: 'Real' },
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', width: '52px', flexShrink: 0 }}>{bar.lbl}</span>
                <div style={{ flex: 1, height: '10px', background: bar.bg, borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(3, (bar.v / maxN) * 100)}%`, background: bar.fill, borderRadius: '999px', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: bar.fill, width: '58px', textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{fmt(bar.v, true)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Year table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Year by Year</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['fd', 'rd', 'mf'] as const).map(v => (
              <button key={v} onClick={() => setTView(v)} style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600,
                background: tView === v ? '#e8f5ee' : '#f9fafb',
                border: `1px solid ${tView === v ? '#16a34a' : '#e5e7eb'}`,
                color: tView === v ? '#16a34a' : '#9ca3af',
              }}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px', fontSize: '11px' }}>
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
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#dc2626' }}>{fmt(r.taxPaid)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#d97706' }}>{fmt(r.postTax)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#16a34a', fontWeight: 700 }}>{fmt(r.realValue)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: g >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{g >= 0 ? '+' : ''}{fmt(g)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ── Insights panel ──
  const InsightsPanel = (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{ins.icon}</span>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.7, margin: 0 }} dangerouslySetInnerHTML={{ __html: ins.txt }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#d1d5db', lineHeight: 1.7, textAlign: 'center' }}>
        Fisher Equation for real returns · FD/RD taxed at slab rate · MF: 12.5% LTCG + ₹1.25L exemption (Budget 2024) · Not investment advice
      </p>
    </div>
  )

  // ── Life Planner panel ──
  const PlannerPanel = (
    <div style={{ padding: '16px' }}>

      {/* Scores */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>📊 Your Financial Scores</div>
        <ScoreBar label="Wealth Score" score={wealthScore} col="#16a34a" />
        <ScoreBar label="Protection Score" score={protScore} col="#3b82f6" />
        <ScoreBar label="Stability Score" score={stabScore} col="#8b5cf6" />
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Based on your savings rate, insurance, and investment habits</div>
      </div>

      {/* Inputs */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>👤 Your Profile</div>
        <Slider label="Age" val={age} set={setAge} min={22} max={60} step={1} disp={`${age} yrs`} />
        <Slider label="Monthly Income" val={income} set={setIncome} min={20000} max={500000} step={5000} disp={fmt(income)} />
        <Slider label="Monthly Expenses" val={expenses} set={setExpenses} min={10000} max={400000} step={5000} disp={fmt(expenses)} />
        <Slider label="Total Savings" val={savings} set={setSavings} min={0} max={5000000} step={10000} disp={fmt(savings)} />
        <Slider label="Monthly Investment" val={monthlyInvest} set={setMonthlyInvest} min={0} max={200000} step={1000} disp={fmt(monthlyInvest)} />

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f3f4f6', marginTop: '4px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Monthly surplus</span>
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: surplus > 0 ? '#16a34a' : '#dc2626' }}>{surplus > 0 ? '+' : ''}{fmt(surplus)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Savings rate</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: savingsRate >= 20 ? '#16a34a' : '#d97706' }}>{savingsRate}%</span>
        </div>
      </div>

      {/* Insurance */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>🛡️ Insurance</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Life Insurance</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Recommended: {fmt(recommendedLife)}</div>
          </div>
          <button onClick={() => setHasLife(!hasLife)} style={{
            padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: hasLife ? '#dcfce7' : '#fee2e2', color: hasLife ? '#16a34a' : '#dc2626',
          }}>{hasLife ? '✓ Have it' : '✗ None'}</button>
        </div>
        {hasLife && <Slider label="Cover Amount" val={lifeCover} set={setLifeCover} min={500000} max={50000000} step={500000} disp={fmt(lifeCover)} col="#3b82f6" />}
        {lifeGap > 0 && (
          <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#dc2626', marginBottom: '12px' }}>
            ⚠️ Underinsured by <strong>{fmt(lifeGap)}</strong>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Health Insurance</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Recommended: {fmt(recommendedHealth)}</div>
          </div>
          <button onClick={() => setHasHealth(!hasHealth)} style={{
            padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: hasHealth ? '#dcfce7' : '#fee2e2', color: hasHealth ? '#16a34a' : '#dc2626',
          }}>{hasHealth ? '✓ Have it' : '✗ None'}</button>
        </div>
        {hasHealth && <Slider label="Cover Amount" val={healthCover} set={setHealthCover} min={100000} max={5000000} step={100000} disp={fmt(healthCover)} col="#3b82f6" />}
        {healthGap > 0 && (
          <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#dc2626' }}>
            ⚠️ Underinsured by <strong>{fmt(healthGap)}</strong>
          </div>
        )}
      </div>

      {/* Goals */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>🎯 Goal Tracker</div>
        {goalProjections.map(g => (
          <div key={g.id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{g.name}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{g.years} years</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Target</span>
              <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', fontWeight: 600, color: '#374151' }}>{fmt(g.amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>On track for</span>
              <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', fontWeight: 600, color: g.gap === 0 ? '#16a34a' : '#d97706' }}>{fmt(g.corpusAtGoal)}</span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (g.corpusAtGoal / g.amount) * 100)}%`, background: g.gap === 0 ? '#16a34a' : '#f59e0b', borderRadius: '999px' }} />
            </div>
            {g.gap > 0 ? (
              <div style={{ fontSize: '12px', color: '#dc2626' }}>
                Short by <strong>{fmt(g.gap)}</strong> — need <strong>{fmt(g.sipNeeded)}/mo</strong> extra SIP
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#16a34a' }}>✓ On track to meet this goal</div>
            )}
          </div>
        ))}
      </div>

      {/* Action plan */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginBottom: '12px' }}>✅ Action Plan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savingsRate < 20 && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
              📈 Increase monthly SIP by <strong>{fmt(Math.round((income * 0.2 - monthlyInvest) / 1000) * 1000)}</strong> to hit 20% savings rate
            </div>
          )}
          {lifeGap > 0 && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
              🛡️ Add <strong>{fmt(lifeGap)}</strong> life cover — term plan costs ~₹{Math.round(lifeGap / 1000000 * 800)}/month
            </div>
          )}
          {healthGap > 0 && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
              🏥 Add <strong>{fmt(healthGap)}</strong> health cover — family floater ~₹8,000–15,000/year
            </div>
          )}
          {goalProjections.some(g => g.gap > 0) && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
              🎯 Increase SIP by <strong>{fmt(Math.round(goalProjections.reduce((s, g) => s + g.sipNeeded, 0)))}/month</strong> to close all goal gaps
            </div>
          )}
          {savingsRate >= 20 && !lifeGap && !healthGap && goalProjections.every(g => g.gap === 0) && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#16a34a' }}>
              🎉 You&apos;re in great financial shape! Keep investing consistently.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <style>{`
        @media (min-width: 768px) {
          .mob-tabs { display: none !important; }
          .mob-panel { display: block !important; }
          .desk-layout { display: grid !important; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
          .desk-sidebar { display: block !important; }
          .desk-main { display: block !important; }
          .mob-panel-inputs, .mob-panel-results, .mob-panel-insights { display: none !important; }
        }
        @media (max-width: 767px) {
          .desk-layout { display: block !important; }
          .desk-sidebar { display: none !important; }
          .desk-main { display: none !important; }
        }
        input[type='range']::-webkit-slider-thumb { width: 22px; height: 22px; }
        input[type='range']::-moz-range-thumb { width: 22px; height: 22px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', height: '52px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 300 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1a6b3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📊</div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>real<span style={{ color: '#1a6b3c' }}>return</span>.in</span>
        </Link>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ k: 'tax', l: 'Tax', v: inclTax }, { k: 'inf', l: 'Inflation', v: inclInf }].map(t => (
            <button key={t.k} onClick={() => t.k === 'tax' ? setInclTax(!inclTax) : setInclInf(!inclInf)} style={{
              display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '999px', padding: '5px 10px',
              background: t.v ? '#e8f5ee' : '#f9fafb', border: `1px solid ${t.v ? '#16a34a' : '#e5e7eb'}`,
              color: t.v ? '#16a34a' : '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.v ? '#16a34a' : '#d1d5db', display: 'inline-block' }} />{t.l}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN TAB SWITCHER ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 16px', position: 'sticky', top: '52px', zIndex: 200 }}>
        <div style={{ display: 'flex', gap: '0', maxWidth: '500px' }}>
          {[
            { k: 'calc', l: '📊 Calculator' },
            { k: 'planner', l: '🎯 Life Planner' },
          ].map(t => (
            <button key={t.k} onClick={() => setMainTab(t.k as any)} style={{
              flex: 1, padding: '13px 4px', fontSize: '13px', fontWeight: 700,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: mainTab === t.k ? '#1a6b3c' : '#9ca3af',
              borderBottom: mainTab === t.k ? '2px solid #1a6b3c' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ── CALCULATOR ── */}
      {mainTab === 'calc' && (
        <>
          {/* Mobile sub-tabs */}
          <div className="mob-tabs" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 16px', position: 'sticky', top: '104px', zIndex: 190 }}>
            <div style={{ display: 'flex' }}>
              {[{ k: 'inputs', l: '⚙️ Inputs' }, { k: 'results', l: '📊 Results' }, { k: 'insights', l: '💡 Insights' }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k as any)} style={{
                  flex: 1, padding: '12px 4px', fontSize: '13px', fontWeight: 600,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: tab === t.k ? '#1a6b3c' : '#9ca3af',
                  borderBottom: tab === t.k ? '2px solid #1a6b3c' : '2px solid transparent',
                }}>{t.l}</button>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '16px' }}>
            {/* Desktop 2-col */}
            <div className="desk-layout" style={{ display: 'block' }}>
              <div className="desk-sidebar" style={{ display: 'none', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', position: 'sticky', top: '110px', maxHeight: 'calc(100vh - 130px)', overflowY: 'auto' }}>
                {InputPanel}
              </div>
              <div className="desk-main" style={{ display: 'none' }}>
                {ResultsPanel}
                {InsightsPanel}
              </div>
            </div>

            {/* Mobile tab content */}
            {tab === 'inputs' && (
              <div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
                  {InputPanel}
                </div>
                {/* Winner preview on inputs tab */}
                <div style={{ background: winner.col, borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Best real return</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'DM Mono, monospace', color: '#fff' }}>{pct(winner.d.realReturn)}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>🏆 {winner.lbl}</div>
                  </div>
                  <button onClick={() => setTab('results')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    See Results →
                  </button>
                </div>
              </div>
            )}
            {tab === 'results' && ResultsPanel}
            {tab === 'insights' && InsightsPanel}
          </div>
        </>
      )}

      {/* ── LIFE PLANNER ── */}
      {mainTab === 'planner' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
          {PlannerPanel}
        </div>
      )}
    </div>
  )
}
