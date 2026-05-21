import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroVariants } from '@/components/landing/hero-variants'
import { RescueDemo } from '@/components/landing/rescue-demo'
import { WhatItCatches } from '@/components/landing/what-it-catches'
import { YouArePatterned } from '@/components/landing/you-are-patterned'
import { HowItWorksStrip } from '@/components/landing/how-it-works-strip'
import { ProofStrip } from '@/components/landing/proof-strip'
import { PricingSnapshot } from '@/components/landing/pricing-snapshot'
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

export default async function HomePage({
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
          {/* 1. Hero — the one line + animated letters */}
          <HeroVariants variant={variant} />

          {/* 2. Try it now — the product moment, mid-fold */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* 3. The premise — "You are not random. You are patterned."
              Myth-first beat per the May 2026 virality dispatch — ladders
              the demo into the category claim before naming the use cases. */}
          <YouArePatterned />

          {/* 4. What it catches — three wedges, one band */}
          <WhatItCatches />

          {/* 4. How it works — detect / interrupt / recover */}
          <HowItWorksStrip />

          {/* 5. The proof — comparison + clinical + recovery */}
          <ProofStrip />

          {/* 6. Pricing snapshot — 4 tiers, route to /pricing */}
          <PricingSnapshot />

          {/* 7. For partners — B2B trust strip */}
          <PartnersStrip />

          {/* 8. Final CTA */}
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
