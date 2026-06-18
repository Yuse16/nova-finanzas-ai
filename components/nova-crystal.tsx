'use client'

import { useEffect, useState } from 'react'
import { loadNotifications } from '@/lib/notifications'

export function NovaCrystal({ onClick }: { onClick: () => void }) {
  const [hasNotifications, setHasNotifications] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const update = () => {
      const ns = loadNotifications()
      setHasNotifications(ns.some((n) => !n.read))
    }
    update()
    window.addEventListener('nova-notifications-changed', update)
    return () => window.removeEventListener('nova-notifications-changed', update)
  }, [])

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label="Abrir Nova"
      className="relative -mt-8 grid size-16 shrink-0 place-items-center outline-none"
    >
      <span
        className="absolute inset-0 rounded-[22px] will-change-transform"
        style={{
          background: 'var(--nova-crystal-bg)',
          border: '1px solid var(--nova-crystal-border)',
          boxShadow: 'var(--nova-crystal-shadow), var(--nova-crystal-glow)',
          animation: 'nova-breathe 6s ease-in-out infinite',
          transform: pressed ? 'scale(0.92)' : 'scale(1)',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]"
        style={{
          background:
            'linear-gradient(135deg, var(--nova-crystal-edge) 0%, transparent 50%, transparent 100%)',
        }}
      />

      <span
        className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{
          animation: 'nova-shimmer 4s ease-in-out infinite',
          background:
            'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 25%) 50%, transparent 100%)',
          opacity: 0,
        }}
      />

      <span
        className="pointer-events-none relative z-10 select-none text-xl font-bold leading-none tracking-tight"
        style={{
          color: 'var(--nova-crystal-n)',
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic',
        }}
      >
        N
      </span>

      {hasNotifications && (
        <span
          className="pointer-events-none absolute -right-0.5 -top-0.5 size-2.5 rounded-full"
          style={{ background: 'var(--nova-crystal-dot)' }}
        />
      )}
    </button>
  )
}
