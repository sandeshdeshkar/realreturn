'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PageConfig } from '../lib/fd-sip-configs'
import type { CalcResult } from '../lib/fd-sip-calculator'
import { fmtL, fmtPct } from '../lib/fd-sip-calculator'

interface Props {
  config: PageConfig
  result: CalcResult
  breadcrumbs: { label: string; href?: string }[]
  related: ({ slug: string; title: string; tag: string; sipL: string; fdL: string } | null)[]
}

export default function FdVsSipPage({ config, result, breadcrumbs, related }: Props) {
  const [yearOpen, setYearOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)

  const { inputs } = config
  const { sip, fd, gapAmount, gapMonths, breakEvenYear, yearByYear } = result

  const gapL       = fmtL(gapAmount)
  const gapYears   = Math.max(1, Math.round(gapMonths / 12))
  const sipNomL    = fmtL(sip.nominalCorpus)
  const fdNomL     = fmtL(fd.nominalCorpus)
  const sipL       = fmtL(sip.postTaxCorpus)
  const fdL        = fmtL(fd.postTaxCorpus)
  const sipRealL   = fmtL(sip.realCorpus)
  const fdRealL    = fmtL(fd.realCorpus)
  const sipTaxL    = fmtL(sip.taxPaid)
  const fdTaxL     = fmtL(fd.taxPaid)
  const taxSavingL = fmtL(Math.abs(fd.taxPaid - sip.taxPaid))
  const investedL  = fmtL(sip.totalInvested)
  const sipPct     = fmtPct(sip.realReturnPct)
  const fdPct      = fmtPct(fd.realReturnPct)
  const fdBarWidth = Math.round((fd.nominalCorpus / sip.nominalCorpus) * 100)

  // FD real return label — show "barely positive" framing when close to zero
  const fdRealLabel = fd.realReturnPct <= 0
    ? `${fdPct}/yr (losing to inflation)`
    : `${fdPct}/yr`

  const faqs = [
    {
      q: `Is SIP actually better than FD for ${inputs.durationYears} years — or just on paper?`,
      a: `In practice, yes — if you pay 20–30% income tax. SIP at ${inputs.sipCagr}% annual growth gives ${sipNomL} vs FD's ${fdNomL} before tax. After paying tax and adjusting for inflation, SIP real return is ${sipPct}/year vs FD's ${fdPct}/year. The catch: SIP can fall 30–40% in a bad year before recovering. If that would cause you to stop investing, FD is a safer fit.`,
    },
    {
      q: `In which year does SIP overtake FD?`,
      a: `Around year ${breakEvenYear}. Before that, FD's guaranteed compounding keeps it ahead. After year ${breakEvenYear}, SIP accelerates — reaching ${gapL} ahead by year ${inputs.durationYears}.`,
    },
    {
      q: `Is SIP safe? What if markets crash?`,
      a: `SIP does not guarantee your money back — unlike FD. In 2020, equity SIPs fell about 35% before fully recovering within a year. Over any 10-year period in Indian market history, patient SIP investors have come out ahead. But if you need the money at a specific date or a 35% temporary drop would keep you awake at night, FD's guarantee is genuinely valuable.`,
    },
    {
      q: `How much less tax do I pay with SIP vs FD?`,
      a: `In the ${inputs.taxSlab}% income tax bracket: FD attracts ${fdTaxL} in tax over ${inputs.durationYears} years. SIP attracts just ${sipTaxL}. You save ${taxSavingL} in tax alone — before counting higher returns. FD interest is taxed like salary, while SIP profits are taxed at only 12.5%.`,
    },
    {
      q: `Why does FD lose to inflation after tax?`,
      a: `FD gives you ${inputs.fdRate}%. After ${inputs.taxSlab}% tax that becomes ~${(inputs.fdRate * (1 - inputs.taxSlab / 100)).toFixed(1)}%. With ${inputs.inflationRate}% annual inflation, your real gain is just ${fdPct}/year. Your ${investedL} invested today can only buy ${fdRealL} worth of things after ${inputs.durationYears} years — even though your account shows ${fdNomL}.`,
    },
    {
      q: `SIP or FD for a shorter goal with ₹${inputs.monthlyAmount.toLocaleString('en-IN')}/month?`,
      a: `For goals under 3 years, FD is safer. For 3–5 years, consider a split: 60–70% in SIP, 30–40% in FD. SIP gives better expected returns but the FD portion gives you a guaranteed floor if markets dip at the wrong time.`,
    },
  ]

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600,
    letterSpacing: '.06em', textTransform: 'uppercase' as const,
    color: '#9ca3af', marginBottom: 12,
  }
  const sec: React.CSSProperties = {
    padding: '20px 0',
    borderBottom: '1px solid #e5e7eb',
  }

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; margin: 0; }
        .pw { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
        .tc { display: grid; grid-template-columns: 300px 1fr; gap: 28px; align-items: start; }
        .lc { position: sticky; top: 72px; }
        @media (max-width: 768px) {
          .tc { grid-template-columns: 1fr; }
          .lc { position: static; }
          .pw { padding: 0 16px; }
        }
      `}</style>

      <div style={{ fontFamily: "'Sora', sans-serif", color: '#111827', fontSize: 14, lineHeight: 1.6, minHeight: '100vh' }}>

        {/* NAV */}
        <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', height: 54, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 99 }}>
          <div className="pw" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 600, fontSize: 15, color: '#1a6b3c', letterSpacing: '-.3px', textDecoration: 'none' }}>
              real<span style={{ color: '#9ca3af', fontWeight: 300 }}>return</span>.in
            </Link>
            <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ fontSize: 12, fontWeight: 500, background: '#1a6b3c', color: '#fff', padding: '6px 14px', borderRadius: 6, textDecoration: 'none' }}>
              Open calculator →
            </Link>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '7px 0' }}>
          <div className="pw">
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {breadcrumbs.map((bc, i) => (
                <span key={i}>
                  {bc.href
                    ? <Link href={bc.href} style={{ color: '#1a6b3c', textDecoration: 'none' }}>{bc.label}</Link>
                    : <span>{bc.label}</span>}
                  {i < breadcrumbs.length - 1 && <span style={{ margin: '0 5px', opacity: .4 }}>›</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* HERO */}
        <div style={{ background: '#0f3d22', padding: '24px 0 20px' }}>
          <div className="pw">
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>
              FD vs SIP · India 2025
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1.2, letterSpacing: '-.3px', margin: 0 }}>
              {config.h1}
            </h1>
          </div>
        </div>

        {/* BODY */}
        <div className="pw" style={{ paddingTop: 24, paddingBottom: 48 }}>
          <div className="tc">

            {/* LEFT COLUMN */}
            <div className="lc">

              {/* Verdict card */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>

                {/* Gap headline */}
                <div style={{ background: '#1a6b3c', padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 4 }}>
                    SIP wins by
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: '#fff', lineHeight: 1, marginBottom: 6 }}>
                    {gapL}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>
                    On {investedL} invested over {inputs.durationYears} years
                  </div>
                </div>

                {/* Two chips — clean, 3 numbers each */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e5e7eb' }}>
                  {[
                    { name: 'SIP', nominal: sipNomL, posttax: sipL, real: sipRealL, pct: sipPct, win: true },
                    { name: 'FD',  nominal: fdNomL,  posttax: fdL,  real: fdRealL,  pct: fdPct,  win: false },
                  ].map(chip => (
                    <div key={chip.name} style={{ background: '#fff', padding: '14px 16px' }}>

                      {/* Instrument name */}
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                        {chip.name}
                      </div>

                      {/* Before tax */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>Before tax</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: '#374151' }}>
                          {chip.nominal}
                        </div>
                      </div>

                      {/* After tax */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>After tax</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: chip.win ? '#1a6b3c' : '#374151' }}>
                          {chip.posttax}
                        </div>
                      </div>

                      {/* After inflation */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>After inflation</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: chip.win ? '#1a6b3c' : '#6b7280' }}>
                          {chip.real}
                        </div>
                      </div>

                      {/* Real return badge */}
                      <div style={{
                        display: 'inline-block',
                        background: chip.win ? '#f0fdf4' : (fd.realReturnPct < 0 ? '#fff7ed' : '#f9fafb'),
                        color: chip.win ? '#166534' : (fd.realReturnPct < 0 ? '#92400e' : '#6b7280'),
                        fontSize: 11, fontWeight: 600,
                        fontFamily: "'DM Mono', monospace",
                        padding: '3px 8px', borderRadius: 4,
                      }}>
                        {chip.pct}/yr real
                      </div>
                    </div>
                  ))}
                </div>

               {/* Context */}
                <div style={{ padding: '10px 16px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                    That {gapL} gap equals ~{gapYears} years of your monthly investment.
                  </p>
                </div>
              </div>

              {/* Assumptions */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>
                  Assumptions
                </div>
                {[
                  { label: 'FD interest rate',    val: `${inputs.fdRate}%` },
                  { label: 'SIP expected return', val: `${inputs.sipCagr}% p.a.` },
                  { label: 'Income tax slab',     val: `${inputs.taxSlab}%` },
                  { label: 'Inflation',           val: `${inputs.inflationRate}%` },
                  { label: 'Monthly investment',  val: `₹${inputs.monthlyAmount.toLocaleString('en-IN')}` },
                  { label: 'Duration',            val: `${inputs.durationYears} years` },
                ].map(p => (
                  <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>{p.label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#111827' }}>{p.val}</span>
                  </div>
                ))}
              </div>

              <Link href="/fd-vs-rd-vs-mf-returns-calculator" style={{ display: 'block', background: '#1a6b3c', color: '#fff', fontWeight: 600, fontSize: 13, padding: '11px 20px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
                Customise your inputs →
              </Link>
            </div>

            {/* RIGHT COLUMN */}
            <div>

              {/* AEO block */}
              <div style={{ ...sec, paddingTop: 0 }}>
                <div style={{ borderLeft: '3px solid #d97706', padding: '12px 14px', background: '#fffbeb', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#d97706', marginBottom: 5 }}>
                    In plain numbers
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 2, margin: 0 }}>
                    ₹{inputs.monthlyAmount.toLocaleString('en-IN')}/month in SIP for {inputs.durationYears} years → <strong>{sipNomL}</strong> before tax<br />
                    ₹{inputs.monthlyAmount.toLocaleString('en-IN')}/month in FD for {inputs.durationYears} years → <strong>{fdNomL}</strong> before tax<br />
                    After tax &amp; {inputs.inflationRate}% inflation: SIP <strong>{sipPct}/yr</strong> vs FD <strong>{fdPct}/yr</strong><br />
                    SIP overtakes FD in <strong>year {breakEvenYear}</strong> — ends {gapL} ahead
                  </p>
                </div>
              </div>

              {/* The gap */}
              <div style={sec}>
                <div style={lbl}>What's the difference?</div>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  Both invest <strong style={{ color: '#111827' }}>{investedL}</strong> over {inputs.durationYears} years. SIP returns <strong style={{ color: '#111827' }}>{gapL} more.</strong>
                </p>
                <div style={{ marginBottom: 14 }}>
                  {[
                    { name: 'SIP', width: 100,       corpus: sipNomL, pct: sipPct, green: true },
                    { name: 'FD',  width: fdBarWidth, corpus: fdNomL,  pct: fdPct,  green: false },
                  ].map(bar => (
                    <div key={bar.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: bar.green ? '#374151' : '#9ca3af', width: 32, flexShrink: 0 }}>{bar.name}</div>
                      <div style={{ flex: 1, height: 32, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${bar.width}%`, height: '100%', background: bar.green ? '#1a6b3c' : '#93c5fd', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: bar.green ? '#fff' : '#1e3a8a', whiteSpace: 'nowrap' }}>{bar.corpus}</span>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: bar.green ? '#1a6b3c' : '#6b7280', fontWeight: bar.green ? 600 : 400, width: 80, textAlign: 'right', flexShrink: 0 }}>
                        {bar.pct} real
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '11px 14px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  Same money, same duration. The only difference is <em>where</em> you put it.
                  SIP ends up giving you <strong>{gapL} more</strong> — roughly <strong>~{gapYears} years of your monthly savings</strong>.
                </div>
              </div>

              {/* Why SIP wins */}
              <div style={sec}>
                <div style={lbl}>Why does SIP come out ahead?</div>
                {[
                  {
                    icon: '📈', bg: '#f0fdf4',
                    title: `Grows faster — ${inputs.sipCagr}% vs ${inputs.fdRate}% per year`,
                    text: `That ${(inputs.sipCagr - inputs.fdRate).toFixed(0)}% annual difference compounds over ${inputs.durationYears} years into ${gapL} extra on ₹${inputs.monthlyAmount.toLocaleString('en-IN')}/month.`,
                  },
                  {
                    icon: '🧾', bg: '#fffbeb',
                    title: `${taxSavingL} less tax`,
                    text: `FD interest taxed at ${inputs.taxSlab}% like salary = ${fdTaxL} tax. SIP gains taxed at 12.5% (above ₹1.25L) = ${sipTaxL} tax. That ${taxSavingL} saving exists even before counting higher returns.`,
                  },
                  {
                    icon: '🔥', bg: '#fff1f2',
                    title: `FD barely beats ${inputs.inflationRate}% inflation`,
                    text: `${inputs.fdRate}% FD minus ${inputs.taxSlab}% tax = ${(inputs.fdRate * (1 - inputs.taxSlab / 100)).toFixed(1)}% post-tax. Minus ${inputs.inflationRate}% inflation = ${fdPct}/yr real. Your ${investedL} buys only ${fdRealL} in today's money after ${inputs.durationYears} years.`,
                  },
                ].map(r => (
                  <div key={r.title} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: r.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.55 }}>{r.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* When FD wins */}
              <div style={sec}>
                <div style={lbl}>But wait — when is FD the better choice?</div>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>SIP wins here — but FD is better if:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { title: 'You need money within 3 years',        text: 'SIP can drop 30–40% temporarily. FD guarantees your amount on the exact date you need it.' },
                    { title: 'You pay little or no income tax',       text: `At 0–5% tax, FD's real gain rises to 3–4%/yr — far more competitive.` },
                    { title: 'Market drops would make you stop SIP',  text: 'SIP fell 35% in 2020 then recovered. An abandoned SIP loses to FD every time.' },
                    { title: "It's your emergency fund",              text: '3–6 months of expenses should always be in FD — never in the markets.' },
                  ].map(chip => (
                    <div key={chip.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '11px 13px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{chip.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{chip.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison table */}
              <div style={sec}>
                <div style={lbl}>The full picture</div>
                <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}></th>
                        <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#1a6b3c' }}>SIP</th>
                        <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#2563eb' }}>FD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Before tax corpus',               sip: sipNomL,              fd: fdNomL,              sipWin: true  },
                        { label: 'Total invested',                  sip: investedL,            fd: investedL,           sipWin: false },
                        { label: 'Annual return rate',              sip: `${inputs.sipCagr}%`, fd: `${inputs.fdRate}%`, sipWin: true  },
                        { label: 'Tax paid',                        sip: sipTaxL,              fd: fdTaxL,              sipWin: true  },
                        { label: 'After-tax corpus',                sip: sipL,                 fd: fdL,                 sipWin: true  },
                        { label: `After inflation (${inputs.inflationRate}%)`, sip: sipRealL, fd: fdRealL,             sipWin: true  },
                        { label: 'Real return/yr',                  sip: sipPct,               fd: fdPct,               sipWin: true  },
                        { label: 'Guaranteed?',                     sip: '✗ No',               fd: '✓ Yes',             sipWin: false },
                        { label: 'Withdraw anytime?',               sip: '✓ Yes',              fd: 'Penalty',           sipWin: true  },
                        { label: 'Tax efficient?',                  sip: '✓ Yes',              fd: '✗ No',              sipWin: true  },
                      ].map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' }}>{row.label}</td>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', fontSize: 12, fontFamily: "'DM Mono', monospace", color: row.sipWin ? '#1a6b3c' : '#9ca3af', fontWeight: row.sipWin ? 600 : 400 }}>
                            {row.sip}
                          </td>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', fontSize: 12, fontFamily: "'DM Mono', monospace", color: row.sipWin ? '#9ca3af' : '#1a6b3c' }}>
                            {row.fd}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Year table */}
              <div style={sec}>
                <button
                  onClick={() => setYearOpen(o => !o)}
                  style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '11px 16px', fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>See how the money grows year by year</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', transform: yearOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
                </button>
                {yearOpen && (
                  <div style={{ marginTop: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#111827' }}>
                          <th style={{ padding: '9px 14px', color: '#fff', textAlign: 'left', fontSize: 11, fontWeight: 500 }}>Year</th>
                          <th style={{ padding: '9px 14px', color: '#4ade80', textAlign: 'right', fontSize: 11, fontWeight: 500 }}>SIP corpus</th>
                          <th style={{ padding: '9px 14px', color: '#93c5fd', textAlign: 'right', fontSize: 11, fontWeight: 500 }}>FD corpus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearByYear.map((row, i) => (
                          <tr key={row.year} style={{ background: i % 2 === 1 ? '#f9fafb' : '#fff' }}>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 500, color: '#374151' }}>
                              Year {row.year}
                            </td>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: "'DM Mono', monospace", color: row.year === inputs.durationYears ? '#1a6b3c' : '#374151', fontWeight: row.year === inputs.durationYears ? 600 : 400 }}>
                              {fmtL(row.sipTotal)}
                            </td>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: "'DM Mono', monospace", color: '#6b7280' }}>
                              {fmtL(row.fdTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: 11, color: '#9ca3af', padding: '8px 14px' }}>
                      Nominal corpus before tax. Assumed rates: SIP {inputs.sipCagr}% CAGR, FD {inputs.fdRate}%. Actual SIP returns vary with markets.
                    </p>
                  </div>
                )}
              </div>
          

              {/* Editorial */}
              <div style={sec}>
                <button
                  onClick={() => setEditOpen(o => !o)}
                  style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '11px 16px', fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>Why do these numbers work out this way?</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', transform: editOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
                </button>
                {editOpen && (
                  <div style={{ marginTop: 16 }}>
                    {[
                      {
                        h: `Why ${inputs.durationYears} years tips the balance toward SIP`,
                        p: `In the first 1–3 years, FD and SIP give similar results. From year 4 onwards, SIP's compounding takes over. By year ${breakEvenYear}, SIP overtakes FD — and by year ${inputs.durationYears} it's ${gapL} ahead. The longer the horizon, the bigger the gap.`,
                      },
                      {
                        h: 'How income tax quietly kills FD returns',
                        p: `In the ${inputs.taxSlab}% bracket, ${inputs.taxSlab} paise of every rupee of FD interest goes to tax. Over ${inputs.durationYears} years that's ${fdTaxL}. SIP profits are taxed at only 12.5% above ₹1.25L — just ${sipTaxL} total. That ${taxSavingL} difference is pure extra wealth.`,
                      },
                      {
                        h: `Why FD loses to ${inputs.inflationRate}% inflation`,
                        p: `FD earns ${inputs.fdRate}%. After ${inputs.taxSlab}% tax: ${(inputs.fdRate * (1 - inputs.taxSlab / 100)).toFixed(1)}%. Minus ${inputs.inflationRate}% inflation: ${fdPct}/year real. Your ${investedL} invested today only buys ${fdRealL} worth in ${inputs.durationYears} years — even though the account shows ${fdNomL}.`,
                      },
                      {
                        h: 'The smart middle path',
                        p: `Most planners suggest splitting: 70% in SIP for long-term growth, 30% in FD for safety and liquidity. SIP builds wealth. FD keeps a guaranteed buffer for near-term needs.`,
                      },
                    ].map(s => (
                      <div key={s.h}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '16px 0 5px' }}>{s.h}</h3>
                        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, margin: '0 0 8px' }}>{s.p}</p>
                      </div>
                    ))}
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', marginTop: 12, fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
                      <strong style={{ color: '#374151' }}>How calculated: </strong>
                      SIP uses effective monthly rate formula matching AMFI/Groww exactly. FD uses Indian bank quarterly compounding. Tax on SIP gains: 12.5% above ₹1.25L (Budget 2024). Inflation: Fisher equation. All numbers computed at page generation.
                    </div>
                  </div>
                )}
              </div>

              {/* FAQ */}
              <div style={{ ...sec, borderBottom: 'none' }}>
                <div style={lbl}>Common questions</div>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.4, fontFamily: "'Sora', sans-serif" }}>{faq.q}</span>
                      <span style={{ color: '#9ca3af', fontSize: 18, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {openFaq === i && (
                      <div style={{ paddingBottom: 12, fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Related */}
              {related.filter(Boolean).length > 0 && (
                <div style={{ paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                  <div style={lbl}>Try other combinations</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(related.filter(Boolean) as NonNullable<typeof related[number]>[]).map(r => (
                      <Link key={r.slug} href={`/fd-vs-sip/${r.slug}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, textDecoration: 'none', display: 'block' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{r.tag}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.4, marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#1a6b3c' }}>SIP {r.sipL} vs FD {r.fdL}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ background: '#111827', color: 'rgba(255,255,255,.4)', fontSize: 12, padding: '24px 20px', textAlign: 'center', lineHeight: 1.9 }}>
          <div style={{ marginBottom: 6 }}>
            {[
              { label: 'realreturn.in',  href: '/' },
              { label: 'Calculator',    href: '/fd-vs-rd-vs-mf-returns-calculator' },
              { label: 'Financial Plan', href: '/personal-financial-planner' },
              { label: 'Retirement',    href: '/retirement-corpus-calculator' },
            ].map((l, i) => (
              <span key={l.href}>
                {i > 0 && <span style={{ margin: '0 6px' }}> · </span>}
                <Link href={l.href} style={{ color: 'rgba(255,255,255,.55)', textDecoration: 'none' }}>{l.label}</Link>
              </span>
            ))}
          </div>
          <div>Free tools for Indian personal finance. No login. No ads. No data stored.</div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,.2)' }}>
            Returns are illustrative. SIP returns not guaranteed. Consult a SEBI-registered advisor before investing.
          </div>
        </footer>

      </div>
    </>
  )
}