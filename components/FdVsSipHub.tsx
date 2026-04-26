'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

// ── Constants ──────────────────────────────────────────────────────────────
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
  { href: '#',                                   title: 'Does FD beat inflation in India?',         sub: 'After 30% tax, FD real return is often negative' },
  { href: '/fd-vs-rd-vs-mf-returns-calculator', title: 'FD vs RD vs Mutual Funds Calculator',      sub: 'Compare all three with fully adjustable inputs' },
  { href: '/retirement-corpus-calculator',       title: 'How much SIP do I need for retirement?',  sub: 'Retirement corpus calculator with inflation adjustment' },
]

const FAQS = [
  { q: 'Is SIP in Equity Mutual Funds better than Fixed Deposit for all investors?', a: 'Not necessarily. Based on estimated returns, SIP (MF) tends to deliver higher real returns for investors in the 20–30% tax bracket investing for 5+ years. Fixed Deposit may be more suitable for goals under 3 years, emergency funds, or lower tax brackets. Actual SIP (MF) returns are not guaranteed.' },
  { q: 'Why does Fixed Deposit show a negative real return after tax?', a: 'At 30% tax: Fixed Deposit at 7% gives ~4.9% after tax. With 6% inflation, the estimated real return is around −1.0%/yr — purchasing power falls even as the balance grows. At 0% tax, FD estimated real return is approximately +0.9%/yr.' },
  { q: 'What is SIP in Equity Mutual Funds exactly?', a: 'SIP = Systematic Investment Plan in a Mutual Fund. You invest a fixed amount monthly into a diversified equity mutual fund. Returns are market-linked and not guaranteed — unlike Fixed Deposit which gives guaranteed returns. SIPs benefit from rupee cost averaging over long periods.' },
  { q: 'What happens to Equity Mutual Fund SIP if markets fall?', a: 'Portfolio value falls temporarily. In 2020, equity mutual fund portfolios fell approximately 35% before recovering. Historically, diversified equity SIPs held for 10+ years in India have not delivered negative returns — but past performance is not a guarantee of future results.' },
  { q: 'Can I invest in both Fixed Deposit and Equity Mutual Fund SIP?', a: 'Yes. A common approach: keep 3–6 months of expenses in Fixed Deposit as an emergency fund, invest additional savings via SIP in Equity Mutual Funds for longer-term goals. The right split depends on your goals, risk comfort, and time horizon.' },
]

