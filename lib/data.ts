import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  HandCoins,
  UtensilsCrossed,
  Fuel,
  ShoppingCart,
  Tv,
  Wallet,
  Wifi,
  Zap,
  Droplets,
} from 'lucide-react'

export type Method =
  | 'Efectivo'
  | 'Débito'
  | 'Crédito'
  | 'Ahorro'
  | 'Inversión'
  | 'Otro'

export type MovementType = 'gasto' | 'ingreso' | 'transferencia' | 'deuda'

export type Movement = {
  id: string
  title: string
  category: string
  amount: number
  type: MovementType
  method: string
  group: 'Hoy' | 'Ayer' | 'Esta semana' | 'Este mes'
  icon: LucideIcon
  color: string
}

export const user = {
  name: 'Enrique',
  available: 8750,
  balanceChange: 1250,
  changePercent: 25,
}

export const quickStats = [
  { label: 'Gastos hoy', value: 320, delta: 12, up: true },
  { label: 'Gastos semana', value: 1450, delta: 8, up: false },
  { label: 'Gastos mes', value: 5230, delta: 15, up: true },
  { label: 'Ingresos mes', value: 9850, delta: 25, up: true },
]

export type Account = {
  id: string
  name: string
  amount: number
  caption: string
  icon: LucideIcon
  color: string
  negative?: boolean
}

export const accounts: Account[] = [
  {
    id: 'efectivo',
    name: 'Efectivo',
    amount: 2350,
    caption: 'Disponible',
    icon: Banknote,
    color: 'oklch(0.72 0.16 150)',
  },
  {
    id: 'debito',
    name: 'Tarjeta Débito',
    amount: 1850,
    caption: 'Disponible',
    icon: CreditCard,
    color: 'oklch(0.72 0.15 235)',
  },
  {
    id: 'credito',
    name: 'Tarjeta Crédito',
    amount: -1200,
    caption: 'Deuda actual',
    icon: CreditCard,
    color: 'oklch(0.68 0.18 295)',
    negative: true,
  },
  {
    id: 'ahorro',
    name: 'Ahorro',
    amount: 5000,
    caption: 'Disponible',
    icon: PiggyBank,
    color: 'oklch(0.78 0.16 70)',
  },
  {
    id: 'inversion',
    name: 'Inversión',
    amount: 3200,
    caption: 'Disponible',
    icon: TrendingUp,
    color: 'oklch(0.74 0.15 175)',
  },
  {
    id: 'deudas',
    name: 'Deudas',
    amount: -2450,
    caption: 'Total de deuda',
    icon: HandCoins,
    color: 'oklch(0.68 0.19 25)',
    negative: true,
  },
]

export const movements: Movement[] = [
  {
    id: 'm1',
    title: 'Tacos',
    category: 'Comida',
    amount: -120,
    type: 'gasto',
    method: 'Efectivo',
    group: 'Hoy',
    icon: UtensilsCrossed,
    color: 'oklch(0.72 0.16 150)',
  },
  {
    id: 'm2',
    title: 'Gasolina',
    category: 'Transporte',
    amount: -300,
    type: 'gasto',
    method: 'Débito',
    group: 'Hoy',
    icon: Fuel,
    color: 'oklch(0.78 0.16 70)',
  },
  {
    id: 'm3',
    title: 'Sueldo',
    category: 'Ingreso',
    amount: 3500,
    type: 'ingreso',
    method: 'Banco',
    group: 'Hoy',
    icon: Banknote,
    color: 'oklch(0.72 0.16 150)',
  },
  {
    id: 'm4',
    title: 'Supermercado',
    category: 'Compras',
    amount: -850,
    type: 'gasto',
    method: 'Débito',
    group: 'Ayer',
    icon: ShoppingCart,
    color: 'oklch(0.78 0.16 70)',
  },
  {
    id: 'm5',
    title: 'Netflix',
    category: 'Entretenimiento',
    amount: -179,
    type: 'gasto',
    method: 'Crédito',
    group: 'Ayer',
    icon: Tv,
    color: 'oklch(0.68 0.18 295)',
  },
  {
    id: 'm6',
    title: 'Transferencia a Ahorro',
    category: 'Transferencia',
    amount: -500,
    type: 'transferencia',
    method: 'Ahorro',
    group: 'Esta semana',
    icon: Wallet,
    color: 'oklch(0.72 0.15 235)',
  },
  {
    id: 'm7',
    title: 'Préstamo a Juan',
    category: 'Deuda',
    amount: -500,
    type: 'deuda',
    method: 'Efectivo',
    group: 'Esta semana',
    icon: HandCoins,
    color: 'oklch(0.68 0.19 25)',
  },
]

