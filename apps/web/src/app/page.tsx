import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroVariants } from '@/components/landing/hero-variants'
// PlatformBand is intentionally NOT imported here — the protocol-stack
// surface lives at /platform and /protocol per the May 2026 audit.
// The homepage stays consumer-led.
import { ProofCaseBand } from '@/components/landing/proof-case-band'
import { RescueDemo } from '@/components/landing/rescue-demo'
import { WhatItCatches } from '@/components/landing/what-it-catches'
import { YouArePatterned } from '@/components/landing/you-are-patterned'
import { ArchetypesStrip } from '@/components/landing/archetypes-strip'
import { WhyNow } from '@/components/landing/why-now'
import { SafetyBanner } from '@/components/safety/safety-banner'
import { HowItWorksStrip } from '@/components/landing/how-it-works-strip'
import { ProofStrip } from '@/components/landing/proof-strip'
import { PartnersStrip } from '@/components/landing/partners-strip'
import { FinalCta } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/footer'

/**
 * Homepage — v5 (May 2026 overhaul).
 *
 * Per the Refero synthesis (Linear, Vapi, Metaview, Vercel, Pipe,
 * Dovetail): award-winning SaaS homepages stop at 5–8 sections. The
 * prior v4 stacked 17 sections — too much, too fast, no breath.
 *
 * v5 cuts to 8 disciplined beats:
 *
 *   1. HERO              → animated COYL letters + the ONE line + 2 CTAs
 *   2. TRY IT NOW        → RescueDemo (the product moment)
 *   3. WHAT IT CATCHES   → three wedges in a tight band (NEW)
 *   4. HOW IT WORKS      → 3-step strip — detect / interrupt / recover
 *   5. THE PROOF         → comparison + clinical study + recovery (NEW)
 *   6. PRICING SNAPSHOT  → 4 tiers in a band, link to /pricing (NEW)
 *   7. FOR PARTNERS      → B2B trust strip (telehealth + employers + research)
 *   8. FINAL CTA         → single moment, single CTA
 *
 * What got cut from the homepage (still exist for other pages):
 *   - Glp1Callout, ProcrastinationCallout, TeamsCallout (absorbed into WhatItCatches)
 *   - BrandStatement, IconicLine (the iconic line is the hero subhead now)
 *   - ComparisonTable (absorbed into ProofStrip)
 *   - YouIf, LiveExample (the rescue demo does this job better)
 *   - ThingsCoylSays (vanity — drop)
 *   - UniversalWedges, RecoverySection (absorbed elsewhere)
 *   - HomepageFaq (moved entirely to /pricing; no FAQ on homepage)
 *
 * The principle: one moment per section, one accent per section, breath
 * between sections. If a visitor scrolls and can't tell what each
 * section is doing, it's not earning its place.
 */

type Variant = 'a' | 'b' | 'c'

