# realreturn.in — Project Context (CLAUDE.md)

## What this is
A free Indian personal finance tools website. No login, no ads, no data stored.
- **Stack**: Next.js (TypeScript, App Router), Vercel (free tier)
- **GitHub**: sandeshdeshkar/realreturn
- **Local**: `C:\Users\Sandesh\projects\realreturn`
- **Live**: https://www.realreturn.in
- **Dev**: `npm run dev` → localhost:3000
- **Deploy**: `git add . && git commit -m "message" && git push` (Vercel auto-deploys ~2 min)

## Design system
- Fonts: Sora (UI) + DM Mono (all numbers)
- Primary green: `#1a6b3c`
- Red: `#dc2626` | Amber: `#d97706`
- Mobile-first design

---

## Three live tools

### Tool 1 — FD vs RD vs MF Returns Calculator
- **URL**: `/fd-vs-rd-vs-mf-returns-calculator`
- **File**: `app/fd-vs-rd-vs-mf-returns-calculator/page.tsx`

**Architecture — TWO levels of tabs:**

Level 1 (top bar, always visible):
- 📊 Calculator tab
- 🎯 Life Planner tab

Level 2 (mobile only, inside Calculator tab):
- ⚙️ Inputs
- 📊 Results
- 💡 Insights

Desktop: 2-column layout — sticky sidebar (340px) with inputs on left, results + insights on right. No sub-tabs on desktop.

**Inputs (separate per instrument):**
- General: Duration slider with snap buttons (5Y/10Y/15Y/20Y/30Y), Tax Slab, Inflation
- FD: Lump Sum / Monthly toggle, Amount, Interest Rate
- RD: Monthly Amount, Interest Rate
- MF: SIP Monthly / Lump Sum toggle, Amount, Expected CAGR

**Quick Start presets** (top of inputs panel, green strip):
- ₹5K/month → auto-fills all three + jumps to Results
- ₹10K/month → same
- ₹1L lump sum → same

**What If buttons** (amber section at bottom of inputs):
- Inflation goes up 1%
- SIP returns drop 2%
- Stay invested 5 more years

**Results structure — 3 blocks per instrument card:**
- Block 1: Real Return % in giant text + plain English message ("Barely beating inflation" / "Losing purchasing power")
- Block 2: Visual bars — Nominal → Post-Tax → Real (shows shrinkage)
- Block 3: "You lost to" — Tax amount + Inflation erosion amount

**Additional results elements:**
- Winner strip (green card, shows best real return % + real corpus)
- Break-even insight (when SIP overtakes FD in year X)
- Expected vs Reality comparison bars (FD/RD/MF side by side)
- Year-by-year table (switchable FD/RD/MF, shows invested/corpus/tax/post-tax/real/gain)

**Insights panel:** Smart contextual insights — real return comparisons, break-even year, tax efficiency comparison, purchasing power half-life at current inflation.

**Nav toggles (top right in nav bar):** Tax ON/OFF pill + Inflation ON/OFF pill

**Winner preview on mobile Inputs tab:** Green card at bottom showing current winner + "See Results →" button.

**Life Planner tab (📊 Calculator → 🎯 Life Planner toggle):**
- Profile inputs: Age, Monthly Income, Monthly Expenses, Total Savings, Monthly Investment
- Shows: Monthly surplus, Savings rate %
- Insurance section: Life Insurance (✓ Have it / ✗ None toggle + cover slider), Health Insurance (same)
- Shows recommended cover, underinsured gap warning
- Goal tracker: Pre-loaded with Retirement (₹1Cr, 30yr) + Child Education (₹30L, 15yr)
  - Shows target vs on-track corpus, progress bar, extra SIP needed
- Financial Scores: Wealth Score / Protection Score / Stability Score (each out of 100)
- Action Plan: Personalised items based on gaps

