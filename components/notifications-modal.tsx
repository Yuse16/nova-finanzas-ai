'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'

export function NotificationsModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'notifications'

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Notificaciones y Recordatorios"
      fullScreen
    >
      <div className="p-4 text-center text-lg">
        No hay notificaciones pendientes.
      </div>
    </GlassSheet>
  )
}
