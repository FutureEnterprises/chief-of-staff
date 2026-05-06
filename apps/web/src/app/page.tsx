import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { CrystalBackground } from '@/components/landing/crystal-bg'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroVariants } from '@/components/landing/hero-variants'
import { BrandStatement } from '@/components/landing/brand-statement'
import { LiveExample } from '@/components/landing/live-example'
import { RecoverySection } from '@/components/landing/recovery-section'
import { RescueDemo } from '@/components/landing/rescue-demo'
import { UniversalWedges } from '@/components/landing/universal-wedges'
import { YouIf } from '@/components/landing/you-if'
import { ThingsCoylSays } from '@/components/landing/things-coyl-says'
import { Glp1Callout } from '@/components/landing/glp1-callout'
import { HowItWorksStrip } from '@/components/landing/how-it-works-strip'
import { ComparisonTable } from '@/components/landing/comparison-table'
import { HomepageFaq } from '@/components/landing/homepage-faq'
import { PartnersStrip } from '@/components/landing/partners-strip'
import { FinalCta } from '@/components/landing/final-cta'
// Cut from the homepage per COYL_homepage_v4.md (cut-convert-win pass):
//   - FeaturesGrid (demoted as "deep feature breakdown"; still exists for
//     internal/feature pages if needed)
//   - PricingSection (detailed tiers live at /pricing, not on homepage)
//   - WedgeClarity, AiDemo, PatternIntelligence (still exports for
//     re-introduction if A/B tests justify)
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
          {/* v4 spec order (COYL_homepage_v4.md):
              1. Hero
              2. This is your loop          \u2190 BrandStatement
              3. Try it now                  \u2190 RescueDemo (moved up)
              4. This is for you             \u2190 YouIf (restored)
              5. Real moment                 \u2190 LiveExample
              6. Wedge                       \u2190 UniversalWedges
              7. Recovery                    \u2190 RecoverySection
              8. Final CTA                   \u2190 FinalCta
              Cut: FeaturesGrid (3-block explanation \u2014 demoted as
                                  "deep feature breakdown" per v4 \u00a71) */}

          {/* 1. Hero */}
          <HeroVariants variant={variant} />

          {/* GLP-1 callout band — surfaces the urgent payer-funded wedge
              right after the hero without replacing it. Lead use case for
              Year 1 per the May 2026 strategy doc; the dedicated /glp1
              page is the destination. */}
          <Glp1Callout />

          {/* How COYL works — three-step answer to "what is this thing?"
              for cold traffic. Per the May 2026 homepage audit, the page
              previously made visitors sit through 4 emotional sections
              before they could explain the product to themselves. This
              strip gives them the answer in 5 seconds, then the
              emotional sections deepen the why. */}
          <HowItWorksStrip />

          {/* 2. This is your loop */}
          <BrandStatement />

          {/* Iconic-line motif between Loop and Try-it. V4 Option 1 locked:
              "It's not the mistake. It's what you do after." Single-line,
              no outcome copy beneath it \u2014 v4 wants less, not more. */}
          <IconicLine />

          {/* 3. Try it now \u2014 interactive, still the #try-it anchor target */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* Comparison table \u2014 cold visitors compare COYL to Noom /
              MFP / Calibrate in their head; this gives them a structured
              way to do it. Wins on three axes: when-it-acts (only COYL
              fires at decision moment), bad-day handling (no restart),
              and price ($19 below Noom's $60 and Calibrate's ~$137). Per
              May 2026 audit \u00a77. */}
          <ComparisonTable />

          {/* 4. This is for you \u2014 recognition bullets */}
          <YouIf />

          {/* 5. Real moment \u2014 Friday night "I'll restart Monday" scene */}
          <LiveExample />

          {/* Viral-screenshot section. Four punchy quotable lines designed
              to be screenshotted and shared. Added per reviewer note:
              "You need ONE viral screenshot moment." */}
          <ThingsCoylSays />

          {/* 6. Wedge \u2014 Built first for weight loss + one-line broaden */}
          <UniversalWedges />

          {/* 7. Recovery */}
          <RecoverySection />

          {/* Homepage FAQ — five highest-frequency cold-traffic
              objections (GLP-1 replace?, privacy, notification volume,
              what-if-it-doesn't-work, medical disclaimer). Sits before
              B2B + final CTA so consumer questions are answered before
              we ask for the click. Full FAQ continues on /pricing. */}
          <HomepageFaq />

          {/* B2B partners strip — telehealth GLP-1, employers, research
              labs. Per the May 2026 audit, the homepage was 100%
              consumer-facing with no surface for the 3 audiences that
              gate $60M of the $100M revenue plan. Honest framing — no
              fake logos, no fake outcome stats, single mailto +
              /research deep link. */}
          <PartnersStrip />

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
/**
 * LOCKED signature line \u2014 used verbatim on landing, ads, OG cards,
 * product header, social. One line, seen enough times to stick.
 * No subcopy \u2014 spec says less, not more.
 */
function IconicLine() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-16 text-center md:px-12">
      <p className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
        It&apos;s not the mistake.<br />
        It&apos;s{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          what you do after
        </span>.
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
