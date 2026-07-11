'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Bell, User, LogOut } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { useAuth } from '@/context/auth-context'
import { loadNotifications } from '@/lib/notifications'
import { fmt } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'
import { useStore } from '@/lib/store'

export type PageType = 'home' | 'movimientos' | 'cuentas' | 'historial' | 'insights' | 'metas'

const PAGE_TITLES: Record<PageType, string> = {
  home: '',
  movimientos: 'Movimientos',
  cuentas: 'Cuentas',
  historial: 'Historial',
  insights: 'Insights',
  metas: 'Metas',
}

export function PageHeader({ page }: { page: PageType }) {
  const { theme, openFullSummary, open } = useUI()
  const { settings } = useCustomization()
  const { data } = useStore()
  const { user, signOut } = useAuth()
  const [unread, setUnread] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const update = () => setUnread(loadNotifications().filter((n) => !n.read).length)
    update()
    window.addEventListener('nova-notifications-changed', update)
    return () => window.removeEventListener('nova-notifications-changed', update)
  }, [])

  const name = data.profile?.name ?? 'Usuario'
  const availableBalance = data.accounts
    .filter((a) => !isAccountLiability(a))
    .reduce((sum, acc) => sum + acc.balance, 0)

  return (
    <section
        className="relative w-screen overflow-hidden shrink-0 left-1/2 -translate-x-1/2"
        style={{
          height: 'calc(340px + env(safe-area-inset-top, 0px))',
          marginTop: 'calc(-1.5rem - env(safe-area-inset-top, 0px) - 60px)',
        }}
      >
      <div className="absolute inset-0">
        <Image
          src={theme === 'dark' ? '/montanaobs.webp' : '/montanav2.webp'}
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover"
          style={{ objectPosition: 'center 30%' }}
          sizes="100vw"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background:
            theme === 'dark'
              ? 'linear-gradient(to bottom, transparent 0%, #030712 100%)'
              : 'linear-gradient(to bottom, transparent 0%, white 100%)',
        }}
      />

      <div className="absolute right-5 flex items-center gap-2" style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <div className="relative">
          <button
            type="button"
            aria-label="Usuario"
            onClick={() => setShowMenu(!showMenu)}
            className="glass relative grid size-11 place-items-center rounded-2xl active:scale-95 transition-transform"
          >
            <User className="size-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                <p className="truncate px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {user?.email ?? ''}
                </p>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  type="button"
                  onClick={() => { signOut() }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={() => open({ kind: 'notifications' })}
          className="glass relative grid size-11 place-items-center rounded-2xl active:scale-95 transition-transform"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-[var(--negative)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </div>

      <div className="absolute bottom-20 left-5 z-10">
        {page === 'home' ? (
          <div className="cursor-pointer" onClick={openFullSummary}>
            {settings.dashboard.showGreeting && (
              <p className="text-lg font-light text-gray-800 dark:text-gray-100">
                Hola, {name}
              </p>
            )}
            {settings.dashboard.showBalance && (
              <>
                <p className="mt-1 text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Dinero disponible
                </p>
                <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
                  {fmt(availableBalance)}
                </p>
              </>
            )}
          </div>
        ) : (
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {PAGE_TITLES[page]}
          </h1>
        )}
      </div>
    </section>
  )
}
