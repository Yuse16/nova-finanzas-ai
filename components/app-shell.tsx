'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { FontProvider } from './font-provider'
import { generateNotifications, saveNotifications } from '@/lib/notifications'
import { BottomNav } from './bottom-nav'
import { VoiceExperience } from './voice-experience'
import { Onboarding } from './onboarding'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { ThemeCustomizationProvider } from '@/context/ThemeCustomizationContext'

import { TransactionModal } from './transaction-modal'
import { TransferModal } from './transfer-modal'
import { QuickActionsModal } from './quick-actions-modal'
import { NovaAIModal } from './nova-ai-modal'
import { AccountModal } from './account-modal'
import { AccountDetailModal } from './account-detail-modal'
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
import { ResetFinancialModal } from './reset-financial-modal'

export function AppShell({ children }: { children: ReactNode }) {
  const { data, ready } = useStore()
  const { voiceOpen, closeVoice, theme, setTheme } = useUI()
  const pathname = usePathname()

  // Apply saved theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('nova-finanzas:theme')
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    } else {
      setTheme('light')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate notifications on mount and when financial data changes
  useEffect(() => {
    if (!ready) return
    const notifs = generateNotifications(data)
    saveNotifications(notifs)
  }, [data, ready])

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
    <ThemeCustomizationProvider>
      <div
        className="relative min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950"
        style={{ paddingTop: 'var(--sat)', minHeight: 'calc(100vh - var(--sat) - var(--sab))' }}
      >
        {pathname !== '/' && pathname !== '/movimientos' && pathname !== '/cuentas' && (
          <div className="fixed inset-0 -z-10" style={{ backgroundImage: 'var(--bg-image)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
            <div className="absolute inset-0" style={{ background: 'var(--bg-overlay)' }} />
          </div>
        )}

        <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 pb-40 pt-6">
          {children}
        </main>

        <BottomNav />

        <TransactionModal />
        <TransferModal />
        <QuickActionsModal />
        <NovaAIModal />
        <AccountModal />
        <AccountDetailModal />
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
        <ResetFinancialModal />

        <VoiceExperience open={voiceOpen} onClose={closeVoice} />
      </div>
    </ThemeCustomizationProvider>
  )
}
