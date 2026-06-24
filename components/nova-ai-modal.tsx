'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Sparkles, TrendingUp, TrendingDown, Target, BarChart3, CreditCard, Check, Loader2, Mic, Wallet, PiggyBank, Calendar } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { sendChatMessage, type NovaIntent, type DetectedData } from '@/lib/services/openrouter'
import { fmt } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

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
  { label: '📊 Analizar finanzas', prompt: 'Analiza mis finanzas del mes' },
  { label: '🎯 Crear meta', prompt: 'Quiero crear una meta' },
  { label: '💳 Revisar deudas', prompt: 'Analiza mis deudas' },
  { label: '📈 Resumen del mes', prompt: 'Dame un resumen de este mes' },
  { label: '🔄 Simular ahorro', prompt: 'Si ahorro 200 más al mes, ¿cuánto tendría en 6 meses?' },
  { label: '🔍 Detectar suscripciones', prompt: '¿Tengo suscripciones activas?' },
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
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { supported, status, transcript, start, stop, reset } = useSpeechRecognition()

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

  // Voice recognition result handler
  useEffect(() => {
    if (status === 'done' && transcript && listening) {
      setInput(transcript)
      setListening(false)
      // Auto-send after voice
      handleSend(transcript)
    }
    if (status === 'error' && listening) {
      setListening(false)
    }
  }, [status, transcript, listening])

  function toggleVoice() {
    if (listening) {
      stop()
      setListening(false)
    } else {
      reset()
      start()
      setListening(true)
    }
  }

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
          <button type="button" onClick={() => confirmIntent(msg)} className="mt-2 w-full rounded-lg bg-red-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform">Guardar gasto</button>
        </div>
      )
    }

    if (msg.intent === 'addIncome') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-green-100 dark:border-green-900/30 p-3">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">Ingreso detectado</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(msg.data.monto || 0)}</span></p>
          <button type="button" onClick={() => confirmIntent(msg)} className="mt-2 w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform">Guardar ingreso</button>
        </div>
      )
    }

    if (msg.intent === 'createGoal') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-blue-100 dark:border-blue-900/30 p-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Meta detectada</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Título: <span className="font-medium">{msg.data.titulo}</span></p>
          <p className="text-sm text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(msg.data.monto || 0)}</span></p>
          <button type="button" onClick={() => confirmIntent(msg)} className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform">Crear meta</button>
        </div>
      )
    }

    return null
  }

  function dataCard(msg: ChatMessage) {
    if (msg.intent === 'monthlySummary' && msg.data) {
      const ahorro = (msg.data.ingresos || 0) - (msg.data.gastos || 0)
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">Ingresos</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300 tabular-nums">${fmt(msg.data.ingresos || 0)}</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Gastos</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300 tabular-nums">${fmt(msg.data.gastos || 0)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-3 col-span-2">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Balance</p>
            <p className={`text-lg font-bold tabular-nums ${ahorro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {ahorro >= 0 ? '+' : ''}{fmt(ahorro)}
            </p>
          </div>
        </div>
      )
    }

    if (msg.intent === 'subscriptions') {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-amber-100 dark:border-amber-900/30 p-3">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="size-3" /> Suscripciones detectadas
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Basado en tus movimientos recurrentes</p>
        </div>
      )
    }

    if (msg.intent === 'simulation' && msg.data) {
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-purple-100 dark:border-purple-900/30 p-3">
          <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider flex items-center gap-1">
            <PiggyBank className="size-3" /> Simulación
          </p>
          {msg.data.escenario && <p className="text-sm mt-1 text-gray-600 dark:text-gray-300"><span className="font-medium">Escenario:</span> {msg.data.escenario}</p>}
          {msg.data.resultado && <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Resultado:</span> {msg.data.resultado}</p>}
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
                  {['Registrar gastos e ingresos', 'Crear metas de ahorro', 'Analizar deudas y suscripciones', 'Resumen mensual de finanzas', 'Simular escenarios de ahorro', 'Dar consejos financieros'].map((item) => (
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
                      <>
                        {intentCard(msg)}
                        {!intentCard(msg) && dataCard(msg)}
                      </>
                    )
                  )}
                  {msg.role === 'assistant' && msg.intent && ['monthlySummary', 'subscriptions', 'simulation'].includes(msg.intent) && !msg.confirmed && dataCard(msg)}
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
            {supported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={loading}
                className={`grid size-10 shrink-0 place-items-center rounded-full transition-all ${
                  listening
                    ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40'
                    : 'bg-white/60 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Mic className="size-4" />
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Escuchando...' : 'Escribe tu mensaje...'}
              className="flex-1 rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              disabled={loading || listening}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white disabled:opacity-40 active:scale-90 transition-transform"
            >
              <Send className="size-4" />
            </button>
          </form>
          {listening && (
            <p className="text-xs text-center text-red-500 mt-1 animate-pulse">Habla ahora...</p>
          )}
        </div>
      </div>
    </GlassSheet>
  )
}
