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
import { Onboarding } from '@/components/onboarding'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { useEffect, useRef } from 'react'

// Import all global modals
import { TransactionModal } from '@/components/transaction-modal'
import { TransferModal } from '@/components/transfer-modal'
import { QuickActionsModal } from '@/components/quick-actions-modal'
import { AccountModal } from '@/components/account-modal'
import { GoalModal } from '@/components/goal-modal'
import { ReminderModal } from '@/components/reminder-modal'
import { MoreOptionsModal } from '@/components/more-options-modal'
import { AllMovementsModal } from '@/components/all-movements-modal';
import { AssistantHistoryModal } from '@/components/assistant-history-modal';
import { SettingsModal } from '@/components/settings-modal';
import { SearchModal } from '@/components/search-modal'
import { FiltersModal } from '@/components/filters-modal'
import { FontProvider } from '@/components/font-provider'
import { NotificationsModal } from '@/components/notifications-modal';
import { BalanceDetailModal } from '@/components/balance-detail-modal';

export default function Page() {
  const { data, ready } = useStore()
  const { open } = useUI()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const openVoice = () => setVoiceOpen(true)

  // Definir refs para las secciones principales
  const homeRef = useRef<HTMLDivElement>(null)
  const movementsRef = useRef<HTMLDivElement>(null)
  const accountsRef = useRef<HTMLDivElement>(null)

  // Función para hacer scroll a una sección
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    )
  }

  // If no onboarding profile data exists, show the onboarding screen
  if (!data.profile || !data.profile.onboarded) {
    return <Onboarding />
  }

  return (
    <FontProvider>
      {/* Aplicar padding-top y min-height para respetar safe areas */}
      <div
        className="relative min-h-screen overflow-x-hidden"
        style={{ paddingTop: 'var(--sat)', minHeight: 'calc(100vh - var(--sat) - var(--sab))' }}
      >
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
          <div ref={homeRef}>
            <QuickStats />
          </div>
          <SpendingChart />

          <section className="flex flex-col gap-3">
            <SectionHeader title="Acciones rápidas" />
            <QuickActions onVoice={openVoice} />
          </section>

          <div ref={accountsRef}>
            <AccountsModule />
          </div>
          <div ref={movementsRef}>
            <MovementsModule />
          </div>
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

        {/* Bottom Nav onAdd triggers the Quick Actions Modal instead of voice directly */}
        {/* El BottomNav ya tiene un padding-bottom del body/html si se definió correctamente, pero el contenido de page.tsx debe tener un espacio general */}
        <BottomNav
          onAdd={() => open({ kind: 'quick-actions' })}
          onNavigate={scrollToSection}
          homeRef={homeRef}
          movementsRef={movementsRef}
          accountsRef={accountsRef}
        />

        {/* Global Modals */}
        <TransactionModal />
        <TransferModal />
        <QuickActionsModal />
        <AccountModal />
        <GoalModal />
        <ReminderModal />
        <MoreOptionsModal />
        <AllMovementsModal />
        <AssistantHistoryModal />
        <SettingsModal />
        <SearchModal />
        <FiltersModal />
        <NotificationsModal />
        <BalanceDetailModal />

        <VoiceExperience open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      </div>
    </FontProvider>
  )
}

