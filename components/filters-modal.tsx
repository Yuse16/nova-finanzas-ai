'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'

export function FiltersModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'filters'

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Filtros de Movimientos"
      fullScreen
    >
      <div className="p-4 text-center text-lg">
        Contenido de filtros de movimientos aquí.
      </div>
    </GlassSheet>
  )
}
