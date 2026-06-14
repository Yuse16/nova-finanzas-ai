'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'

export function SearchModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'search'

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Buscar Movimientos"
      fullScreen
    >
      <div className="p-4 text-center text-lg">
        Contenido de búsqueda de movimientos aquí.
      </div>
    </GlassSheet>
  )
}
