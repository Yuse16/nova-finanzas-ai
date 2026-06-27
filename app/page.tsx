'use client'

import { HomeAccountCard } from '@/components/home-account-card'
import { HomeGoalCard } from '@/components/home-goal-card'
import { HomeQuickStats } from '@/components/home-quick-stats'

export default function HomePage() {
  return (
    <>
      <HomeAccountCard />
      <HomeGoalCard />
      <HomeQuickStats />
    </>
  )
}
