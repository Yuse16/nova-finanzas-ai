'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, ChevronDown, Palette, Type, LayoutDashboard, CreditCard, Grid3x3, Accessibility, Sun, Moon, Monitor, Wallet } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { useStore } from '@/lib/store'
import { fmt } from '@/lib/format'
import { PreviewCard } from '@/components/preview-card'
import type { CustomizationSection, CardSettings, LayoutSettings, TypographySettings, AccessibilitySettings } from '@/lib/customization-types'
import { availableFonts } from '@/lib/types'

const PRIMARY_COLORS = [
  { label: 'Azul', value: 'oklch(0.6 0.14 260)' },
  { label: 'Púrpura', value: 'oklch(0.62 0.17 290)' },
  { label: 'Verde', value: 'oklch(0.62 0.15 160)' },
  { label: 'Rosa', value: 'oklch(0.62 0.17 340)' },
  { label: 'Naranja', value: 'oklch(0.65 0.16 50)' },
  { label: 'Rojo', value: 'oklch(0.6 0.18 25)' },
]

const SECTION_ICONS: Record<string, React.ReactNode> = {
  appearance: <Palette className="size-5" />,
  typography: <Type className="size-5" />,
  dashboard: <LayoutDashboard className="size-5" />,
  cards: <CreditCard className="size-5" />,
  layout: <Grid3x3 className="size-5" />,
  accessibility: <Accessibility className="size-5" />,
  finanzas: <Wallet className="size-5" />,
}

const SECTION_LABELS: Record<string, string> = {
  appearance: 'Apariencia',
  typography: 'Tipografía',
  dashboard: 'Dashboard',
  cards: 'Tarjetas',
  layout: 'Layout',
  accessibility: 'Accesibilidad',
  finanzas: 'Finanzas',
}

function SectionCard({ section, children, defaultOpen }: { section: CustomizationSection; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="rounded-2xl bg-white/60 backdrop-blur-xl dark:bg-white/[0.08] border border-white/20 dark:border-white/10 overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-600 dark:text-gray-300">
            {SECTION_ICONS[section]}
          </span>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {SECTION_LABELS[section]}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronDown className="size-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/10 dark:border-white/[0.06]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          value ? 'bg-[#3b82f6]' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

function ChipGroup<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-[#3b82f6] text-white shadow-sm'
              : 'bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SliderControl({ value, min, max, step, onChange, label, suffix }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string; suffix?: string }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {value}{suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-[#3b82f6]"
      />
    </div>
  )
}

function ColorButton({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`size-9 rounded-full transition-all ${selected ? 'ring-2 ring-offset-2 ring-[#3b82f6] dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'}`}
      style={{ background: color }}
    />
  )
}

