'use client'

import Image from 'next/image'
import { useUI } from '@/lib/ui-context'

export function MountainBackground() {
  const { theme } = useUI()

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={theme === 'dark' ? '/montanaobs.webp' : '/montanav2.webp'}
        alt=""
        fill
        priority
        aria-hidden
        className="object-cover"
        style={{ objectPosition: 'center 30%' }}
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background:
            theme === 'dark'
              ? 'linear-gradient(to bottom, transparent 0%, #030712 100%)'
              : 'linear-gradient(to bottom, transparent 0%, white 100%)',
        }}
      />
    </div>
  )
}
