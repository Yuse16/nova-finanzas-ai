'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Check, X, ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react'
import { parseVoice, type ParsedMovement } from '@/lib/parse-voice'
import { fmt } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSpeechRecognition, type VoiceStatus } from '@/hooks/use-speech-recognition' // NEW: Import useSpeechRecognition hook

export const voiceExamples = [
  'Gasté 150 en tacos',
  'Me pagaron 3500',
  'Pagué internet',
  'Le presté 500 a Juan',
]

const methods = ['Efectivo', 'Débito', 'Crédito', 'Ahorro', 'Inversión', 'Otro']

type Phase = 'listening' | 'confirm' | 'saved' | 'error' | 'unsupported'

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-white/80"
          animate={
            active
              ? { height: [6, 8 + ((i * 13) % 28), 6] }
              : { height: 4 }
          }
          transition={
            active
              ? { duration: 0.7 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' }
              : { type: 'keyframes', duration: 0.5 } // Keep it flat when not active
          }
        />
      ))}
    </div>
  )
}

export function VoiceExperience({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [phase, setPhase] = useState<Phase>('listening')
  const [parsed, setParsed] = useState<ParsedMovement | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const addMovement = useStore((s) => s.addMovement)

  const resolveAccountIdByMethod = useStore(
    (s) => s.resolveAccountIdByMethod
  )

  // NEW: Use the speech recognition hook
  const { supported, status, transcript, error, start, stop, reset } = useSpeechRecognition()

  useEffect(() => {
    if (!open) return
    
    if (!supported) {
      setPhase('unsupported')
      return
    }

    setPhase('listening')
    setParsed(null)
    setMethod(null)
    reset() // Reset speech recognition state
    start() // Start listening

    // Simulate auto-stop if for some reason it doesn't detect speech naturally
    const timeout = setTimeout(() => {
      if (status === 'listening' && transcript === '') {
        stop()
        setPhase('error') // Or could be 'done' if we want to confirm empty speech
      }
    }, 4000); // Stop listening after 4 seconds of silence/no input

    return () => {
      stop()
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported])

  // Handle status changes from speech recognition
  useEffect(() => {
    if (status === 'done' && transcript && phase === 'listening') {
      const parsedResult = parseVoice(transcript) 
      setParsed(parsedResult)
      setPhase('confirm')
    } else if (status === 'error' && phase === 'listening') {
      setPhase('error')
    } else if (status === 'listening' && transcript === '' && phase === 'error') {
      // Reset visual error state if listening starts again
      setPhase('listening') 
    } else if (status === 'unsupported') {
      setPhase('unsupported')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, transcript, phase])

  function confirm(m: string) {
    if (!parsed) return
  
    const accountId = resolveAccountIdByMethod(m)
  
    addMovement({
      title: parsed.title || 'Movimiento por voz',
      category: parsed.category,
      amount: parsed.amount,
      type:
        parsed.type === 'ingreso'
          ? 'ingreso'
          : parsed.type === 'deuda'
          ? 'deuda'
          : 'gasto',
      accountId,
      toAccountId: null,
      method: m,
      date: new Date().toISOString(),
      person: parsed.person,
      note: '',
      icon: 'wallet',
      color:
        parsed.type === 'ingreso'
          ? '#22c55e'
          : parsed.type === 'deuda'
          ? '#f59e0b'
          : '#ef4444',
    }) 
    setMethod(m)
    setPhase('saved')
  
    setTimeout(() => {
      onClose()
    }, 1400) // Give user time to see 'saved' state
  }

  const typeMeta =
    parsed?.type === 'ingreso'
      ? { label: 'Ingreso', Icon: ArrowDownLeft, color: 'var(--positive)' }
      : parsed?.type === 'deuda'
        ? { label: 'Préstamo', Icon: HandCoins, color: 'oklch(0.78 0.16 70)' } // Should be 'Deuda' if it means 'Me prestaron'
        : { label: 'Gasto', Icon: ArrowUpRight, color: 'var(--negative)' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute inset-0 bg-[oklch(0.3_0.08_260/45%)] backdrop-blur-md"
          />

          <motion.div
            className="glass-strong relative z-10 w-full max-w-md rounded-[2rem] p-6 pb-8"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full glass-subtle"
            >
              <X className="size-4" />
            </button>

            <AnimatePresence mode="wait">
              {phase === 'unsupported' && (
                <motion.div
                  key="unsupported"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5 pt-2"
                >
                  <p className="text-center text-red-500 font-semibold">Voz no soportada</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Tu navegador no soporta el reconocimiento de voz o requiere habilitarlo.
                  </p>
                </motion.div>
              )}
              {phase === 'error' && (
                <motion.div
                  key="speech-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5 pt-2"
                >
                  <p className="text-center text-red-500 font-semibold">Error en el reconocimiento de voz</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Asegúrate de haber otorgado el permiso al micrófono y vuelve a intentar.
                  </p>
                </motion.div>
              )}
              {phase === 'listening' && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5 pt-2"
                >
                  <div className="relative grid place-items-center">
                    <span className="absolute size-24 rounded-full bg-[oklch(0.7_0.18_290)]" style={{ animation: 'nova-pulse 1.8s ease-out infinite' }} />
                    <div className="relative grid size-20 place-items-center rounded-full bg-[oklch(0.62_0.17_290)] shadow-lg">
                      <Mic className="size-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Escuchando…</p>
                  <p className="min-h-7 text-center text-lg font-medium text-balance">
                    {transcript || 'Di algo como "Gasté 150 en tacos"'}
                  </p>
                  <Waveform active={status === 'listening'} />
                </motion.div>
              )}

              {phase === 'confirm' && parsed && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5 pt-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-12 place-items-center rounded-2xl"
                      style={{ background: typeMeta.color }}
                    >
                      <typeMeta.Icon className="size-6 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {typeMeta.label} · {parsed.category}
                      </p>
                      <p className="truncate text-lg font-semibold">
                        {parsed.title}
                      </p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums">
                      {fmt(parsed.amount)}
                    </p>
                  </div>

                  {parsed.person && (
                    <p className="text-sm text-muted-foreground">
                      Persona detectada:{' '}
                      <span className="font-medium text-foreground">
                        {parsed.person}
                      </span>
                    </p>
                  )}

                  <div className="border-t border-white/15 pt-4">
                    <p className="text-base font-medium">
                      ¿Qué método utilizaste?
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {methods.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => confirm(m)}
                          className="glass-subtle rounded-2xl py-3 text-sm font-medium transition-transform active:scale-95"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === 'saved' && parsed && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                    className="grid size-20 place-items-center rounded-full bg-[var(--positive)]"
                  >
                    <Check className="size-10 text-white" />
                  </motion.div>
                  <p className="text-lg font-semibold">Movimiento guardado</p>
                  <p className="text-center text-sm text-muted-foreground text-balance">
                    {parsed.title} · {fmt(parsed.amount)} · {method}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
