'use client'

import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { accountTypes, bankOptions, cardIdentifierOptions } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { fmt } from '@/lib/format'
import type { Account, AccountType, FinancialSnapshot } from '@/lib/types'
import { Field, GlassInput, GlassButton } from './ui/form-controls'
import { CustomAccountFields } from './custom-account-fields'

const presetAccounts: { type: AccountType; label: string }[] = [
  { type: 'efectivo', label: 'Efectivo' },
  { type: 'debito', label: 'Tarjeta Débito' },
  { type: 'credito', label: 'Tarjeta Crédito' },
  { type: 'ahorro', label: 'Ahorro' },
  { type: 'inversion', label: 'Inversión' },
]

const customTypeOptions: { value: AccountType; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Tarjeta Débito' },
  { value: 'credito', label: 'Tarjeta Crédito' },
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'inversion', label: 'Inversión' },
  { value: 'personalizada', label: 'Otro' },
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
  const { theme, setTheme } = useUI()
  const previousName = getPreviousNameFromSnapshot()
  const isFromReset = previousName !== null

  useEffect(() => {
    const stored = localStorage.getItem('nova-finanzas:theme')
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stepOffset = isFromReset ? 1 : 0
  const totalSteps = 3 + stepOffset

  const [step, setStep] = useState(0)
  const [name, setName] = useState(previousName ?? '')
  const [showNameInput, setShowNameInput] = useState(false)

  // Preset account amounts and expanded state
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Card-specific fields for crédito/débito presets
  const [cardBanks, setCardBanks] = useState<Record<string, string>>({})
  const [cardIdentifiers, setCardIdentifiers] = useState<
    Record<string, string>
  >({})
  const [creditLimits, setCreditLimits] = useState<Record<string, string>>({})
  const [creditCorte, setCreditCorte] = useState<Record<string, string>>({})
  const [creditPago, setCreditPago] = useState<Record<string, string>>({})

  // Custom accounts added via "+ Agregar otra cuenta"
  const [customAccounts, setCustomAccounts] = useState<
    {
      key: string
      type: AccountType
      name: string
      balance: number
      icon: string
      color: string
      isLiability: boolean
      bank?: string
      identifier?: string
      limiteCredito?: number
      fechaCorte?: number
      fechaPago?: number
    }[]
  >([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customType, setCustomType] = useState<AccountType>('efectivo')
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('wallet')
  const [customColor, setCustomColor] = useState('oklch(0.72 0.16 150)')
  const [customLiability, setCustomLiability] = useState(false)
  const [customBalance, setCustomBalance] = useState('')
  const [customBank, setCustomBank] = useState('')
  const [customIdentifier, setCustomIdentifier] = useState('')
  const [customLimiteCredit, setCustomLimiteCredit] = useState('')
  const [customCorte, setCustomCorte] = useState('')
  const [customPago, setCustomPago] = useState('')

  const setAmount = (key: string, v: string) =>
    setAmounts((a) => ({ ...a, [key]: v }))

  const num = (key: string) => {
    const v = Number.parseFloat((amounts[key] ?? '').replace(/,/g, ''))
    return Number.isFinite(v) ? v : 0
  }

  const customNum = Number.parseFloat(customBalance.replace(/,/g, '')) || 0

  // Total balance: assets positive, credit negative
  const totalBalance = presetAccounts.reduce((s, p) => {
    const meta = accountTypes.find((a) => a.type === p.type)!
    return s + (meta.liability ? -num(p.type) : num(p.type))
  }, 0)

  // Generate unique key for custom accounts
  function nextCustomKey() {
    return `custom_${Date.now()}_${customAccounts.length}`
  }

  function isCardType(t: AccountType) {
    return t === 'credito' || t === 'debito'
  }

  function finish() {
    const now = Date.now()
    const accounts: Account[] = [
      ...presetAccounts
        .map((p) => {
          const meta = accountTypes.find((a) => a.type === p.type)!
          const value = num(p.type)
          const isCredito = p.type === 'credito'
          return {
            id: `acc_${p.type}`,
            name: meta.label,
            type: p.type,
            balance: isCredito ? -value : value,
            icon: meta.icon,
            color: meta.color,
            ...(isCardType(p.type)
              ? {
                  bank: cardBanks[p.type] || undefined,
                  identifier: cardIdentifiers[p.type] || undefined,
                  activa: true,
                }
              : {}),
            ...(isCredito
              ? {
                  limiteCredito:
                    Number.parseFloat(creditLimits[p.type]) || undefined,
                  fechaCorte: creditCorte[p.type]
                    ? Number.parseInt(creditCorte[p.type], 10)
                    : undefined,
                  fechaPago: creditPago[p.type]
                    ? Number.parseInt(creditPago[p.type], 10)
                    : undefined,
                }
              : {}),
            createdAt: now,
            updatedAt: now,
          }
        })
        .filter((a) => a.balance !== 0),
      ...customAccounts.map((ca) => ({
        id: `acc_${ca.key}`,
        name: ca.name,
        type: ca.type,
        balance: ca.isLiability ? -ca.balance : ca.balance,
        icon: ca.icon,
        color: ca.color,
        isLiability: ca.isLiability,
        bank: ca.bank || undefined,
        identifier: ca.identifier || undefined,
        ...(ca.type === 'credito'
          ? {
              limiteCredito: ca.limiteCredito || undefined,
              fechaCorte: ca.fechaCorte || undefined,
              fechaPago: ca.fechaPago || undefined,
            }
          : {}),
        createdAt: now,
        updatedAt: now,
      })),
    ]

    completeOnboarding(
      {
        name: name.trim() || 'Usuario',
        onboarded: true,
        createdAt: now,
        selectedFont: 'system',
        accountsSkipped: accounts.length === 0 ? true : undefined,
      },
      accounts,
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'var(--bg-image)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'var(--bg-overlay)' }}
        />
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
              <h1 className="text-2xl font-semibold tracking-tight text-balance text-white">
                ¿Sigues siendo {previousName}?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/80 text-pretty">
                Identifícate para continuar con tu nuevo inicio financiero.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {!showNameInput ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setName(previousName!)
                        setStep(1)
                      }}
                      className="rounded-2xl bg-white/40 p-4 text-left backdrop-blur-sm ring-1 ring-white/30 transition-all active:scale-[0.98] dark:bg-white/[0.06] dark:ring-white/10"
                    >
                      <span className="text-sm font-semibold text-white">
                        Sí, sigo siendo {previousName}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNameInput(true)}
                      className="rounded-2xl bg-white/30 p-4 text-left backdrop-blur-sm transition-all active:scale-[0.98] dark:bg-white/[0.04]"
                    >
                      <span className="text-sm font-semibold text-white/80">
                        No, quiero usar otro nombre
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-white/90">
                        Nuevo nombre
                      </span>
                      <GlassInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        autoFocus
                        className="bg-white/20 text-white placeholder:text-white/60 border border-white/30"
                      />
                    </label>
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
              <h1 className="text-3xl font-semibold tracking-tight text-balance text-white">
                Bienvenido a Nova Finanzas AI
              </h1>
              <p className="mt-3 text-base leading-relaxed text-white/80 text-pretty">
                Tu centro de control financiero personal. Registra gastos por
                voz, controla tus cuentas y alcanza tus metas. Todo se guarda en
                tu dispositivo.
              </p>

              <div className="mt-8">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-white/90">
                    ¿Cómo te llamas?
                  </span>
                  <GlassInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoFocus
                    className="bg-white/20 text-white placeholder:text-white/60 border border-white/30"
                  />
                </label>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton
                  onClick={() => setStep(step + 1)}
                  disabled={!name.trim()}
                >
                  Continuar <ArrowRight className="size-4" />
                </GlassButton>
                {step > 0 && (
                  <GlassButton
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                  >
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
              <h1 className="text-2xl font-semibold tracking-tight text-balance text-white">
                ¿Cuánto tienes hoy?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80 text-pretty">
                Registra los lugares donde tienes dinero actualmente. Puedes
                dejar en blanco lo que no uses.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                {presetAccounts.map((p) => {
                  const meta = accountTypes.find((a) => a.type === p.type)!
                  const Icon = getIcon(meta.icon)
                  const isCard = isCardType(p.type)
                  const isCredito = p.type === 'credito'
                  const isOpen = expanded[p.type] ?? false

                  return (
                    <div key={p.type}>
                      <div
                        className={`flex items-center gap-3 rounded-2xl bg-white/40 px-4 py-3 backdrop-blur-sm ring-1 ring-white/30 transition-all dark:bg-white/[0.06] dark:ring-white/10 ${
                          isOpen ? 'rounded-b-none' : ''
                        }`}
                      >
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl"
                          style={{ background: meta.color }}
                        >
                          <Icon className="size-5 text-white" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                          {p.label}
                        </span>
                        <div className="relative w-28">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                            $
                          </span>
                          <GlassInput
                            inputMode="decimal"
                            value={amounts[p.type] ?? ''}
                            onChange={(e) => setAmount(p.type, e.target.value)}
                            placeholder="0"
                            className="py-2 pl-7 text-right text-sm"
                          />
                        </div>
                        {isCard && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((e) => ({
                                ...e,
                                [p.type]: !e[p.type],
                              }))
                            }
                            className="grid size-7 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            {isOpen ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isOpen && isCard && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden rounded-b-2xl bg-white/30 backdrop-blur-sm ring-1 ring-white/30 dark:bg-white/[0.04] dark:ring-white/10"
                          >
                            <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
                              <div>
                                <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Banco
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {bankOptions.map((b) => (
                                    <button
                                      key={b.value}
                                      type="button"
                                      onClick={() =>
                                        setCardBanks((c) => ({
                                          ...c,
                                          [p.type]: b.value,
                                        }))
                                      }
                                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                                        cardBanks[p.type] === b.value
                                          ? 'bg-white/85 text-gray-900 shadow-sm dark:bg-white/20 dark:text-white dark:shadow-sm'
                                          : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70'
                                      }`}
                                    >
                                      {b.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Identificador
                                </p>
                                <GlassInput
                                  value={cardIdentifiers[p.type] ?? ''}
                                  onChange={(e) =>
                                    setCardIdentifiers((c) => ({
                                      ...c,
                                      [p.type]: e.target.value,
                                    }))
                                  }
                                  placeholder="Ej. Principal, Nómina..."
                                  className="py-2 text-sm"
                                />
                                {!cardIdentifiers[p.type] && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {cardIdentifierOptions.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() =>
                                          setCardIdentifiers((c) => ({
                                            ...c,
                                            [p.type]: opt,
                                          }))
                                        }
                                        className="rounded-lg bg-white/50 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {isCredito && (
                                <>
                                  <div className="flex gap-3">
                                    <div className="flex-1">
                                      <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Límite de crédito
                                      </p>
                                      <div className="relative">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                                          $
                                        </span>
                                        <GlassInput
                                          inputMode="decimal"
                                          value={creditLimits[p.type] ?? ''}
                                          onChange={(e) =>
                                            setCreditLimits((c) => ({
                                              ...c,
                                              [p.type]: e.target.value,
                                            }))
                                          }
                                          placeholder="0"
                                          className="py-2 pl-6 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="w-20">
                                      <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Corte
                                      </p>
                                      <GlassInput
                                        inputMode="numeric"
                                        value={creditCorte[p.type] ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(
                                            /\D/g,
                                            '',
                                          )
                                          if (
                                            v === '' ||
                                            (Number(v) >= 1 && Number(v) <= 31)
                                          )
                                            setCreditCorte((c) => ({
                                              ...c,
                                              [p.type]: v,
                                            }))
                                        }}
                                        placeholder="Día"
                                        maxLength={2}
                                        className="py-2 text-sm text-center"
                                      />
                                    </div>
                                    <div className="w-20">
                                      <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Pago
                                      </p>
                                      <GlassInput
                                        inputMode="numeric"
                                        value={creditPago[p.type] ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(
                                            /\D/g,
                                            '',
                                          )
                                          if (
                                            v === '' ||
                                            (Number(v) >= 1 && Number(v) <= 31)
                                          )
                                            setCreditPago((c) => ({
                                              ...c,
                                              [p.type]: v,
                                            }))
                                        }}
                                        placeholder="Día"
                                        maxLength={2}
                                        className="py-2 text-sm text-center"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* Custom accounts added */}
              {customAccounts.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {customAccounts.map((ca) => {
                    const Icon = getIcon(ca.icon)
                    return (
                      <div
                        key={ca.key}
                        className="flex items-center gap-3 rounded-2xl bg-white/40 px-4 py-3 backdrop-blur-sm ring-1 ring-white/30 dark:bg-white/[0.06] dark:ring-white/10"
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-xl"
                          style={{ background: ca.color }}
                        >
                          <Icon className="size-4 text-white" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                          {ca.name}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-white">
                          {fmt(ca.balance)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCustomAccounts(
                              customAccounts.filter(
                                (c) => c.key !== ca.key,
                              ),
                            )
                          }
                          className="grid size-7 place-items-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* "+ Agregar otra cuenta" */}
              {!showCustomForm ? (
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/30 p-4 text-sm font-medium text-gray-600 backdrop-blur-sm transition-all active:scale-[0.98] dark:border-white/15 dark:text-gray-400"
                >
                  <Plus className="size-4" /> Agregar otra cuenta
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-4 rounded-2xl bg-white/40 p-4 backdrop-blur-sm ring-1 ring-white/30 dark:bg-white/[0.06] dark:ring-white/10">
                  <p className="text-sm font-semibold text-white">
                    Nueva cuenta
                  </p>

                  <Field label="Tipo">
                    <div className="flex flex-wrap gap-2">
                      {customTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setCustomType(opt.value)
                            setCustomBank('')
                            setCustomIdentifier('')
                            setCustomLimiteCredit('')
                            setCustomCorte('')
                            setCustomPago('')
                            const meta = accountTypes.find(
                              (a) => a.type === opt.value,
                            )
                            if (meta) {
                              setCustomName('')
                              setCustomIcon(meta.icon)
                              setCustomColor(meta.color)
                              setCustomLiability(meta.liability)
                            }
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            customType === opt.value
                              ? 'bg-white/85 text-gray-900 shadow-sm dark:bg-white/20 dark:text-white'
                              : 'bg-white/50 text-gray-600 hover:bg-white/70 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {customType === 'personalizada' && (
                    <>
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
                    </>
                  )}

                  {customType === 'ahorro' && (
                    <Field label="Nombre (opcional)">
                      <GlassInput
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ej. Fondo emergencia, Vacaciones..."
                      />
                    </Field>
                  )}

                  {customType === 'inversion' && (
                    <Field label="Nombre (opcional)">
                      <GlassInput
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ej. GBM, Kuspit, Cetes..."
                      />
                    </Field>
                  )}

                  {isCardType(customType) && (
                    <>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                          Banco
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {bankOptions.map((b) => (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => setCustomBank(b.value)}
                              className={`rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                                customBank === b.value
                                  ? 'bg-white/85 text-gray-900 shadow-sm dark:bg-white/20 dark:text-white dark:shadow-sm'
                                  : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Field label="Identificador (opcional)">
                        <GlassInput
                          value={customIdentifier}
                          onChange={(e) => setCustomIdentifier(e.target.value)}
                          placeholder="Ej. Principal, Nómina, Viajes..."
                        />
                        {!customIdentifier && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {cardIdentifierOptions.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setCustomIdentifier(opt)}
                                className="rounded-lg bg-white/50 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </Field>

                      {customType === 'credito' && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Field label="Límite de crédito">
                              <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                                  $
                                </span>
                                <GlassInput
                                  inputMode="decimal"
                                  value={customLimiteCredit}
                                  onChange={(e) =>
                                    setCustomLimiteCredit(e.target.value)
                                  }
                                  placeholder="0"
                                  className="pl-6"
                                />
                              </div>
                            </Field>
                          </div>
                          <div className="w-20">
                            <Field label="Corte">
                              <GlassInput
                                inputMode="numeric"
                                value={customCorte}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, '')
                                  if (
                                    v === '' ||
                                    (Number(v) >= 1 && Number(v) <= 31)
                                  )
                                    setCustomCorte(v)
                                }}
                                placeholder="Día"
                                maxLength={2}
                                className="text-center"
                              />
                            </Field>
                          </div>
                          <div className="w-20">
                            <Field label="Pago">
                              <GlassInput
                                inputMode="numeric"
                                value={customPago}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, '')
                                  if (
                                    v === '' ||
                                    (Number(v) >= 1 && Number(v) <= 31)
                                  )
                                    setCustomPago(v)
                                }}
                                placeholder="Día"
                                maxLength={2}
                                className="text-center"
                              />
                            </Field>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <Field label="Saldo">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                        $
                      </span>
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
                        const meta = accountTypes.find(
                          (a) => a.type === customType,
                        )
                        const displayName =
                          customName.trim() ||
                          (customType === 'personalizada'
                            ? 'Mi cuenta'
                            : meta?.label ?? 'Cuenta')
                        setCustomAccounts([
                          ...customAccounts,
                          {
                            key: nextCustomKey(),
                            type: customType,
                            name: displayName,
                            balance: customNum,
                            icon: customIcon,
                            color: customColor,
                            isLiability: customLiability,
                            bank: customBank || undefined,
                            identifier: customIdentifier || undefined,
                            limiteCredito:
                              Number.parseFloat(
                                customLimiteCredit.replace(/,/g, ''),
                              ) || undefined,
                            fechaCorte: customCorte
                              ? Number.parseInt(customCorte, 10)
                              : undefined,
                            fechaPago: customPago
                              ? Number.parseInt(customPago, 10)
                              : undefined,
                          },
                        ])
                        setCustomType('efectivo')
                        setCustomName('')
                        setCustomIcon('wallet')
                        setCustomColor('oklch(0.72 0.16 150)')
                        setCustomLiability(false)
                        setCustomBalance('')
                        setCustomBank('')
                        setCustomIdentifier('')
                        setCustomLimiteCredit('')
                        setCustomCorte('')
                        setCustomPago('')
                        setShowCustomForm(false)
                      }}
                      disabled={
                        customType !== 'personalizada'
                          ? false
                          : !customName.trim() &&
                            customBalance.trim().length === 0
                      }
                    >
                      Agregar
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      onClick={() => setShowCustomForm(false)}
                    >
                      Cancelar
                    </GlassButton>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <GlassButton onClick={() => setStep(step + 1)}>
                  Ver mi balance <ArrowRight className="size-4" />
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                >
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
              <h1 className="text-2xl font-semibold tracking-tight text-balance text-white">
                Tu balance global
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80 text-pretty">
                Esto es lo que tienes actualmente.
              </p>

              <div className="mt-6 rounded-3xl bg-white/40 p-6 backdrop-blur-sm ring-1 ring-white/30 dark:bg-white/[0.06] dark:ring-white/10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Dinero disponible
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-white">
                  {fmt(totalBalance)}
                </p>

                <ul className="mt-5 flex flex-col gap-2 border-t border-white/30 pt-4 dark:border-white/10">
                  {presetAccounts
                    .filter((p) => num(p.type) > 0)
                    .map((p) => {
                      const meta = accountTypes.find(
                        (a) => a.type === p.type,
                      )!
                      const isCredito = p.type === 'credito'
                      const Icon = getIcon(meta.icon)
                      return (
                        <li
                          key={p.type}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="grid size-7 shrink-0 place-items-center rounded-lg"
                              style={{ background: meta.color }}
                            >
                              <Icon className="size-3.5 text-white" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {meta.label}
                            </span>
                          </div>
                          <span
                            className={`font-medium tabular-nums ${
                              isCredito
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-white'
                            }`}
                          >
                            {isCredito ? '-' : ''}
                            {fmt(num(p.type))}
                          </span>
                        </li>
                      )
                    })}
                  {customAccounts
                    .filter((ca) => ca.balance > 0)
                    .map((ca) => {
                      const Icon = getIcon(ca.icon)
                      return (
                        <li
                          key={ca.key}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="grid size-7 shrink-0 place-items-center rounded-lg"
                              style={{ background: ca.color }}
                            >
                              <Icon className="size-3.5 text-white" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {ca.name}
                            </span>
                          </div>
                          <span className="font-medium tabular-nums text-white">
                            {fmt(ca.balance)}
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
                <GlassButton
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                >
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
