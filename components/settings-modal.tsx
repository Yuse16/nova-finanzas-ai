'use client'

import { useRouter } from 'next/navigation'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { useStore } from '@/lib/store' // NEW: Import useStore
import { availableFonts } from '@/lib/types' // NEW: Import availableFonts

export function SettingsModal() {
  const router = useRouter()
  const { modal, open, close, theme, setTheme } = useUI()
  const isOpen = modal.kind === 'settings'

  // NEW: Access font state and action
  const { data: { profile }, updateSelectedFont } = useStore()
  const currentFont = profile?.selectedFont || 'system' // Default to 'system'

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Configuración"
      fullScreen
    >
      <div className="flex flex-col gap-4 p-4 text-left">
        <h3 className="text-xl font-semibold">Tema</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 rounded-2xl p-3 text-sm font-semibold transition-all ${
              theme === 'light'
                ? 'bg-[oklch(0.62_0.17_290)] text-white'
                : 'glass-subtle text-foreground'
            }`}
          >
            ☀️ Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 rounded-2xl p-3 text-sm font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-[oklch(0.65_0.18_280)] text-white'
                : 'glass-subtle text-foreground'
            }`}
          >
            🌙 Oscuro Espacial
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 text-left">
        <h3 className="text-xl font-semibold">Fuente de la Interfaz</h3>
        <div className="flex flex-col gap-2">
          {availableFonts.map((font) => (
            <label key={font.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="font-selection"
                value={font.value}
                checked={currentFont === font.value}
                onChange={() => updateSelectedFont(font.value)}
                className="form-radio h-4 w-4"
              />
              <span className={`text-lg ${font.value === 'system' ? 'font-system' : font.value === 'var(--font-inter)' ? 'font-inter' : 'font-roboto-mono'}`}>
                {font.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 text-left">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Personalización</h3>
        <button
          type="button"
          onClick={() => { close(); router.push('/settings/personalizacion') }}
          className="flex items-center gap-3 rounded-2xl bg-white/50 dark:bg-white/10 p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 active:scale-[0.98] transition-all"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-400">
            <span className="text-lg">🎨</span>
          </span>
          Personalizar apariencia
        </button>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 p-4 text-left">
        <h3 className="text-xl font-semibold text-[oklch(0.7_0.2_25)]">Peligro</h3>
        <button
          type="button"
          onClick={() => {
            close()
            open({ kind: 'reset-financial' })
          }}
          className="flex items-center gap-3 rounded-2xl border border-[oklch(0.6_0.25_25/30%)] p-4 text-left text-sm font-semibold text-[oklch(0.7_0.2_25)] active:scale-[0.98]"
        >
          Reiniciar finanzas
        </button>
      </div>
    </GlassSheet>
  )
}
