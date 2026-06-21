'use client'

import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { HomeHero } from '@/components/home-hero'
import { HomeAccountCard } from '@/components/home-account-card'
import { HomeGoalCard } from '@/components/home-goal-card'
import { HomeQuickStats } from '@/components/home-quick-stats'

export default function HomePage() {
  const { data } = useStore()
  const { open } = useUI()

  return (
    <div className="flex flex-col">
      <HomeHero data={data} onBellClick={() => open({ kind: 'notifications' })} />

      <div className="flex flex-col bg-gray-50 min-h-screen pb-32 pt-5 dark:bg-gray-950">
        <HomeAccountCard />
        <HomeGoalCard />
        <HomeQuickStats />
      </div>
    </div>
  )
}
