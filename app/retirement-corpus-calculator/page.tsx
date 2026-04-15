'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(1) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}
const fmtShort = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(1) + 'Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(0) + 'L'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}

// FV of lump sum: P*(1+r)^n
const fvLump = (p: number, rPct: number, n: number) =>
  p * Math.pow(1 + rPct / 100, n)

// FV of monthly SIP: PMT * ((1+r)^n - 1) / r  — monthly compounding
const fvSip = (pmt: number, annualPct: number, months: number) => {
  const r = annualPct / 100 / 12
  if (r === 0) return pmt * months
  return pmt * (Math.pow(1 + r, months) - 1) / r
}

// Corpus needed using 4% withdrawal rule adjusted for inflation
const corpusNeeded = (monthlyExpense: number, yearsToRetire: number, inflationPct: number, retirementYears: number) => {
  const futureMonthly = monthlyExpense * Math.pow(1 + inflationPct / 100, yearsToRetire)
  const annualExpense = futureMonthly * 12
  // 4% rule: corpus = annual expense / 0.04
  // But also factor inflation during retirement — use safer 3.5% for India
  return annualExpense / 0.035
}

// How long corpus lasts
const corpusRunsOutAge = (corpus: number, monthlyExpenseAtRetire: number, retireAge: number, inflationPct: number, returnPct: number) => {
  let bal = corpus
  let monthly = monthlyExpenseAtRetire
  let age = retireAge
  while (bal > 0 && age < 120) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + returnPct / 100 / 12) - monthly
      if (bal <= 0) return age
    }
    monthly *= (1 + inflationPct / 100)
    age++
  }
  return age
}

// ─── Nav ────────────────────────────────────────────────────────
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Calculator</Link>
        <Link href="/personal-financial-planner" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Financial Plan</Link>
      </div>
    </nav>
  )
}

// ─── Slider ─────────────────────────────────────────────────────
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
      {hint && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

// ─── Asset Input Row ────────────────────────────────────────────
function AssetRow({ dot, name, rate, now, future }: {
  dot: string; name: string; rate: string; now: string; future: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0, marginTop: '5px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{rate}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', fontFamily: 'DM Mono, monospace' }}>{now}</div>
        <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>{future}</div>
      </div>
    </div>
  )
}

// ─── Breakdown Row ──────────────────────────────────────────────
function BreakRow({ dot, name, now, future, isTot }: {
  dot: string; name: string; now: string; future: string; isTot?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: isTot ? '10px 0 2px' : '7px 0',
      borderTop: isTot ? '1.5px solid #e2e8f0' : undefined,
      borderBottom: isTot ? 'none' : '1px solid #f8fafc',
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '12px', color: isTot ? '#0f172a' : '#64748b', fontWeight: isTot ? 700 : 400 }}>{name}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'DM Mono, monospace', width: '48px', textAlign: 'right' }}>{now}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }}>→</div>
      <div style={{ fontSize: '12px', fontWeight: isTot ? 700 : 500, color: isTot ? '#16a34a' : '#0f172a', fontFamily: 'DM Mono, monospace', width: '56px', textAlign: 'right' }}>{future}</div>
    </div>
  )
}

// ─── Section Label ──────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '18px 0 10px' }}>
      {children}
    </div>
  )
}

