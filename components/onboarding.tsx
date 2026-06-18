'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Sparkles, User, Plus, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { accountTypes } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { fmt } from '@/lib/format'
import type { Account, AccountType, FinancialSnapshot } from '@/lib/types'
import { Field, GlassInput, GlassButton } from './ui/form-controls'
import { CustomAccountFields } from './custom-account-fields'

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

function getPreviousNameFromSnapshot(): string | null {
  try {
    const raw = localStorage.getItem('nova-finanzas:snapshots')
    if (!raw) return null
    const snapshots: FinancialSnapshot[] = JSON.parse(raw)
    if (snapshots.length === 0) return null
    return snapshots[0].fullData.profile?.name ?? null
  } catch {
    return null
  }
}

export function Onboarding() {
  const { completeOnboarding } = useStore()
  const previousName = getPreviousNameFromSnapshot()
  const isFromReset = previousName !== null
  const stepOffset = isFromReset ? 1 : 0
  const totalSteps = 3 + stepOffset

  const [step, setStep] = useState(0)
  const [name, setName] = useState(previousName ?? '')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [showNameInput, setShowNameInput] = useState(false)
  const [customAccounts, setCustomAccounts] = useState<{
    name: string
    icon: string
    color: string
    isLiability: boolean
    balance: number
  }[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('wallet')
  const [customColor, setCustomColor] = useState('oklch(0.72 0.16 150)')
  const [customLiability, setCustomLiability] = useState(false)
  const [customBalance, setCustomBalance] = useState('')

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
    const accounts: Account[] = [
      ...balanceFields
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
        .filter((a) => a.balance !== 0 || !accountTypes.find((m) => m.type === a.type)?.liability),
      ...customAccounts.map((ca, i) => ({
      id: `acc_custom_${i}`,
      name: ca.name,
      type: 'personalizada' as AccountType,
      balance: ca.isLiability ? -ca.balance : ca.balance,
      icon: ca.icon,
      color: ca.color,
      isLiability: ca.isLiability,
      createdAt: now,
      updatedAt: now,
    })),
  ]

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
          {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
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
          {isFromReset && step === 0 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex flex-1 flex-col"
            >
              <div className="glass-subtle mb-6 grid size-16 place-items-center rounded-3xl">
                <User className="size-8 text-[oklch(0.82_0.16_90)]" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                ¿Sigues siendo {previousName}?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                Identifícate para continuar con tu nuevo inicio financiero.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {!showNameInput ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setName(previousName!); setStep(1) }}
                      className="rounded-2xl p-4 text-left glass active:scale-[0.98]"
                    >
                      <span className="text-sm font-semibold">
                        Sí, sigo siendo {previousName}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNameInput(true)}
                      className="rounded-2xl p-4 text-left glass-subtle active:scale-[0.98]"
                    >
                      <span className="text-sm font-semibold text-white/70">
                        No, quiero usar otro nombre
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Field label="Nuevo nombre">
                      <GlassInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        autoFocus
                      />
                    </Field>
                    <GlassButton
                      onClick={() => setStep(1)}
                      disabled={!name.trim()}
                    >
                      Confirmar <ArrowRight className="size-4" />
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      onClick={() => setShowNameInput(false)}
                    >
                      Atrás
                    </GlassButton>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 0 + stepOffset && (
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

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton onClick={() => setStep(step + 1)} disabled={!name.trim()}>
                  Continuar <ArrowRight className="size-4" />
                </GlassButton>
                {step > 0 && (
                  <GlassButton variant="ghost" onClick={() => setStep(step - 1)}>
                    Atrás
                  </GlassButton>
                )}
              </div>
            </motion.div>
          )}

          {step === 1 + stepOffset && (
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

              {customAccounts.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {customAccounts.map((ca, i) => {
                    const Icon = getIcon(ca.icon)
                    return (
                      <div key={i} className="flex items-center justify-between rounded-2xl glass-subtle px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-xl" style={{ background: ca.color }}>
                            <Icon className="size-4 text-white" />
                          </span>
                          <span className="text-sm font-medium">{ca.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm tabular-nums">
                            {ca.isLiability ? '-$' : '$'}
                            {ca.balance}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomAccounts(customAccounts.filter((_, j) => j !== i))}
                            className="flex items-center justify-center rounded-full p-1 text-white/40 hover:text-white/70 active:scale-90"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {!showCustomForm ? (
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 text-sm font-medium text-white/50 active:scale-[0.98]"
                >
                  <Plus className="size-4" /> Agregar otra cuenta
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-3 rounded-2xl glass-strong p-4">
                  <span className="text-sm font-semibold text-white/70">Nueva cuenta personalizada</span>
                  <Field label="Nombre">
                    <GlassInput
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ej. Mi Wallet Cripto"
                    />
                  </Field>
                  <CustomAccountFields
                    selectedIcon={customIcon}
                    onIconChange={setCustomIcon}
                    selectedColor={customColor}
                    onColorChange={setCustomColor}
                    isLiability={customLiability}
                    onLiabilityChange={setCustomLiability}
                  />
                  <Field label="Saldo">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <GlassInput
                        inputMode="decimal"
                        value={customBalance}
                        onChange={(e) => setCustomBalance(e.target.value)}
                        placeholder="0"
                        className="pl-7"
                      />
                    </div>
                  </Field>
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={() => {
                        const b = Number.parseFloat(customBalance.replace(/,/g, '')) || 0
                        setCustomAccounts([
                          ...customAccounts,
                          {
                            name: customName.trim() || 'Mi cuenta',
                            icon: customIcon,
                            color: customColor,
                            isLiability: customLiability,
                            balance: b,
                          },
                        ])
                        setCustomName('')
                        setCustomIcon('wallet')
                        setCustomColor('oklch(0.72 0.16 150)')
                        setCustomLiability(false)
                        setCustomBalance('')
                        setShowCustomForm(false)
                      }}
                      disabled={!customName.trim() && customBalance.trim().length === 0}
                    >
                      Agregar cuenta
                    </GlassButton>
                    <GlassButton variant="ghost" onClick={() => setShowCustomForm(false)}>
                      Cancelar
                    </GlassButton>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton onClick={() => setStep(step + 1)}>
                  Ver mi balance <ArrowRight className="size-4" />
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setStep(step - 1)}>
                  Atrás
                </GlassButton>
              </div>
            </motion.div>
          )}

          {step === 2 + stepOffset && (
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
                <GlassButton variant="ghost" onClick={() => setStep(step - 1)}>
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
