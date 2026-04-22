// lib/fd-sip-calculator.ts

export interface CalcInputs {
  monthlyAmount: number
  durationYears: number
  fdRate: number
  sipCagr: number
  taxSlab: number
  inflationRate: number
  ltcgRate: number
  ltcgExemption: number
}

export interface InstrumentResult {
  nominalCorpus: number
  totalInvested: number
  totalGains: number
  taxPaid: number
  postTaxCorpus: number
  realCorpus: number
  realReturnPct: number
  nominalReturnPct: number
}

export interface CalcResult {
  sip: InstrumentResult
  fd: InstrumentResult
  gapAmount: number
  gapMonths: number
  breakEvenYear: number
  sipWinsByRealPct: number
  yearByYear: YearRow[]
}

export interface YearRow {
  year: number
  sipTotal: number
  fdTotal: number
  sipAfterTax: number
  fdAfterTax: number
  sipTodayMoney: number
  fdTodayMoney: number
}

// ── SIP corpus (annuity-due, effective monthly rate) ──────────────────────
function calcSIPCorpus(pmt: number, annualRate: number, years: number): number {
  const n  = years * 12
  const mr = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  return pmt * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
}

// ── FD monthly (quarterly compounding — standard Indian bank) ─────────────
function calcFDCorpus(pmt: number, annualRate: number, years: number): number {
  const n           = years * 12
  const effectiveMr = Math.pow(1 + (annualRate / 100) / 4, 1 / 3) - 1
  let corpus        = 0
  for (let i = 0; i < n; i++) {
    corpus = (corpus + pmt) * (1 + effectiveMr)
  }
  return corpus
}

// ── SIP LTCG tax (Budget 2024: 12.5% on gains above ₹1.25L) ─────────────
function calcSIPTax(
  corpus: number,
  totalInvested: number,
  ltcgRate: number,
  ltcgExemption: number
): number {
  const gains        = corpus - totalInvested
  const taxableGains = Math.max(0, gains - ltcgExemption)
  return taxableGains * (ltcgRate / 100)
}

// ── FD income tax ─────────────────────────────────────────────────────────
function calcFDTax(
  corpus: number,
  totalInvested: number,
  taxSlab: number
): number {
  const interest = corpus - totalInvested
  return interest * (taxSlab / 100)
}

// ── Inflation-adjusted value ──────────────────────────────────────────────
function toTodaysMoney(futureValue: number, inflationRate: number, years: number): number {
  return futureValue / Math.pow(1 + inflationRate / 100, years)
}

// ── Real return using Fisher equation ─────────────────────────────────────
function realReturn(postTaxNominalRate: number, inflationRate: number): number {
  return ((1 + postTaxNominalRate / 100) / (1 + inflationRate / 100) - 1) * 100
}

// ── Break-even year: first year SIP post-tax corpus > FD post-tax corpus ──
function findBreakEvenYear(inputs: CalcInputs): number {
  let fdWasAhead = false
  for (let y = 1; y <= inputs.durationYears; y++) {
    const sip = calcSIPCorpus(inputs.monthlyAmount, inputs.sipCagr, y)
    const fd  = calcFDCorpus(inputs.monthlyAmount, inputs.fdRate, y)
    if (fd > sip) fdWasAhead = true
    if (fdWasAhead && sip >= fd) return y
  }
  // FD never led — SIP was ahead from start
  // In this case find the year SIP first meaningfully exceeds FD by >5%
  for (let y = 1; y <= inputs.durationYears; y++) {
    const sip = calcSIPCorpus(inputs.monthlyAmount, inputs.sipCagr, y)
    const fd  = calcFDCorpus(inputs.monthlyAmount, inputs.fdRate, y)
    if (sip > fd * 1.05) return y
  }
  return inputs.durationYears
}

