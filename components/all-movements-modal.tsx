'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { MovementsModule } from './movements-module' // Import existing movements module

export function AllMovementsModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'all-movements'

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Todos los Movimientos"
      fullScreen // Typically, 'all' views are full screen
    >
      {/* Re-use the MovementsModule for display, potentially with adjustments for 'all' mode */}
      <div className="flex flex-col gap-4 pb-4">
        <p className="text-sm text-muted-foreground text-center">Aquí se mostrarían todos los movimientos en una vista expandida.</p>
        {/* You might pass a prop to MovementsModule to indicate it's in a full view */}
        {/* <MovementsModule showAll={true} /> */}
      </div>
    </GlassSheet>
  )
}
