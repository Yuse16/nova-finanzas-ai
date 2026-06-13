'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Mic } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { QuickStats } from '@/components/quick-stats'
import { SpendingChart } from '@/components/spending-chart'
import { QuickActions } from '@/components/quick-actions'
import { AccountsModule } from '@/components/accounts-module'
import { MovementsModule } from '@/components/movements-module'
import { AiAssistant } from '@/components/ai-assistant'
import { GoalsModule } from '@/components/goals-module'
import {
  SmartInsights,
  HealthScore,
  PovertyZero,
  RemindersModule,
} from '@/components/insights-health'
import { BottomNav } from '@/components/bottom-nav'
import { VoiceExperience, voiceExamples } from '@/components/voice-experience'
import { SectionHeader } from '@/components/section-header'

export default function Page() {
  const [voiceOpen, setVoiceOpen] = useState(false)
  const openVoice = () => setVoiceOpen(true)

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/bg-atmosphere.png"
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.55_0.13_255/35%)]" />
      </div>

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-40 pt-6">
        <DashboardHeader />
        <QuickStats />
        <SpendingChart />

        <section className="flex flex-col gap-3">
          <SectionHeader title="Acciones rápidas" />
          <QuickActions onVoice={openVoice} />
        </section>

        <AccountsModule />
        <MovementsModule />
        <AiAssistant />
        <SmartInsights />
        <GoalsModule />
        <HealthScore />
        <PovertyZero />
        <RemindersModule />

        {/* Voice trigger bar */}
        <button
          type="button"
          onClick={openVoice}
          className="glass-strong flex items-center gap-4 rounded-3xl p-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-[oklch(0.62_0.17_290)]">
            <span
              className="absolute size-14 rounded-full bg-[oklch(0.7_0.18_290)]"
              style={{ animation: 'nova-pulse 2.4s ease-out infinite' }}
            />
            <Mic className="relative size-6 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Registra hablando
            </span>
            <span className="block truncate text-sm text-muted-foreground">
              &ldquo;{voiceExamples[0]}&rdquo; · &ldquo;{voiceExamples[1]}&rdquo;
            </span>
          </span>
        </button>
      </main>

      <BottomNav onAdd={openVoice} />
      <VoiceExperience open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  )
}
