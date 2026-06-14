'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context' // NEW: Import useUI
import { getCategoryMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import { aiService, type AssistantAnswer } from '@/lib/services/ai'

const prompts = [
  '¿Dónde estoy gastando más este mes?',
  '¿Cuánto me queda para terminar el mes?',
  '¿Cómo puedo ahorrar más?',
  '¿Cuáles son mis gastos hormiga?',
]

export function AiAssistant() {
  const { data, addAssistantMessage } = useStore() // NEW: addAssistantMessage
  const { open } = useUI() // NEW: useUI hook

  const [active, setActive] = useState(0)
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null)
  const [loading, setLoading] = useState(false)

  // Función para manejar el envío de preguntas
  const askQuestion = async (index: number) => {
    setActive(index)
    setLoading(true)
    setAnswer(null) // Limpiar respuesta anterior
    const selectedQuestion = prompts[index]
    try {
      const response = await aiService.ask(selectedQuestion, data)
      setAnswer(response)
      // NEW: Save to assistant history
      addAssistantMessage({
        question: selectedQuestion,
        answer: response.text,
        breakdown: response.breakdown,
      })
    } catch (error) {
      console.error('Error asking AI:', error)
      setAnswer({ text: 'Lo siento, hubo un error al procesar tu solicitud.' })
    } finally {
      setLoading(false)
    }
  }

  // Cargar la primera respuesta al montar el componente o cambiar los datos
  useEffect(() => {
    // Only ask if there isn't already an answer (e.g. from history being loaded)
    if (data && data.movements.length > 0 && !answer) {
      askQuestion(active)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]) // Re-evaluar cuando los datos cambian
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-[oklch(0.8_0.15_290)]" />
        <h2 className="text-lg font-semibold tracking-tight">Asistente IA</h2>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {prompts.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => askQuestion(i)} // Llama a askQuestion
            className={`shrink-0 rounded-2xl px-4 py-2 text-left text-sm font-medium transition-colors ${
              active === i
                ? 'bg-[oklch(0.6_0.17_290)] text-white'
                : 'glass-subtle'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="glass-subtle mt-4 rounded-2xl p-4"
        >
          {loading ? (
            <p className="py-2 text-center text-sm text-muted-foreground animate-pulse">Pensando...</p>
          ) : answer ? (
            <>
              <p className="text-sm text-muted-foreground">{answer.text}</p>
              {answer.breakdown && answer.breakdown.length > 0 && (
          <ul className="mt-3 flex flex-col gap-3">
                  {answer.breakdown.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                        style={{ background: s.color || getCategoryMeta(s.label).color }}
                />
                <span className="flex-1 text-sm font-medium">{s.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(s.amount)}
                </span>
                <span className="glass w-12 rounded-lg py-0.5 text-center text-xs font-medium tabular-nums">
                  {s.percent}%
                </span>
              </li>
            ))}
                </ul>
            )}
            </>
          ) : (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Selecciona una pregunta para empezar.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={() => open({ kind: 'assistant' })} // NEW: Open assistant history modal
        className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground active:text-foreground hover:text-foreground transition-colors"
      >
        Ver conversación <ChevronRight className="size-4" />
      </button>
    </GlassCard>
  )
}
