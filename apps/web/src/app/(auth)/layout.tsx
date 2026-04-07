import { CoylLogo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: gradient mesh with brand */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center bg-gradient-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm opacity-[0.07]" />
        <div className="relative z-10 text-center">
          <CoylLogo size="lg" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A system that remembers everything you commit to, follows up until it&apos;s resolved,
            and surfaces what matters.
          </p>
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6">
        {/* Mobile-only gradient banner */}
        <div className="mb-8 lg:hidden">
          <CoylLogo size="md" />
        </div>
        {children}
      </div>
    </div>
  )
}
