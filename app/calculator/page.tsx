'use client'

import { useState, useEffect, useRef } from 'react'

export default function Calculator() {
  // ---- STATE ----
  const [years, setYears] = useState(10)
  const [tax, setTax] = useState(30)
  const [inf, setInf] = useState(6)
  const [fdType, setFdType] = useState<'lumpsum'|'monthly'>('lumpsum')
  const [fdLs, setFdLs] = useState(500000)
  const [fdMo, setFdMo] = useState(10000)
  const [fdRate, setFdRate] = useState(7)
  const [rdAmt, setRdAmt] = useState(10000)
  const [rdRate, setRdRate] = useState(6.5)
  const [mfType, setMfType] = useState<'sip'|'lumpsum'>('sip')
  const [mfSip, setMfSip] = useState(10000)
  const [mfLs, setMfLs] = useState(500000)
  const [mfRate, setMfRate] = useState(12)
  const [inclTax, setInclTax] = useState(true)
  const [inclInf, setInclInf] = useState(true)
  const [tableView, setTableView] = useState<'fd'|'rd'|'mf'>('fd')

  // ---- HELPERS ----
  const fmt = (n: number) => {
    if (!isFinite(n) || isNaN(n)) return '₹0'
    const abs = Math.abs(n)
    const prefix = n < 0 ? '-' : ''
    if (abs >= 1e7) return prefix + '₹' + (abs/1e7).toFixed(2) + 'Cr'
    if (abs >= 1e5) return prefix + '₹' + (abs/1e5).toFixed(2) + 'L'
    return prefix + '₹' + Math.round(abs).toLocaleString('en-IN')
  }
  const fmtP = (n: number) => (!isFinite(n)||isNaN(n)?'0.00':(n>=0?'+':'')+n.toFixed(2)) + '%'
  const fisher = (nom: number, inflation: number) =>
    ((1 + nom/100) / (1 + inflation/100) - 1) * 100

  // ---- CALCULATIONS ----
  const calcFD = (yrs = years) => {
    const r = fdRate / 100
    const taxR = inclTax ? tax/100 : 0
    const inflR = inclInf ? inf/100 : 0
    let corpus: number, invested: number
    if (fdType === 'lumpsum') {
      invested = fdLs
      corpus = invested * Math.pow(1+r, yrs)
    } else {
      const n = yrs * 12
      invested = fdMo * n
      corpus = 0
      for (let i = 0; i < n; i++) corpus += fdMo * Math.pow(1+r, (n-i)/12)
    }
    const gains = corpus - invested
    const taxPaid = gains * taxR
    const postTax = corpus - taxPaid
    const postTaxRate = fdRate * (1 - taxR)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1+inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate }
  }

  const calcRD = (yrs = years) => {
    const mr = (rdRate/100) / 12
    const n = yrs * 12
    const taxR = inclTax ? tax/100 : 0
    const inflR = inclInf ? inf/100 : 0
    let corpus = 0
    for (let i = 1; i <= n; i++) corpus += rdAmt * Math.pow(1+mr, i)
    const invested = rdAmt * n
    const gains = corpus - invested
    const taxPaid = gains * taxR
    const postTax = corpus - taxPaid
    const postTaxRate = rdRate * (1 - taxR)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1+inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate }
  }

  const calcMF = (yrs = years) => {
    const r = mfRate / 100
    const inflR = inclInf ? inf/100 : 0
    let corpus: number, invested: number
    if (mfType === 'sip') {
      const mr = r/12, n = yrs*12
      corpus = mfSip * ((Math.pow(1+mr,n)-1)/mr) * (1+mr)
      invested = mfSip * n
    } else {
      invested = mfLs
      corpus = invested * Math.pow(1+r, yrs)
    }
    const gains = corpus - invested
    const taxableGain = inclTax ? Math.max(0, gains - 125000) : 0
    const taxPaid = taxableGain * 0.125
    const postTax = corpus - taxPaid
    const effTaxRate = gains > 0 ? taxPaid/gains : 0
    const postTaxRate = mfRate * (1 - effTaxRate)
    const realReturn = fisher(postTaxRate, inclInf ? inf : 0)
    const realValue = postTax / Math.pow(1+inflR, yrs)
    return { corpus, invested, gains, taxPaid, postTax, realValue, realReturn, postTaxRate }
  }

  const fd = calcFD()
  const rd = calcRD()
  const mf = calcMF()

  // Break-even year
  const getBreakEven = () => {
    for (let y = 1; y <= 40; y++) {
      if (calcMF(y).realValue > calcFD(y).realValue) return y
    }
    return null
  }
  const breakEven = getBreakEven()

  // Winner
  const scores = [
    { id: 'fd', name: fdType==='lumpsum'?'FD':'FD Monthly', rr: fd.realReturn, rv: fd.realValue },
    { id: 'rd', name: 'RD', rr: rd.realReturn, rv: rd.realValue },
    { id: 'mf', name: mfType==='sip'?'SIP':'MF', rr: mf.realReturn, rv: mf.realValue },
  ].sort((a,b) => b.rr - a.rr)
  const winner = scores[0]

  // Year table
  const tableRows = Array.from({length: years}, (_,i) => {
    const y = i+1
    const d = tableView==='fd' ? calcFD(y) : tableView==='rd' ? calcRD(y) : calcMF(y)
    return { y, ...d }
  })

  // Bar max
  const maxNom = Math.max(fd.corpus, rd.corpus, mf.corpus)
  const maxReal = Math.max(fd.realValue, rd.realValue, mf.realValue)

  const rrColor = (v: number) => v > 0.5 ? '#1a6b3c' : v < 0 ? '#c0392b' : '#d4860a'
  const rrLabel = (v: number) => v > 0.5 ? 'positive' : v < 0 ? 'losing to inflation' : 'marginal'

  const sliderStyle = { width:'100%', accentColor:'#1a6b3c' }
  const labelStyle = { display:'flex' as const, justifyContent:'space-between' as const, marginBottom:'5px' }
  const labelText = { fontSize:'12px', color:'#4a5568' }
  const valText = { fontSize:'12px', fontWeight:'600' as const, color:'#0f1923', fontFamily:'DM Mono, monospace' }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f8fa' }}>

      {/* NAV */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'0 20px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <div style={{ width:'28px', height:'28px', background:'#1a6b3c', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>📊</div>
          <span style={{ fontSize:'15px', fontWeight:'700', color:'#0f1923' }}>real<span style={{color:'#1a6b3c'}}>return</span>.in</span>
        </a>
        <div style={{ display:'flex', gap:'8px' }}>
          {[{label:'Tax', key:'tax'}, {label:'Inflation', key:'inf'}].map(t => (
            <button key={t.key}
              onClick={() => t.key==='tax' ? setInclTax(!inclTax) : setInclInf(!inclInf)}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                background: (t.key==='tax'?inclTax:inclInf) ? '#e8f5ee' : '#f7f8fa',
                border: `1px solid ${(t.key==='tax'?inclTax:inclInf) ? '#1a6b3c' : '#e8ecf0'}`,
                color: (t.key==='tax'?inclTax:inclInf) ? '#1a6b3c' : '#8896a8',
                borderRadius:'999px', padding:'4px 12px', fontSize:'12px', fontWeight:'500', cursor:'pointer'
              }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:(t.key==='tax'?inclTax:inclInf)?'#1a6b3c':'#c0ccd8', display:'inline-block' }}></span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* PAGE TITLE */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'20px 24px' }}>
        <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0f1923', letterSpacing:'-0.5px' }}>
            Financial Reality Engine
          </h1>
          <p style={{ fontSize:'13px', color:'#4a5568', marginTop:'4px' }}>
            FD vs RD vs Mutual Funds — real returns after tax &amp; inflation
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ maxWidth:'1300px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'300px 1fr', gap:'20px', alignItems:'start' }}>

        {/* ===== INPUTS ===== */}
        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:'12px', overflow:'hidden', position:'sticky', top:'72px' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e8ecf0', fontSize:'11px', fontWeight:'600', textTransform:'uppercase' as const, letterSpacing:'1px', color:'#8896a8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            Configure
            <span style={{ fontSize:'10px', background:'#e8f5ee', color:'#1a6b3c', padding:'2px 8px', borderRadius:'999px' }}>● Live</span>
          </div>
          <div style={{ padding:'16px' }}>

            {/* General */}
            <div style={{ fontSize:'10px', fontWeight:'600', textTransform:'uppercase' as const, letterSpacing:'1px', color:'#8896a8', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'6px', height:'6px', background:'#f59e0b', borderRadius:'2px', display:'inline-block' }}></span>General
            </div>
            {[
              { label:'Duration', val:years, set:setYears, min:1, max:40, step:1, suffix:' yrs' },
              { label:'Tax Slab', val:tax, set:setTax, min:0, max:42, step:5, suffix:'%' },
              { label:'Inflation', val:inf, set:setInf, min:3, max:12, step:0.5, suffix:'%' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom:'12px' }}>
                <div style={labelStyle}>
                  <span style={labelText}>{s.label}</span>
                  <span style={valText}>{s.val}{s.suffix}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                  onChange={e => s.set(parseFloat(e.target.value))} style={sliderStyle} />
              </div>
            ))}

            {/* FD */}
            <div style={{ fontSize:'10px', fontWeight:'600', textTransform:'uppercase' as const, letterSpacing:'1px', color:'#8896a8', margin:'14px 0 10px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'6px', height:'6px', background:'#3b82f6', borderRadius:'2px', display:'inline-block' }}></span>Fixed Deposit
            </div>
            <div style={{ display:'flex', background:'#f7f8fa', border:'1px solid #e8ecf0', borderRadius:'8px', overflow:'hidden', marginBottom:'10px' }}>
              {(['lumpsum','monthly'] as const).map(t => (
                <button key={t} onClick={() => setFdType(t)} style={{
                  flex:1, padding:'6px', fontSize:'11px', fontWeight:'600', cursor:'pointer', border:'none',
                  background: fdType===t ? '#3b82f6' : 'transparent',
                  color: fdType===t ? '#fff' : '#8896a8',
                }}>{t==='lumpsum'?'Lump Sum':'Monthly'}</button>
              ))}
            </div>
            {fdType === 'lumpsum' ? (
              <div style={{ marginBottom:'10px' }}>
                <div style={labelStyle}><span style={labelText}>Amount</span><span style={valText}>{fmt(fdLs)}</span></div>
                <input type="range" min={10000} max={5000000} step={10000} value={fdLs} onChange={e=>setFdLs(+e.target.value)} style={sliderStyle}/>
              </div>
            ) : (
              <div style={{ marginBottom:'10px' }}>
                <div style={labelStyle}><span style={labelText}>Monthly</span><span style={valText}>{fmt(fdMo)}/mo</span></div>
                <input type="range" min={500} max={200000} step={500} value={fdMo} onChange={e=>setFdMo(+e.target.value)} style={sliderStyle}/>
              </div>
            )}
            <div style={{ marginBottom:'12px' }}>
              <div style={labelStyle}><span style={labelText}>Interest Rate</span><span style={valText}>{fdRate}%</span></div>
              <input type="range" min={4} max={10} step={0.25} value={fdRate} onChange={e=>setFdRate(+e.target.value)} style={sliderStyle}/>
            </div>

            {/* RD */}
            <div style={{ fontSize:'10px', fontWeight:'600', textTransform:'uppercase' as const, letterSpacing:'1px', color:'#8896a8', margin:'14px 0 10px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'6px', height:'6px', background:'#8b5cf6', borderRadius:'2px', display:'inline-block' }}></span>Recurring Deposit
            </div>
            <div style={{ marginBottom:'10px' }}>
              <div style={labelStyle}><span style={labelText}>Monthly</span><span style={valText}>{fmt(rdAmt)}/mo</span></div>
              <input type="range" min={500} max={200000} step={500} value={rdAmt} onChange={e=>setRdAmt(+e.target.value)} style={sliderStyle}/>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <div style={labelStyle}><span style={labelText}>Interest Rate</span><span style={valText}>{rdRate}%</span></div>
              <input type="range" min={4} max={9} step={0.25} value={rdRate} onChange={e=>setRdRate(+e.target.value)} style={sliderStyle}/>
            </div>

            {/* MF */}
            <div style={{ fontSize:'10px', fontWeight:'600', textTransform:'uppercase' as const, letterSpacing:'1px', color:'#8896a8', margin:'14px 0 10px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'6px', height:'6px', background:'#1a6b3c', borderRadius:'2px', display:'inline-block' }}></span>Mutual Funds
            </div>
            <div style={{ display:'flex', background:'#f7f8fa', border:'1px solid #e8ecf0', borderRadius:'8px', overflow:'hidden', marginBottom:'10px' }}>
              {(['sip','lumpsum'] as const).map(t => (
                <button key={t} onClick={() => setMfType(t)} style={{
                  flex:1, padding:'6px', fontSize:'11px', fontWeight:'600', cursor:'pointer', border:'none',
                  background: mfType===t ? '#1a6b3c' : 'transparent',
                  color: mfType===t ? '#fff' : '#8896a8',
                }}>{t==='sip'?'SIP Monthly':'Lump Sum'}</button>
              ))}
            </div>
            {mfType === 'sip' ? (
              <div style={{ marginBottom:'10px' }}>
                <div style={labelStyle}><span style={labelText}>Monthly SIP</span><span style={valText}>{fmt(mfSip)}/mo</span></div>
                <input type="range" min={500} max={200000} step={500} value={mfSip} onChange={e=>setMfSip(+e.target.value)} style={sliderStyle}/>
              </div>
            ) : (
              <div style={{ marginBottom:'10px' }}>
                <div style={labelStyle}><span style={labelText}>Amount</span><span style={valText}>{fmt(mfLs)}</span></div>
                <input type="range" min={10000} max={5000000} step={10000} value={mfLs} onChange={e=>setMfLs(+e.target.value)} style={sliderStyle}/>
              </div>
            )}
            <div style={{ marginBottom:'8px' }}>
              <div style={labelStyle}><span style={labelText}>Expected CAGR</span><span style={valText}>{mfRate}%</span></div>
              <input type="range" min={6} max={18} step={0.5} value={mfRate} onChange={e=>setMfRate(+e.target.value)} style={sliderStyle}/>
              <div style={{ fontSize:'10px', color:'#8896a8', marginTop:'3px' }}>Nifty 50 historical: ~12% CAGR</div>
            </div>

          </div>
        </div>

        {/* ===== RESULTS ===== */}
        <div>

          {/* REALITY BANNER */}
          <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:'12px', padding:'14px 20px', marginBottom:'16px', display:'flex', flexWrap:'wrap' as const, gap:'0', justifyContent:'space-between', alignItems:'center' }}>
            {[
              { val: fmt(fd.invested + rd.invested + mf.invested), label:'Total Invested' },
              { val: fmt(Math.max(fd.corpus, rd.corpus, mf.corpus)), label:'Best Nominal Corpus' },
              { val: fmt(Math.max(fd.realValue, rd.realValue, mf.realValue)), label:'Best Real Value', green:true },
              { val: fmt(Math.max(fd.postTax,rd.postTax,mf.postTax) - Math.max(fd.realValue,rd.realValue,mf.realValue)), label:'Lost to Inflation', red:true },
            ].map((item, i) => (
              <div key={i} style={{ textAlign:'center', padding:'0 12px', borderRight: i < 3 ? '1px solid #e8ecf0' : 'none' }}>
                <div style={{ fontSize:'18px', fontWeight:'700', fontFamily:'DM Mono, monospace', color: item.green ? '#1a6b3c' : item.red ? '#c0392b' : '#0f1923' }}>{item.val}</div>
                <div style={{ fontSize:'10px', color:'#8896a8', marginTop:'2px' }}>{item.label}</div>
              </div>
            ))}
            <div style={{ textAlign:'center', padding:'0 12px' }}>
              <div style={{ background:'#e8f5ee', border:'1px solid #1a6b3c', color:'#1a6b3c', borderRadius:'999px', padding:'4px 12px', fontSize:'12px', fontWeight:'600' }}>
                🏆 {winner.name} wins
              </div>
              <div style={{ fontSize:'10px', color:'#8896a8', marginTop:'4px' }}>{fmtP(winner.rr)} real/yr</div>
            </div>
          </div>

          {/* 3 CARDS */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
            {[
              { id:'fd', label: fdType==='lumpsum'?'Fixed Deposit':'FD Monthly', color:'#3b82f6', data:fd },
              { id:'rd', label:'Recurring Deposit', color:'#8b5cf6', data:rd },
              { id:'mf', label: mfType==='sip'?'Mutual Funds (SIP)':'Mutual Funds', color:'#1a6b3c', data:mf },
            ].map(card => {
              const isWinner = winner.id === card.id
              const rr = inclInf ? card.data.realReturn : card.data.postTaxRate
              return (
                <div key={card.id} style={{
                  background:'#fff',
                  border: isWinner ? `2px solid ${card.color}` : '1px solid #e8ecf0',
                  borderRadius:'12px', overflow:'hidden',
                  boxShadow: isWinner ? `0 0 20px ${card.color}20` : 'none',
                }}>
                  {/* top stripe */}
                  <div style={{ height:'3px', background:card.color }}></div>
                  {isWinner && (
                    <div style={{ background:card.color, color:'#fff', fontSize:'9px', fontWeight:'700', textAlign:'center', padding:'2px', letterSpacing:'1px' }}>
                      BEST REAL RETURN
                    </div>
                  )}
                  <div style={{ padding:'14px' }}>
                    <div style={{ fontSize:'10px', fontWeight:'600', color:card.color, textTransform:'uppercase' as const, letterSpacing:'1px', marginBottom:'8px' }}>{card.label}</div>

                    {/* Hero metric */}
                    <div style={{ fontSize:'30px', fontWeight:'700', fontFamily:'DM Mono, monospace', color:rrColor(rr), letterSpacing:'-1px', lineHeight:1 }}>
                      {fmtP(rr)}
                    </div>
                    <div style={{ fontSize:'10px', color:'#8896a8', marginTop:'3px', marginBottom:'12px' }}>
                      {inclInf && inclTax ? `real/yr · after ${tax}% tax & ${inf}% inflation` :
                       inclTax ? `post-tax/yr · after ${tax}% tax` :
                       inclInf ? `real/yr · after ${inf}% inflation` : 'stated rate (no adjustments)'}
                    </div>

                    {/* Illusion vs Reality */}
                    <div style={{ background:'#f7f8fa', borderRadius:'8px', padding:'10px', marginBottom:'10px' }}>
                      {[
                        { dot:'#9ca3af', label:'Invested', val:fmt(card.data.invested), vc:'#4a5568' },
                        { dot:'#9ca3af', label:'Gross Corpus', val:fmt(card.data.corpus), vc:'#4a5568' },
                        { dot:'#f59e0b', label:'Post-Tax', val:fmt(card.data.postTax), vc:'#d4860a' },
                        { dot:'#1a6b3c', label:'Real Value', val:fmt(card.data.realValue), vc:'#1a6b3c' },
                      ].map((row, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: i<3 ? '5px':'0' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#8896a8' }}>
                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:row.dot, display:'inline-block', flexShrink:0 }}></span>
                            {row.label}
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:'600', fontFamily:'DM Mono, monospace', color:row.vc }}>{row.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Loss block */}
                    <div style={{ background:'#fdecea', borderRadius:'8px', padding:'10px' }}>
                      <div style={{ fontSize:'10px', fontWeight:'600', color:'#c0392b', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'6px' }}>💸 Losses</div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'3px' }}>
                        <span style={{ color:'rgba(192,57,43,0.8)' }}>Tax paid</span>
                        <span style={{ fontFamily:'DM Mono, monospace', color:'#c0392b', fontWeight:'600' }}>{fmt(card.data.taxPaid)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px' }}>
                        <span style={{ color:'rgba(192,57,43,0.8)' }}>Inflation erosion</span>
                        <span style={{ fontFamily:'DM Mono, monospace', color:'#c0392b', fontWeight:'600' }}>{inclInf ? fmt(card.data.postTax - card.data.realValue) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* BAR CHART — Expected vs Real */}
          <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:'12px', padding:'18px', marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' as const, gap:'8px' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#4a5568', textTransform:'uppercase' as const, letterSpacing:'1px' }}>Expected vs Reality</div>
              <div style={{ display:'flex', gap:'14px' }}>
                {[['#9ca3af','Nominal'],['#f59e0b','Post-Tax'],['#1a6b3c','Real Value']].map(([c,l]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#4a5568' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'2px', background:c as string, display:'inline-block' }}></span>{l}
                  </div>
                ))}
              </div>
            </div>
            {[
              { label:'Fixed Deposit', nom:fd.corpus, tax:fd.postTax, real:fd.realValue, color:'#3b82f6' },
              { label:'Rec. Deposit', nom:rd.corpus, tax:rd.postTax, real:rd.realValue, color:'#8b5cf6' },
              { label:'Mutual Funds', nom:mf.corpus, tax:mf.postTax, real:mf.realValue, color:'#1a6b3c' },
            ].map(bar => (
              <div key={bar.label} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ fontSize:'11px', color:'#4a5568', width:'90px', flexShrink:0, textAlign:'right' as const }}>{bar.label}</div>
                <div style={{ flex:1, display:'flex', flexDirection:'column' as const, gap:'3px' }}>
                  {[
                    { val:bar.nom, bg:'#e5e7eb', fill:'#9ca3af' },
                    { val:bar.tax, bg:'#fef3dc', fill:'#f59e0b' },
                    { val:bar.real, bg:`${bar.color}15`, fill:bar.color },
                  ].map((b, i) => (
                    <div key={i} style={{ height:'8px', background:b.bg, borderRadius:'999px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.max(2,(b.val/maxNom)*100)}%`, background:b.fill, borderRadius:'999px', transition:'width 0.5s ease' }}></div>
                    </div>
                  ))}
                </div>
                <div style={{ width:'80px', flexShrink:0 }}>
                  <div style={{ fontSize:'10px', color:'#9ca3af', fontFamily:'DM Mono, monospace' }}>{fmt(bar.nom)}</div>
                  <div style={{ fontSize:'10px', color:'#f59e0b', fontFamily:'DM Mono, monospace' }}>{fmt(bar.tax)}</div>
                  <div style={{ fontSize:'10px', color:bar.color, fontFamily:'DM Mono, monospace', fontWeight:'600' }}>{fmt(bar.real)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* YEAR TABLE */}
          <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #e8ecf0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#4a5568', textTransform:'uppercase' as const, letterSpacing:'1px' }}>Year-by-Year Breakdown</div>
              <div style={{ display:'flex', gap:'6px' }}>
                {(['fd','rd','mf'] as const).map(v => (
                  <button key={v} onClick={()=>setTableView(v)} style={{
                    fontSize:'11px', padding:'3px 10px', borderRadius:'999px', cursor:'pointer',
                    background: tableView===v ? '#e8f5ee' : '#f7f8fa',
                    border: `1px solid ${tableView===v ? '#1a6b3c' : '#e8ecf0'}`,
                    color: tableView===v ? '#1a6b3c' : '#8896a8',
                    fontWeight: tableView===v ? '600' : '400',
                  }}>{v.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowY:'auto', maxHeight:'280px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                <thead>
                  <tr style={{ background:'#f7f8fa', position:'sticky', top:0 }}>
                    {['Year','Invested','Gross','Tax Paid','Post-Tax','Real Value','Real Gain'].map(h => (
                      <th key={h} style={{ padding:'7px 12px', textAlign: h==='Year'?'left':'right' as any, color:'#8896a8', fontWeight:'500', fontSize:'10px', textTransform:'uppercase' as const, letterSpacing:'0.5px', borderBottom:'1px solid #e8ecf0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(row => {
                    const realGain = row.realValue - row.invested
                    return (
                      <tr key={row.y} style={{ borderBottom:'1px solid #f0f2f4' }}>
                        <td style={{ padding:'7px 12px', color:'#4a5568', fontWeight:'500' }}>Year {row.y}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color:'#4a5568' }}>{fmt(row.invested)}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color:'#4a5568' }}>{fmt(row.corpus)}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color:'#c0392b' }}>{fmt(row.taxPaid)}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color:'#d4860a' }}>{fmt(row.postTax)}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color:'#1a6b3c', fontWeight:'600' }}>{fmt(row.realValue)}</td>
                        <td style={{ padding:'7px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', color: realGain>=0?'#1a6b3c':'#c0392b', fontWeight:'600' }}>
                          {realGain>=0?'+':''}{fmt(realGain)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* INSIGHTS */}
          <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:'12px', padding:'18px' }}>
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#4a5568', textTransform:'uppercase' as const, letterSpacing:'1px', marginBottom:'14px' }}>💡 Smart Insights</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'10px' }}>
              {[
                mf.realReturn > 2 && {
                  icon:'🚀',
                  text:`SIP at ${mfRate}% CAGR delivers <strong>${fmtP(mf.realReturn)}/yr</strong> real return. That's genuine wealth creation — purchasing power grows every year.`
                },
                fd.realReturn < 0 && {
                  icon:'⚠️',
                  text:`Your FD is losing purchasing power at <strong>${fmtP(fd.realReturn)}/yr</strong>. Bank balance grows but each rupee buys less. FD is safe parking, not wealth creation.`
                },
                fd.realReturn >= 0 && fd.realReturn < 1.5 && {
                  icon:'😐',
                  text:`FD real return is just <strong>${fmtP(fd.realReturn)}/yr</strong>. Technically positive but ${(mf.realReturn - fd.realReturn).toFixed(1)}pp below SIP — that gap compounds dramatically over ${years} years.`
                },
                breakEven && years >= breakEven && {
                  icon:'✅',
                  text:`SIP overtook FD at <strong>Year ${breakEven}</strong>. You&apos;re ${years-breakEven} years past the crossover — that&apos;s <strong>${fmt(mf.realValue-fd.realValue)}</strong> more real wealth.`
                },
                breakEven && years < breakEven && {
                  icon:'⏱️',
                  text:`SIP overtakes FD in real terms at <strong>Year ${breakEven}</strong>. Just ${breakEven-years} more year${breakEven-years>1?'s':''} to the crossover — stay invested.`
                },
                inclTax && {
                  icon:'🧾',
                  text:`Tax takes <strong>${fd.gains>0?(fd.taxPaid/fd.gains*100).toFixed(0):0}%</strong> of FD gains (${tax}% slab) vs only <strong>${mf.gains>0?(mf.taxPaid/mf.gains*100).toFixed(0):0}%</strong> of MF gains. LTCG is far more efficient.`
                },
                inclInf && {
                  icon:'📊',
                  text:`At ${inf}% inflation, purchasing power halves every <strong>${(72/inf).toFixed(0)} years</strong>. Any investment earning less than ${inf}% post-tax is shrinking your real wealth.`
                },
                years >= 15 && {
                  icon:'⚡',
                  text:`${years}-year horizon is a major advantage. Compounding over ${years} years turns every ₹1 into <strong>₹${(Math.pow(1+mfRate/100,years)).toFixed(1)}</strong> at ${mfRate}% CAGR.`
                },
                years <= 3 && {
                  icon:'🛡️',
                  text:`Short horizon alert: equity MFs can be volatile over ${years} years. FD and RD offer more predictable returns in this window.`
                },
              ].filter(Boolean).map((ins: any, i) => (
                <div key={i} style={{ background:'#f7f8fa', border:'1px solid #e8ecf0', borderRadius:'8px', padding:'12px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'16px', flexShrink:0 }}>{ins.icon}</span>
                  <span style={{ fontSize:'12px', color:'#4a5568', lineHeight:'1.6' }} dangerouslySetInnerHTML={{__html:ins.text}}></span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'14px', fontSize:'11px', color:'#b0bac8', lineHeight:'1.6' }}>
              Calculations use Fisher Equation for real returns. FD/RD tax at income slab rate. MF uses 12.5% LTCG with ₹1.25L exemption (Budget 2024). Not investment advice. Consult a SEBI-registered advisor.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}