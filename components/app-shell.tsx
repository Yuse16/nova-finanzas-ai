'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

import { FontProvider } from './font-provider'
import { generateNotifications, saveNotifications } from '@/lib/notifications'
import { BottomNav } from './bottom-nav'
import { VoiceExperience } from './voice-experience'
import { Onboarding } from './onboarding'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import type { AppData } from '@/lib/types'
import { ThemeCustomizationProvider } from '@/context/ThemeCustomizationContext'
import { PageHeader } from './page-header'
import type { PageType } from './page-header'

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
import { FinancialSummaryFull } from './financial-summary-full'

function getPageType(pathname: string): PageType | null {
  const key = pathname.replace('/', '') || 'home'
  if (['home', 'movimientos', 'cuentas', 'historial', 'insights', 'metas'].includes(key)) {
    return key as PageType
  }
  return null
}

export function AppShell({ children }: { children: ReactNode }) {
  const ready = useStore((s) => s.ready)
  const profile = useStore((s) => s.data.profile)
  const accounts = useStore((s) => s.data.accounts)
  const movements = useStore((s) => s.data.movements)
  const goals = useStore((s) => s.data.goals)
  const reminders = useStore((s) => s.data.reminders)
  const assistantHistory = useStore((s) => s.data.assistantHistory)
  const recoveryPlans = useStore((s) => s.data.recoveryPlans)

  const { voiceOpen, closeVoice, theme, setTheme, showFullSummary } = useUI()
  const pathname = usePathname()
  const pageType = getPageType(pathname)

  // Scroll to top on every navigation (fixes mobile scroll jump)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Apply saved theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('nova-finanzas:theme')
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    } else {
      setTheme('light')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate notifications on mount and when financial data changes (debounced)
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      const notifs = generateNotifications({
        profile,
        accounts,
        movements,
        goals,
        reminders,
        assistantHistory,
        recoveryPlans,
        version: 2,
      } as AppData)
      saveNotifications(notifs)
    }, 1000)
    return () => clearTimeout(timer)
  }, [ready, accounts, movements, reminders, goals, profile])

  if (pathname.startsWith('/auth')) {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    )
  }

  const needsOnboarding =
    !profile ||
    !profile.onboarded ||
    (accounts.length === 0 && !profile.accountsSkipped)
  if (needsOnboarding) {
    return <Onboarding />
  }

  return (
    <ThemeCustomizationProvider>
      <div
        className="relative overflow-x-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', minHeight: '100dvh' }}
      >
        <AnimatePresence mode="wait">
          {!showFullSummary ? (
            <motion.div
              key="home"
              className="contents"
              initial={false}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            >
              <main className={`mx-auto flex w-full max-w-lg flex-col gap-6 px-5 pb-40 ${pathname === '/' ? 'pt-0' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)]'}`}>
                {pageType && <PageHeader page={pageType} />}
                {children}
              </main>

              <BottomNav />
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              className="contents"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            >
              <FinancialSummaryFull />
            </motion.div>
          )}
        </AnimatePresence>

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
