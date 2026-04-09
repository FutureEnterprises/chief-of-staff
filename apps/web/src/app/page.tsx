import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AnimatedGrid } from '@/components/landing/animated-grid'
import { GlassNav } from '@/components/landing/glass-nav'
import { HeroSection } from '@/components/landing/hero-section'
import { BrandStatement } from '@/components/landing/brand-statement'
import { FeaturesGrid } from '@/components/landing/features-grid'
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
    <div className="relative min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500 selection:text-white">
      <AnimatedGrid />
      <GlassNav />

      <main className="relative z-10">
        <HeroSection />
        <BrandStatement />
        <FeaturesGrid />
        <PricingSection />
      </main>

      <LandingFooter />
    </div>
  )
}
