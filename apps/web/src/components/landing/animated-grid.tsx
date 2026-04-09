'use client'

export function AnimatedGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Animated mesh blobs */}
      <div className="absolute -left-[10%] -top-[20%] h-[70vw] w-[70vw] animate-[mesh1_20s_ease-in-out_infinite_alternate] rounded-full bg-orange-500 opacity-[0.12] blur-[120px] mix-blend-screen" />
      <div className="absolute -bottom-[20%] -right-[10%] h-[60vw] w-[60vw] animate-[mesh2_25s_ease-in-out_infinite_alternate] rounded-full bg-red-700 opacity-[0.10] blur-[140px] mix-blend-screen" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />
    </div>
  )
}
