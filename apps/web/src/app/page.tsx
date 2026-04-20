import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { CrystalBackground } from '@/components/landing/crystal-bg'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroSection } from '@/components/landing/hero-section'
import { BrandStatement } from '@/components/landing/brand-statement'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { LiveExample } from '@/components/landing/live-example'
import { WedgeClarity } from '@/components/landing/wedge-clarity'
import { AiDemo } from '@/components/landing/ai-demo'
import { PatternIntelligence } from '@/components/landing/pattern-intelligence'
import { RecoverySection } from '@/components/landing/recovery-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { FinalCta } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/footer'

export default async function HomePage() {
  const clerkReady = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')
  if (clerkReady) {
    const { userId } = await auth()
    if (userId) redirect('/today')
  }

  return (
    <CrystalBackground>
      <SoftwareApplicationSchema />
      <FAQSchema />
      <div className="relative min-h-screen text-white selection:bg-orange-500 selection:text-white">
        <GlassNav />

        <main className="relative z-10">
          {/* 1. Hero */}
          <HeroSection />
          {/* 2. Truth */}
          <BrandStatement />
          {/* 3. What COYL does */}
          <FeaturesGrid />
          {/* 4. Live Example */}
          <LiveExample />
          {/* 5. Wedge Clarity */}
          <WedgeClarity />
          {/* 6. Personality Modes */}
          <AiDemo />
          {/* 7. Pattern Intelligence */}
          <PatternIntelligence />
          {/* 8. Recovery */}
          <RecoverySection />
          {/* 9. Pricing */}
          <PricingSection />
          {/* 10. Final CTA */}
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </CrystalBackground>
  )
}
