'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Sparkles, TrendingUp, TrendingDown, Target, BarChart3, CreditCard, Check, Loader2, Mic, MicOff, Wallet, PiggyBank, Calendar, ChevronDown, WifiOff } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { sendChatMessage, type NovaIntent, type DetectedData } from '@/lib/services/openrouter'
import { sendHybridMessage, type HybridResult, getConnectionStatus } from '@/lib/services/hybrid-ai'
import { fmt } from '@/lib/format'
import { accountTypeToMethod } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: NovaIntent
  data?: DetectedData | null
  multiData?: DetectedData[]
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

function VoiceMenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all text-left"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  )
}

export function NovaAIModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'nova-ai'
  const { data, addMovement, addGoal, addAssistantMessage } = useStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const [listening, setListening] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    msg: ChatMessage
    data: DetectedData
    type: 'addExpense' | 'addIncome'
    dataIndex?: number
  } | null>(null)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)
  const didHoldRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const voiceBtnRef = useRef<HTMLButtonElement>(null)

  const { supported, status, transcript, start, stop, reset } = useSpeechRecognition()

  const [isOffline, setIsOffline] = useState(!getConnectionStatus())

  useEffect(() => {
    function update() { setIsOffline(!getConnectionStatus()) }
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (isOpen && modal.kind === 'nova-ai') {
      if (modal.history && modal.history.length > 0) {
        const msgs: ChatMessage[] = []
        modal.history.forEach((h) => {
          msgs.push({ id: nextId(), role: 'user', content: h.question })
          msgs.push({ id: nextId(), role: 'assistant', content: h.answer })
        })
        setMessages(msgs)
        setShowChips(false)
      } else {
        setMessages([])
        setShowChips(true)
      }
      msgId = 0
    }
  }, [isOpen])

  // Auto-start voice when opened with startVoice flag
  useEffect(() => {
    if (isOpen && modal.kind === 'nova-ai' && modal.startVoice && supported) {
      reset()
      start()
      setListening(true)
      setShowChips(false)
    }
  }, [isOpen])

  // Stop voice when user releases the Nova button (custom event)
  useEffect(() => {
    if (!isOpen) return
    function handleVoiceEnd() {
      if (listening) {
        stop()
      }
    }
    window.addEventListener('nova-voice-end', handleVoiceEnd)
    return () => window.removeEventListener('nova-voice-end', handleVoiceEnd)
  }, [isOpen, listening, stop])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close voice menu on outside click
  useEffect(() => {
    if (!showVoiceMenu) return
    function handleClick(e: MouseEvent) {
      if (voiceBtnRef.current && !voiceBtnRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showVoiceMenu])

  // Voice recognition result handler for hold-to-talk
  useEffect(() => {
    if (status === 'done' && transcript && listening) {
      setListening(false)
      handleSend(transcript)
    }
    if (status === 'error' && listening) {
      setListening(false)
    }
  }, [status, transcript, listening])

  function startHolding() {
    isHoldingRef.current = true
    didHoldRef.current = false
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true
      // Started holding — begin recording
      reset()
      start()
      setListening(true)
    }, 150)
  }

  function stopHolding() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (isHoldingRef.current && listening) {
      stop()
    }
    isHoldingRef.current = false
  }

  function tapVoice() {
    if (didHoldRef.current) {
      didHoldRef.current = false
      return
    }
    if (listening) {
      stop()
      setListening(false)
      setShowVoiceMenu(false)
    } else {
      setShowVoiceMenu(prev => !prev)
    }
  }

  function voiceMenuOption(prompt: string) {
    setShowVoiceMenu(false)
    handleSend(prompt)
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
      const response: HybridResult = await sendHybridMessage(history, data)
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: response.source === 'nova-core' ? `⚡ ${response.text}` : response.text,
        intent: response.intent,
        data: response.data,
        multiData: response.multiData,
      }
      setMessages(prev => [...prev, assistantMsg])

      addAssistantMessage({
        question: text,
        answer: response.text,
        breakdown: response.data?.breakdown,
      })
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error al procesar tu mensaje'
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content: `⚠️ ${errorMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleChipClick(prompt: string) {
    handleSend(prompt)
  }

  function resolveAccount(hint: string | null | undefined): string | null | '__MULTIPLE__' {
    if (!hint) return null

    const hintLC = hint.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Match by account type
    const typeMap: Record<string, string> = {
      debito: 'debito',
      débito: 'debito',
      credito: 'credito',
      crédito: 'credito',
      efectivo: 'efectivo',
      ahorro: 'ahorro',
      inversion: 'inversion',
      inversión: 'inversion',
    }
    for (const [key, type] of Object.entries(typeMap)) {
      if (hintLC.includes(key)) {
        const matches = data.accounts.filter((a) => a.type === type)
        if (matches.length === 1) return matches[0].id
        if (matches.length > 1) return '__MULTIPLE__'
      }
    }

    // Match by account name or bank
    const matchesByName = data.accounts.filter((a) => {
      const normalizedName = a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const normalizedBank = (a.bank ?? '').toLowerCase()
      return normalizedName.includes(hintLC) || normalizedBank.includes(hintLC)
    })
    if (matchesByName.length === 1) return matchesByName[0].id
    if (matchesByName.length > 1) return '__MULTIPLE__'

    return null
  }

  function getMethodForAccount(accountId: string): string {
    const acc = data.accounts.find((a) => a.id === accountId)
    if (!acc) return 'Otro'
    return accountTypeToMethod[acc.type] || 'Otro'
  }

  function doSaveAction(msg: ChatMessage, accountId: string, dataIndex?: number) {
    const targetData = dataIndex !== undefined && msg.multiData
      ? msg.multiData[dataIndex]
      : msg.data
    if (!targetData) return

    const method = getMethodForAccount(accountId)

    if (msg.intent === 'addExpense' || targetData.tipo === 'gasto' || targetData.tipo === 'prestamo') {
      addMovement({
        title: targetData.concepto || 'Gasto',
        category: targetData.categoria || 'General',
        amount: targetData.monto || 0,
        type: targetData.tipo === 'prestamo' ? 'prestamo' : 'gasto',
        accountId,
        toAccountId: null,
        method,
        date: new Date().toISOString(),
        person: '',
        note: '',
        icon: 'wallet',
        color: '#ef4444',
      })
    } else if (msg.intent === 'addIncome' || targetData.tipo === 'ingreso' || targetData.tipo === 'me_prestaron') {
      addMovement({
        title: targetData.concepto || 'Ingreso',
        category: 'Ingreso',
        amount: targetData.monto || 0,
        type: 'ingreso',
        accountId,
        toAccountId: null,
        method,
        date: new Date().toISOString(),
        person: '',
        note: '',
        icon: 'wallet',
        color: '#22c55e',
      })
    }

    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m))

    if (msg.intent === 'createGoal' && targetData) {
      addGoal({
        title: targetData.concepto || targetData.titulo || 'Meta',
        saved: 0,
        target: targetData.monto || 0,
        date: new Date().toISOString().split('T')[0],
        icon: 'target',
        color: '#3b82f6',
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m))
    }

    setPendingAction(null)
    setShowAccountPicker(false)
  }

  function confirmIntent(msg: ChatMessage, dataIndex?: number) {
    const targetData = dataIndex !== undefined && msg.multiData
      ? msg.multiData[dataIndex]
      : msg.data
    if (!targetData) return

    if (msg.intent === 'createGoal') {
      return doSaveAction(msg, '', dataIndex)
    }

    const resolvedId = resolveAccount(targetData.cuenta_hint)
    if (resolvedId === '__MULTIPLE__' || resolvedId === null) {
      setPendingAction({ msg, data: targetData, type: msg.intent as 'addExpense' | 'addIncome', dataIndex })
      setShowAccountPicker(true)
      return
    }
    doSaveAction(msg, resolvedId, dataIndex)
  }

  function handleAccountSelect(accountId: string) {
    if (!pendingAction) return
    doSaveAction(pendingAction.msg, accountId, pendingAction.dataIndex)
  }

  function renderDataCard(data: DetectedData, msg: ChatMessage, dataIndex?: number) {
    const isExpense = msg.intent === 'addExpense' || data.tipo === 'gasto' || data.tipo === 'prestamo'
    const label = isExpense ? 'Gasto detectado' : 'Ingreso detectado'
    const btnColor = isExpense ? 'bg-red-500' : 'bg-green-500'

    if (msg.confirmed) return null

    const isPending = pendingAction?.msg.id === msg.id &&
      pendingAction?.dataIndex === (dataIndex ?? undefined)
    const accountPicker = isPending && showAccountPicker ? (
      <div className="mt-2 rounded-xl bg-white/70 dark:bg-white/[0.06] border border-gray-100 dark:border-white/10 p-2">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Selecciona una cuenta
        </p>
        <div className="flex flex-col gap-0.5">
          {data.accounts.length === 0 ? (
            <p className="px-2 py-2 text-xs text-gray-400 dark:text-gray-500">No hay cuentas disponibles</p>
          ) : (
            data.accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleAccountSelect(acc.id)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all"
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-white text-[10px] font-bold"
                  style={{ background: acc.color || '#6b7280' }}
                >
                  {acc.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{acc.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    ) : null

    const borderClass = isExpense ? 'border-red-100 dark:border-red-900/30' : 'border-green-100 dark:border-green-900/30'
    const textAccentClass = isExpense ? 'text-red-500' : 'text-green-500'

    return (
      <div>
        <div className={`mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border ${borderClass} p-3`}>
          <p className={`text-xs font-semibold ${textAccentClass} uppercase tracking-wider`}>
            {label}
            {dataIndex !== undefined && msg.multiData && msg.multiData.length > 1
              ? ` (${dataIndex! + 1}/${msg.multiData.length})`
              : ''}
          </p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">
            Concepto: <span className="font-medium">{data.concepto || '—'}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Categoría: <span className="font-medium">{data.categoria}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Monto: <span className="font-medium">${fmt(data.monto || 0)}</span>
          </p>
          <button
            type="button"
            onClick={() => confirmIntent(msg, dataIndex)}
            className={`mt-2 w-full rounded-lg ${btnColor} py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform`}
          >
            Guardar
          </button>
        </div>
        {accountPicker}
      </div>
    )
  }

  function intentCard(msg: ChatMessage) {
    if (msg.confirmed) return null

    // createGoal is handled separately (no account picker needed)
    if (msg.intent === 'createGoal') {
      const targetData = msg.multiData?.[0] ?? msg.data
      if (!targetData) return null
      return (
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-white/[0.08] border border-blue-100 dark:border-blue-900/30 p-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Meta detectada</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">Título: <span className="font-medium">{targetData.titulo || targetData.concepto}</span></p>
          <p className="text-sm text-gray-700 dark:text-gray-200">Monto: <span className="font-medium">${fmt(targetData.monto || 0)}</span></p>
          <button type="button" onClick={() => confirmIntent(msg)} className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform">Crear meta</button>
        </div>
      )
    }

    // Multi-movement: render one card per data item
    if (msg.multiData && msg.multiData.length > 0) {
      return (
        <div>
          {msg.multiData.map((d, i) => (
            <div key={`${msg.id}-${i}`}>
              {renderDataCard(d, msg, i)}
            </div>
          ))}
        </div>
      )
    }

    if (!msg.data) return null

    return renderDataCard(msg.data, msg)
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
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full mt-0.5">
                      <WifiOff className="size-2.5" />
                      Modo sin conexión
                    </span>
                  )}
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
              <div className="relative">
                <button
                  ref={voiceBtnRef}
                  type="button"
                  disabled={loading}
                  onMouseDown={startHolding}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={startHolding}
                  onTouchEnd={stopHolding}
                  onClick={tapVoice}
                  className={`grid size-10 shrink-0 place-items-center rounded-full transition-all ${
                    listening
                      ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40'
                      : 'bg-white/60 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
                <AnimatePresence>
                  {showVoiceMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden"
                    >
                      <div className="p-1.5">
                        <VoiceMenuItem icon="💰" label="Registrar gasto" onClick={() => voiceMenuOption('Agrega un gasto de')} />
                        <VoiceMenuItem icon="💵" label="Registrar ingreso" onClick={() => voiceMenuOption('Registra un ingreso de')} />
                        <VoiceMenuItem icon="🎯" label="Crear meta" onClick={() => voiceMenuOption('Quiero crear una meta de')} />
                        <VoiceMenuItem icon="📊" label="Resumen del mes" onClick={() => voiceMenuOption('Dame un resumen de este mes')} />
                        <VoiceMenuItem icon="💳" label="Analizar deudas" onClick={() => voiceMenuOption('Analiza mis deudas')} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
