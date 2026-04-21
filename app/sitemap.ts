// app/sitemap.ts
// Replace your existing sitemap.ts with this file.
// Existing pages are preserved. New programmatic pages auto-generate from PAGE_CONFIGS.

import type { MetadataRoute } from 'next'
import { PAGE_CONFIGS } from '../lib/fd-sip-configs'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.realreturn.in'
  const now  = new Date()

  // ── Existing pages ──────────────────────────────────────────────────────
  const existing: MetadataRoute.Sitemap = [
    {
      url:              `${base}/`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${base}/fd-vs-rd-vs-mf-returns-calculator`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         0.9,
    },
    {
      url:              `${base}/personal-financial-planner`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${base}/retirement-corpus-calculator`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
  ]

  // ── Programmatic pages (auto-generated from PAGE_CONFIGS) ──────────────
  // Priority tiers based on slug depth:
  //   1 segment  = hub page      → 0.85
  //   2 segments = one-param     → 0.75
  //   3 segments = two-param     → 0.65
  //   4 segments = three-param   → 0.55
  const programmatic: MetadataRoute.Sitemap = PAGE_CONFIGS.map(config => ({
    url:             `${base}/fd-vs-sip/${config.slug.join('/')}`,
    lastModified:    now,
    changeFrequency: 'monthly' as const,
    priority:        Math.max(0.55, 0.85 - (config.slug.length - 1) * 0.10),
  }))

  return [...existing, ...programmatic]
}