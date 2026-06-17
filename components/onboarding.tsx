'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { accountTypes } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { fmt } from '@/lib/format'
import type { Account, AccountType } from '@/lib/types'
import { Field, GlassInput, GlassButton } from './ui/form-controls'

// Order and labels used during onboarding capture
const balanceFields: { type: AccountType; label: string; liability: boolean }[] =
  [
    { type: 'efectivo', label: 'Efectivo actual', liability: false },
    { type: 'debito', label: 'Saldo en débito', liability: false },
    { type: 'ahorro', label: 'Ahorro actual', liability: false },
    { type: 'inversion', label: 'Inversión actual', liability: false },
    { type: 'credito', label: 'Deuda en crédito', liability: true },
    { type: 'deudas', label: 'Otras deudas', liability: true },
  ]

export function Onboarding() {
  const { completeOnboarding } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const setAmount = (type: string, v: string) =>
    setAmounts((a) => ({ ...a, [type]: v }))

  const num = (type: string) => {
    const v = Number.parseFloat((amounts[type] ?? '').replace(/,/g, ''))
    return Number.isFinite(v) ? v : 0
  }

  const balance = balanceFields.reduce(
    (s, f) => s + (f.liability ? -num(f.type) : num(f.type)),
    0,
  )

  function finish() {
    const now = Date.now()
    const accounts: Account[] = balanceFields
      .map((f) => {
        const meta = accountTypes.find((a) => a.type === f.type)!
        const value = num(f.type)
        return {
          id: `acc_${f.type}`,
          name: meta.label,
          type: f.type,
          balance: f.liability ? -value : value,
          icon: meta.icon,
          color: meta.color,
          createdAt: now,
          updatedAt: now,
        }
      })
      // keep only accounts the user actually funded (or all assets for usability)
      .filter((a) => a.balance !== 0 || !accountTypes.find((m) => m.type === a.type)?.liability)

    completeOnboarding(
      { name: name.trim() || 'Usuario', onboarded: true, createdAt: now },
      accounts,
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/bg-aurora.webp"
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.35_0.12_260/25%)]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),2rem)]">
        {/* progress */}
        <div className="mb-8 flex gap-2 pt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
            >
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: step >= i ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex flex-1 flex-col"
            >
              <div className="glass-subtle mb-6 grid size-16 place-items-center rounded-3xl">
                <Sparkles className="size-8 text-[oklch(0.82_0.16_90)]" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                Bienvenido a Nova Finanzas AI
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
                Tu centro de control financiero personal. Registra gastos por
                voz, controla tus cuentas y alcanza tus metas. Todo se guarda en
                tu dispositivo.
              </p>

              <div className="mt-8">
                <Field label="¿Cómo te llamas?">
                  <GlassInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoFocus
                  />
                </Field>
              </div>

              <div className="mt-auto pt-8">
                <GlassButton onClick={() => setStep(1)} disabled={!name.trim()}>
                  Continuar <ArrowRight className="size-4" />
                </GlassButton>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="balances"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex flex-1 flex-col"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                ¿Cuánto tienes hoy?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                Registra tus saldos actuales. Puedes dejar en blanco lo que no
                uses y editarlo después.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {balanceFields.map((f) => {
                  const meta = accountTypes.find((a) => a.type === f.type)!
                  const Icon = getIcon(meta.icon)
                  return (
                    <div key={f.type} className="flex items-center gap-3">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-2xl"
                        style={{ background: meta.color }}
                      >
                        <Icon className="size-5 text-white" />
                      </span>
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span className="text-sm font-medium">{f.label}</span>
                        <div className="relative w-32">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            $
                          </span>
                          <GlassInput
                            inputMode="decimal"
                            value={amounts[f.type] ?? ''}
                            onChange={(e) => setAmount(f.type, e.target.value)}
                            placeholder="0"
                            className="py-2.5 pl-7 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton onClick={() => setStep(2)}>
                  Ver mi balance <ArrowRight className="size-4" />
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setStep(0)}>
                  Atrás
                </GlassButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex flex-1 flex-col"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Tu balance global
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                Calculado a partir de tus activos menos tus deudas.
              </p>

              <div className="glass-strong mt-6 rounded-3xl p-6">
                <p className="text-sm text-muted-foreground">Dinero disponible</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                  {fmt(balance)}
                </p>
                <ul className="mt-5 flex flex-col gap-2 border-t border-white/15 pt-4">
                  {balanceFields
                    .filter((f) => num(f.type) > 0)
                    .map((f) => {
                      const meta = accountTypes.find((a) => a.type === f.type)!
                      return (
                        <li
                          key={f.type}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {meta.label}
                          </span>
                          <span
                            className="font-medium tabular-nums"
                            style={{
                              color: f.liability ? 'var(--negative)' : undefined,
                            }}
                          >
                            {f.liability ? '-' : ''}
                            {fmt(num(f.type))}
                          </span>
                        </li>
                      )
                    })}
                </ul>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton onClick={finish}>
                  <Check className="size-4" /> Empezar a usar Nova
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setStep(1)}>
                  Atrás
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
