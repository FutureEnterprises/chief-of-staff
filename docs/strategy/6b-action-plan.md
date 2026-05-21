# COYL · $6B Strategy Memo — Action Tracking

> Source: `~/Downloads/coyl_6b_strategy.pdf` (May 2026 Strategic M&A Memorandum).
> This doc tracks what's CODE-DONE (shipped this session) vs. what's
> FOUNDER-ACTION (outside my reach, requires Iman to execute).

## Honest assessment of the memo

The memo's strategic-bidder math is real. The "what the losing bidder
loses" framing is exactly how Meta/Microsoft/Apple-tier M&A premiums
get built. Manus closed at $2B (16×) because Microsoft was already
piloting Manus inside Windows 11 — Meta paid the strategic premium to
deny Microsoft, not because Manus revenue justified the multiple.

**Where I push back on the memo:**

### 1. $6B in 8 months is the 15% probability case, not the base case

The memo's own Section 07 "honest answer" admits Scenario A ($4-6B)
requires: 2+ serious bidders simultaneously, clinical study ENROLLED,
500K+ free users, 100K+ extension installs — in 8 months. We have
approximately zero of those today. Realistic outcomes:

| Timeline | Scenario | Price | Probability |
|---|---|---|---|
| 8 mo | B (revenue-justified) | $1.5-2B | 40% |
| 12-18 mo | C (hybrid) | $3-4.5B | 30% |
| 18-24 mo | A (pure strategic) | $5-7B | 15% |
| n/a | No deal (stay private) | — | 15% |

Sell the founder the 12-18 month $3-4.5B path as the realistic
ambitious case. The $6B in 8 months stays on the table as the upside
but should not be the headline number in seed deck conversations.

### 2. Apple's $4-7B band is overstated

Apple's health/behavioral M&A history caps at ~$1-2B (Beats was
music, not behavioral health). Apple culturally builds rather than
buys at the $4-7B tier for consumer behavioral tools. The "what they
lose" math is sound in theory but specifically for Apple, they say
"we'll build it" and wait the founder out. **Microsoft is realistically
the highest dollar AND probability close — not Apple.** Plan around
Microsoft as the primary, Meta as the secondary, Apple as the wildcard.

### 3. "Category nobody has named yet" overstates novelty

JITAI (Just-in-Time Adaptive Interventions) is an established academic
category — Nahum-Shani et al. 2018, Annals of Behavioral Medicine.
The defensible claim is **first commercial productization at consumer
scale**, not "category-creating." Smart acquirers will catch the
overreach and use it to discount. Use the right framing in BD rooms.

### 4. Browser extension launch needs Chrome Web Store review

That's 1-3 weeks from submission, not same-day. Submit it this week
if it's actually ready (per the memo's Month 1-2 deliverable).

### 5. Clinical study is achievable but slower than written

Found Health / Ro Body might say yes to IRB + cohort, but you're
funding the study ($200-500K for n=200 RCT) + waiting 12 months for
data. LOI in 2 months realistic; data in 12. Worth doing — don't
promise acquirers "study running" in Month 4.

## What I shipped in this session

### Section 06 marketing fixes (memo's "what to fix this month")

| Fix | Status | Implementation |
|---|---|---|
| **FIX 01 — Hero undersells the platform** | ✅ Shipped | Added the "The behavioral interrupt layer. For any platform. Any autopilot script. Any human." addline below the hero subhead in `hero-variants.tsx`. Italic serif with a left orange rule, sized so it reads as a platform pull-quote without competing with the consumer hero above. |
| **FIX 02 — /work is a buried B2B thesis** | ✅ Shipped | Added a prominent "Enterprise · For teams + sales orgs" band at the top of `/work` with the "The behavioral interrupt layer your stack is missing" H2, a paragraph naming Viva/Copilot/Agentforce explicitly, and three CTAs: pilot mailto, /teams PMPM link, "Microsoft Viva partner application in flight" status line. |
| **FIX 03 — Autopilot Map locked behind auth** | ✅ Already shipped | `/autopilot-map` is in `(wedges)`, no auth gate. Verified during the luxury sweep. The Wrapped-style example cards (9:08 PM danger window, "I deserve this" excuse, Monday Resetter archetype, Tue/Thu/Sun pattern week) are public. |