// ── Calc helpers ───────────────────────────────────────────────────────────
function calcSIP(pmt: number, yrs: number, rate: number): number {
  const n = yrs * 12, mr = Math.pow(1 + rate / 100, 1 / 12) - 1
  return pmt * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
}
function calcFD(pmt: number, yrs: number, rate: number): number {
  const n = yrs * 12, mr = Math.pow(1 + rate / 400, 1 / 3) - 1
  let c = 0; for (let i = 0; i < n; i++) c = (c + pmt) * (1 + mr); return c
}
function fmtL(v: number): string {
  const l = v / 100000
  if (l >= 100) { const c = Math.round(l / 10) / 10; return `₹${c % 1 === 0 ? c.toFixed(0) : c.toFixed(1)}Cr` }
  const r = Math.round(l * 10) / 10; return `₹${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}L`
}
function fmtPct(p: number): string { return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%` }
function taxDesc(v: number): string {
  if (v === 0) return 'No tax — income ≤ ₹7L (new regime)'
  if (v <= 5)  return 'Income ₹7L–₹10L (new regime)'
  if (v <= 10) return 'Income ₹10L–₹12L (new regime)'
  if (v <= 15) return 'Income ₹12L–₹15L (new regime)'
  if (v <= 20) return 'Income ₹15L–₹20L (new regime)'
  return 'Income above ₹20L/yr (new regime)'
}
function sliderBg(val: number, min: number, max: number, dark = false): string {
  const pct = ((val - min) / (max - min) * 100).toFixed(1)
  return dark
    ? `linear-gradient(to right, #4ade80 ${pct}%, rgba(255,255,255,.15) ${pct}%)`
    : `linear-gradient(to right, #1a6b3c ${pct}%, #e5e7eb ${pct}%)`
}

// ── Design tokens ──────────────────────────────────────────────────────────
const G = '#1a6b3c', GD = '#0f3d22', GL = '#4ade80'
const GP = '#f0fdf4', GB = '#bbf7d0'
const AM = '#d97706', AMP = '#fffbeb', BL = '#2563eb'
const C200 = '#e5e7eb', C400 = '#9ca3af', C500 = '#6b7280'
const C700 = '#374151', C900 = '#111827'

// ── Component ──────────────────────────────────────────────────────────────
export default function FdVsSipHub() {
  const [state,       setState]       = useState<1|2>(1)
  const [amount,      setAmount]      = useState(10000)
  const [duration,    setDuration]    = useState(10)
  const [fdRate,      setFdRate]      = useState(7.0)
  const [mfRate,      setMfRate]      = useState(12.0)
  const [taxVal,      setTaxVal]      = useState(30)
  const [openFaq,     setOpenFaq]     = useState<number|null>(null)
  const [openColl,    setOpenColl]    = useState<Record<string,boolean>>({})
  const [showSticky,  setShowSticky]  = useState(false)
  const calcRef = useRef<HTMLDivElement>(null)

  // Derived
  const inv     = amount * 12 * duration
  const sipNom  = calcSIP(amount, duration, mfRate)
  const fdNom   = calcFD(amount, duration, fdRate)
  const tax     = taxVal / 100
  const sipTax  = Math.max(0, (sipNom - inv) - 125000) * 0.125
  const sipPT   = sipNom - sipTax
  const sipReal = sipPT / Math.pow(1.06, duration)
  const fdTax   = (fdNom - inv) * tax
  const fdPT    = fdNom - fdTax
  const fdReal  = fdPT / Math.pow(1.06, duration)
  const sipRealPct = ((1 + mfRate * (sipPT / sipNom) / 100) / 1.06 - 1) * 100
  const fdRealPct  = ((1 + fdRate * (1 - tax) / 100) / 1.06 - 1) * 100

  const handleTax = useCallback((v: number) => setTaxVal(v), [])
  const toggleColl = (key: string) => setOpenColl(p => ({ ...p, [key]: !p[key] }))
  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Sticky CTA: show when calc is out of view
  useEffect(() => {
    const el = calcRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setShowSticky(!e.isIntersecting),
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{`
        /* ── BASE ── */
        body{background:#f3f4f6!important;margin:0}
        *,*::before,*::after{box-sizing:border-box}
        .hub{font-family:'Sora',sans-serif;color:${C900};font-size:15px;line-height:1.6}

        /* ── NAV ── */
        .nav{background:#fff;border-bottom:1px solid ${C200};height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:99}
        .nav-logo{font-weight:700;font-size:15px;color:${G};text-decoration:none;letter-spacing:-.3px}
        .nav-logo span{color:${C400};font-weight:300}
        .nav-links{display:none}
        .nav-cta{font-size:11px;font-weight:600;background:${G};color:#fff;padding:7px 13px;border-radius:6px;text-decoration:none;white-space:nowrap}

        /* ── BREADCRUMB ── */
        .bc{background:#fff;border-bottom:1px solid ${C200};padding:7px 16px;font-size:11px;color:${C500}}
        .bc a{color:${G};text-decoration:none}

        /* ── HERO ── */
        .hero{background:${GD};padding:20px 16px 20px}
        .hero-ey{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:6px}
        .hero h1{font-size:24px;font-weight:700;color:#fff;line-height:1.2;letter-spacing:-.3px;margin-bottom:12px}
        .hero-intro{font-size:13px;color:rgba(255,255,255,.88);line-height:1.6;margin-bottom:12px}
        .hero-intro strong{color:${GL}}
        .cond-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
        .cond{border-radius:8px;padding:10px 12px}
        .cond.sip{background:rgba(74,222,128,.18);border:1px solid rgba(74,222,128,.35)}
        .cond.fd{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)}
        .cond-title{font-size:11px;font-weight:700;margin-bottom:5px;display:block}
        .cond.sip .cond-title{color:${GL}}
        .cond.fd .cond-title{color:#fff}
        .cond-body{font-size:11px;line-height:1.65;display:flex;flex-direction:column;gap:3px}
        .cond-body span{display:block}
        .cond.sip .cond-body{color:rgba(255,255,255,.92)}
        .cond.fd .cond-body{color:rgba(255,255,255,.8)}

        /* ── CALCULATOR CARD ── */
        .calc-wrap{padding:10px 12px 0}
        .calc-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
        .calc-head{background:${GD};padding:13px 16px}
        .calc-head h2{font-size:14px;font-weight:700;color:#fff;margin-bottom:2px}
        .calc-head p{font-size:10px;color:rgba(255,255,255,.5)}

        /* ── INPUTS ── */
        .inputs{padding:15px 15px;display:flex;flex-direction:column;gap:15px}
        .ig-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
        .ig-label{font-size:13px;font-weight:500;color:${C700}}
        .ig-label strong{font-size:14px;font-weight:700;color:${C900}}
        .amt-box{display:flex;align-items:center;gap:2px;background:${GP};border:1.5px solid ${GB};border-radius:8px;padding:5px 9px}
        .amt-pfx{font-family:'DM Mono',monospace;font-size:12px;color:${G};font-weight:700}
        .amt-inp{border:none;outline:none;background:transparent;font-family:'DM Mono',monospace;font-size:15px;font-weight:700;color:${G};text-align:right;width:68px}
        .amt-sfx{font-family:'DM Mono',monospace;font-size:10px;color:${C500}}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:99px;outline:none;cursor:pointer;margin-top:8px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;border:2.5px solid ${G};box-shadow:0 2px 8px rgba(26,107,60,.25);cursor:pointer}
        input[type=range]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#fff;border:2.5px solid ${G};cursor:pointer}
        .sl-hints{display:flex;justify-content:space-between;font-size:10px;color:${C500};margin-top:5px;font-family:'DM Mono',monospace}
        .dur-picks{display:flex;gap:4px;margin-top:9px}
        .dp{flex:1;text-align:center;padding:8px 0;border-radius:7px;font-size:12px;font-weight:600;background:#f9fafb;border:1.5px solid ${C200};color:${C700};cursor:pointer;transition:all .12s}
        .dp.on{background:${GP};border-color:${GB};color:${G}}
        .rate-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}
        .rate-item{display:flex;flex-direction:column}
        .rate-lbl{font-size:12px;font-weight:500;color:${C700};margin-bottom:3px}
        .rate-val{font-family:'DM Mono',monospace;font-size:18px;font-weight:700;margin-bottom:5px}
        .rate-val.dark{color:${C900}}
        .rate-val.grn{color:${G}}
        .mf-note{font-size:10px;color:${C500};margin-top:3px;font-style:italic}
        .cdiv{border:none;border-top:1px solid ${C200}}

        /* ── STATE 1 RESULTS ── */
        .nom-wrap{padding:13px 15px}
        .nom-lbl{font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:${C500};margin-bottom:10px}
        .chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:11px}
        .chip{border-radius:10px;padding:13px 14px;position:relative;overflow:hidden}
        .chip.sip{background:${GD}}
        .chip.fd{background:#f9fafb;border:1px solid ${C200}}
        .chip-name{font-size:11px;font-weight:600;margin-bottom:4px}
        .chip.sip .chip-name{color:rgba(255,255,255,.6)}
        .chip.fd .chip-name{color:${C500}}
        .chip-val{font-family:'DM Mono',monospace;font-size:26px;font-weight:700;line-height:1}
        .chip.sip .chip-val{color:#fff}
        .chip.fd .chip-val{color:${C900}}
        .chip-sub{font-size:10px;margin-top:4px}
        .chip.sip .chip-sub{color:rgba(255,255,255,.45)}
        .chip.fd .chip-sub{color:${C400}}
        .win-badge{position:absolute;top:7px;right:7px;background:${GL};color:${GD};font-size:7px;font-weight:800;padding:2px 5px;border-radius:3px;letter-spacing:.04em}
        .gap-strip{background:${GP};border:1px solid ${GB};border-radius:9px;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
        .gap-lbl{font-size:12px;color:${C700};font-weight:500;margin-bottom:2px}
        .gap-val{font-family:'DM Mono',monospace;font-size:24px;font-weight:700;color:${G}}
        .gap-right{font-size:10px;color:${C500};text-align:right;line-height:1.6}
        .real-teaser{background:${GP};border:1px solid ${GB};border-radius:8px;padding:9px 12px;margin-bottom:8px;font-size:12px;color:${C700};line-height:1.55}
        .real-teaser strong{color:${G};font-weight:700}
        .est-note{font-size:10px;color:${C400};text-align:center;padding:0 0 8px;font-style:italic}
        .reveal-btn{display:block;width:100%;border:none;border-top:2px solid ${GL};background:${GD};padding:14px 15px;cursor:pointer;text-align:center}
        .reveal-main{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;font-family:'Sora',sans-serif}
        .reveal-sub{font-size:11px;color:rgba(255,255,255,.6);margin-bottom:7px}
        .reveal-pill{display:inline-block;background:${GL};color:${GD};font-size:10px;font-weight:800;padding:5px 16px;border-radius:20px;letter-spacing:.04em}

        /* ── STATE 2 REAL RETURN ── */
        .real-wrap{display:none}
        .real-wrap.on{display:block}
        .back-btn{display:flex;align-items:center;gap:5px;width:100%;border:none;background:#f9fafb;border-bottom:1px solid ${C200};padding:10px 15px;font-size:13px;font-weight:600;color:${G};cursor:pointer;font-family:'Sora',sans-serif}
        .tax-sec{padding:13px 15px;background:#f9fafb;border-bottom:1px solid ${C200}}
        .tax-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .tax-lbl-t{font-size:13px;color:${C700};font-weight:600}
        .tax-cur{font-family:'DM Mono',monospace;font-size:15px;font-weight:700;color:${G};background:${GP};border:1.5px solid ${GB};border-radius:6px;padding:3px 10px}
        .tax-pills{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
        .tp{padding:6px 11px;border-radius:16px;font-size:11px;font-weight:500;border:1.5px solid ${C200};background:#fff;color:${C700};cursor:pointer;font-family:'DM Mono',monospace;transition:all .12s}
        .tp.on{background:${GP};border-color:${GB};color:${G};font-weight:700}
        .tax-desc{font-size:11px;color:${C500};margin-top:5px}
        .real-head{background:${G};padding:13px 15px}
        .real-badge{display:inline-flex;background:rgba(255,255,255,.15);border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.9);margin-bottom:5px}
        .real-hl{font-family:'DM Mono',monospace;font-size:17px;font-weight:600;color:#fff;line-height:1.25;margin-bottom:4px}
        .real-sub{font-size:11px;color:rgba(255,255,255,.7)}

        /* Mobile result rows */
        .result-rows{background:#fff;padding:12px 15px;display:flex;flex-direction:column}
        .rrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0;border-bottom:1px solid #f3f4f6}
        .rrow:last-child{border-bottom:none}
        .rrow-lbl{font-size:10px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:${C700};margin-bottom:6px;grid-column:1/-1}
        .rr-cell{display:flex;flex-direction:column;gap:2px}
        .rr-name{font-size:10px;font-weight:500;color:${C500};margin-bottom:2px}
        .rr-num{font-family:'DM Mono',monospace;font-size:21px;font-weight:700}
        .rr-num.win{color:${G}}
        .rr-num.lose{color:${C700}}
        .rr-pill{display:inline-block;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;padding:3px 7px;border-radius:4px;margin-top:2px}
        .rr-pill.g{background:${GP};color:#166534}
        .rr-pill.r{background:#fff7ed;color:#92400e}
        .r-insight{padding:11px 15px;background:${GP};border-top:1px solid ${GB};font-size:12px;color:#166534;line-height:1.65;font-weight:500}
        .r-assump{padding:9px 15px 13px;background:#f9fafb;border-top:1px solid ${C200}}
        .r-al{font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:${C500};margin-bottom:5px}
        .r-aps{display:flex;flex-wrap:wrap;gap:4px}
        .r-ap{font-size:11px;background:#fff;border:1px solid ${C200};border-radius:4px;padding:3px 8px;color:${C700};font-family:'DM Mono',monospace}

        /* Desktop: rchips hidden on mobile */
        .rchips-wrap{display:none}

        /* ── CONTENT ── */
        .content-sec{padding:12px 12px 90px;display:flex;flex-direction:column}
        .eeat{display:flex;flex-direction:column;gap:3px;padding:9px 0 13px;border-bottom:1px solid ${C200};margin-bottom:4px}
        .eeat-brand{font-size:12px;font-weight:700;color:${C900}}
        .eeat-disc{font-size:11px;color:${C500}}
        .sec{padding:14px 0;border-bottom:1px solid ${C200}}
        .sec:last-child{border-bottom:none}
        .sec-h{font-size:12px;font-weight:700;color:${C900};margin-bottom:11px;display:block;text-transform:none;letter-spacing:0}

        /* Direct answer */
        .da-wrap{background:#fff;border-left:3px solid ${G};border-radius:0 10px 10px 0;padding:14px 16px}
        .da-intro{font-size:13px;color:${C900};line-height:1.7;margin-bottom:10px}
        .da-intro strong{color:${G}}
        .da-points{list-style:none;padding:0;margin:0 0 10px;display:flex;flex-direction:column;gap:7px}
        .da-points li{font-size:12px;color:${C700};line-height:1.6;padding-left:16px;position:relative}
        .da-points li::before{content:'→';position:absolute;left:0;color:${G};font-size:11px;font-weight:700}
        .da-points li strong{color:${C900}}
        .da-note{font-size:11px;color:${C500};font-style:italic;padding-top:8px;border-top:1px solid ${C200}}

        /* AEO */
        .aeo{border-left:3px solid ${AM};padding:12px 14px;background:${AMP};border-radius:0 8px 8px 0}
        .aeo-tag{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${AM};margin-bottom:6px}
        .aeo p{font-size:12px;color:${C900};line-height:1.9}

        /* Bars */
        .bar-row{display:flex;align-items:center;gap:7px;margin-bottom:6px}
        .bar-name{font-size:12px;font-weight:600;width:52px;flex-shrink:0;color:${C700}}
        .bar-track{flex:1;height:28px;background:#f3f4f6;border-radius:6px;overflow:hidden}
        .bar-fill{height:100%;border-radius:6px;display:flex;align-items:center;padding-left:8px}
        .bar-fill span{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;white-space:nowrap}
        .bar-pct{font-family:'DM Mono',monospace;font-size:11px;width:62px;text-align:right;flex-shrink:0}

        /* Safety */
        .safety{background:#fff;border:1px solid ${C200};border-radius:10px;overflow:hidden}
        .safety-head{background:#1e3a8a;padding:12px 14px;display:flex;gap:9px;align-items:center}
        .safety-ht{font-size:13px;font-weight:600;color:#fff;line-height:1.4}
        .safety-body{padding:12px 14px;font-size:13px;color:${C700};line-height:1.7}

        /* Table */
        .ctable{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border:1px solid ${C200};border-radius:10px;overflow:hidden}
        .ctable th{padding:8px 9px;font-size:11px;font-weight:700;border-bottom:1px solid ${C200};text-align:left;background:#f9fafb;color:${C700}}
        .ctable td{padding:8px 9px;border-bottom:1px solid #f3f4f6;font-size:12px;line-height:1.5;vertical-align:middle;color:${C700}}
        .ctable tr:last-child td{border-bottom:none}
        .tag{font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;margin-left:3px}
        .tag-g{color:${G};background:${GP}}
        .tag-b{color:${BL};background:#eff6ff}
        .tag-a{color:${AM};background:${AMP}}

        /* Collapsible */
        .coll-hd{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:13px 0;border-bottom:1px solid ${C200}}
        .coll-hd h2{font-size:12px;font-weight:700;color:${C900};margin:0;text-transform:none;letter-spacing:0}
        .coll-icon{font-size:14px;color:${G};font-weight:700;transition:transform .2s;display:inline-block;flex-shrink:0}
        .coll-icon.open{transform:rotate(180deg)}
        .coll-body{max-height:0;overflow:hidden;transition:max-height .3s ease}
        .coll-body.open{max-height:2000px;padding-top:10px}

        /* Related tools grid */
        .rt-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .rt-item{background:${GP};border:1px solid ${GB};border-radius:8px;padding:12px 13px;text-decoration:none;font-size:12px;font-weight:600;color:${G};line-height:1.4;display:block;min-height:44px}

        /* Popular comparisons */
        .pop-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .pc{background:#fff;border:1px solid ${C200};border-radius:8px;padding:11px 12px;text-decoration:none;display:block;min-height:44px}
        .pc-tag{font-size:10px;font-weight:700;text-transform:uppercase;color:${C500};margin-bottom:2px}
        .pc-tag.live{color:${G}}
        .pc-title{font-size:12px;font-weight:600;color:${C900};line-height:1.4;margin-bottom:3px}
        .pc-nums{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:${G}}
        .pc-nums.soon{color:${C500};font-weight:400}

        /* Related guides */
        .rl{background:#fff;border:1px solid ${C200};border-radius:8px;padding:12px 13px;text-decoration:none;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;min-height:52px}
        .rl:last-child{margin-bottom:0}
        .rl-title{font-size:13px;font-weight:600;color:${C900};margin-bottom:2px}
        .rl-sub{font-size:11px;color:${C500}}

        /* FAQ */
        .fi{border-bottom:1px solid #f3f4f6}
        .fb{width:100%;background:none;border:none;padding:12px 0;cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;text-align:left;font-family:'Sora',sans-serif;min-height:44px}
        .fq{font-size:13px;font-weight:500;color:${C900};line-height:1.5}
        .fa{padding-bottom:12px;font-size:13px;color:${C700};line-height:1.7;display:none}
        .fi.open .fa{display:block}

        /* CTA */
        .cta{background:${GD};border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:9px;margin-top:4px}
        .cta strong{color:#fff;font-size:14px;display:block;margin-bottom:2px}
        .cta p{font-size:12px;color:rgba(255,255,255,.65);margin:0}
        .cta-btn-a{display:block;background:${GL};color:${GD};font-family:'Sora',sans-serif;font-size:14px;font-weight:700;padding:12px 18px;border-radius:8px;text-decoration:none;text-align:center}

        /* ── STICKY CTA — mobile only ── */
        .sticky-cta{
          display:none;position:fixed;bottom:0;left:0;right:0;z-index:88;
          padding:12px 14px 16px;background:#fff;border-top:2px solid ${G};
          box-shadow:0 -4px 16px rgba(0,0,0,.1);
        }
        .sticky-btn{
          display:block;width:100%;background:${G};color:#fff;
          font-family:'Sora',sans-serif;font-size:15px;font-weight:700;
          padding:14px;border-radius:8px;border:none;cursor:pointer;text-align:center;letter-spacing:.01em;
        }

        footer{background:#111827;color:rgba(255,255,255,.4);font-size:11px;padding:20px 16px;text-align:center;line-height:1.9}
        footer a{color:rgba(255,255,255,.55);text-decoration:none}
        .footer-disc{margin-top:4px;font-size:10px;color:rgba(255,255,255,.2)}

        /* =====================================================
           MOBILE ONLY (max-width:899px)
           All font sizes, colors benchmarked vs Groww/Angel One
           ===================================================== */
        @media(max-width:899px){
          .sticky-cta{display:block}
          .sticky-cta.hidden{transform:translateY(100%);transition:transform .2s}
          .sticky-cta.visible{transform:translateY(0);transition:transform .2s}
          .hero{padding:12px 16px 14px}
          .hero h1{font-size:21px;margin-bottom:8px}
          .hero-intro{font-size:13px;margin-bottom:10px}
          .cond{padding:10px 11px}
          .cond-title{font-size:11px;margin-bottom:5px}
          .cond-body{font-size:12px}
          .cond-grid{gap:6px}
          .calc-wrap{padding:8px 12px 0}
          .calc-head{padding:11px 13px}
          .calc-head h2{font-size:13px}
          .calc-head p{font-size:9px}
          .inputs{padding:13px 13px;gap:13px}
          .ig-label{font-size:13px}
          .ig-label strong{font-size:14px}
          .rate-val{font-size:17px}
          .chip-val{font-size:24px}
          .gap-val{font-size:22px}
          .content-sec{padding:12px 12px 90px}
          .eeat{flex-direction:column}
          .eeat-brand{font-size:12px}
          .eeat-disc{font-size:11px}
          .sec-h{font-size:12px}
          .da-intro{font-size:13px}
          .da-points li{font-size:12px}
          .aeo p{font-size:12px}
          .safety-body{font-size:13px}
          .rl-title{font-size:13px}
          .fq{font-size:13px}
          .fa{font-size:13px}
          .cta strong{font-size:14px}
          .cta p{font-size:12px}
        }

        /* =====================================================
           DESKTOP (min-width:900px)
           ===================================================== */
        @media(min-width:900px){
          .sticky-cta{display:none!important}
          .nav{padding:0 48px;height:58px}
          .nav-links{display:flex;gap:28px}
          .nav-link{font-size:13px;color:${C500};text-decoration:none;font-weight:500}
          .nav-link:hover{color:${G}}
          .bc{padding:8px 48px}
          .hero{padding:48px 48px 44px}
          .hero h1{font-size:38px;margin-bottom:18px}
          .hero-intro{font-size:15px;margin-bottom:16px}
          .cond-grid{max-width:720px}
          .cond{padding:14px 18px}
          .cond-title{font-size:11px}
          .cond-body{font-size:13px;line-height:1.7}

          /* Calculator: full width dark green band */
          .calc-wrap{padding:0;background:${GD}}
          .calc-card{
            max-width:1280px;margin:0 auto;border-radius:0;
            box-shadow:none;background:transparent;
            display:grid;grid-template-columns:1fr 1fr 1fr;
            grid-template-rows:auto 1fr;min-height:460px;
          }
          .calc-head{
            grid-column:1/-1;padding:22px 48px 18px;background:transparent;
            border-bottom:1px solid rgba(255,255,255,.08);
            display:flex;align-items:center;justify-content:space-between;
          }
          .calc-head h2{font-size:19px;margin-bottom:0}
          .calc-head p{font-size:12px;margin-top:2px}

          /* Inputs: left col on desktop */
          .inputs{
            padding:28px 40px 28px 48px;background:transparent;gap:24px;
            border-right:1px solid rgba(255,255,255,.08);
          }
          .ig-label{font-size:14px;color:rgba(255,255,255,.7)}
          .ig-label strong{color:#fff;font-size:14px}
          .amt-box{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)}
          .amt-pfx{color:rgba(255,255,255,.5);font-size:14px}
          .amt-inp{color:#fff;font-size:17px}
          .amt-sfx{color:rgba(255,255,255,.4)}
          input[type=range]{background:linear-gradient(to right,${GL} var(--p,50%),rgba(255,255,255,.15) var(--p,50%))}
          input[type=range]::-webkit-slider-thumb{background:${GD};border-color:${GL};width:24px;height:24px}
          input[type=range]::-moz-range-thumb{background:${GD};border-color:${GL};width:24px;height:24px}
          .sl-hints{color:rgba(255,255,255,.3);font-size:11px;margin-top:5px}
          .rate-row{display:flex;flex-direction:column;gap:22px}
          .rate-lbl{font-size:14px;color:rgba(255,255,255,.7)}
          .rate-val{display:none}
          .mf-note{color:rgba(255,255,255,.25)}
          .dp{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.6);padding:9px 0;font-size:13px}
          .dp.on{background:rgba(74,222,128,.2);border-color:rgba(74,222,128,.4);color:${GL}}
          .dur-picks{gap:8px;margin-top:12px}
          .cdiv{display:none}

          /* nom-outer: display:contents so children become grid cells */
          .nom-outer{display:contents!important}
          .nom-res{
            padding:28px 32px;display:flex;flex-direction:column;justify-content:center;
            border-right:1px solid rgba(255,255,255,.08);
          }
          .nom-lbl{color:rgba(255,255,255,.4);font-size:11px;margin-bottom:16px}
          .chips{gap:12px;margin-bottom:20px}
          .chip{padding:20px 22px;border-radius:14px}
          .chip.sip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15)}
          .chip.sip .chip-val{color:#fff}
          .chip.sip .chip-name{color:rgba(255,255,255,.5)}
          .chip.sip .chip-sub{color:rgba(255,255,255,.4)}
          .chip.fd{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
          .chip.fd .chip-val{color:rgba(255,255,255,.8)}
          .chip.fd .chip-name{color:rgba(255,255,255,.4)}
          .chip.fd .chip-sub{color:rgba(255,255,255,.3)}
          .chip-val{font-size:36px}
          .chip-name{font-size:12px}
          .chip-sub{font-size:12px;margin-top:8px}
          .gap-strip{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);border-radius:12px;margin-bottom:0;padding:16px 20px}
          .gap-lbl{color:rgba(255,255,255,.5);font-size:13px}
          .gap-val{font-size:32px;color:${GL}}
          .gap-right{color:rgba(255,255,255,.4);font-size:12px}
          .real-teaser{display:none}
          .est-note{color:rgba(255,255,255,.25);padding:12px 0 0;text-align:left}
          .reveal-btn{
            border-top:none;border-left:1px solid rgba(255,255,255,.08);
            background:transparent;display:flex;flex-direction:column;
            align-items:center;justify-content:center;padding:40px 32px;gap:10px;min-height:100%;
          }
          .reveal-btn:hover{background:rgba(255,255,255,.04)}
          .reveal-main{font-size:19px;color:#fff;text-align:center;line-height:1.3;margin-bottom:0}
          .reveal-sub{font-size:12px;color:rgba(255,255,255,.5);text-align:center;max-width:220px;margin-bottom:0}
          .reveal-pill{font-size:12px;padding:6px 20px}

          /* State 2: desktop grid */
          .real-wrap.on{
            display:grid!important;grid-column:2/-1;
            grid-template-columns:1fr 2fr;grid-template-rows:auto 1fr auto auto;
            background:transparent;
          }
          .back-btn{
            grid-column:1/-1;padding:11px 40px;
            background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.08);
            border-right:none;color:rgba(255,255,255,.6);font-size:13px;font-weight:500;
          }
          .back-btn:hover{color:#fff}
          .tax-sec{
            padding:28px;background:transparent;border-bottom:none;
            border-right:1px solid rgba(255,255,255,.08);
            display:flex;flex-direction:column;justify-content:center;gap:14px;
          }
          .tax-head{flex-direction:column;align-items:flex-start;gap:6px;margin-bottom:0}
          .tax-lbl-t{color:rgba(255,255,255,.6);font-size:13px}
          .tax-cur{font-size:16px;color:${GL};background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.3)}
          input[type=range]{background:linear-gradient(to right,${GL} var(--p,100%),rgba(255,255,255,.15) var(--p,100%))}
          .sl-hints{color:rgba(255,255,255,.3)}
          .tp{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;padding:5px 10px}
          .tp.on{background:rgba(74,222,128,.2);border-color:rgba(74,222,128,.4);color:${GL}}
          .tax-desc{color:rgba(255,255,255,.3);font-size:11px}
          .tax-pills{margin-top:0;gap:6px}
          .real-head{
            background:transparent;padding:24px 32px;
            display:flex;flex-direction:column;justify-content:center;gap:4px;
          }
          .real-hl{font-size:26px;margin-bottom:6px}
          .real-sub{font-size:12px;margin-bottom:16px;color:rgba(255,255,255,.65)}

          /* Desktop result chips (3-box) */
          .result-rows{display:none!important}
          .rchips-wrap{display:block}
          .rchips{display:grid;grid-template-columns:1fr 1fr;background:transparent;gap:10px;margin-top:0}
          .rc{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column}
          .rcn{font-size:11px;color:rgba(255,255,255,.45);margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px}
          .rpill{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px}
          .rpill.g{background:rgba(74,222,128,.25);color:${GL}}
          .rpill.r{background:rgba(251,191,36,.15);color:#fbbf24}
          .rr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:0}
          .rr-item{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:9px 8px;overflow:hidden}
          .rr-item.win{background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.25)}
          .rrl{color:rgba(255,255,255,.4);font-size:9px;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
          .rr-item.win .rrl{color:rgba(74,222,128,.8)}
          .rrv{font-family:'DM Mono',monospace;font-size:16px;font-weight:600;color:#fff}
          .rrv.m{color:rgba(255,255,255,.45)}
          .r-insight{grid-column:1/-1;padding:13px 40px;background:rgba(74,222,128,.08);border-top:1px solid rgba(74,222,128,.15);color:rgba(255,255,255,.75);font-size:13px}
          .r-assump{grid-column:1/-1;padding:11px 40px 18px;background:transparent;border-top:1px solid rgba(255,255,255,.06)}
          .r-al{color:rgba(255,255,255,.3)}
          .r-ap{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:11px}

          /* Content: 2-col grid */
          .content-sec{
            max-width:1280px;margin:0 auto;padding:40px 48px 64px;
            display:grid;grid-template-columns:240px 1fr;gap:40px;align-items:start;
          }
          .left-sticky{position:sticky;top:74px}
          .rt-card-d{background:#fff;border:1px solid ${C200};border-radius:12px;overflow:hidden}
          .rt-card-title{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${C500};padding:14px 16px 10px}
          .rt-grid{display:flex;flex-direction:column;gap:0;margin-bottom:0}
          .rt-item{background:transparent;border:none;border-radius:0;border-bottom:1px solid #f3f4f6;padding:10px 16px;font-size:13px;color:${G};display:flex;align-items:center;gap:8px;min-height:unset}
          .rt-item:last-child{border-bottom:none}
          .rt-dot{width:5px;height:5px;border-radius:50%;background:${G};flex-shrink:0}
          .right-col{display:flex;flex-direction:column}
          .sec{padding:26px 0}
          .sec-h{font-size:11px;margin-bottom:14px;text-transform:uppercase;letter-spacing:.04em;color:${C500}}
          .da-intro{font-size:14px}
          .da-points li{font-size:13px}
          .aeo p{font-size:14px;line-height:2}
          .safety-body{font-size:14px}
          .rl-title{font-size:14px}
          .fq{font-size:14px}
          .fa{font-size:13px}
          .eeat{flex-direction:row;justify-content:space-between;align-items:center;padding:12px 0 18px}
          .coll-hd{cursor:default;padding:0;border-bottom:none;margin-bottom:14px}
          .coll-icon{display:none}
          .coll-body{max-height:none!important;overflow:visible!important;padding-top:0!important}
          .sec.coll-sec{padding:26px 0}
          .cta{flex-direction:row;align-items:center;justify-content:space-between;padding:20px 24px}
          .cta-btn-a{flex-shrink:0;white-space:nowrap;font-size:14px;padding:12px 22px}
          footer{padding:28px 48px}
        }
      `}</style>

      <div className="hub">

        {/* NAV */}
        <nav className="nav">
          <Link href="/" className="nav-logo">real<span>return</span>.in</Link>
          <div className="nav-links">
            {[['FD vs SIP','/fd-vs-sip'],['FD vs RD vs MF','/fd-vs-rd-vs-mf-returns-calculator'],['Retirement','/retirement-corpus-calculator'],['Financial Plan','/personal-financial-planner']].map(([l,h])=>(
              <Link key={h} href={h} className="nav-link">{l}</Link>
            ))}
          </div>
          <Link href="/fd-vs-rd-vs-mf-returns-calculator" className="nav-cta">Full calculator →</Link>
        </nav>

        {/* BREADCRUMB */}
        <div className="bc">
          <Link href="/">Home</Link>
          <span style={{margin:'0 5px',opacity:.4}}>›</span>
          Fixed Deposit vs SIP (Equity Mutual Funds)
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-ey">Fixed Deposit vs SIP (Equity Mutual Funds)</div>
          <h1>FD vs SIP: Which is Better?</h1>
          <p className="hero-intro">
            Comparing <strong>Fixed Deposit (FD)</strong> vs <strong>SIP in Equity Mutual Funds</strong> — based on estimated returns after tax and inflation, SIP (MF) tends to come out ahead for most salaried investors over 5+ years.
          </p>
          <div className="cond-grid">
            <div className="cond sip">
              <span className="cond-title">✓ Consider SIP (MF) if</span>
              <div className="cond-body">
                <span>Investing for 5+ years</span>
                <span>In 20–30% tax bracket</span>
                <span>Goal is long-term growth</span>
              </div>
            </div>
            <div className="cond fd">
              <span className="cond-title">✓ Consider FD if</span>
              <div className="cond-body">
                <span>Need money within 3 years</span>
                <span>Pay 0–5% income tax</span>
                <span>It's your emergency fund</span>
              </div>
            </div>
          </div>
        </div>

        {/* CALCULATOR */}
        <div className="calc-wrap" ref={calcRef}>
        <div className="calc-card">
          <div className="calc-head">
            <div>
              <h2>FD vs SIP (MF) Calculator</h2>
              <p>Adjust inputs — estimated results update live</p>
            </div>
          </div>

          {/* INPUTS */}
          <div className="inputs">
            {/* Amount */}
            <div>
              <div className="ig-row">
                <span className="ig-label">Monthly investment</span>
                <div className="amt-box">
                  <span className="amt-pfx">₹</span>
                  <input className="amt-inp" type="number" value={amount} min={500} max={500000} step={500}
                    onChange={e => setAmount(parseFloat(e.target.value)||10000)}
                    style={{background:'transparent'}}
                  />
                  <span className="amt-sfx">/mo</span>
                </div>
              </div>
              <input type="range" min={500} max={100000} step={500} value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
                style={{background: sliderBg(Math.min(amount,100000),500,100000)}}
              />
            </div>

            {/* Duration */}
            <div>
              <div className="ig-row">
                <span className="ig-label">Duration — <strong>{duration} years</strong></span>
              </div>
              <input type="range" min={1} max={30} step={1} value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
                style={{background: sliderBg(duration,1,30)}}
              />
              <div className="dur-picks">
                {[3,5,10,15,20,30].map(y=>(
                  <button key={y} className={`dp${duration===y?' on':''}`} onClick={()=>setDuration(y)}>{y}Y</button>
                ))}
              </div>
            </div>

            {/* FD + MF rate: side by side on mobile, stacked on desktop */}
            <div className="rate-row">
              <div className="rate-item">
                <div className="rate-lbl">FD rate</div>
                <div className="rate-val dark">{fdRate.toFixed(1)}%</div>
                <input type="range" min={4} max={10} step={0.25} value={fdRate}
                  onChange={e => setFdRate(parseFloat(e.target.value))}
                  style={{background: sliderBg(fdRate,4,10)}}
                />
                <div className="sl-hints"><span>4%</span><span>7%</span><span>10%</span></div>
              </div>
              <div className="rate-item">
                <div className="rate-lbl">SIP (MF) return</div>
                <div className="rate-val grn">{mfRate.toFixed(1)}%</div>
                <input type="range" min={8} max={18} step={0.5} value={mfRate}
                  onChange={e => setMfRate(parseFloat(e.target.value))}
                  style={{background: sliderBg(mfRate,8,18)}}
                />
                <div className="sl-hints"><span>8%</span><span>12%</span><span>18%</span></div>
              </div>
            </div>
            {/* Desktop FD/MF labels (shown via CSS .rate-lbl on desktop) */}
            <div className="mf-note">12% = ~30yr historical avg for diversified equity funds</div>
          </div>

          <hr className="cdiv" />

          {/* STATE 1 — nominal */}
          <div className="nom-outer" style={{display: state===1 ? undefined : 'none'}}>
            <div className="nom-res">
              <div className="nom-lbl">Estimated corpus · before tax &amp; inflation</div>
              <div className="chips">
                <div className="chip sip">
                  <span className="win-badge">WINNER EST.</span>
                  <div className="chip-name">SIP (MF)</div>
                  <div className="chip-val">{fmtL(sipNom)}</div>
                  <div className="chip-sub">estimated</div>
                </div>
                <div className="chip fd">
                  <div className="chip-name">FD</div>
                  <div className="chip-val">{fmtL(fdNom)}</div>
                  <div className="chip-sub">estimated</div>
                </div>
              </div>
              <div className="gap-strip">
                <div>
                  <div className="gap-lbl">SIP (MF) est. ahead by</div>
                  <div className="gap-val">{fmtL(sipNom-fdNom)}</div>
                </div>
                <div className="gap-right">on {fmtL(inv)} invested<br/>over {duration} years</div>
              </div>
              {/* Real return teaser — mobile only */}
              <div className="real-teaser">
                After tax &amp; inflation: <strong>FD may be losing purchasing power. SIP builds real wealth.</strong> Tap below to see your actual numbers.
              </div>
              <div className="est-note">Estimates only. Actual SIP (MF) returns depend on market performance.</div>
            </div>

            <button className="reveal-btn" onClick={()=>setState(2)}>
              <div className="reveal-main">🔓 But what's the Real Return? ↓</div>
              <div className="reveal-sub">After tax &amp; inflation — most people don't know this number</div>
              <div><span className="reveal-pill">TAP TO REVEAL</span></div>
            </button>
          </div>

          {/* STATE 2 — real return */}
          <div className={`real-wrap${state===2?' on':''}`}>
            <button className="back-btn" onClick={()=>setState(1)}>← Back</button>

            {/* Tax */}
            <div className="tax-sec">
              <div className="tax-head">
                <span className="tax-lbl-t">Income tax slab</span>
                <span className="tax-cur">{taxVal}%</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={taxVal}
                onChange={e=>handleTax(parseInt(e.target.value))}
                style={{background: sliderBg(taxVal,0,30,false)}}
              />
              <div className="sl-hints"><span>0%</span><span>10%</span><span>20%</span><span>30%</span></div>
              <div className="tax-pills">
                {[0,5,10,20,30].map(v=>(
                  <button key={v} className={`tp${taxVal===v?' on':''}`} onClick={()=>handleTax(v)}>{v}%</button>
                ))}
              </div>
              <div className="tax-desc">{taxDesc(taxVal)}</div>
            </div>

            {/* Real head + desktop chips */}
            <div className="real-head">
              <div className="real-badge">✦ Estimated Real Return</div>
              <div className="real-hl">SIP (MF) ahead by {fmtL(sipPT-fdPT)} after tax</div>
              <div className="real-sub">After {taxVal}% tax &amp; 6% inflation on {fmtL(inv)} invested</div>
              {/* Desktop 3-box chips */}
              <div className="rchips-wrap">
                <div className="rchips">
                  {[
                    {name:'SIP (MF)', pct:sipRealPct, nom:fmtL(sipNom), pt:fmtL(sipPT), real:fmtL(sipReal), win:true},
                    {name:'FD',       pct:fdRealPct,  nom:fmtL(fdNom),  pt:fmtL(fdPT),  real:fmtL(fdReal),  win:false},
                  ].map(chip=>(
                    <div key={chip.name} className="rc">
                      <div className="rcn">
                        {chip.name}
                        <span className={`rpill ${chip.win?'g':'r'}`}>{fmtPct(chip.pct)}/yr est.</span>
                      </div>
                      <div className="rr">
                        <div className="rr-item"><div className="rrl">Nominal</div><div className="rrv">{chip.nom}</div></div>
                        <div className={`rr-item${chip.win?' win':''}`}><div className="rrl">After tax</div><div className={`rrv${chip.win?'':' m'}`}>{chip.pt}</div></div>
                        <div className={`rr-item${chip.win?' win':''}`}><div className="rrl">Real value</div><div className={`rrv${chip.win?'':' m'}`}>{chip.real}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile result rows */}
            <div className="result-rows">
              {[
                {lbl:'Nominal (before tax)', sn:fmtL(sipNom), fn:fmtL(fdNom), sPill:null, fPill:null},
                {lbl:'After tax', sn:fmtL(sipPT), fn:fmtL(fdPT), sPill:fmtPct(sipRealPct)+'/yr est.', fPill:fmtPct(fdRealPct)+'/yr est.', sfWin:true},
                {lbl:'Real value (after inflation)', sn:fmtL(sipReal), fn:fmtL(fdReal), sPill:null, fPill:null},
              ].map((row,i)=>(
                <div key={i} className="rrow">
                  <div className="rrow-lbl">{row.lbl}</div>
                  <div className="rr-cell">
                    <div className="rr-name">SIP (MF){i===1?' · 12.5% LTCG':''}</div>
                    <div className="rr-num win">{row.sn}</div>
                    {row.sPill && <span className="rr-pill g">{row.sPill}</span>}
                  </div>
                  <div className="rr-cell">
                    <div className="rr-name">FD{i===1?' · income tax':''}</div>
                    <div className="rr-num lose">{row.fn}</div>
                    {row.fPill && <span className={`rr-pill ${fdRealPct<0?'r':'g'}`}>{row.fPill}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="r-insight">
              {fdRealPct < 0
                ? <>At this tax rate, estimated FD real return is <strong>negative after inflation</strong>. {fmtL(fdNom)} today has the estimated purchasing power of {fmtL(fdReal)} in {duration} years.</>
                : <>Estimated real returns — FD: <strong>{fmtPct(fdRealPct)}/yr</strong>, SIP (MF): <strong>{fmtPct(sipRealPct)}/yr</strong>. Actual returns vary with markets.</>
              }
            </div>
            <div className="r-assump">
              <div className="r-al">Assumptions used</div>
              <div className="r-aps">
                {[`FD ${fdRate.toFixed(1)}%`,`SIP (MF) ${mfRate.toFixed(1)}%`,`Tax ${taxVal}%`,'Inflation 6%'].map(p=>(
                  <span key={p} className="r-ap">{p}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
        </div>{/* end calc-wrap */}

        {/* CONTENT */}
        <div className="content-sec">

          {/* Left: related tools desktop sidebar */}
          <div className="left-sticky">
            <div className="rt-card-d">
              <div className="rt-card-title">Related tools</div>
              <div className="rt-grid">
                {RELATED_TOOLS.map((t,i)=>(
                  <Link key={`tool-${i}`} href={t.href} className="rt-item">
                    <span className="rt-dot"/>
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: content */}
          <div className="right-col">

            {/* E-E-A-T */}
            <div className="eeat">
              <span className="eeat-brand">realreturn.in · See what your money actually earns</span>
              <span className="eeat-disc">Estimates only · Not financial advice · Based on current Indian tax laws</span>
            </div>

            {/* Direct answer */}
            <div className="sec">
              <div className="da-wrap">
                <p className="da-intro">Based on estimated returns, <strong>SIP in Equity Mutual Funds tends to come out ahead</strong> of Fixed Deposit for most salaried investors — especially after accounting for tax and inflation.</p>
                <ul className="da-points">
                  <li>At 30% tax, FD's estimated real return is <strong>negative</strong> after 6% inflation</li>
                  <li>SIP (MF) benefits from lower 12.5% LTCG tax vs income tax on FD interest</li>
                  <li>FD remains better for goals under 3 years or if you're in a 0–5% tax bracket</li>
                </ul>
                <p className="da-note">Use the calculator above to see your exact numbers.</p>
              </div>
            </div>

            {/* AEO */}
            <div className="sec">
              <div className="aeo">
                <div className="aeo-tag">In plain numbers</div>
                <p>
                  SIP in Equity Mutual Funds at 12% for 10 years on ₹10,000/month → <strong>₹22.4L</strong> estimated (before tax)<br/>
                  Fixed Deposit (FD) at 7% for 10 years on ₹10,000/month → <strong>₹17.4L</strong> estimated (before tax)<br/>
                  After 30% tax &amp; 6% inflation: SIP (MF) <strong>+5.1%/yr est. real</strong>, Fixed Deposit <strong>−1.0%/yr est. real</strong><br/>
                  Estimated gap: SIP (MF) ahead by <strong>~₹5.5L after tax</strong> on the same ₹12L invested
                </p>
              </div>
            </div>

            {/* Gap bars */}
            <div className="sec">
              <span className="sec-h">Estimated gap after 10 years</span>
              <p style={{fontSize:12,color:C500,marginBottom:12}}>Same ₹10,000/month, same 10 years, same ₹12L invested.</p>
              <div style={{marginBottom:12}}>
                {[{name:'SIP (MF)',w:100,corpus:'₹22.4L',pct:'+5.1%',green:true},{name:'FD',w:77,corpus:'₹17.4L',pct:'−1.0%',green:false}].map(bar=>(
                  <div key={bar.name} className="bar-row">
                    <div className="bar-name" style={{color:bar.green?C700:C400}}>{bar.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width:`${bar.w}%`,background:bar.green?G:'#93c5fd'}}>
                        <span style={{color:bar.green?'#fff':'#1e3a8a'}}>{bar.corpus}</span>
                      </div>
                    </div>
                    <div className="bar-pct" style={{color:bar.green?G:C500,fontWeight:bar.green?600:400}}>{bar.pct}</div>
                  </div>
                ))}
              </div>
              <div style={{background:GP,border:`1px solid ${GB}`,borderRadius:8,padding:'10px 12px',fontSize:12,color:C700,lineHeight:1.6}}>
                The estimated ₹5L gap = <strong>~4 years of your monthly savings</strong>. Actual SIP (MF) returns depend on market performance.
              </div>
            </div>

            {/* When FD wins */}
            <div className="sec">
              <span className="sec-h">When does Fixed Deposit make more sense?</span>
              <div className="safety">
                <div className="safety-head"><span style={{fontSize:20}}>🛡️</span><span className="safety-ht">Fixed Deposit's guarantee is real — here's when it's the better choice.</span></div>
                <div className="safety-body">
                  <p style={{marginBottom:8}}><strong>1. Short timeline.</strong> SIP (MF) can fall 30–40% right when you need the money. Fixed Deposit gives a fixed amount on a fixed date.</p>
                  <p style={{marginBottom:8}}><strong>2. Low tax bracket.</strong> At 0% tax, FD's estimated real return is ~+0.9%/yr. The SIP advantage shrinks significantly.</p>
                  <p style={{color:C500,marginBottom:0}}><strong>3. Emergency fund.</strong> Keep 3–6 months of expenses in Fixed Deposit — not in market-linked instruments.</p>
                </div>
              </div>
            </div>

            {/* Comparison table — collapsible on mobile */}
            <div className="sec coll-sec">
              <div className="coll-hd" onClick={()=>toggleColl('table')}>
                <h2>Full comparison — Fixed Deposit vs SIP (Equity Mutual Funds)</h2>
                <span className={`coll-icon${openColl['table']?' open':''}`}>↓</span>
              </div>
              <div className={`coll-body${openColl['table']?' open':''}`}>
                <div style={{overflowX:'auto',paddingTop:4}}>
                  <table className="ctable">
                    <thead><tr>
                      <th style={{color:C500,width:'35%'}}>Factor</th>
                      <th style={{color:G}}>SIP (MF)</th>
                      <th style={{color:BL}}>FD</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ['Est. returns','10–14% historically','Higher','6–8% fixed','Guaranteed','g','b'],
                        ['Tax on gains','12.5% LTCG above ₹1.25L','Lower','At income slab (20–30%)','Higher','g','b'],
                        ['Risk','Can fall 30–40% short term','','Zero — guaranteed','Safer','','b'],
                        ['Beats inflation?','Est. yes at 30% slab','Est. yes','Est. no at 30% slab','','g',''],
                        ['Liquidity','Withdraw anytime','Flexible','Penalty for early exit','','g',''],
                        ['Best for','5yr+ goals','Long term','Under 3yr, emergency','Short term','g','b'],
                      ].map(([f,s,st,fd,ft,sc,fc],i)=>(
                        <tr key={i} style={{background:i%2===0?'#fff':'#f9fafb'}}>
                          <td>{f}</td>
                          <td>{s}{st&&<span className={`tag tag-${sc}`}>{st}</span>}</td>
                          <td>{fd}{ft&&<span className={`tag tag-${fc}`}>{ft}</span>}</td>
                        </tr>
                      ))}
                      <tr style={{background:'#f9fafb'}}>
                        <td>Common split</td>
                        <td colSpan={2} style={{textAlign:'center'}}><span className="tag tag-a">70% SIP (MF) + 30% FD</span> — a common approach</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Popular comparisons — collapsible on mobile */}
            <div className="sec coll-sec">
              <div className="coll-hd" onClick={()=>toggleColl('pop')}>
                <h2>Popular comparisons</h2>
                <span className={`coll-icon${openColl['pop']?' open':''}`}>↓</span>
              </div>
              <div className={`coll-body${openColl['pop']?' open':''}`}>
                <p style={{fontSize:11,color:C500,marginBottom:10}}>Detailed Fixed Deposit vs SIP comparison for specific amounts and durations.</p>
                <div className="pop-grid">
                  {POPULAR_PAGES.map((p,i)=>(
                    <Link key={`pop-${i}`} href={p.href} className="pc">
                      <div className={`pc-tag${p.live?' live':''}`}>{p.tag}</div>
                      <div className="pc-title">{p.title}</div>
                      <div className={`pc-nums${!p.live?' soon':''}`}>{p.nums}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Related guides — collapsible on mobile */}
            <div className="sec coll-sec">
              <div className="coll-hd" onClick={()=>toggleColl('guides')}>
                <h2>Related guides</h2>
                <span className={`coll-icon${openColl['guides']?' open':''}`}>↓</span>
              </div>
              <div className={`coll-body${openColl['guides']?' open':''}`}>
                {RELATED_GUIDES.map((g,i)=>(
                  <Link key={`guide-${i}`} href={g.href} className="rl">
                    <div><div className="rl-title">{g.title}</div><div className="rl-sub">{g.sub}</div></div>
                    <span style={{color:C400,flexShrink:0}}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="sec" style={{borderBottom:'none'}}>
              <span className="sec-h">Common questions</span>
              {FAQS.map((faq,i)=>(
                <div key={i} className={`fi${openFaq===i?' open':''}`}>
                  <button className="fb" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                    <span className="fq">{faq.q}</span>
                    <span style={{color:C400,fontSize:18,flexShrink:0}}>{openFaq===i?'−':'+'}</span>
                  </button>
                  <div className="fa">{faq.a}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="cta">
              <div>
                <strong>Compare FD vs RD vs Mutual Funds together</strong>
                <p>Full calculator compares all three side by side with fully adjustable inputs.</p>
              </div>
              <Link href="/fd-vs-rd-vs-mf-returns-calculator" className="cta-btn-a">Open full calculator →</Link>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <footer>
          <div style={{marginBottom:5}}>
            {[['realreturn.in','/'],['FD vs SIP','/fd-vs-sip'],['FD vs RD vs MF','/fd-vs-rd-vs-mf-returns-calculator'],['Financial Plan','/personal-financial-planner'],['Retirement','/retirement-corpus-calculator']].map(([l,h],i)=>(
              <span key={`f-${i}`}>{i>0&&<span style={{margin:'0 5px'}}> · </span>}<Link href={h} style={{color:'rgba(255,255,255,.55)',textDecoration:'none'}}>{l}</Link></span>
            ))}
          </div>
          <div>See what your money actually earns. Free. No login.</div>
          <div className="footer-disc">Estimates only. Not financial advice. Consult a SEBI-registered advisor before investing.</div>
        </footer>

        {/* STICKY CTA — mobile only, shown when calc out of view */}
        <div className={`sticky-cta${showSticky?' visible':' hidden'}`}>
          <button className="sticky-btn" onClick={scrollToCalc}>Try your numbers →</button>
        </div>

      </div>
    </>
  )
}
