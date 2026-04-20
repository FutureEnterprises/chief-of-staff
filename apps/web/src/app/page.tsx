import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { CrystalBackground } from '@/components/landing/crystal-bg'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroVariants } from '@/components/landing/hero-variants'
import { BrandStatement } from '@/components/landing/brand-statement'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { LiveExample } from '@/components/landing/live-example'
import { RecoverySection } from '@/components/landing/recovery-section'
import { RescueDemo } from '@/components/landing/rescue-demo'
import { UniversalWedges } from '@/components/landing/universal-wedges'
import { PricingSection } from '@/components/landing/pricing-section'
import { FinalCta } from '@/components/landing/final-cta'
// Cut from the homepage 2026-04-20 per reviewer feedback (bloated page,
// too many sections). Still used on other surfaces or available for
// re-introduction if the narrower page underperforms:
//   - WedgeClarity, AiDemo, PatternIntelligence, YouIf
import { LandingFooter } from '@/components/landing/footer'

type Variant = 'a' | 'b' | 'c'

async function pickVariant(searchVariant: string | undefined): Promise<Variant> {
  const jar = await cookies()
  const sticky = jar.get('coyl_lv')?.value as Variant | undefined
  const explicit = (searchVariant === 'a' || searchVariant === 'b' || searchVariant === 'c') ? searchVariant : null

  if (explicit) return explicit
  if (sticky === 'a' || sticky === 'b' || sticky === 'c') return sticky

  // Weight-loss-primary bias for the next 90 days. The product is broader
  // than weight loss (and the app surface reflects that), but the
  // go-to-market wedge is weight loss \u2014 the landing leans into it by
  // serving variant C ("Weight loss doesn't fail at lunch. It fails at
  // 9 PM.") to ~60% of cold traffic, with the universal variants A and B
  // splitting the remainder. If this bias hurts D7/D30 in /admin, dial
  // it back here.
  const roll = Math.random()
  if (roll < 0.6) return 'c'
  if (roll < 0.8) return 'a'
  return 'b'
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  // Try to detect a logged-in user and bounce to /today. Wrapped in
  // try/catch because the middleware BYPASSES Clerk on `/` to keep the
  // marketing page reachable while Clerk still uses dev-instance keys
  // (see middleware.ts + docs/ENGINEERING.md \u00a711). When middleware
  // hasn't run, @clerk/nextjs/server's auth() throws \u2014 treating that
  // as "not signed in" is the right fallback on the landing.
  const clerkReady =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')
  if (clerkReady) {
    try {
      const { userId } = await auth()
      if (userId) redirect('/today')
    } catch {
      // Clerk middleware didn't run on this route (by design). Render
      // the landing regardless; logged-in users can navigate via CTAs.
    }
  }

  const params = await searchParams
  const variant = await pickVariant(params?.v)

  return (
    <CrystalBackground>
      <SoftwareApplicationSchema />
      <FAQSchema />
      <VariantCookieSetter variant={variant} />
      <div className="relative min-h-screen text-white selection:bg-orange-500 selection:text-white">
        <GlassNav />

        <main className="relative z-10">
          {/* Reviewer-driven order (2026-04-20):
              Hero \u2192 Try it \u2192 Why you keep failing \u2192 What COYL does
              \u2192 Live example \u2192 Built first for weight loss
              \u2192 Recovery \u2192 Pricing \u2192 Final CTA.
              Cut from above-the-fold: YouIf (duplicated recognition), AiDemo
              (personality modes), PatternIntelligence (pattern screen marketing).
              WedgeClarity compressed into UniversalWedges. */}

          {/* 1. Hero \u2014 variant-specific */}
          <HeroVariants variant={variant} />

          {/* 2. Try it right now \u2014 interactive, anchor target for hero CTAs */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* 3. Why you keep failing \u2014 the autopilot beat + the knife-line */}
          <BrandStatement />

          {/* 4. What COYL does \u2014 3-step explanation */}
          <FeaturesGrid />

          {/* 5. Live example \u2014 Friday night "I'll restart Monday" scene */}
          <LiveExample />

          {/* 6. Built first for weight loss \u2014 wedge reassurance + "same loop" */}
          <UniversalWedges />

          {/* 7. Recovery \u2014 moat section */}
          <RecoverySection />

          {/* 8. Pricing */}
          <PricingSection />

          {/* 9. Final CTA */}
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </CrystalBackground>
  )
}

/**
 * Client-side cookie setter — stamps the user's assigned variant so they see
 * the same hero on return visits + tags sign-up analytics.
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
