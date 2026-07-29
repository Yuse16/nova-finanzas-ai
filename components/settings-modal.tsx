'use client'

import { useRouter } from 'next/navigation'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { useStore } from '@/lib/store'
import { availableFonts } from '@/lib/types'
import { useAuth } from '@/context/auth-context'

export function SettingsModal() {
  const router = useRouter()
  const { modal, open, close, theme, setTheme } = useUI()
  const isOpen = modal.kind === 'settings'
  const { data: { profile }, updateSelectedFont } = useStore()
  const currentFont = profile?.selectedFont || 'system'
  const { isGuest, enableGuestMode: enableGuest, exitGuestMode, user } = useAuth()

  function handleExitGuest() {
    close()
    exitGuestMode()
    router.push('/auth/login')
  }

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

      {/* Guest mode card */}
      {isGuest && (
        <div className="flex flex-col gap-4 p-4 text-left">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800/50 dark:bg-blue-950/30">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Protege y sincroniza tus datos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Crea una cuenta para respaldar tu información y utilizar MPUME Finanzas en otros dispositivos.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  close()
                  router.push('/auth/signup')
                }}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Crear cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  close()
                  router.push('/auth/login')
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Continuar con Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest: Exit guest mode */}
      {isGuest && (
        <div className="flex flex-col gap-4 border-t border-white/10 p-4 text-left">
          <h3 className="text-xl font-semibold text-[oklch(0.7_0.2_25)]">Modo invitado</h3>
          <button
            type="button"
            onClick={handleExitGuest}
            className="flex items-center gap-3 rounded-2xl border border-[oklch(0.6_0.25_25/30%)] p-4 text-left text-sm font-semibold text-[oklch(0.7_0.2_25)] active:scale-[0.98]"
          >
            Salir del modo invitado
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tus datos permanecen guardados en este dispositivo.
          </p>
        </div>
      )}

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
