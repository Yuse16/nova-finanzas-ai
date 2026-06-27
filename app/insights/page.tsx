'use client'

import {
  SmartInsights,
  HealthScore,
  PovertyZero,
  RemindersModule,
} from '@/components/insights-health'

export default function InsightsPage() {
  return (
    <>
      <SmartInsights />
      <HealthScore />
      <PovertyZero />
      <RemindersModule />
    </>
  )
}
