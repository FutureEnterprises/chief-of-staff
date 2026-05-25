/**
 * Shared research-stat citations — single source of truth.
 *
 * The v4 audit (May 2026) flagged that COYL's verticals repeat research
 * citations (e.g., "23-minute recovery cost: Mark et al., 2008 — UC
 * Irvine") with risk of drift. This module is the canonical version of
 * each fact + citation. Pages should import from here rather than
 * re-stating the numbers inline.
 *
 * Adding a new stat:
 *   1. Pick a stable id (kebab-case, prefixed by domain — e.g.
 *      `interruption-recovery-cost`)
 *   2. Add the fact + citation + url
 *   3. Import from this file at the consuming page
 *
 * NEVER hardcode a research number in marketing copy. Always import
 * through here so the citation drifts in exactly one place when the
 * underlying study is updated.
 */

export type ResearchStat = {
  /** Stable id; usable in URLs (e.g., for footnotes). */
  id: string
  /** The headline number — short, share-ready (e.g., "23 minutes"). */
  headline: string
  /** One-sentence explanation. */
  summary: string
  /** Author + year — what to print in a citation block. */
  citation: string
  /** Permalink to the source. */
  url: string
  /** Optional: longer explanation when context is needed. */
  detail?: string
}

export const RESEARCH_STATS = {
  /** UC Irvine — recovery cost after an interruption to a focused task. */
  INTERRUPTION_RECOVERY_COST: {
    id: 'interruption-recovery-cost',
    headline: '23 minutes',
    summary: 'Average time to return to a focused task after an interruption.',
    citation: 'Mark, Gudith, Klocke, 2008',
    url: 'https://www.ics.uci.edu/~gmark/Home_page/Research_files/CHI%202008%20Cost%20of%20Interruptions.pdf',
    detail:
      'The cost of interrupted work: more speed and stress (CHI 2008, UC Irvine).',
  },
  /** Microsoft 2023 — cadence at which knowledge workers are interrupted. */
  INTERRUPTION_CADENCE: {
    id: 'interruption-cadence',
    headline: 'every 11 minutes',
    summary: 'Median cadence at which knowledge workers are interrupted.',
    citation: 'Microsoft Work Trend Index, 2023',
    url: 'https://www.microsoft.com/en-us/worklab/work-trend-index',
  },
  /** Wilding et al. 2022 — GLP-1 weight-regain meta-analysis. */
  GLP1_WEIGHT_REGAIN: {
    id: 'glp1-weight-regain',
    headline: '60%',
    summary: 'Of weight lost on GLP-1 returns within a year of discontinuation.',
    citation: 'Wilding et al., 2022',
    url: 'https://dom-pubs.onlinelibrary.wiley.com/doi/10.1111/dom.14725',
    detail:
      'Weight regain and cardiometabolic effects after withdrawal of semaglutide (Diabetes, Obesity & Metabolism, 2022).',
  },
  /** JITAI foundation paper — just-in-time adaptive interventions. */
  JITAI_FOUNDATION: {
    id: 'jitai-foundation',
    headline: 'The right intervention at the right moment',
    summary:
      'Just-in-Time Adaptive Interventions (JITAIs) deliver behavioral support precisely when state-of-need + state-of-receptivity align.',
    citation: 'Nahum-Shani et al., 2018',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27663578/',
    detail:
      'Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health (Annals of Behavioral Medicine, 2018).',
  },
} as const

export type ResearchStatId = keyof typeof RESEARCH_STATS

/** Convenience — get a stat by id. */
export function researchStat(id: ResearchStatId): ResearchStat {
  return RESEARCH_STATS[id]
}