export const chartData = [
  300, 420, 380, 520, 460, 600, 540, 720, 650, 580, 690, 760, 700, 640, 720,
  810, 760, 900, 980, 1120, 1040, 960, 880, 1010, 1100, 1180, 1080, 1000, 1140,
  1190,
]

export const spendingBreakdown = [
  { label: 'Comida', amount: 1850, percent: 35, color: 'oklch(0.68 0.19 25)' },
  {
    label: 'Transporte',
    amount: 1230,
    percent: 23,
    color: 'oklch(0.78 0.16 70)',
  },
  { label: 'Compras', amount: 950, percent: 18, color: 'oklch(0.68 0.18 295)' },
  {
    label: 'Entretenimiento',
    amount: 620,
    percent: 12,
    color: 'oklch(0.72 0.15 235)',
  },
]

export type Goal = {
  id: string
  title: string
  saved: number
  target: number
  date: string
  image: string
  color: string
}

export const goals: Goal[] = [
  {
    id: 'g1',
    title: 'Viaje a Cancún',
    saved: 6500,
    target: 10000,
    date: '20 Dic 2024',
    image: '/goal-cancun.png',
    color: 'oklch(0.78 0.14 200)',
  },
  {
    id: 'g2',
    title: 'Fondo de emergencia',
    saved: 4000,
    target: 10000,
    date: '1 Jul 2025',
    image: '',
    color: 'oklch(0.72 0.16 235)',
  },
  {
    id: 'g3',
    title: 'Nuevo iPhone',
    saved: 3000,
    target: 10000,
    date: '30 Nov 2024',
    image: '/goal-iphone.png',
    color: 'oklch(0.78 0.16 120)',
  },
]

export type Reminder = {
  id: string
  title: string
  amount: number
  due: string
  icon: LucideIcon
  color: string
}

export const reminders: Reminder[] = [
  {
    id: 'r1',
    title: 'Luz (CFE)',
    amount: 540,
    due: 'Vence en 2 días',
    icon: Zap,
    color: 'oklch(0.78 0.16 70)',
  },
  {
    id: 'r2',
    title: 'Internet',
    amount: 599,
    due: 'Vence en 5 días',
    icon: Wifi,
    color: 'oklch(0.72 0.15 235)',
  },
  {
    id: 'r3',
    title: 'Agua',
    amount: 320,
    due: 'Vence en 9 días',
    icon: Droplets,
    color: 'oklch(0.78 0.14 200)',
  },
  {
    id: 'r4',
    title: 'Tarjeta de crédito',
    amount: 1200,
    due: 'Vence en 12 días',
    icon: CreditCard,
    color: 'oklch(0.68 0.18 295)',
  },
]

export const insights = [
  {
    id: 'i1',
    text: 'Has gastado 15% más en comida que el mes pasado.',
    tone: 'warn' as const,
  },
  {
    id: 'i2',
    text: 'Podrías ahorrar $1,250 este mes ajustando suscripciones.',
    tone: 'good' as const,
  },
  {
    id: 'i3',
    text: 'Tu gasto más alto este mes fue gasolina ($1,230).',
    tone: 'info' as const,
  },
  {
    id: 'i4',
    text: 'Netflix aumentó $40 respecto al mes anterior.',
    tone: 'warn' as const,
  },
]

export const healthScore = {
  score: 78,
  factors: [
    { label: 'Tasa de ahorro', value: 82 },
    { label: 'Nivel de deuda', value: 64 },
    { label: 'Hábitos de gasto', value: 75 },
    { label: 'Fondo de emergencia', value: 40 },
  ],
}

export const povertyZero = {
  total: 1850,
  items: [
    { label: 'Suscripción sin uso (Gym App)', amount: 299 },
    { label: 'Comisión bancaria evitable', amount: 180 },
    { label: 'Café diario fuera de casa', amount: 920 },
    { label: 'Doble servicio de streaming', amount: 451 },
  ],
}

export const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

export const fmtShort = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n)
