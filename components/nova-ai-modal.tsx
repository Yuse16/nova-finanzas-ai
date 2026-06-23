'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Sparkles, TrendingUp, TrendingDown, Target, BarChart3, CreditCard, Check, Loader2 } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { sendChatMessage, type AssistantMessage, type NovaIntent, type DetectedData } from '@/lib/services/openrouter'
import { fmt } from '@/lib/format'
import { useStore } from '@/lib/store'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: NovaIntent
  data?: DetectedData | null
  confirmed?: boolean
}

const quickChips = [
  { label: '➕ Registrar gasto', prompt: 'Agrega un gasto' },
  { label: '💰 Registrar ingreso', prompt: 'Registra un ingreso' },
  { label: '📊 Analizar finanzas', prompt: 'Analiza mis finanzas' },
  { label: '🎯 Crear meta', prompt: 'Quiero crear una meta' },
  { label: '💳 Revisar deudas', prompt: 'Analiza mis deudas' },
]

let msgId = 0
function nextId() {
  msgId += 1
  return `msg-${msgId}`
}

export function NovaAIModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'nova-ai'
  const { data, addMovement, addGoal } = useStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMessages([])
      setShowChips(true)
      msgId = 0
    }
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || loading) return
    setShowChips(false)

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history: { role: string; content: string }[] = [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: text }]

    try {
      const response = await sendChatMessage(history)
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: response.text,
        intent: response.intent,
        data: response.data,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content: 'Lo siento, hubo un error al comunicarme con Nova AI. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleChipClick(prompt: string) {
    handleSend(prompt)
  }

  function confirmIntent(msg: ChatMessage) {
    if (msg.intent === 'addExpense' && msg.data) {
      addMovement({
        title: msg.data.titulo || 'Gasto',
        category: msg.data.categoria || 'Otros',
        amount: msg.data.monto || 0,
        type: 'gasto',
        accountId: data.accounts[0]?.id || '',
        toAccountId: null,
        method: 'Otro',
        date: new Date().toISOString(),
        person: '',
        note: '',
        icon: 'wallet',
        color: '#ef4444',
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m))
    }
    if (msg.intent === 'addIncome' && msg.data) {
      addMovement({
        title: msg.data.titulo || 'Ingreso',
        category: 'Ingreso',
        amount: msg.data.monto || 0,
        type: 'ingreso',
        accountId: data.accounts[0]?.id || '',
        toAccountId: null,
        method: 'Otro',
        date: new Date().toISOString(),
        person: '',
        note: '',
        icon: 'wallet',
        color: '#22c55e',
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m))
    }
    if (msg.intent === 'createGoal' && msg.data) {
      addGoal({
        title: msg.data.titulo || 'Meta',
        saved: 0,
        target: msg.data.monto || 0,
        date: new Date().toISOString().split('T')[0],
        icon: 'target',
        color: '#3b82f6',
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m))
    }
  }

  function intentCard(msg: ChatMessage) {
    if (!msg.data || msg.confirmed) return null

    if (msg.intent === 'addExpense') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-red-100 dark:border-red-900/30 p-3">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Gasto detectado</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Categoría: <span className="font-medium">{msg.data.categoria}</span></p>
          <p className="text-sm text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(msg.data.monto || 0)}</span></p>
          <button
            type="button"
            onClick={() => confirmIntent(msg)}
            className="mt-2 w-full rounded-lg bg-red-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Guardar gasto
          </button>
        </div>
      )
    }

    if (msg.intent === 'addIncome') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-green-100 dark:border-green-900/30 p-3">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">Ingreso detectado</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(msg.data.monto || 0)}</span></p>
          <button
            type="button"
            onClick={() => confirmIntent(msg)}
            className="mt-2 w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Guardar ingreso
          </button>
        </div>
      )
    }

    if (msg.intent === 'createGoal') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-blue-100 dark:border-blue-900/30 p-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Meta detectada</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Título: <span className="font-medium">{msg.data.titulo}</span></p>
          <p className="text-sm text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(msg.data.monto || 0)}</span></p>
          <button
            type="button"
            onClick={() => confirmIntent(msg)}
            className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Crear meta
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <GlassSheet open={isOpen} onClose={close} title="Nova AI" fullScreen>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500">
                  <Sparkles className="size-5 text-white" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Hola Jorge 👋</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nova AI — Tu asistente financiero inteligente</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-white/[0.08] p-4 mt-3 border border-gray-100 dark:border-white/10">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  Puedo ayudarte a:
                </p>
                <ul className="mt-2 space-y-1">
                  {['Registrar gastos', 'Registrar ingresos', 'Crear metas', 'Analizar deudas', 'Revisar movimientos', 'Dar consejos financieros'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="size-1.5 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">¿Qué deseas hacer?</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white/60 dark:bg-white/[0.08] border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Nova AI</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.intent && msg.intent !== 'unknown' && (
                    msg.confirmed ? (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-green-500">
                        <Check className="size-3.5" />
                        Guardado
                      </div>
                    ) : (
                      intentCard(msg)
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-gray-100 dark:border-white/10 px-4 py-3 rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nova está escribiendo...</p>
                </div>
              </div>
            </motion.div>
          )}

          {showChips && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {quickChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  className="rounded-full bg-white/60 dark:bg-white/[0.08] border border-gray-100 dark:border-white/10 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 active:scale-95 transition-all hover:bg-white/80 dark:hover:bg-white/15"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white disabled:opacity-40 active:scale-90 transition-transform"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </GlassSheet>
  )
}
