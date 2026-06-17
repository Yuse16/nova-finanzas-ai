'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  SmartInsights,
  HealthScore,
  PovertyZero,
  RemindersModule,
} from '@/components/insights-health'

export default function InsightsPage() {
  return (
    <>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -mb-2"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>
      <SmartInsights />
      <HealthScore />
      <PovertyZero />
      <RemindersModule />
    </>
  )
}
