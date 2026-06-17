'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { FontProvider } from './font-provider'
import { BottomNav } from './bottom-nav'
import { VoiceExperience } from './voice-experience'
import { Onboarding } from './onboarding'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'

import { TransactionModal } from './transaction-modal'
import { TransferModal } from './transfer-modal'
import { QuickActionsModal } from './quick-actions-modal'
import { AccountModal } from './account-modal'
import { GoalModal } from './goal-modal'
import { ReminderModal } from './reminder-modal'
import { MoreOptionsModal } from './more-options-modal'
import { AllMovementsModal } from './all-movements-modal'
import { AssistantHistoryModal } from './assistant-history-modal'
import { SettingsModal } from './settings-modal'
import { SearchModal } from './search-modal'
import { FiltersModal } from './filters-modal'
import { NotificationsModal } from './notifications-modal'
import { BalanceDetailModal } from './balance-detail-modal'

export function AppShell({ children }: { children: ReactNode }) {
  const { data, ready } = useStore()
  const { voiceOpen, closeVoice } = useUI()

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    )
  }

  if (!data.profile || !data.profile.onboarded) {
    return <Onboarding />
  }

  return (
    <FontProvider>
      <div
        className="relative min-h-screen overflow-x-hidden"
        style={{ paddingTop: 'var(--sat)', minHeight: 'calc(100vh - var(--sat) - var(--sab))' }}
      >
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
          {children}
        </main>

        <BottomNav />

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

        <VoiceExperience open={voiceOpen} onClose={closeVoice} />
      </div>
    </FontProvider>
  )
}