// ── Year-by-year rows ─────────────────────────────────────────────────────
function buildYearByYear(inputs: CalcInputs): YearRow[] {
  const {
    monthlyAmount, fdRate, sipCagr, taxSlab,
    inflationRate, ltcgRate, ltcgExemption, durationYears,
  } = inputs

  const milestones = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30].filter(y => y <= durationYears)

  return milestones.map(year => {
    const invested    = monthlyAmount * 12 * year
    const sipTotal    = calcSIPCorpus(monthlyAmount, sipCagr, year)
    const fdTotal     = calcFDCorpus(monthlyAmount, fdRate, year)
    const sipTax      = calcSIPTax(sipTotal, invested, ltcgRate, ltcgExemption)
    const fdTax       = calcFDTax(fdTotal, invested, taxSlab)
    const sipAfterTax = sipTotal - sipTax
    const fdAfterTax  = fdTotal  - fdTax

    return {
      year,
      sipTotal:      Math.round(sipTotal),
      fdTotal:       Math.round(fdTotal),
      sipAfterTax:   Math.round(sipAfterTax),
      fdAfterTax:    Math.round(fdAfterTax),
      sipTodayMoney: Math.round(toTodaysMoney(sipAfterTax, inflationRate, year)),
      fdTodayMoney:  Math.round(toTodaysMoney(fdAfterTax,  inflationRate, year)),
    }
  })
}

// ── Main export ───────────────────────────────────────────────────────────
export function calculate(inputs: CalcInputs): CalcResult {
  const {
    monthlyAmount, durationYears, fdRate, sipCagr,
    taxSlab, inflationRate, ltcgRate, ltcgExemption,
  } = inputs

  const totalInvested = monthlyAmount * 12 * durationYears

  // SIP
  const sipNominal     = calcSIPCorpus(monthlyAmount, sipCagr, durationYears)
  const sipTax         = calcSIPTax(sipNominal, totalInvested, ltcgRate, ltcgExemption)
  const sipPostTax     = sipNominal - sipTax
  const sipReal        = toTodaysMoney(sipPostTax, inflationRate, durationYears)
  const sipPostTaxRate = sipCagr * (sipPostTax / sipNominal)
  const sipRealPct     = realReturn(sipPostTaxRate, inflationRate)

  // FD
  const fdNominal     = calcFDCorpus(monthlyAmount, fdRate, durationYears)
  const fdTax         = calcFDTax(fdNominal, totalInvested, taxSlab)
  const fdPostTax     = fdNominal - fdTax
  const fdReal        = toTodaysMoney(fdPostTax, inflationRate, durationYears)
  const fdPostTaxRate = fdRate * (1 - taxSlab / 100)
  const fdRealPct     = realReturn(fdPostTaxRate, inflationRate)

  const gap       = sipNominal - fdNominal
  const gapMonths = Math.round(gap / monthlyAmount)

  return {
    sip: {
      nominalCorpus:    Math.round(sipNominal),
      totalInvested:    Math.round(totalInvested),
      totalGains:       Math.round(sipNominal - totalInvested),
      taxPaid:          Math.round(sipTax),
      postTaxCorpus:    Math.round(sipPostTax),
      realCorpus:       Math.round(sipReal),
      realReturnPct:    Math.round(sipRealPct * 10) / 10,
      nominalReturnPct: sipCagr,
    },
    fd: {
      nominalCorpus:    Math.round(fdNominal),
      totalInvested:    Math.round(totalInvested),
      totalGains:       Math.round(fdNominal - totalInvested),
      taxPaid:          Math.round(fdTax),
      postTaxCorpus:    Math.round(fdPostTax),
      realCorpus:       Math.round(fdReal),
      realReturnPct:    Math.round(fdRealPct * 10) / 10,
      nominalReturnPct: fdRate,
    },
    gapAmount:        Math.round(gap),
    gapMonths,
    breakEvenYear:    findBreakEvenYear(inputs),
    sipWinsByRealPct: Math.round((sipRealPct - fdRealPct) * 10) / 10,
    yearByYear:       buildYearByYear(inputs),
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────
export function fmtL(amount: number): string {
  const lakhs = amount / 100000
  const rounded = Math.round(lakhs * 10) / 10
  if (lakhs >= 100) {
    const cr = Math.round(lakhs / 10) / 10
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`
  }
  return `₹${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}L`
}

export function fmtPct(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}