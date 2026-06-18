'use client'

import { Mic, Target } from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard-header'
import { QuickStats } from '@/components/quick-stats'
import { SpendingChart } from '@/components/spending-chart'
import { QuickActions } from '@/components/quick-actions'
import { AiAssistant } from '@/components/ai-assistant'
import { SectionHeader } from '@/components/section-header'
import { voiceExamples } from '@/components/voice-experience'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { getIcon } from '@/lib/icons'
import { nextDueDate, daysUntil, urgentReminders } from '@/lib/calendar'

export default function HomePage() {
  const { openVoice, open } = useUI()
  const { data } = useStore()
  const urgent = urgentReminders(data.reminders)

  return (
    <>
      <DashboardHeader />
      <QuickStats />
      <SpendingChart />

      {urgent.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Avisos" />
          <div className="flex flex-col gap-2">
            {urgent.map((r) => {
              const Icon = getIcon(r.icon)
              const days = daysUntil(nextDueDate(r))
              const name = data.profile?.name
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => open({ kind: 'reminder', editing: r })}
                  className="glass-strong flex items-center gap-3 rounded-3xl p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-2xl"
                    style={{ background: r.color }}
                  >
                    <Icon className="size-6 text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight">
                      {days === 0
                        ? `Hoy vence ${r.title}`
                        : name
                          ? `${name}, en ${days} días vence ${r.title}`
                          : `En ${days} días vence ${r.title}`}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      ${r.amount}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Acciones rápidas" />
        <QuickActions onVoice={openVoice} />
      </section>

      <Link
        href="/metas"
        className="glass-strong flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[oklch(0.7_0.18_295)]">
          <Target className="size-6 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Ir a Metas</span>
          <span className="block truncate text-sm text-muted-foreground">
            Revisa tus metas de ahorro y haz seguimiento
          </span>
        </span>
      </Link>

      <AiAssistant />

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
    </>
  )
}
