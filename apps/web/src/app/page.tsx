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
import { FinalCta } from '@/components/landing/final-cta'
// Cut from the homepage per COYL_homepage_v3_FINAL.md spec:
//   - PricingSection (spec's homepage ends at Final CTA \u2014 pricing
//     lives at /#pricing via nav or post-signup)
//   - WedgeClarity, AiDemo, PatternIntelligence, YouIf (already cut
//     in the previous bloat-reduction pass, kept available as exports
//     in case narrower-page data says to re-introduce)
import { LandingFooter } from '@/components/landing/footer'

type Variant = 'a' | 'b' | 'c'

async function pickVariant(searchVariant: string | undefined): Promise<Variant> {
  const jar = await cookies()
  const sticky = jar.get('coyl_lv')?.value as Variant | undefined
  const explicit = (searchVariant === 'a' || searchVariant === 'b' || searchVariant === 'c') ? searchVariant : null

  if (explicit) return explicit
  if (sticky === 'a' || sticky === 'b' || sticky === 'c') return sticky

  // v3 spec: lock the hero to variant B ("Why do you keep doing this?").
  // The A/B/C system stays \u2014 ?v=a|b|c still overrides \u2014 but fresh
  // traffic without a cookie or param gets the spec-approved hero.
  // Flip this back to weighted rolls when we want to re-test variants.
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
          {/* v3 spec order (COYL_homepage_v3_FINAL.md):
              1. Hero
              2. This is your loop          \u2190 BrandStatement
              3. What COYL does              \u2190 FeaturesGrid
              4. Real moment demo            \u2190 LiveExample
              5. Try it now                  \u2190 RescueDemo
              6. Built first for weight loss \u2190 UniversalWedges
              7. Recovery                    \u2190 RecoverySection
              8. Final CTA                   \u2190 FinalCta
              Cut: PricingSection (moved off the homepage). */}

          {/* 1. Hero */}
          <HeroVariants variant={variant} />

          {/* 2. This is your loop */}
          <BrandStatement />

          {/* 3. What COYL does */}
          <FeaturesGrid />

          {/* Iconic-line motif \u2014 lands between Features and the Real-moment
              demo so it hits right before the emotional Friday-night scene.
              Per spec \u00a73: "This stops the moment you usually screw yourself." */}
          <IconicLine />

          {/* 4. Real moment \u2014 Friday night "I'll restart Monday" scene */}
          <LiveExample />

          {/* 5. Try it now \u2014 interactive, still the #try-it anchor target */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* 6. Wedge \u2014 Built first for weight loss */}
          <UniversalWedges />

          {/* 7. Recovery */}
          <RecoverySection />

          {/* 8. Final CTA */}
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </CrystalBackground>
  )
}

/**
 * The iconic line, per v3 spec \u00a73. Used verbatim everywhere it appears
 * so readers see it enough to stick. Styled as a quiet full-width
 * statement between sections \u2014 not a CTA, just a recurring motif.
 */
function IconicLine() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-20 text-center md:px-12">
      <p className="text-2xl font-black leading-tight tracking-tight text-white md:text-4xl">
        This stops the moment<br />
        you usually{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          screw yourself
        </span>.
      </p>
      {/* GODFILE \u00a715 message stack \u2014 outcome sits under the iconic line so the
          reader sees the reward for the interruption, not just the pain. */}
      <p className="mt-5 text-lg font-semibold text-gray-300 md:text-xl">
        COYL makes sure you do what you said you&apos;d do.
      </p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
        You don&apos;t need discipline. You need interruption.
      </p>
    </section>
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
