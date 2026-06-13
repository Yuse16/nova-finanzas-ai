'use client'

import { ChevronRight, Plus } from 'lucide-react'

export function SectionHeader({
  title,
  action,
  withPlus,
}: {
  title: string
  action?: string
  withPlus?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action ? (
        <button
          type="button"
          className="flex items-center gap-0.5 text-sm text-muted-foreground transition-colors active:text-foreground"
        >
          {withPlus && <Plus className="size-4" />}
          {action}
          {!withPlus && <ChevronRight className="size-4" />}
        </button>
      ) : null}
    </div>
  )
}
