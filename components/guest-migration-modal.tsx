'use client'

import { useState } from 'react'
import { GlassSheet } from './ui/glass-sheet'

type Props = {
  open: boolean
  onCancel: () => void
  onSkip: () => void
  onMigrate: () => Promise<void>
}

export function GuestMigrationModal({ open, onCancel, onSkip, onMigrate }: Props) {
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleMigrate() {
    setMigrating(true)
    setError(null)
    try {
      await onMigrate()
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <GlassSheet open={open} onClose={onCancel} title="Sincronizar datos">
      <div className="flex flex-col gap-6 p-6 text-left">
        {done ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Datos sincronizados
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Toda tu información está respaldada en tu cuenta.
              </p>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continuar
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Encontramos información guardada en este dispositivo
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Tienes datos locales de cuando usabas MPUME Finanzas sin cuenta.
                ¿Quieres conservarlos y sincronizarlos con tu nueva cuenta?
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                No pudimos terminar la sincronización. Tus datos siguen seguros en este dispositivo.
              </div>
            )}

            <button
              type="button"
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {migrating ? 'Sincronizando...' : 'Conservar y sincronizar mis datos'}
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Entrar sin importar
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </GlassSheet>
  )
}