async function pickVariant(searchVariant: string | undefined): Promise<Variant> {
  const jar = await cookies()
  const sticky = jar.get('coyl_lv')?.value as Variant | undefined
  const explicit = (searchVariant === 'a' || searchVariant === 'b' || searchVariant === 'c') ? searchVariant : null

  if (explicit) return explicit
  if (sticky === 'a' || sticky === 'b' || sticky === 'c') return sticky

  // Locked to variant B per v3 spec. ?v=a|b|c still overrides for testing.
  return 'b'
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  // Outer shell renders statically (cacheComponents contract). The
  // auth check + variant cookie read happen in HomePageContent inside
  // the Suspense boundary, so the runtime-data accesses are properly
  // scoped per Next 16.
  return (
    <Suspense fallback={null}>
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function HomePageContent({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  // Logged-in visitors bounce to /today. Wrapped in try/catch because
  // middleware bypasses Clerk on `/` while dev-instance keys are live
  // (see middleware.ts + docs/ENGINEERING.md §11).
  const clerkReady =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')
  if (clerkReady) {
    try {
      const { userId } = await auth()
      if (userId) redirect('/today')
    } catch {
      // Clerk middleware didn't run on this route; render the landing.
    }
  }

  const params = await searchParams
  const variant = await pickVariant(params?.v)

  return (
    <>
      <SoftwareApplicationSchema />
      <FAQSchema />
      <VariantCookieSetter variant={variant} />
      <div className="relative min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
        <GlassNav />

        <main className="relative z-10">
          {/* HOMEPAGE v6 — 10-beat category-launch flow per the May 2026
              virality dispatch. Order reflects: myth first, mechanism
              second, viral surface third (archetypes), category arrival
              fourth (why now), use cases fifth (patterns), proof + safety
              sixth, audit CTA last. Pricing is intentionally NOT on the
              homepage — strategist's rule: "do not lead with pricing." */}

          {/* 1. Hero — cinematic cold-open recognition + auto-playing
              MomentLoop. Per the May 2026 full-site audit overhaul. */}
          <HeroVariants variant={variant} />

          {/* PlatformBand (BIP / PAP / EAP / UAP / RAP protocol-stack
              copy) was previously here as section 1b. Pulled per the
              May 2026 audit ("the consumer surface and the protocol
              surface are two audiences; one should be one click deep,
              not above the fold"). Lives now on /platform and /protocol.
              The homepage stays consumer-led. */}

          {/* 2. The premise — most human failure is predictable.
              "You are not random. You are patterned." */}
          <YouArePatterned />

          {/* 3 + 4. How COYL works — learns the loops, then intervenes.
              The mechanism in detect / interrupt / recover form. */}
          <HowItWorksStrip />

          {/* 5. Try it now — real examples. The interactive rescue demo
              proves the mechanism without a signup. */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* 5a. The proof case — coyl.ai, the consumer product, as
              evidence the protocol works in real life. Stripe-style
              "look at our merchants" surface. Sits between the rescue
              demo (the moment) and the catch-yourself break (the
              mythic line). Added May 2026. */}
          <ProofCaseBand />

          {/* 5b. Section break — the footer tagline, promoted to the spine
              per the May 2026 brief. Sits as a full-bleed breath between
              the 3-step product flow / rescue demo and the Six Families.
              No card chrome, no CTA, no decoration. One line, in serif,
              orange accent on the verb. */}
          <section className="relative mx-auto max-w-6xl px-6 py-32 md:px-12 md:py-40">
            <p className="text-center font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-7xl">
              <span className="italic text-orange-600">Catch yourself</span> before you do it again.
            </p>
          </section>

          {/* 6. The six families — the viral surface. People recognise
              themselves here BEFORE taking the audit; the audit confirms. */}
          <ArchetypesStrip />

          {/* 6b. Autopilot map teaser — Spotify Wrapped for self-sabotage.
              Promoted from /autopilot-map per the May 2026 brief: this
              line earns a home on the spine because it is the single
              most shareable framing of the product. Sits as a quiet
              full-bleed callout, micro-eyebrow + serif italic, no card. */}
          <section className="relative mx-auto max-w-5xl px-6 py-32 md:px-12 md:py-40">
            <div className="flex flex-col items-start gap-6">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-orange-500" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Your year, mapped
                </span>
              </div>
              <p className="font-serif text-4xl font-normal italic leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
                Spotify Wrapped <span className="text-orange-600">for self-sabotage</span> — the map of your year&rsquo;s autopilot.
              </p>
            </div>
          </section>

          {/* 7. Why now — three pillars of category arrival. The
              press-grade "AI is leaving the prompt box" framing. */}
          <WhyNow />

          {/* 8. Patterns COYL catches — the breadth band. Renamed from
              "Use cases" per strategist: this is a pattern library, not
              a solutions catalog. */}
          <WhatItCatches />

          {/* 9. Proof + safety — research outcomes + the safety frame.
              Behavioral support, not medical treatment. */}
          <ProofStrip />
          <div className="mx-auto max-w-5xl px-6 pb-16 md:px-12">
            <SafetyBanner variant="inline" />
          </div>

          {/* For partners — B2B trust strip, sits just before final CTA. */}
          <PartnersStrip />

          {/* 10. Final CTA — the audit. Strategist's mandate: the
              homepage ends pointing at the audit, not the signup. */}
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </>
  )
}

/**
 * Cookie setter for the hero variant — sticks the user's assigned
 * variant so they see the same hero on return + tags analytics.
 */
function VariantCookieSetter({ variant }: { variant: Variant }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try { if (!document.cookie.match(/coyl_lv=/)) { document.cookie = 'coyl_lv=${variant}; max-age=' + (60*60*24*30) + '; path=/; SameSite=Lax'; } } catch (e) {}`,
      }}
    />
  )
}
