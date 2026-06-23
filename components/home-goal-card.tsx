'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lightbulb } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { fmtShort } from '@/lib/format'

const consejos = [
  { titulo: "Fondo de emergencia", desc: "Tener 3-6 meses de gastos guardados es el primer paso hacia la libertad financiera." },
  { titulo: "Regla del 50/30/20", desc: "Destina 50% a necesidades, 30% a gustos y 20% a ahorro e inversión." },
  { titulo: "Paga primero a ti mismo", desc: "Separa tu ahorro al inicio del mes antes de gastar en cualquier otra cosa." },
  { titulo: "Meta de viaje", desc: "Ahorrar $500 al mes durante un año te da $6,000 para el viaje que siempre quisiste." },
  { titulo: "Elimina deuda cara", desc: "Pagar una tarjeta de crédito al 30% de interés es mejor inversión que cualquier rendimiento." },
  { titulo: "Invierte en ti", desc: "Una habilidad nueva puede multiplicar tus ingresos más que cualquier instrumento financiero." },
  { titulo: "Automatiza tu ahorro", desc: "Lo que no ves, no lo gastas. Configura transferencias automáticas el día de tu nómina." },
  { titulo: "Primera meta sugerida", desc: "Empieza con algo concreto: $10,000 en 6 meses. Presiona + Nueva meta para comenzar." },
]

export function HomeGoalCard() {
  const { data } = useStore()
  const { open } = useUI()
  const { settings } = useCustomization()
  const [tipIndex] = useState(() => Math.floor(Math.random() * consejos.length))

  if (!settings.dashboard.showGoals) return null

  const sorted = [...data.goals]
    .filter((g) => g.target > 0)
    .sort((a, b) => (b.saved / b.target) - (a.saved / a.target))

  const main = sorted[0]

  if (main) {
    const pct = Math.min((main.saved / main.target) * 100, 100)
    const remaining = Math.max(main.target - main.saved, 0)

    return (
      <section className="rounded-2xl bg-white px-5 pt-4 pb-2 shadow-sm dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Metas</h2>
          <div className="flex items-center gap-3">
            <Link href="/metas" className="text-sm text-blue-500 dark:text-blue-400">Ver todas</Link>
            <button type="button" onClick={() => open({ kind: 'goal' })} className="text-sm font-semibold text-blue-500 dark:text-blue-400">+ Nueva meta</button>
          </div>
        </div>
        <Link href="/metas" className="block border-b border-gray-50 last:border-b-0 dark:border-gray-800">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{main.title}</p>
                <p className="text-sm text-gray-400">{fmtShort(main.saved)} de {fmtShort(main.target)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Faltan {fmtShort(remaining)}</span>
                <span className="text-gray-300 dark:text-gray-600">›</span>
              </div>
            </div>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Link>
      </section>
    )
  }

  const tip = consejos[tipIndex]

  return (
    <section className="rounded-2xl bg-white px-5 pt-4 pb-2 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Metas</h2>
        <button type="button" onClick={() => open({ kind: 'goal' })} className="text-sm font-semibold text-blue-500 dark:text-blue-400">+ Nueva meta</button>
      </div>
      <div className="border-b border-gray-50 last:border-b-0 py-3 dark:border-gray-800">
        <div className="flex gap-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{tip.titulo}</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-400">{tip.desc}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
