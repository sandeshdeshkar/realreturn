'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(1) + 'L'
  if (a >= 1000) return s + '₹' + (a / 1000).toFixed(0) + 'K'
  return s + '₹' + Math.round(a).toLocaleString('en-IN')
}

// SIP PMT needed to reach FV: PMT = FV * r / ((1+r)^n - 1)
const sipNeeded = (fv: number, annualPct: number, years: number) => {
  const r = annualPct / 100 / 12
  const n = years * 12
  if (r === 0) return fv / n
  return fv * r / (Math.pow(1 + r, n) - 1)
}

// FV of monthly SIP
const fvSip = (pmt: number, annualPct: number, years: number) => {
  const r = annualPct / 100 / 12
  const n = years * 12
  if (r === 0) return pmt * n
  return pmt * (Math.pow(1 + r, n) - 1) / r
}

// Health score
const healthScore = (
  savingsRate: number,      // % of income saved
  lifeGapPct: number,       // 0 if no gap, 100 if fully covered
  healthInsured: boolean,
  emergencyFundMonths: number
) => {
  const wealth = Math.min(savingsRate / 25 * 30, 30)          // 30 pts — target 25% savings
  const protection = lifeGapPct >= 100
    ? (healthInsured ? 30 : 15)
    : lifeGapPct >= 50
      ? (healthInsured ? 20 : 10)
      : (healthInsured ? 10 : 0)                              // 30 pts
  const stability = Math.min(emergencyFundMonths / 6 * 15, 15) // 15 pts — target 6 months
  const goals = 25                                              // 25 pts — always show potential
  return Math.round(Math.min(wealth + protection + stability + goals, 100))
}

// Life cover needed (income × 10 × dependant multiplier)
const lifeCoverNeeded = (annualIncome: number, dependants: string[]) => {
  const base = annualIncome * 10
  const dep = dependants.includes('spouse') ? 1.2 : 1
  const kids = dependants.filter(d => d.startsWith('child')).length
  return base * dep * (1 + kids * 0.1)
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
        <Link href="/retirement-corpus-calculator" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Retirement</Link>
      </div>
    </nav>
  )
}

// ─── Chip selector ───────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
      border: `1.5px solid ${active ? '#1a6b3c' : '#e2e8f0'}`,
      background: active ? '#f0fdf4' : '#fff',
      color: active ? '#1a6b3c' : '#64748b',
      cursor: 'pointer', fontFamily: 'Sora, sans-serif',
    }}>{label}</button>
  )
}

// ─── Number Input ────────────────────────────────────────────────
function NumInput({ label, val, set, prefix = '₹', suffix = '', hint }: {
  label: string; val: number; set: (v: number) => void;
  prefix?: string; suffix?: string; hint?: string
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '11px', color: '#374151', fontWeight: 600, marginBottom: '5px' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: '#f8fafc', border: '1.5px solid #1a6b3c',
        borderRadius: '10px', padding: '10px 12px',
      }}>
        {prefix && <span style={{ fontSize: '14px', color: '#94a3b8' }}>{prefix}</span>}
        <input
          type="number"
          value={val}
          onChange={e => set(Number(e.target.value))}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: '15px', fontWeight: 600, color: '#0f172a',
            fontFamily: 'DM Mono, monospace', outline: 'none',
          }}
        />
        {suffix && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

// ─── Toggle ─────────────────────────────────────────────────────
function Toggle({ on, onToggle, label, sub }: { on: boolean; onToggle: () => void; label: string; sub?: string }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px',
      background: on ? '#f0fdf4' : '#fff',
      border: `1.5px solid ${on ? '#1a6b3c' : '#e2e8f0'}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{label}</div>
        {sub && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
      </div>
      <div style={{
        width: '36px', height: '20px', borderRadius: '999px',
        background: on ? '#1a6b3c' : '#e2e8f0', position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: '2px', left: on ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  )
}

// ─── Section header ──────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '20px 0 12px' }}>
      {children}
    </div>
  )
}

// ─── Step progress bar ───────────────────────────────────────────
function ProgBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ background: '#fff', padding: '10px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
        <span style={{ fontWeight: 700, color: '#1a6b3c' }}>
          {['About you', 'Your money', 'Goals & protection'][step]}
        </span>
        <span style={{ color: '#94a3b8' }}>Step {step + 1} of {total}</span>
      </div>
      <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((step + 1) / total) * 100}%`, background: 'linear-gradient(90deg,#1a6b3c,#2d9d5c)', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

// ─── Score Ring ──────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 38, c = 2 * Math.PI * r
  const fill = (c * score) / 100
  const col = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626'
  return (
    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="8"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round" />
    </svg>
  )
}

// ─── Action item ─────────────────────────────────────────────────
function ActionItem({ num, priority, action, detail, cost }: {
  num: number; priority: 'high' | 'medium' | 'low'; action: string; detail: string; cost: string
}) {
  const bg = priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef3c7' : '#dcfce7'
  const col = priority === 'high' ? '#991b1b' : priority === 'medium' ? '#92400e' : '#166534'
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: bg, color: col, fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{action}</div>
        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{detail}</div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', fontFamily: 'DM Mono, monospace', flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {cost}
      </div>
    </div>
  )
}

