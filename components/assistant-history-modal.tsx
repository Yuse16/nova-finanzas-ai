'use client'

import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { GlassSheet } from './ui/glass-sheet'
import { MessageSquare, Bot } from 'lucide-react'
import { getCategoryMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'

export function AssistantHistoryModal() {
  const { modal, close } = useUI()
  const { data } = useStore()
  const isOpen = modal.kind === 'assistant'

  // Sort history newest first
  const history = [...data.assistantHistory].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Historial del Asistente"
      fullScreen
    >
      <div className="flex flex-col gap-6 pb-6">
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No hay historial de conversación con el asistente aún.
          </p>
        ) : (
          history.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-3 glass-subtle p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Tú:</span> {msg.question}
              </p>
              <p className="text-sm">
                <Bot className="inline-block size-4 mr-1 text-[oklch(0.8_0.15_290)]" />
                <span className="font-semibold text-foreground">Asistente:</span> {msg.answer}
              </p>
              {msg.breakdown && msg.breakdown.length > 0 && (
                <ul className="mt-2 flex flex-col gap-2">
                  {msg.breakdown.map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: item.color || getCategoryMeta(item.label).color }}
                      />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <span className="font-semibold tabular-nums">{fmt(item.amount)}</span>
                      <span className="glass w-10 text-center rounded-lg py-0.5 font-medium tabular-nums">
                        {item.percent}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="text-xs text-right text-muted-foreground mt-2">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </GlassSheet>
  )
}