// ─── Step indicator ─────────────────────────────────────────────
function Steps({ step }: { step: number }) {
  const steps = ['Your assets', 'Gap analysis', 'Close the gap']
  return (
    <div style={{ display: 'flex', gap: '0', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: '10px 4px', textAlign: 'center',
          fontSize: '11px', fontWeight: 600,
          color: i === step ? '#1a6b3c' : '#94a3b8',
          borderBottom: `2px solid ${i === step ? '#1a6b3c' : 'transparent'}`,
        }}>
          {i + 1}. {s}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────
export default function RetirementPage() {
  const [step, setStep] = useState(0)

  // Inputs — current assets
  const [fdAmt, setFdAmt] = useState(3000000)
  const [epfAmt, setEpfAmt] = useState(1650000)
  const [equityAmt, setEquityAmt] = useState(3200000)
  const [goldAmt, setGoldAmt] = useState(150000)
  const [cryptoAmt, setCryptoAmt] = useState(250000)

  // SIPs
  const [equitySip, setEquitySip] = useState(100000)
  const [goldSip, setGoldSip] = useState(10000)
  const [cryptoSip, setCryptoSip] = useState(15000)

  // Profile
  const [currentAge, setCurrentAge] = useState(44)
  const [retireAge, setRetireAge] = useState(55)
  const [monthlyExpense, setMonthlyExpense] = useState(250000)
  const [inflation, setInflation] = useState(6)

  // Growth rates (editable)
  const [fdRate, setFdRate] = useState(7)
  const [epfRate] = useState(8.1)
  const [equityRate, setEquityRate] = useState(12)
  const [goldRate, setGoldRate] = useState(8)
  const [cryptoRate, setCryptoRate] = useState(15)

  // Lever state
  const [leverSip, setLeverSip] = useState(100000)
  const [leverRetireAge, setLeverRetireAge] = useState(55)
  const [leverExpense, setLeverExpense] = useState(250000)

  const years = Math.max(retireAge - currentAge, 1)
  const months = years * 12

  // Compute projected corpus
  const corpus = useMemo(() => {
    const lump =
      fvLump(fdAmt, fdRate, years) +
      fvLump(epfAmt, epfRate, years) +
      fvLump(equityAmt, equityRate, years) +
      fvLump(goldAmt, goldRate, years) +
      fvLump(cryptoAmt, cryptoRate, years)
    const sips =
      fvSip(equitySip, equityRate, months) +
      fvSip(goldSip, goldRate, months) +
      fvSip(cryptoSip, cryptoRate, months)
    return lump + sips
  }, [fdAmt, epfAmt, equityAmt, goldAmt, cryptoAmt, equitySip, goldSip, cryptoSip, fdRate, equityRate, goldRate, cryptoRate, years, months, epfRate])

  const needed = useMemo(() =>
    corpusNeeded(monthlyExpense, years, inflation, 30),
    [monthlyExpense, years, inflation])

  const gap = needed - corpus
  const pct = Math.min((corpus / needed) * 100, 100)

  // Age money runs out
  const expenseAtRetire = monthlyExpense * Math.pow(1 + inflation / 100, years)
  const runsOut = corpusRunsOutAge(corpus, expenseAtRetire, retireAge, inflation, 7)

  // Breakdown
  const fdFv = fvLump(fdAmt, fdRate, years)
  const epfFv = fvLump(epfAmt, epfRate, years)
  const equityFv = fvLump(equityAmt, equityRate, years)
  const goldFv = fvLump(goldAmt, goldRate, years)
  const cryptoFv = fvLump(cryptoAmt, cryptoRate, years)
  const eqSipFv = fvSip(equitySip, equityRate, months)
  const gSipFv = fvSip(goldSip, goldRate, months)
  const cSipFv = fvSip(cryptoSip, cryptoRate, months)

  // Lever calculations
  const leverYears = Math.max(leverRetireAge - currentAge, 1)
  const leverMonths = leverYears * 12
  const leverCorpus = useMemo(() => {
    const lump =
      fvLump(fdAmt, fdRate, leverYears) +
      fvLump(epfAmt, epfRate, leverYears) +
      fvLump(equityAmt, equityRate, leverYears) +
      fvLump(goldAmt, goldRate, leverYears) +
      fvLump(cryptoAmt, cryptoRate, leverYears)
    const sips =
      fvSip(leverSip, equityRate, leverMonths) +
      fvSip(goldSip, goldRate, leverMonths) +
      fvSip(cryptoSip, cryptoRate, leverMonths)
    return lump + sips
  }, [fdAmt, epfAmt, equityAmt, goldAmt, cryptoAmt, leverSip, goldSip, cryptoSip, fdRate, equityRate, goldRate, cryptoRate, leverYears, leverMonths, epfRate])

  const leverNeeded = corpusNeeded(leverExpense, leverYears, inflation, 30)
  const leverGap = leverNeeded - leverCorpus
  const leverClosed = gap - leverGap

  const card = (children: React.ReactNode, red = false) => (
    <div style={{
      background: red ? '#fcebeb' : '#fff',
      border: `1px solid ${red ? '#fca5a5' : '#f1f5f9'}`,
      borderRadius: '12px', padding: '16px', marginBottom: '14px',
    }}>{children}</div>
  )

  const calcRow = (label: string, val: string, green = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: green ? '#16a34a' : '#0f172a' }}>{val}</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
      <Nav />
      <Steps step={step} />

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* ═══ STEP 0: YOUR ASSETS ═══ */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Retirement Corpus Calculator
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>
                What you have today
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Enter your current investments and monthly contributions. We'll show you exactly what they grow to at retirement.
              </p>
            </div>

            {/* Profile */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
              <SL>Your retirement profile</SL>
              <Slider label="Current age" val={currentAge} set={setCurrentAge} min={25} max={65} step={1} disp={`${currentAge} yrs`} />
              <Slider label="Target retirement age" val={retireAge} set={setRetireAge} min={Math.max(currentAge + 1, 40)} max={75} step={1} disp={`${retireAge} yrs`} hint={`${retireAge - currentAge} years to build your corpus`} />
              <Slider label="Monthly expenses today" val={monthlyExpense} set={setMonthlyExpense} min={50000} max={1000000} step={10000} disp={fmt(monthlyExpense) + '/mo'} />
              <Slider label="Expected inflation" val={inflation} set={setInflation} min={4} max={9} step={0.5} disp={`${inflation}%`} hint="RBI targets 4–6% · use 6% to be conservative" />
            </div>

            {/* Existing investments */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
              <SL>Existing investments</SL>
              <div style={{ marginBottom: '16px' }}>
                <AssetRow dot="#3b82f6" name="Fixed Deposit" rate={`${fdRate}% p.a.`} now={fmtShort(fdAmt)} future={`→ ${fmtShort(fvLump(fdAmt, fdRate, years))} at ${retireAge}`} />
                <AssetRow dot="#d97706" name="EPF" rate="8.1% p.a." now={fmtShort(epfAmt)} future={`→ ${fmtShort(epfFv)} at ${retireAge}`} />
                <AssetRow dot="#16a34a" name="Equity" rate={`${equityRate}% CAGR`} now={fmtShort(equityAmt)} future={`→ ${fmtShort(equityFv)} at ${retireAge}`} />
                <AssetRow dot="#ca8a04" name="Gold" rate={`${goldRate}% p.a.`} now={fmtShort(goldAmt)} future={`→ ${fmtShort(goldFv)} at ${retireAge}`} />
                <div style={{ borderBottom: 'none' }}>
                  <AssetRow dot="#7c3aed" name="Crypto" rate={`${cryptoRate}% p.a. · conservative`} now={fmtShort(cryptoAmt)} future={`→ ${fmtShort(cryptoFv)} at ${retireAge}`} />
                </div>
              </div>

              {/* Sliders for amounts */}
              <SL>Adjust amounts</SL>
              <Slider label="FD amount" val={fdAmt} set={setFdAmt} min={0} max={10000000} step={100000} disp={fmtShort(fdAmt)} />
              <Slider label="EPF amount" val={epfAmt} set={setEpfAmt} min={0} max={10000000} step={100000} disp={fmtShort(epfAmt)} />
              <Slider label="Equity amount" val={equityAmt} set={setEquityAmt} min={0} max={20000000} step={100000} disp={fmtShort(equityAmt)} />
              <Slider label="Gold amount" val={goldAmt} set={setGoldAmt} min={0} max={2000000} step={10000} disp={fmtShort(goldAmt)} />
              <Slider label="Crypto amount" val={cryptoAmt} set={setCryptoAmt} min={0} max={2000000} step={10000} disp={fmtShort(cryptoAmt)} />
            </div>

            {/* Monthly SIPs */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
              <SL>Monthly investments (SIP)</SL>
              <AssetRow dot="#16a34a" name="Equity SIP" rate={`${equityRate}% CAGR`} now={fmtShort(equitySip) + '/mo'} future={`→ ${fmtShort(eqSipFv)} at ${retireAge}`} />
              <AssetRow dot="#ca8a04" name="Gold SIP" rate={`${goldRate}% p.a.`} now={fmtShort(goldSip) + '/mo'} future={`→ ${fmtShort(gSipFv)} at ${retireAge}`} />
              <div style={{ borderBottom: 'none' }}>
                <AssetRow dot="#7c3aed" name="Crypto SIP" rate={`${cryptoRate}% p.a.`} now={fmtShort(cryptoSip) + '/mo'} future={`→ ${fmtShort(cSipFv)} at ${retireAge}`} />
              </div>
              <SL>Adjust SIPs</SL>
              <Slider label="Equity SIP" val={equitySip} set={setEquitySip} min={0} max={500000} step={5000} disp={fmtShort(equitySip) + '/mo'} />
              <Slider label="Gold SIP" val={goldSip} set={setGoldSip} min={0} max={100000} step={1000} disp={fmtShort(goldSip) + '/mo'} />
              <Slider label="Crypto SIP" val={cryptoSip} set={setCryptoSip} min={0} max={100000} step={1000} disp={fmtShort(cryptoSip) + '/mo'} />
            </div>

            {/* Preview total */}
            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginBottom: '3px' }}>Projected corpus at {retireAge}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>All investments combined</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.5px' }}>
                {fmt(corpus)}
              </div>
            </div>

            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '16px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
              See my gap analysis →
            </button>
          </>
        )}

        {/* ═══ STEP 1: GAP ANALYSIS ═══ */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                At age {retireAge}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>
                You'll have {fmt(corpus)}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                You need {fmt(needed)}. {gap > 0 ? `That's a ${fmt(gap)} gap.` : 'You are on track — no gap.'}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>₹0</span>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>{fmt(corpus)} ({Math.round(pct)}%)</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmt(needed)} needed</span>
              </div>
              <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gap > 0 ? '#16a34a' : '#16a34a', borderRadius: '999px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#16a34a' }}>On track</span>
                {gap > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{fmt(gap)} short</span>}
                {gap <= 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}>Surplus of {fmt(-gap)}</span>}
              </div>
            </div>

            {/* Gap card */}
            {gap > 0 && card(
              <>
                <div style={{ fontSize: '10px', color: '#a32d2d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>The gap</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#501313', fontFamily: 'DM Mono, monospace', letterSpacing: '-1px', lineHeight: 1, marginBottom: '8px' }}>
                  {fmt(gap)}
                </div>
                <div style={{ fontSize: '12px', color: '#791f1f', lineHeight: 1.6 }}>
                  At this pace, your money runs out at age <strong>{runsOut}</strong> — not 85. You'd need to cut expenses or return to work after {runsOut}.
                </div>
              </>, true
            )}

            {gap <= 0 && card(
              <>
                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>You're on track</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#14532d', fontFamily: 'DM Mono, monospace', letterSpacing: '-1px', lineHeight: 1, marginBottom: '8px' }}>
                  {fmt(-gap)} surplus
                </div>
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.6 }}>
                  Your corpus covers retirement well beyond age 85. You could retire earlier or spend more.
                </div>
              </>
            )}

            {/* How we got the number */}
            {card(
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>How we calculated {fmt(needed)}</div>
                {calcRow('Monthly expenses today', fmt(monthlyExpense) + '/mo')}
                {calcRow(`At ${retireAge} after ${inflation}% inflation`, fmt(expenseAtRetire) + '/mo')}
                {calcRow('Years in retirement', '30 years')}
                {calcRow('Withdrawal rate', '3.5% (conservative)')}
                <div style={{ borderBottom: 'none' }}>
                  {calcRow('Corpus needed', fmt(needed), true)}
                </div>
              </>
            )}

            {/* Breakdown */}
            <SL>Your {fmt(corpus)} breakdown at {retireAge}</SL>
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
              <BreakRow dot="#3b82f6" name="FD + EPF" now={fmtShort(fdAmt + epfAmt)} future={fmtShort(fdFv + epfFv)} />
              <BreakRow dot="#16a34a" name="Equity corpus" now={fmtShort(equityAmt)} future={fmtShort(equityFv)} />
              <BreakRow dot="#16a34a" name="Equity SIP" now={fmtShort(equitySip) + '/mo'} future={fmtShort(eqSipFv)} />
              <BreakRow dot="#7c3aed" name="Gold + Crypto" now={fmtShort(goldAmt + cryptoAmt)} future={fmtShort(goldFv + cryptoFv + gSipFv + cSipFv)} />
              <BreakRow dot="transparent" name="Total" now="" future={fmt(corpus)} isTot />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                ← Edit assets
              </button>
              <button onClick={() => { setLeverSip(equitySip); setLeverRetireAge(retireAge); setLeverExpense(monthlyExpense); setStep(2) }}
                style={{ flex: 2, padding: '14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                {gap > 0 ? 'How do I close this gap? →' : 'Explore what\'s possible →'}
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: CLOSE THE GAP ═══ */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: gap > 0 ? '#dc2626' : '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                {gap > 0 ? `Close the ${fmt(gap)} gap` : 'You\'re on track'}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>
                Three levers. Pick any combination.
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Adjust the sliders below — your projected corpus updates live.
              </p>
            </div>

            {/* Live corpus meter */}
            <div style={{ background: leverGap <= 0 ? '#f0fdf4' : '#fff', border: `1.5px solid ${leverGap <= 0 ? '#16a34a' : '#e2e8f0'}`, borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Adjusted corpus at {leverRetireAge}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: leverGap <= 0 ? '#16a34a' : '#0f172a', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {fmt(leverCorpus)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    {leverGap > 0 ? 'Still short by' : 'Surplus of'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: leverGap > 0 ? '#dc2626' : '#16a34a', fontFamily: 'DM Mono, monospace' }}>
                    {fmt(Math.abs(leverGap))}
                  </div>
                </div>
              </div>
              {leverClosed > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>
                  ↑ Closed {fmt(leverClosed)} of the original {fmt(gap)} gap
                </div>
              )}
            </div>

            {/* LEVER 1: Invest more */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Lever 1 — Invest more</div>
              </div>
              <Slider
                label="Monthly equity SIP"
                val={leverSip}
                set={setLeverSip}
                min={0}
                max={500000}
                step={5000}
                disp={fmtShort(leverSip) + '/mo'}
                hint={leverSip > equitySip ? `+${fmtShort(leverSip - equitySip)}/mo more than today` : 'Same as today'}
              />
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Moving FD (₹30L) to equity at 12% vs 7% adds <span style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(fvLump(fdAmt, equityRate, leverYears) - fvLump(fdAmt, fdRate, leverYears))}</span> to corpus — for free.
              </div>
            </div>

            {/* LEVER 2: Retire later */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Lever 2 — Retire a bit later</div>
              </div>
              <Slider
                label="New retirement age"
                val={leverRetireAge}
                set={setLeverRetireAge}
                min={Math.max(currentAge + 1, 45)}
                max={75}
                step={1}
                disp={`Age ${leverRetireAge}`}
                hint={leverRetireAge > retireAge ? `${leverRetireAge - retireAge} more years of compounding` : 'Same as target'}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                {[retireAge + 2, retireAge + 5, retireAge + 10].filter(a => a <= 75).map(a => (
                  <button key={a} onClick={() => setLeverRetireAge(a)} style={{
                    padding: '8px', border: `1px solid ${leverRetireAge === a ? '#1a6b3c' : '#e2e8f0'}`,
                    borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                    background: leverRetireAge === a ? '#f0fdf4' : '#fff',
                    color: leverRetireAge === a ? '#1a6b3c' : '#64748b', cursor: 'pointer',
                    fontFamily: 'Sora, sans-serif',
                  }}>
                    Age {a}
                  </button>
                ))}
              </div>
            </div>

            {/* LEVER 3: Spend less */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Lever 3 — Plan for less in retirement</div>
              </div>
              <Slider
                label="Monthly retirement budget"
                val={leverExpense}
                set={setLeverExpense}
                min={50000}
                max={1000000}
                step={10000}
                disp={fmt(leverExpense) + '/mo'}
                hint={`At ${leverRetireAge} this becomes ${fmt(leverExpense * Math.pow(1 + inflation / 100, leverYears))}/mo after inflation`}
              />
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Reducing by <span style={{ fontWeight: 600 }}>{fmt(monthlyExpense - leverExpense)}/mo</span> lowers the corpus target from {fmt(needed)} to{' '}
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(leverNeeded)}</span>
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                {leverGap <= 0 ? '✅ Gap closed with these settings' : '💡 Recommended combination'}
              </div>
              <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                {leverGap <= 0
                  ? `Your adjusted corpus of ${fmt(leverCorpus)} covers the ${fmt(leverNeeded)} needed. You have a ${fmt(-leverGap)} surplus.`
                  : `Increase SIP to ${fmtShort(leverSip > equitySip ? leverSip : Math.round(equitySip * 1.8))}+ retire at ${retireAge + 2}. Closes most of the gap — any part-time income post-${retireAge} covers the rest.`
                }
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                ← Gap analysis
              </button>
              <button onClick={() => setStep(0)} style={{ flex: 2, padding: '14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                Recalculate with new numbers
              </button>
            </div>

            {/* ── SEO Content ── */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '40px', marginTop: '40px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
                How much money do you need to retire in India?
              </h2>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
                The retirement corpus you need depends on three things: how much you spend each month today, how many years until you retire (which determines how much inflation erodes purchasing power), and how long you expect to live in retirement. Most Indians significantly underestimate all three, which is why retirement planning often starts too late and ends with an underfunded corpus.
              </p>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
                The standard method used by financial planners is the 4% rule — also called the safe withdrawal rate. It states that if your annual retirement expenses are 4% or less of your corpus, the corpus will last 25–30 years at a moderate return. For India, where inflation averages 5–7%, a slightly more conservative 3.5% withdrawal rate is safer. This means if you need ₹50,000 per month in retirement today, and you retire in 15 years with 6% inflation, your monthly expense becomes approximately ₹1.2 lakh. Your corpus needs to be ₹1.2L × 12 / 0.035 = approximately ₹4.1 crore.
              </p>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '28px' }}>
                The most powerful lever in retirement planning is time. Starting a SIP of ₹10,000 per month at age 25 at 12% CAGR builds ₹3.5 crore by age 60. Starting the same SIP at age 35 builds only ₹1.2 crore. The decade of compounding between 25 and 35 accounts for ₹2.3 crore — nearly two-thirds of the entire corpus. This is why the best time to start planning for retirement is always earlier than you think.
              </p>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
                What is the 4% rule for retirement in India?
              </h2>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
                The 4% rule originated from US research (the Trinity Study) showing that a portfolio of 60% equities and 40% bonds historically survived 30 years of withdrawals at 4% per year. In India, the equivalent safe withdrawal rate is estimated at 3.5% because Indian inflation is structurally higher (averaging 5–7%) and equity market history is shorter.
              </p>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '40px' }}>
                To use the 4% rule: calculate your annual retirement expenses (monthly expense at retirement × 12), then divide by 0.04 (or 0.035 for India). The result is your target retirement corpus. Remember to use your inflation-adjusted expense at retirement age, not today's expense — a ₹1 lakh monthly expense today becomes ₹2.4 lakh in 15 years at 6% inflation.
              </p>

              {/* FAQ */}
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '20px' }}>
                Frequently asked questions
              </h2>
              {[
                {
                  q: 'How much corpus do I need to retire at 50 in India?',
                  a: 'To retire at 50 with ₹1 lakh monthly expenses today, you need to account for inflation to your retirement age and then fund 35+ years of retirement. If you are currently 35, that is 15 years of 6% inflation bringing your monthly expense to approximately ₹2.4 lakh at 50. Using the 3.5% withdrawal rule, your corpus needs to be ₹2.4L × 12 / 0.035 = approximately ₹8.2 crore. Early retirement requires a significantly larger corpus than retiring at 60 because of the longer retirement period and more years of inflation before retirement.',
                },
                {
                  q: 'What is EPF and how does it contribute to retirement?',
                  a: 'The Employees\' Provident Fund (EPF) is a mandatory retirement savings scheme for salaried employees in India. Both employee (12% of basic salary) and employer (12% of basic salary) contribute monthly. The current interest rate is 8.15% per annum, which is tax-free. EPF accumulation is exempt from tax on maturity (EEE status). For most salaried employees, EPF forms a significant portion of retirement savings — often ₹20–50 lakh by retirement — but is rarely sufficient as a standalone retirement corpus.',
                },
                {
                  q: 'Should I use NPS or mutual funds for retirement in India?',
                  a: 'The National Pension System (NPS) offers an additional ₹50,000 tax deduction under Section 80CCD(1B) beyond the ₹1.5 lakh 80C limit — making it useful for people in the 30% tax slab as a pure tax-saving instrument. However, NPS has restrictions: 40% of the corpus must be used to buy an annuity at retirement (which typically yields 5–6%), and withdrawals are locked until age 60. Mutual funds through SIPs offer more flexibility — no lock-in after 1 year for ELSS, better liquidity, and potentially higher long-term returns. Most financial planners recommend a combination: use NPS for the additional tax benefit, and equity mutual fund SIPs for the bulk of retirement savings.',
                },
                {
                  q: 'How does inflation affect retirement planning in India?',
                  a: 'Inflation is the single biggest risk to retirement planning in India. At 6% annual inflation, ₹1 lakh today becomes ₹1.79 lakh in 10 years and ₹3.21 lakh in 20 years. This means your retirement corpus needs to be large enough not just to fund today\'s expenses, but to fund significantly higher expenses in the future. It also means that any investment returning less than 6% post-tax is shrinking your real wealth — which is why FD-heavy retirement portfolios often fail to sustain purchasing power through a 20–30 year retirement.',
                },
                {
                  q: 'What is the right asset allocation for retirement savings?',
                  a: 'A common rule of thumb is to subtract your age from 100 to get the percentage to allocate to equity — so a 35-year-old should have 65% in equity and 35% in debt. However, with longer life expectancies and higher inflation in India, many advisors now use 110 minus age. As you approach retirement, gradually shift from equity to more stable assets — but maintain at least 30–40% in equity even in retirement to ensure the corpus keeps growing in real terms. EPF and PPF naturally handle the debt portion for most salaried employees.',
                },
              ].map((faq, i, arr) => (
                <div key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '18px', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>{faq.q}</h3>
                  <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8 }}>{faq.a}</p>
                </div>
              ))}

              <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', marginTop: '20px' }}>
                Not investment advice · All projections are illustrative · Actual returns may vary · Consult a SEBI-registered financial advisor
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