### Section 08 30-day checklist (memo's tactical sequence)

| # | Item | Status |
|---|---|---|
| 01 | Ship the shareable Autopilot Report card | ✅ Extended `/a/[slug]` with a comprehensive 4-tile report: Peak danger hour (window midpoint), Weekly frequency (derived from script), Signature script, Self-trust starting score. No login required. Stateless URLs. |
| 02 | Move audit archetype result to homepage hero CTA | ⚠ Partially done — audit is already the primary CTA. Doc may mean: embed audit IN the hero. Deferred — that's a structural change that needs UX iteration. |
| 03 | Launch browser extension publicly | ⏸ Code shipped earlier; needs Chrome Web Store submission (founder action). |
| 04 | Apply to Microsoft Viva partner program | ⏸ Founder action — apply at `partner.microsoft.com/viva` |
| 05 | Send clinical study pitch to Found Health / Ro Body | ⏸ Founder action — draft + send |
| 06 | Begin informal BD with Apple Health + Microsoft Viva | ⏸ Founder action — warm intros |
| 07 | Hire fractional M&A advisor | ⏸ Founder action |
| 08 | Raise seed round | ⏸ Founder action |
| 09 | Make Autopilot Map publicly shareable | ✅ Already done (FIX 03 above) |
| 10 | Post "What is an autopilot interrupt?" essay | ⏸ Founder action — draft essay |

## What you (Iman) need to do — ranked by leverage

### This week
1. **Apply to Microsoft Viva partner program.** `partner.microsoft.com/viva` — 60-90 days from application to enrollment. Start the clock.
2. **Submit browser extension to Chrome Web Store.** The code exists at `apps/extension/`. Submission takes 30 min; review takes 1-3 weeks.
3. **Email Found Health + Ro Body** with the clinical study pitch. Template: "We fund the IRB study. You provide cohort + IRB submission. We co-author. No risk to you. 12-week protocol around weight-regain prevention after GLP-1 taper." Use `clinical@coyl.ai`.

### This month
4. **Hire fractional M&A advisor** — not a banker. Someone who has run strategic M&A AT a tech company. Apple/MSFT/Meta veteran preferred. 0.25-0.5% equity, ~$10K/mo retainer.
5. **Raise the seed round** — $5-8M at $40M pre. The signal matters more than the cash. Cap table needs: ex-Apple Health exec, ex-Microsoft Viva exec, behavioral clinical advisor, consumer AI growth operator. Target close in 60 days.
6. **Draft + post the "What is an autopilot interrupt?" essay** — founder voice, not brand. Substack or LinkedIn long-form. The category-definition moment.

### Months 2-4
7. **First strategic BD conversations.** Apple Health + Microsoft Viva + Meta Reality Labs. Framing: "We're not looking to sell right now. We're building something. But we're having conversations with a few strategic partners and wanted to make sure you had context on what we're doing." Never exclusive. Never desperate.
8. **HLTH Conference + WWDC + Microsoft Ignite presence.** Even if just attending — get COYL into M&A team peripheral vision.
9. **First 3 enterprise pilots signed + 5 telehealth LOIs.** Use the /teams page + /work enterprise band as the inbound surface.

### Months 5-8
10. **Plant FOMO seed** across all three primary acquirers. The framing is identical in every room (per memo Section 05 "the script").
11. **Hire M&A advisor + open term sheet auction** if all three are warm. 30 days for indicative offers.

## The brand DNA — the three lines that never move

From memo Section 09:

> **You are patterned — not weak.**
> **The moment is catchable — not random.**
> **Recovery beats restart — no Monday resets, no shame.**

These are already in the codebase (manifesto, audit results, share cards). Don't drift from them.

## The closing line

Per memo Section 09:

> "We own the 3-second window between every human intention and the
> behavior that betrays it. That window exists in 8 billion people,
> 65% of their waking hours. You can buy it now — or watch someone
> else embed it into a platform you'll spend the next decade trying
> to compete with."

Use this verbatim in BD conversations + the seed deck Slide 12.