// ─── Goal SIP Row ────────────────────────────────────────────────
function GoalRow({ emoji, name, target, years, sip, status }: {
  emoji: string; name: string; target: number; years: number; sip: number; status: 'ok' | 'warn' | 'na'
}) {
  const dot = status === 'ok' ? '#16a34a' : status === 'warn' ? '#d97706' : '#94a3b8'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ fontSize: '18px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{name}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{fmt(target)} · {years} years away</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: dot, fontFamily: 'DM Mono, monospace' }}>{fmt(sip)}</div>
        <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>per month</div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────
export default function LifePlannerPage() {
  const [step, setStep] = useState(0)
  const [showPlan, setShowPlan] = useState(false)

  // Step 1: About you
  const [age, setAge] = useState(30)
  const [income, setIncome] = useState(80000)
  const [dependants, setDependants] = useState<string[]>(['spouse'])
  const [employed, setEmployed] = useState<'salaried' | 'self' | 'business'>('salaried')

  // Step 2: Money
  const [expenses, setExpenses] = useState(50000)
  const [savings, setSavings] = useState(300000)
  const [investing, setInvesting] = useState(10000)
  const [loans, setLoans] = useState(0)

  // Step 3: Goals & insurance
  const [selectedGoals, setSelectedGoals] = useState(['retirement', 'education', 'home'])
  const [hasLife, setHasLife] = useState(true)
  const [lifeCover, setLifeCover] = useState(2500000)
  const [hasHealth, setHasHealth] = useState(false)
  const [healthCover, setHealthCover] = useState(0)
  const [emergencyFund, setEmergencyFund] = useState(100000)

  const toggleDep = (d: string) => setDependants(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const toggleGoal = (g: string) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  // ── Computed values ──────────────────────────────────────────
  const annualIncome = income * 12
  const surplus = income - expenses - investing
  const savingsRate = ((investing + Math.max(surplus, 0)) / income) * 100
  const emergencyMonths = emergencyFund / expenses
  const lifeNeeded = lifeCoverNeeded(annualIncome, dependants)
  const lifeGapPct = hasLife ? Math.min((lifeCover / lifeNeeded) * 100, 100) : 0
  const lifeGap = Math.max(lifeNeeded - (hasLife ? lifeCover : 0), 0)
  const healthNeeded = Math.max(income * 6, 500000)    // 6 months income or 5L min
  const healthGap = hasHealth ? Math.max(healthNeeded - healthCover, 0) : healthNeeded
  const emergencyNeeded = expenses * 6

  const score = useMemo(() =>
    healthScore(savingsRate, lifeGapPct, hasHealth, emergencyMonths),
    [savingsRate, lifeGapPct, hasHealth, emergencyMonths])

  // Goal SIPs (12% CAGR assumed)
  const goalList = [
    { id: 'home', emoji: '🏠', name: 'Home down payment', target: 2000000, years: 5 },
    { id: 'education', emoji: '🎓', name: "Child's education", target: 3000000, years: 15 },
    { id: 'retirement', emoji: '🏖️', name: 'Retirement', target: 10000000, years: 60 - age },
    { id: 'wedding', emoji: '💍', name: "Child's wedding", target: 1500000, years: 25 },
    { id: 'vacation', emoji: '✈️', name: 'Dream vacation', target: 300000, years: 2 },
  ]

  const activeGoals = goalList.filter(g => selectedGoals.includes(g.id))
  const totalGoalSip = activeGoals.reduce((sum, g) => sum + sipNeeded(g.target, 12, g.years), 0)

  // Insurance cost estimates
  const termCost = lifeGap > 0 ? Math.round(lifeGap / 100000 * 4) : 0   // ~₹4/lakh/mo
  const healthCost = !hasHealth ? Math.round(healthNeeded / 100000 * 110) : 0  // ~₹110/lakh/mo

  // Total commitment
  const totalMonthly = totalGoalSip + termCost + healthCost + Math.max(emergencyNeeded - emergencyFund, 0) / 6
  const canAfford = totalMonthly <= surplus + investing

  const goBack = () => step === 0 ? null : setStep(s => s - 1)
  const goNext = () => {
    if (step < 2) setStep(s => s + 1)
    else setShowPlan(true)
  }

  // ── Output plan ──────────────────────────────────────────────
  if (showPlan) {
    const scoreCol = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626'
    const scoreLbl = score >= 70 ? 'Healthy' : score >= 45 ? 'Room to improve' : 'Needs attention'

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
        <Nav />

        {/* Dark hero */}
        <div style={{ background: '#0f172a', padding: '24px 16px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '160px', height: '160px',
            background: 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Financial Health Score
            </div>

            {/* Score + sub-scores inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                <ScoreRing score={score} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>/100</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{scoreLbl}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { label: 'Savings', val: Math.min(Math.round(savingsRate / 25 * 30), 30), max: 30, col: '#4ade80' },
                    { label: 'Protection', val: lifeGapPct >= 100 ? (hasHealth ? 30 : 15) : lifeGapPct >= 50 ? (hasHealth ? 20 : 10) : 0, max: 30, col: '#f87171' },
                    { label: 'Stability', val: Math.min(Math.round(emergencyMonths / 6 * 15), 15), max: 15, col: '#60a5fa' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', width: '52px', flexShrink: 0 }}>{s.label}</div>
                      <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(s.val / s.max) * 100}%`, background: s.col, borderRadius: '999px' }} />
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: s.col, width: '20px', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 16px 80px' }}>

          {/* Biggest issue */}
          {(lifeGap > 0 || !hasHealth) && (
            <div style={{ background: '#fcebeb', border: '1.5px solid #fca5a5', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: '#a32d2d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                🔴 Most urgent — fix this first
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#501313', marginBottom: '6px' }}>
                {!hasHealth ? 'You have no health insurance' : 'You are underinsured by ' + fmt(lifeGap)}
              </div>
              <div style={{ fontSize: '12px', color: '#791f1f', lineHeight: 1.6 }}>
                {!hasHealth
                  ? `A single hospitalisation costs ₹2–5L. You have no cover. One medical emergency can wipe out your savings.`
                  : `Your family gets ${fmt(hasLife ? lifeCover : 0)} if something happens to you. They need ${fmt(lifeNeeded)}. That covers only ${Math.round((hasLife ? lifeCover : 0) / lifeNeeded * 100)}% of what's needed.`}
              </div>
            </div>
          )}

          {/* Insurance analysis */}
          <SL>Protection analysis</SL>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            {[
              {
                icon: '🛡️',
                name: 'Life insurance',
                detail: lifeGap > 0 ? `Short by ${fmt(lifeGap)}` : 'Adequately covered',
                bg: lifeGap > 0 ? '#fef3c7' : '#dcfce7',
                risk: lifeGap > 0 ? 'Gap' : 'Covered',
                riskCol: lifeGap > 0 ? '#92400e' : '#166534',
                riskBg: lifeGap > 0 ? '#fef3c7' : '#dcfce7',
                detailCol: lifeGap > 0 ? '#dc2626' : '#16a34a',
              },
              {
                icon: '🏥',
                name: 'Health insurance',
                detail: !hasHealth ? 'No cover at all' : healthGap > 0 ? `Short by ${fmt(healthGap)}` : 'Adequately covered',
                bg: !hasHealth ? '#fee2e2' : '#dcfce7',
                risk: !hasHealth ? 'Critical' : healthGap > 0 ? 'Gap' : 'Covered',
                riskCol: !hasHealth ? '#991b1b' : '#166534',
                riskBg: !hasHealth ? '#fee2e2' : '#dcfce7',
                detailCol: !hasHealth ? '#dc2626' : '#16a34a',
              },
              {
                icon: '🏦',
                name: 'Emergency fund',
                detail: emergencyMonths < 3 ? `Only ${emergencyMonths.toFixed(1)} months — need 6` : emergencyMonths < 6 ? `${emergencyMonths.toFixed(1)} months — need 6` : `${emergencyMonths.toFixed(1)} months — solid`,
                bg: '#f8fafc',
                risk: emergencyMonths < 3 ? 'High risk' : emergencyMonths < 6 ? 'Low' : 'Good',
                riskCol: emergencyMonths < 3 ? '#991b1b' : emergencyMonths < 6 ? '#92400e' : '#166634',
                riskBg: emergencyMonths < 3 ? '#fee2e2' : emergencyMonths < 6 ? '#fef3c7' : '#dcfce7',
                detailCol: emergencyMonths >= 6 ? '#16a34a' : '#d97706',
              },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
                  <div style={{ fontSize: '11px', color: row.detailCol, marginTop: '2px', fontWeight: 500 }}>{row.detail}</div>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, background: row.riskBg, color: row.riskCol, padding: '3px 9px', borderRadius: '999px', flexShrink: 0 }}>
                  {row.risk}
                </div>
              </div>
            ))}
          </div>

          {/* Goal SIPs */}
          <SL>SIP needed for your goals</SL>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            {activeGoals.map(g => (
              <GoalRow
                key={g.id}
                emoji={g.emoji}
                name={g.name}
                target={g.target}
                years={g.years}
                sip={sipNeeded(g.target, 12, g.years)}
                status={surplus >= sipNeeded(g.target, 12, g.years) ? 'ok' : 'warn'}
              />
            ))}
            <div style={{ padding: '10px 16px', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Total SIP needed</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#1a6b3c', fontFamily: 'DM Mono, monospace' }}>{fmt(totalGoalSip)}/mo</span>
            </div>
          </div>

          {/* Action plan */}
          <SL>Your action plan — ordered by impact</SL>
          <div style={{ background: '#0f172a', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Do these things. In this order.</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                Total monthly: {fmt(totalMonthly)} · Your surplus: {fmt(surplus)} {canAfford ? '✓ Achievable' : '— stretch goal'}
              </div>
            </div>
            <div style={{ padding: '4px 16px 12px' }}>
              {!hasHealth && (
                <ActionItem num={1} priority="high" action="Get health insurance" detail={`₹${Math.round(healthNeeded / 100000)}L family floater · covers spouse + children`} cost={`~${fmt(healthCost)}/mo`} />
              )}
              {lifeGap > 0 && (
                <ActionItem num={!hasHealth ? 2 : 1} priority="high" action={`Top up life cover by ${fmt(lifeGap)}`} detail={`Term plan · 30 years · buy now while you're ${age} — cheapest it'll ever be`} cost={`~${fmt(termCost)}/mo`} />
              )}
              {emergencyMonths < 6 && (
                <ActionItem num={lifeGap > 0 || !hasHealth ? 3 : 1} priority="medium" action="Build emergency fund" detail={`Need ${fmt(emergencyNeeded)} · Have ${fmt(emergencyFund)} · ${(6 - emergencyMonths).toFixed(1)} months short`} cost={`${fmt((emergencyNeeded - emergencyFund) / 6)} over 6 months`} />
              )}
              <ActionItem
                num={[lifeGap > 0, !hasHealth, emergencyMonths < 6].filter(Boolean).length + 1}
                priority="low"
                action={`Start SIP of ${fmt(totalGoalSip)}/month`}
                detail={`Covers all ${activeGoals.length} goals · allocate across goal-specific funds`}
                cost={fmt(totalGoalSip) + '/mo'}
              />
            </div>
          </div>

          {/* Cost of delay teaser */}
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>⏱ Cost of waiting to act</div>
            {[
              { age: age, cost: termCost, col: '#16a34a', label: 'Buy now' },
              { age: age + 5, cost: Math.round(termCost * 1.6), col: '#d97706', label: `Wait 5 years` },
              { age: age + 10, cost: Math.round(termCost * 2.8), col: '#dc2626', label: `Wait 10 years` },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ fontSize: '11px', color: '#64748b', width: '80px', flexShrink: 0 }}>Age {row.age} · {row.label}</div>
                <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(row.cost / (termCost * 2.8)) * 100}%`, background: row.col, borderRadius: '999px' }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: row.col, fontFamily: 'DM Mono, monospace', width: '60px', textAlign: 'right', flexShrink: 0 }}>
                  {fmt(row.cost)}/mo
                </div>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 500, marginTop: '10px', padding: '8px 10px', background: '#fff5f5', borderRadius: '7px' }}>
              Waiting 10 years costs {fmt(Math.round(termCost * 1.8))}/month more — for the same cover.
            </div>
          </div>

          {/* Share card teaser */}
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Your financial plan summary</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>realreturn.in · {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.7, marginBottom: '12px' }}>
              Score: <strong>{score}/100</strong> · Need {fmt(lifeGap + healthGap)} more cover · Total SIP: {fmt(totalGoalSip)}/month · All goals achievable from {fmt(surplus)} surplus
            </div>
            <button
              onClick={() => {
                const text = `My financial health score: ${score}/100\n\nPlan:\n• Life cover gap: ${fmt(lifeGap)}\n• Health cover needed: ${fmt(healthNeeded)}\n• SIP for goals: ${fmt(totalGoalSip)}/month\n\nCalculated at realreturn.in`
                if (navigator.share) navigator.share({ title: 'My Financial Plan', text })
                else navigator.clipboard?.writeText(text)
              }}
              style={{ width: '100%', padding: '11px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
            >
              Share with spouse / CA
            </button>
          </div>

          <button onClick={() => { setShowPlan(false); setStep(0) }} style={{ width: '100%', padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
            ← Recalculate with different numbers
          </button>

          {/* ── SEO Content ── */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '40px', marginTop: '40px', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
              What is a personal financial plan and why do you need one?
            </h2>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              A personal financial plan is a structured view of where you stand financially today and what you need to do to reach your goals. Most Indians manage finances reactively — paying EMIs, investing what's left, renewing insurance when reminded. A financial plan flips this: it starts with your goals and works backwards to tell you exactly what you need to invest, protect, and save every month.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              The three pillars of any complete financial plan are protection (life and health insurance adequate for your income and dependants), goals (SIP amounts calculated for each financial milestone), and stability (emergency fund and savings rate). Most financial planning tools in India focus on only one of these. This tool covers all three and shows you a single financial health score so you know exactly where you stand.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '28px' }}>
              The most overlooked area in Indian financial planning is insurance adequacy. Studies show that over 80% of Indian households are significantly underinsured — life cover of ₹5–10 lakh is common when the actual need is ₹50–100 lakh based on income and dependants. A term plan at age 30 costs as little as ₹440 per month for ₹1 crore cover. Waiting until 40 can cost ₹1,200–1,800 per month for the same cover. This tool shows you that cost of delay in rupees.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px' }}>
              How much life insurance do I actually need in India?
            </h2>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '14px' }}>
              The standard financial planning rule is that your life insurance cover should be at least 10 times your annual income. For a person earning ₹10 lakh per year, that means ₹1 crore in life cover — not a ₹10–20 lakh endowment plan. This 10x rule ensures your family can sustain their current lifestyle for approximately 10 years without your income, giving them time to adjust.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.9, marginBottom: '28px' }}>
              If you have dependants — spouse, children, or ageing parents — the cover needs to be higher. Outstanding home loans, car loans, and other liabilities should also be added to the cover amount so your family does not inherit debt. A pure term plan (not ULIP or endowment) is the most cost-efficient way to get this cover. At age 30, a ₹1 crore 30-year term plan from a reputed insurer costs approximately ₹8,000–12,000 per year.
            </p>

            {/* FAQ */}
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '20px' }}>
              Frequently asked questions
            </h2>
            {[
              {
                q: 'How is the financial health score calculated?',
                a: 'The score out of 100 is weighted across four areas: savings rate (30 points — target is 20–25% of income), insurance adequacy (30 points — life and health cover as a percentage of recommended amounts), goal tracking (25 points — whether your current SIP covers your selected goals), and emergency fund (15 points — target is 6 months of expenses in liquid savings). Each sub-score is calculated proportionally, so partial coverage earns partial points.',
              },
              {
                q: 'How much health insurance does a family need in India?',
                a: 'A family of three (couple + one child) needs a minimum ₹10 lakh family floater plan in 2025. Medical inflation in India runs at 10–14% per year, meaning a hospitalisation that costs ₹3 lakh today will cost ₹8–10 lakh in 10 years. For families in metro cities or with a history of medical conditions, ₹15–25 lakh in base cover supplemented by a super top-up plan is advisable. Health insurance premiums paid are tax-deductible under Section 80D.',
              },
              {
                q: 'What is an emergency fund and how much should I have?',
                a: 'An emergency fund is liquid money kept aside specifically for unexpected expenses — job loss, medical emergency, urgent travel, or major home repair. The standard recommendation is 6 months of your total monthly expenses (not just discretionary expenses — include rent, EMIs, utilities, and groceries). This money should be kept in a savings account, liquid mutual fund, or short-duration FD — not in equity or long-term FDs where withdrawal attracts penalties.',
              },
              {
                q: 'How much SIP do I need for my financial goals?',
                a: 'The SIP amount depends on your target corpus, the number of years available, and the assumed CAGR. The formula is: SIP = Target × r / ((1+r)^n − 1), where r is the monthly rate (CAGR / 12) and n is the number of months. For example, to accumulate ₹30 lakh in 15 years at 12% CAGR, you need approximately ₹5,856 per month. This tool calculates the exact SIP for each of your selected goals and shows the total monthly commitment.',
              },
              {
                q: 'What is the difference between term insurance and endowment plans?',
                a: 'A term plan is pure life insurance — it pays the sum assured to your family if you die within the policy term. There is no maturity benefit if you survive. This simplicity makes it extremely cost-efficient: ₹1 crore cover at age 30 costs approximately ₹8,000–12,000 per year. Endowment plans combine insurance with savings and promise a maturity amount — but the effective insurance cover is low, the investment returns are 4–6% (below inflation), and premiums are 10–20x higher. Most financial advisors recommend pure term plans for life cover and separate investments for wealth creation.',
              },
            ].map((faq, i, arr) => (
              <div key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '18px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>{faq.q}</h3>
                <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            ))}

            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', marginTop: '20px' }}>
              Not investment or insurance advice · Consult a SEBI-registered advisor or IRDAI-registered agent · All calculations are illustrative
            </p>
          </div>

        </div>
      </div>
    )
  }

  // ── Wizard ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Sora, sans-serif' }}>
      <Nav />
      <ProgBar step={step} total={3} />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* ═══ STEP 0: ABOUT YOU ═══ */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Step 1 of 3</div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>Tell us about yourself</h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>Your age and dependants shape every recommendation you'll see.</p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <NumInput label="Your age" val={age} set={setAge} prefix="" suffix="years" />
              <NumInput label="Monthly take-home income" val={income} set={setIncome} hint="After all deductions — what hits your account" />

              <SL>Who depends on your income?</SL>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {[
                  { id: 'just-me', label: 'Just me' },
                  { id: 'spouse', label: 'Spouse' },
                  { id: 'child-1', label: '1 child' },
                  { id: 'child-2', label: '2 children' },
                  { id: 'parents', label: 'Parents' },
                ].map(d => (
                  <Chip key={d.id} label={d.label} active={dependants.includes(d.id)} onClick={() => toggleDep(d.id)} />
                ))}
              </div>

              <SL>Employment type</SL>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { v: 'salaried', l: 'Salaried' },
                  { v: 'self', l: 'Self-employed' },
                  { v: 'business', l: 'Business' },
                ].map(o => (
                  <button key={o.v} onClick={() => setEmployed(o.v as typeof employed)} style={{
                    flex: 1, padding: '10px 4px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: employed === o.v ? '#1a6b3c' : '#f8fafc',
                    color: employed === o.v ? '#fff' : '#64748b',
                    borderRadius: '8px', fontFamily: 'Sora, sans-serif',
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '11px 13px', marginBottom: '24px', fontSize: '12px', color: '#1d4ed8', lineHeight: 1.5 }}>
              💡 We'll pre-fill recommended goals and insurance based on your age and dependants
            </div>

            <button onClick={goNext} style={{ width: '100%', padding: '16px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
              Continue →
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
              No login · data stays on your device · takes 3 minutes
            </div>
          </>
        )}

        {/* ═══ STEP 1: YOUR MONEY ═══ */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Step 2 of 3</div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>What does your money look like?</h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>The more honest you are, the sharper your plan.</p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <NumInput label="Monthly expenses (rent, bills, EMIs, food)" val={expenses} set={setExpenses} suffix="/month" />
              <NumInput label="Total savings & investments today" val={savings} set={setSavings} hint="FD + MF + PF + bank account combined" />
              <NumInput label="Monthly investments currently" val={investing} set={setInvesting} suffix="/month" hint="SIP + RD + PPF + NPS combined" />
              <NumInput label="Total loan outstanding" val={loans} set={setLoans} hint="Home loan + car loan + other EMIs" />
              <NumInput label="Emergency fund (liquid savings)" val={emergencyFund} set={setEmergencyFund} hint="Money you can access within 1–2 days" />
            </div>

            {/* Live surplus pill */}
            <div style={{
              background: surplus >= 0 ? '#f0fdf4' : '#fff5f5',
              border: `1px solid ${surplus >= 0 ? '#dcfce7' : '#fecaca'}`,
              borderRadius: '10px', padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '12px', color: surplus >= 0 ? '#166534' : '#dc2626', fontWeight: 600 }}>
                Monthly surplus after expenses
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: surplus >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'DM Mono, monospace' }}>
                {surplus >= 0 ? '+' : ''}{fmt(surplus)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={goBack} style={{ flex: 1, padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>← Back</button>
              <button onClick={goNext} style={{ flex: 2, padding: '14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>Continue →</button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: GOALS & PROTECTION ═══ */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: '#1a6b3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Step 3 of 3</div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.25 }}>Goals & protection</h1>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>Suggested for your age and family — tap to confirm yours.</p>
            </div>

            {/* Goals */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px 16px 8px', marginBottom: '14px' }}>
              <SL>Your financial goals</SL>
              {goalList.map(g => (
                <div key={g.id} onClick={() => toggleGoal(g.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '18px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{g.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{fmt(g.target)} · {g.years} yrs away</div>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                    border: `1.5px solid ${selectedGoals.includes(g.id) ? '#1a6b3c' : '#e2e8f0'}`,
                    background: selectedGoals.includes(g.id) ? '#1a6b3c' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '11px', fontWeight: 700,
                  }}>
                    {selectedGoals.includes(g.id) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Insurance */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
              <SL>Current insurance</SL>
              <Toggle
                on={hasLife}
                onToggle={() => setHasLife(v => !v)}
                label="🛡️ Life / term insurance"
                sub={hasLife ? `${fmt(lifeCover)} cover` : 'No life insurance'}
              />
              {hasLife && (
                <NumInput label="Current life cover" val={lifeCover} set={setLifeCover} hint={`You need ${fmt(lifeNeeded)} · ${lifeGap > 0 ? `short by ${fmt(lifeGap)}` : 'adequately covered'}`} />
              )}
              {!hasLife && (
                <div style={{ fontSize: '11px', color: '#dc2626', background: '#fff5f5', borderRadius: '7px', padding: '8px 10px', marginBottom: '10px', lineHeight: 1.5 }}>
                  ⚠ You need {fmt(lifeNeeded)} in term cover for your dependants
                </div>
              )}
              <Toggle
                on={hasHealth}
                onToggle={() => setHasHealth(v => !v)}
                label="🏥 Health insurance"
                sub={hasHealth ? `${fmt(healthCover)} cover` : 'No health insurance'}
              />
              {hasHealth && (
                <NumInput label="Health cover amount" val={healthCover} set={setHealthCover} hint={`Recommended minimum: ${fmt(healthNeeded)}`} />
              )}
              {!hasHealth && (
                <div style={{ fontSize: '11px', color: '#dc2626', background: '#fff5f5', borderRadius: '7px', padding: '8px 10px', lineHeight: 1.5 }}>
                  ⚠ One hospitalisation costs ₹2–5L. You need at least {fmt(healthNeeded)} cover.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={goBack} style={{ flex: 1, padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>← Back</button>
              <button onClick={goNext} style={{ flex: 2, padding: '14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                Build my plan →
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
              ~3 seconds to calculate your full diagnosis
            </div>
          </>
        )}

      </div>
    </div>
  )
}
