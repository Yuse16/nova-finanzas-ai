'use client'

import { useRef } from 'react'
import { Home, ArrowLeftRight, Wallet, Menu, Sparkles } from 'lucide-react'
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

  const novaHoldRef = useRef(false)
  const novaDidHoldRef = useRef(false)
  const novaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function novaDown() {
    novaHoldRef.current = true
    novaDidHoldRef.current = false
    novaTimerRef.current = setTimeout(() => {
      novaDidHoldRef.current = true
      if (novaHoldRef.current) {
        open({ kind: 'nova-ai', startVoice: true })
      }
    }, 200)
  }

  function novaUp() {
    const wasHolding = novaDidHoldRef.current
    novaHoldRef.current = false
    if (novaTimerRef.current) {
      clearTimeout(novaTimerRef.current)
      novaTimerRef.current = null
    }
    if (wasHolding) {
      window.dispatchEvent(new CustomEvent('nova-voice-end'))
    }
  }

  function novaClick() {
    if (!novaDidHoldRef.current) {
      open({ kind: 'nova-ai' })
    }
    novaDidHoldRef.current = false
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <nav className="glass-strong pointer-events-auto relative mx-4 flex w-full max-w-md items-center justify-between rounded-3xl px-6 py-3">
        <div className="flex flex-1 justify-around">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive(it.href) ? 'text-foreground' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={novaClick}
          onMouseDown={novaDown}
          onMouseUp={novaUp}
          onMouseLeave={novaUp}
          onTouchStart={novaDown}
          onTouchEnd={novaUp}
          aria-label="Nova AI"
          className="relative -mt-8 grid size-14 shrink-0 place-items-center rounded-full outline-none active:scale-90 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          }}
        >
          <Sparkles size={24} strokeWidth={1.5} className="text-white" />
        </button>

        <div className="flex flex-1 justify-around">
          {rightItems.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive(it.href) ? 'text-foreground' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => open({ kind: 'more-options' })}
            className="flex flex-col items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500"
          >
            <Menu className="size-5" />
            Más
          </button>
        </div>
      </nav>
    </div>
  )
}
