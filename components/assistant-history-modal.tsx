'use client'

import { useState, useMemo } from 'react'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { GlassSheet } from './ui/glass-sheet'
import { Bot, ChevronDown, MessageSquare } from 'lucide-react'
import { getCategoryMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import type { AssistantMessage } from '@/lib/types'

function dateGroup(createdAt: number): string {
  const d = new Date(createdAt)
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[d.getDay()]
  }

  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function AssistantHistoryModal() {
  const { modal, close, open } = useUI()
  const { data } = useStore()
  const isOpen = modal.kind === 'assistant'
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  const history = useMemo(() => {
    return [...(data.assistantHistory ?? [])].sort((a, b) => b.createdAt - a.createdAt)
  }, [data.assistantHistory])

  const grouped = useMemo(() => {
    const map = new Map<string, AssistantMessage[]>()
    history.forEach((msg) => {
      const g = dateGroup(msg.createdAt)
      const list = map.get(g) ?? []
      list.push(msg)
      map.set(g, list)
    })
    return Array.from(map.entries())
  }, [history])

  function toggleDay(group: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  function continueConversation(msg: AssistantMessage) {
    close()
    setTimeout(() => {
      open({
        kind: 'nova-ai',
        history: [{ question: msg.question, answer: msg.answer }],
      })
    }, 200)
  }

  return (
    <GlassSheet open={isOpen} onClose={close} title="Historial del Asistente" fullScreen>
      <div className="flex flex-col pb-6">
        {history.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            No hay historial de conversación con el asistente aún.
          </p>
        ) : (
          grouped.map(([group, items]) => {
            const isExpanded = expandedDays.has(group)
            return (
              <div key={group} className="mb-4">
                <button
                  type="button"
                  onClick={() => toggleDay(group)}
                  className="flex w-full items-center gap-2 px-1 py-2"
                >
                  <ChevronDown
                    className={`size-4 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{group}</p>
                  <p className="text-xs text-gray-400">{items.length} conversacione{items.length !== 1 ? 's' : ''}</p>
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-2 mt-1">
                    {items.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => continueConversation(msg)}
                        className="flex flex-col gap-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.06] border border-gray-100 dark:border-white/10 p-4 text-left transition-colors hover:bg-white/80 dark:hover:bg-white/[0.1] active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MessageSquare className="size-3.5 shrink-0 text-blue-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {msg.question}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          <Bot className="inline-block size-3 mr-0.5 text-[oklch(0.8_0.15_290)]" />
                          {msg.answer}
                        </p>
                        {msg.breakdown && msg.breakdown.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {msg.breakdown.map((b) => (
                              <span
                                key={b.label}
                                className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400"
                              >
                                <span
                                  className="size-1.5 rounded-full"
                                  style={{ background: b.color || getCategoryMeta(b.label).color }}
                                />
                                {b.label} {b.percent}%
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </GlassSheet>
  )
}
