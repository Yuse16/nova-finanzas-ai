'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GoalsModule } from '@/components/goals-module'

export default function MetasPage() {
  return (
    <>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -mb-2"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>
      <GoalsModule />
    </>
  )
}