**Calculation logic:**
- FD lump sum: annual compounding
- FD monthly: quarterly compounding (standard Indian bank formula)
- RD: `mr = (rdRate/100)/12`, monthly accumulation loop
- MF SIP: `mr = r/12`, annuity-due formula `corpus = pmt * ((1+mr)^n - 1) / mr * (1+mr)`
- MF LTCG: 12.5% on gains above ₹1.25L exemption (Budget 2024)
- Fisher Equation: `Real Return = ((1 + Post-Tax) / (1 + Inflation)) - 1`

**⚠️ NOTE: SIP formula bug exists in this file's calcMF function**
The `calc-final.tsx` version (Apr 14 chat) still uses `mr = r/12` which is WRONG.
The correct formula uses `mr = Math.pow(1 + r, 1/12) - 1` (effective monthly rate).
This was fixed in the later `page-calculator-final.tsx` (Apr 19 chat).
**When working on the calculator, always use the correct SIP formula below.**

---

### Tool 2 — Get Your Financial Plan in 3 Minutes
- **URL**: `/personal-financial-planner`
- **File**: `app/personal-financial-planner/page.tsx`
- **Design**: 3-step wizard + Output screen
- **Steps**: About You → Your Money → Goals & Protection
- **Output**: Financial health score, biggest issue banner, insurance gaps, goal SIPs, action plan, cost of delay chart, share card
- **Logic**: Life cover = income × 10 × dependant multiplier; health min ₹5L; SIP = FV / annuity factor at 12%

### Tool 3 — Retirement Corpus Calculator
- **URL**: `/retirement-corpus-calculator`
- **File**: `app/retirement-corpus-calculator/page.tsx`
- **Design**: 3-step: Your Assets → Gap Analysis → Three Levers
- **Gap calc**: 3.5% withdrawal rate (4% rule adapted for Indian inflation)
- **Three levers**: Invest more, retire later, spend less (all update live)

---

## File structure
```
app/
  page.tsx                                      ← homepage
  layout.tsx                                    ← metadata, OG, schema, GSC verification
  sitemap.ts                                    ← /sitemap.xml
  globals.css
  fd-vs-rd-vs-mf-returns-calculator/
    page.tsx                                    ← calculator (full version with Life Planner tab)
  personal-financial-planner/
    page.tsx
  retirement-corpus-calculator/
    page.tsx
public/
vercel.json                                     ← redirects non-www → www
CLAUDE.md                                       ← this file
package.json
next.config.ts
```

---

## URLs and naming (final, locked)

| Tool | Homepage Card | URL |
|---|---|---|
| FD vs RD vs MF | FD vs RD vs MF Returns Calculator | `/fd-vs-rd-vs-mf-returns-calculator` |
| Financial Planner | Get Your Financial Plan in 3 Minutes | `/personal-financial-planner` |
| Retirement | Retirement Corpus Calculator | `/retirement-corpus-calculator` |

---

## Critical formula — SIP (VERIFIED CORRECT, matches Groww/AMFI exactly)

```typescript
// ✅ CORRECT — ₹10K/mo at 12% for 10yr = ₹22,40,359 (matches Groww exactly)
const mr = Math.pow(1 + annualRate, 1 / 12) - 1   // effective monthly rate
const corpus = pmt * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)  // annuity-due

// SIP needed (inverse)
const annuityFactor = ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr)
const sipNeeded = targetFV / annuityFactor

// ❌ WRONG — DO NOT USE
// const mr = annualRate / 12   ← gives ₹23.23L instead of ₹22.40L
```

**Other formulas:**
- RD (standard Indian bank): `effectiveMr = Math.pow(1 + r/4, 1/3) - 1` (monthly rate from quarterly compounding)
- FD monthly: same effectiveMr formula as RD
- FD lump sum: `corpus = principal * Math.pow(1 + r, years)`
- MF LTCG: `taxable = Math.max(0, gains - 125000)`, `tax = taxable * 0.125`
- Fisher: `((1 + postTaxRate/100) / (1 + inflation/100) - 1) * 100`
- Retirement corpus: `monthlyExpenseAtRetirement * 12 / 0.035`

---

## Nav links (cross-tool)

