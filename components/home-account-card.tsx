'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { isAccountLiability } from '@/lib/catalog'
import { fmt } from '@/lib/format'

export function HomeAccountCard() {
  const { data } = useStore()

  const allLiquid = data.accounts
    .filter((a) => !isAccountLiability(a))
    .sort((a, b) => b.balance - a.balance)

  const nonZero = allLiquid.filter((a) => a.balance !== 0)
  const liquidAccounts = nonZero.length > 0 ? nonZero : allLiquid.slice(0, 1)

  if (liquidAccounts.length === 0) return null

  return (
    <section className="rounded-2xl bg-white px-5 pt-4 pb-2 shadow-sm mx-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Cuentas</h2>
        <Link href="/cuentas" className="text-sm text-blue-500">Ver todas</Link>
      </div>
      <div>
        {liquidAccounts.map((acc) => (
          <div key={acc.id} className="border-b border-gray-50 last:border-b-0">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-base font-semibold text-gray-900">{acc.name}</p>
                <p className="text-sm text-gray-400">Disponible</p>
              </div>
              <div className="flex items-center">
                <span className="text-base font-semibold text-gray-900">{fmt(acc.balance)}</span>
                <span className="ml-2 text-gray-300">›</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
