import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SoftwareApplicationSchema, FAQSchema } from './structured-data'
import { CrystalBackground } from '@/components/landing/crystal-bg'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroSection } from '@/components/landing/hero-section'
import { BrandStatement } from '@/components/landing/brand-statement'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { InteractiveDemo } from '@/components/landing/interactive-demo'
import { AiDemo } from '@/components/landing/ai-demo'
import { PricingSection } from '@/components/landing/pricing-section'
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
          <HeroSection />
          <BrandStatement />
          <FeaturesGrid />
          <InteractiveDemo />
          <AiDemo />
          <PricingSection />
        </main>

        <LandingFooter />
      </div>
    </CrystalBackground>
  )
}
