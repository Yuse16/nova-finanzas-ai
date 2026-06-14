'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { useStore } from '@/lib/store' // NEW: Import useStore
import { availableFonts } from '@/lib/types' // NEW: Import availableFonts

export function SettingsModal() {
  const { modal, close } = useUI()
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
      {/* NEW: Font Selection UI */}
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
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className={`text-lg ${font.value === 'system' ? 'font-system' : font.value === 'var(--font-inter)' ? 'font-inter' : 'font-roboto-mono'}`}>
                {font.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </GlassSheet>
  )
}
