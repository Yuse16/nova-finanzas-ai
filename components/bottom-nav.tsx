'use client'

import { Home, ArrowLeftRight, Wallet, Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUI } from '@/lib/ui-context'

const items = [
  { label: 'Inicio', icon: Home, href: '/' },
  { label: 'Movimientos', icon: ArrowLeftRight, href: '/movimientos' },
]

const rightItems = [
  { label: 'Cuentas', icon: Wallet, href: '/cuentas' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { open } = useUI()

  const isActive = (href: string) => pathname === href

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <nav className="glass-strong pointer-events-auto relative mx-4 flex w-full max-w-md items-center justify-between rounded-3xl px-6 py-3">
        <div className="flex flex-1 justify-around">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive(it.href) ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => open({ kind: 'quick-actions' })}
          aria-label="Acción rápida"
          className="relative -mt-8 grid size-16 shrink-0 place-items-center rounded-full bg-[oklch(0.62_0.17_290)] shadow-[0_10px_30px_-6px_oklch(0.5_0.18_290/70%)] transition-transform active:scale-95"
        >
          <span
            className="absolute size-16 rounded-full bg-[oklch(0.7_0.18_290)]"
            style={{ animation: 'nova-pulse 2.4s ease-out infinite' }}
          />
          <Plus className="relative size-7 text-white" />
        </button>

        <div className="flex flex-1 justify-around">
          {rightItems.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive(it.href) ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => open({ kind: 'more-options' })}
            className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"
          >
            <Menu className="size-5" />
            Más
          </button>
        </div>
      </nav>
    </div>
  )
}