export default function PersonalizacionPage() {
  const { settings, updateAppearance, updateTypography, updateDashboard, updateCards, updateLayout, updateAccessibility, resetAll } = useCustomization()
  const updateProfile = useStore((s) => s.updateProfile)
  const profile = useStore((s) => s.data.profile)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="size-5" />
            <span className="text-sm font-semibold">Atrás</span>
          </Link>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Personalización</h1>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <RotateCcw className="size-3.5" />
            Restaurar
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Vista Previa
          </p>
          <PreviewCard />
        </div>

        <SectionCard section="appearance" defaultOpen>
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tema</span>
            <div className="flex gap-2">
              {[
                { label: 'Claro', value: 'light' as const, icon: Sun },
                { label: 'Oscuro', value: 'dark' as const, icon: Moon },
                { label: 'Auto', value: 'system' as const, icon: Monitor },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateAppearance('theme', opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-semibold transition-all ${
                    settings.appearance.theme === opt.value
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <opt.icon className="size-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Color Primario</span>
            <div className="flex gap-2 mt-2">
              {PRIMARY_COLORS.map(c => (
                <ColorButton
                  key={c.value}
                  color={c.value}
                  selected={settings.appearance.primaryColor === c.value}
                  onClick={() => updateAppearance('primaryColor', c.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Fondo</span>
            <ChipGroup
              options={[
                { label: 'Montaña', value: 'mountain' },
                { label: 'Sólido', value: 'solid' },
                { label: 'Gradiente', value: 'gradient' },
              ]}
              value={settings.appearance.customBackground}
              onChange={v => updateAppearance('customBackground', v)}
            />
          </div>

          <SliderControl
            label="Transparencia de tarjetas"
            value={settings.cards.glassIntensity}
            min={10}
            max={90}
            onChange={v => updateCards('glassIntensity', v as CardSettings['glassIntensity'])}
            suffix="%"
          />
        </SectionCard>

        <SectionCard section="typography">
          <div className="mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tipo de fuente</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableFonts.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => updateTypography('fontFamily', font.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    settings.typography.fontFamily === font.value
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          <SliderControl
            label="Tamaño de fuente"
            value={settings.typography.fontSize}
            min={12}
            max={22}
            onChange={v => updateTypography('fontSize', v)}
            suffix="px"
          />

          <div className="mt-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Peso de fuente</span>
            <ChipGroup<TypographySettings['fontWeight']>
              options={[
                { label: 'Normal', value: 'normal' },
                { label: 'Medium', value: 'medium' },
                { label: 'Semibold', value: 'semibold' },
                { label: 'Bold', value: 'bold' },
              ]}
              value={settings.typography.fontWeight}
              onChange={v => updateTypography('fontWeight', v)}
            />
          </div>

          <div className="mt-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Espaciado</span>
            <ChipGroup<TypographySettings['letterSpacing']>
              options={[
                { label: 'Apretado', value: 'tight' },
                { label: 'Normal', value: 'normal' },
                { label: 'Amplio', value: 'wide' },
              ]}
              value={settings.typography.letterSpacing}
              onChange={v => updateTypography('letterSpacing', v)}
            />
          </div>
        </SectionCard>

        <SectionCard section="dashboard">
          <div className="flex flex-col gap-1 mt-3">
            <Toggle
              label="Mostrar saludo"
              value={settings.dashboard.showGreeting}
              onChange={v => updateDashboard('showGreeting', v)}
            />
            <Toggle
              label="Mostrar balance"
              value={settings.dashboard.showBalance}
              onChange={v => updateDashboard('showBalance', v)}
            />
            <Toggle
              label="Mostrar ingresos"
              value={settings.dashboard.showIncome}
              onChange={v => updateDashboard('showIncome', v)}
            />
            <Toggle
              label="Mostrar gastos"
              value={settings.dashboard.showExpenses}
              onChange={v => updateDashboard('showExpenses', v)}
            />
            <Toggle
              label="Mostrar metas"
              value={settings.dashboard.showGoals}
              onChange={v => updateDashboard('showGoals', v)}
            />
            <Toggle
              label="Mostrar accesos rápidos"
              value={settings.dashboard.showQuickActions}
              onChange={v => updateDashboard('showQuickActions', v)}
            />
          </div>
        </SectionCard>

        <SectionCard section="finanzas">
          <div className="flex flex-col gap-3 mt-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 block">
                Dinero reservado <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({fmt(profile?.reservedMoney ?? 0)} actual)</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                defaultValue={profile?.reservedMoney ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0) updateProfile({ reservedMoney: val })
                }}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 block">
                Margen de emergencia <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({fmt(profile?.emergencyMargin ?? 0)} actual)</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                defaultValue={profile?.emergencyMargin ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0) updateProfile({ emergencyMargin: val })
                }}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard section="cards">
          <SliderControl
            label="Radio de bordes"
            value={settings.cards.borderRadius}
            min={0}
            max={32}
            onChange={v => updateCards('borderRadius', v as CardSettings['borderRadius'])}
            suffix="px"
          />

          <div className="mt-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Sombras</span>
            <ChipGroup<CardSettings['shadowIntensity']>
              options={[
                { label: 'Sin sombra', value: 'none' },
                { label: 'Suave', value: 'low' },
                { label: 'Media', value: 'medium' },
                { label: 'Fuerte', value: 'high' },
              ]}
              value={settings.cards.shadowIntensity}
              onChange={v => updateCards('shadowIntensity', v)}
            />
          </div>

          <SliderControl
            label="Grosor de bordes"
            value={settings.cards.borderWidth}
            min={0}
            max={4}
            onChange={v => updateCards('borderWidth', v as CardSettings['borderWidth'])}
            suffix="px"
          />
        </SectionCard>

        <SectionCard section="layout">
          <div className="mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Espaciado general</span>
            <ChipGroup<LayoutSettings['spacing']>
              options={[
                { label: 'Compacto', value: 'compact' },
                { label: 'Normal', value: 'normal' },
                { label: 'Amplio', value: 'wide' },
              ]}
              value={settings.layout.spacing}
              onChange={v => updateLayout('spacing', v)}
            />
          </div>

          <div className="mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tamaño de widgets</span>
            <ChipGroup<LayoutSettings['widgetSize']>
              options={[
                { label: 'Pequeño', value: 'small' },
                { label: 'Mediano', value: 'medium' },
                { label: 'Grande', value: 'large' },
              ]}
              value={settings.layout.widgetSize}
              onChange={v => updateLayout('widgetSize', v)}
            />
          </div>

          <div className="mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo</span>
            <ChipGroup<LayoutSettings['layoutMode']>
              options={[
                { label: 'Compacto', value: 'compact' },
                { label: 'Normal', value: 'normal' },
                { label: 'Amplio', value: 'wide' },
              ]}
              value={settings.layout.layoutMode}
              onChange={v => updateLayout('layoutMode', v)}
            />
          </div>
        </SectionCard>

        <SectionCard section="accessibility">
          <div className="flex flex-col gap-1 mt-3">
            <Toggle
              label="Alto contraste"
              value={settings.accessibility.highContrast}
              onChange={v => updateAccessibility('highContrast', v)}
            />
            <Toggle
              label="Reducir animaciones"
              value={settings.accessibility.reduceAnimations}
              onChange={v => updateAccessibility('reduceAnimations', v)}
            />
            <Toggle
              label="Texto grande"
              value={settings.accessibility.largeText}
              onChange={v => updateAccessibility('largeText', v)}
            />
          </div>
        </SectionCard>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-8">
          Todos los cambios se guardan automáticamente
        </p>
      </div>
    </div>
  )
}
