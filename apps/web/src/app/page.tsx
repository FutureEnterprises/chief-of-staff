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
import { WedgeClarity } from '@/components/landing/wedge-clarity'
import { AiDemo } from '@/components/landing/ai-demo'
import { PatternIntelligence } from '@/components/landing/pattern-intelligence'
import { RecoverySection } from '@/components/landing/recovery-section'
import { RescueDemo } from '@/components/landing/rescue-demo'
import { UniversalWedges } from '@/components/landing/universal-wedges'
import { YouIf } from '@/components/landing/you-if'
import { PricingSection } from '@/components/landing/pricing-section'
import { FinalCta } from '@/components/landing/final-cta'
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
  const clerkReady = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')
  if (clerkReady) {
    const { userId } = await auth()
    if (userId) redirect('/today')
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
          {/* Hero — variant-specific */}
          <HeroVariants variant={variant} />

          {/* Playable demo — anchor target for hero CTAs */}
          <div id="try-it">
            <RescueDemo />
          </div>

          {/* Universality — the "not a weight-loss app" pillar */}
          <UniversalWedges />

          {/* Recognition — "This is for you if..." content-hook section */}
          <YouIf />

          {/* Truth */}
          <BrandStatement />
          {/* What COYL does */}
          <FeaturesGrid />
          {/* Live Example */}
          <LiveExample />
          {/* Wedge Clarity */}
          <WedgeClarity />
          {/* Personality Modes */}
          <AiDemo />
          {/* Pattern Intelligence */}
          <PatternIntelligence />
          {/* Recovery */}
          <RecoverySection />
          {/* Pricing */}
          <PricingSection />
          {/* Final CTA */}
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
