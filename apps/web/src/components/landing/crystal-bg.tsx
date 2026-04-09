'use client'

import CrystalCursor from '@/components/ui/crystal-cursor'

export function CrystalBackground({ children }: { children: React.ReactNode }) {
  return (
    <CrystalCursor
      title=""
      subtitle=""
      caption=""
      className="!min-h-0"
    >
      {children}
    </CrystalCursor>
  )
}
