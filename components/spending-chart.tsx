'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { chartData } from '@/lib/data'

const W = 320
const H = 150
const PAD = 8

function buildPaths(data: number[]) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = (W - PAD * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = PAD + i * stepX
    const y = PAD + (H - PAD * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  // smooth catmull-rom -> bezier
  let line = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  const area = `${line} L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`
  return { line, area, points }
}

export function SpendingChart() {
  const id = useId()
  const { line, area, points } = buildPaths(chartData)
  const last = points[points.length - 1]

  return (
    <GlassCard
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-5"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold">Gráfica de gastos</h2>
        <span className="text-xs text-muted-foreground">(mensual)</span>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground tabular-nums">
          <span>$1,200</span>
          <span>$900</span>
          <span>$600</span>
          <span>$300</span>
          <span>$0</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[150px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfica de gastos mensuales"
        >
          <defs>
            <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.18 290)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="oklch(0.72 0.16 255)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.74 0.15 235)" />
              <stop offset="100%" stopColor="oklch(0.7 0.18 295)" />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill={`url(#${id}-area)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke={`url(#${id}-line)`}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
          <circle cx={last[0]} cy={last[1]} r="4" fill="oklch(0.99 0.01 250)" />
        </svg>
      </div>

      <div className="mt-2 flex justify-between pl-8 text-[10px] text-muted-foreground tabular-nums">
        <span>1</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30</span>
      </div>
    </GlassCard>
  )
}