- Calculator → Financial Plan (`/personal-financial-planner`) + Retirement (`/retirement-corpus-calculator`)
- Financial Planner → Calculator (`/fd-vs-rd-vs-mf-returns-calculator`) + Retirement (`/retirement-corpus-calculator`)
- Retirement → Calculator (`/fd-vs-rd-vs-mf-returns-calculator`) + Financial Plan (`/personal-financial-planner`)
- Homepage CTA → `/fd-vs-rd-vs-mf-returns-calculator`

---

## SEO — what's done

- `layout.tsx`: title template, meta description, keywords, OG tags, Twitter card, WebApplication + WebSite schema
- `app/page.tsx`: 600+ words indexable content, FAQPage schema with 4 Q&As
- All three tool pages: unique SEO text + 5 FAQs each at bottom of results screen
- `sitemap.ts`: all four URLs with priorities
- Google Search Console: Domain property `realreturn.in` set up (covers all versions)
- Sitemap submitted: `https://www.realreturn.in/sitemap.xml`
- Target keywords: "real return calculator india", "fd vs sip calculator", "retirement corpus calculator india", "personal financial planner india"

---

## Infrastructure

- **Canonical**: `https://www.realreturn.in` (www, HTTPS)
- **vercel.json**: redirects `realreturn.in` → `https://www.realreturn.in`
- **HTTP → HTTPS**: Handled automatically by Vercel (308 redirect)
- **DNS**: GoDaddy A record → 216.198.79.1, CNAME www → cname.vercel-dns.com
- **GSC**: Domain property `realreturn.in` (preferred — covers all variants)

---

## Calculator redesign history (important for context)

The calculator went through multiple rebuilds in the "FD vs RD vs SIP calculator redesign" chat (Apr 14):

**v1 (original)**: Single page, inputs always visible, broken on mobile — cards clipping/overflowing

**v2 (calc-v3.tsx)**: First tab-based rebuild. 3 mobile tabs (⚙️ Inputs | 📊 Results | 💡 Insights). Desktop: 2-col sticky sidebar. This was a complete architectural fix for mobile. No Life Planner yet.

**v3 (calc-final.tsx) — CURRENT VERSION in `/fd-vs-rd-vs-mf-returns-calculator/page.tsx`**: 
Full "Financial Reality Engine" rebuild. Added:
- Two-level tab system (Calculator + Life Planner at top, Inputs/Results/Insights sub-tabs on mobile)
- Quick Start presets (₹5K/₹10K/₹1L)
- What If buttons
- 3-block result cards (Reality / Real Value bars / Loss)
- Break-even insight card
- Life Financial Planner tab (scores, insurance, goals, action plan)
- Duration snap buttons (5Y/10Y/15Y/20Y/30Y)
- 22px slider thumbs for mobile usability

**⚠️ Known issue in current file**: The `calcMF` SIP formula uses `mr = r/12` (wrong). Should be `mr = Math.pow(1+r, 1/12) - 1`. This was fixed in `page-calculator-final.tsx` from the Apr 19 chat but may not have been merged back into the main calculator file. Verify before making changes.

---

## About Sandesh (site owner)
- Performance Marketing head at The Sleep Company, Nagpur
- Age 44, target retirement at 55, ₹2.5L monthly expenses
- Co-runs Deshkars food business
- Interested in Indian equity markets, ETF investing, F&O
- No-code — Claude writes all code
- GitHub: `sandeshdeshkar`
- Prefers direct advice, not motivational framing

---

## Status / pending items

- [DONE] All three tools coded and deployed
- [DONE] SEO content + 5 FAQs on all three tool pages
- [DONE] vercel.json for non-www redirect
- [DONE] Google Search Console domain property set up, sitemap submitted
- [PENDING] Verify SIP formula fix is in live calculator file (mr = Math.pow(1+r,1/12)-1 not r/12)
- [PENDING] Fix gaps and design issues across all three tools (user mentioned issues, details not yet provided)
- [PENDING] Duplicate URL errors in GSC will clear in 1-2 weeks after vercel.json deploys
