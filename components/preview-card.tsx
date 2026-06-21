'use client'

import { useCustomization } from '@/context/ThemeCustomizationContext'
import { CreditCard, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export function PreviewCard() {
  const { settings } = useCustomization()
  const { cards, typography, layout, accessibility } = settings

  const shadowClass = cards.shadowIntensity === 'none' ? 'shadow-none'
    : cards.shadowIntensity === 'low' ? 'shadow-sm'
    : cards.shadowIntensity === 'medium' ? 'shadow-md'
    : 'shadow-xl'

  const borderClass = cards.borderWidth > 0 ? 'border border-white/20' : 'border-0'

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ${borderClass} ${shadowClass}`}
      style={{
        borderRadius: `${cards.borderRadius}px`,
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        padding: layout.spacing === 'compact' ? '12px' : layout.spacing === 'wide' ? '24px' : '16px',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-white/60 text-xs font-medium uppercase tracking-wider"
            style={{ letterSpacing: '0.1em', fontSize: `${Math.max(10, typography.fontSize - 6)}px` }}
          >
            Balance Total
          </p>
          <p
            className="text-white font-bold mt-1"
            style={{
              fontSize: `${Math.max(18, typography.fontSize + 8)}px`,
              fontWeight: accessibility.largeText ? 700 : 600,
              letterSpacing: LETTER_SPACING_MAP[typography.letterSpacing],
            }}
          >
            $12,450.00
          </p>
        </div>
        <div
          className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur-sm"
          style={{ borderRadius: `${Math.max(8, cards.borderRadius - 8)}px` }}
        >
          <CreditCard className="size-5 text-white" />
        </div>
      </div>

      <div
        className="flex gap-4 mt-4"
        style={{ gap: layout.spacing === 'compact' ? '8px' : layout.spacing === 'wide' ? '20px' : '12px' }}
      >
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 flex-1"
          style={{ borderRadius: `${Math.max(6, cards.borderRadius - 10)}px` }}
        >
          <TrendingUp className="size-4 text-green-300" />
          <div>
            <p className="text-white/50 text-[10px] font-medium">Ingresos</p>
            <p className="text-white text-sm font-semibold"
              style={{ fontSize: `${Math.max(12, typography.fontSize - 2)}px` }}
            >$3,200</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 flex-1"
          style={{ borderRadius: `${Math.max(6, cards.borderRadius - 10)}px` }}
        >
          <TrendingDown className="size-4 text-red-300" />
          <div>
            <p className="text-white/50 text-[10px] font-medium">Gastos</p>
            <p className="text-white text-sm font-semibold"
              style={{ fontSize: `${Math.max(12, typography.fontSize - 2)}px` }}
            >$1,890</p>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-4 pt-3 border-t border-white/15"
      >
        <p
          className="text-white/50 text-[10px] font-mono"
          style={{ letterSpacing: '0.15em', fontSize: `${Math.max(9, typography.fontSize - 7)}px` }}
        >
          **** 4532
        </p>
        <Wallet className="size-4 text-white/40" />
      </div>
    </div>
  )
}

const LETTER_SPACING_MAP: Record<string, string> = {
  tight: '-0.025em',
  normal: '0em',
  wide: '0.05em',
}
