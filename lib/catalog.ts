import type { AccountType, Method, MovementType } from './types'

// ---- Account type metadata ------------------------------------------------

export type AccountTypeMeta = {
  type: AccountType
  label: string
  caption: string
  icon: string
  color: string
  /** Liability accounts hold a negative balance and subtract from net worth. */
  liability: boolean
  method: Method
}

export const accountTypes: AccountTypeMeta[] = [
  {
    type: 'efectivo',
    label: 'Efectivo',
    caption: 'Disponible',
    icon: 'banknote',
    color: 'oklch(0.72 0.16 150)',
    liability: false,
    method: 'Efectivo',
  },
  {
    type: 'debito',
    label: 'Tarjeta Débito',
    caption: 'Disponible',
    icon: 'credit-card',
    color: 'oklch(0.72 0.15 235)',
    liability: false,
    method: 'Débito',
  },
  {
    type: 'credito',
    label: 'Tarjeta Crédito',
    caption: 'Deuda actual',
    icon: 'credit-card',
    color: 'oklch(0.68 0.18 295)',
    liability: true,
    method: 'Crédito',
  },
  {
    type: 'ahorro',
    label: 'Ahorro',
    caption: 'Disponible',
    icon: 'piggy-bank',
    color: 'oklch(0.78 0.16 70)',
    liability: false,
    method: 'Ahorro',
  },
  {
    type: 'inversion',
    label: 'Inversión',
    caption: 'Disponible',
    icon: 'trending-up',
    color: 'oklch(0.74 0.15 175)',
    liability: false,
    method: 'Inversión',
  },
  {
    type: 'deudas',
    label: 'Deudas',
    caption: 'Total de deuda',
    icon: 'hand-coins',
    color: 'oklch(0.68 0.19 25)',
    liability: true,
    method: 'Otro',
  },
]

export function getAccountTypeMeta(type: AccountType): AccountTypeMeta {
  return accountTypes.find((a) => a.type === type) ?? accountTypes[0]
}

// ---- Spending categories --------------------------------------------------

export type CategoryMeta = {
  label: string
  icon: string
  color: string
  /** Keywords used by the voice parser to detect this category. */
  keywords: string[]
}

export const categories: CategoryMeta[] = [
  {
    label: 'Comida',
    icon: 'utensils',
    color: 'oklch(0.68 0.19 25)',
    keywords: [
      'taco',
      'tacos',
      'comida',
      'restaurante',
      'almuerzo',
      'cena',
      'desayuno',
      'pizza',
      'hamburguesa',
      'lonche',
      'torta',
    ],
  },
  {
    label: 'Café',
    icon: 'coffee',
    color: 'oklch(0.6 0.12 60)',
    keywords: ['café', 'cafe', 'starbucks', 'capuccino', 'latte'],
  },
  {
    label: 'Transporte',
    icon: 'fuel',
    color: 'oklch(0.78 0.16 70)',
    keywords: [
      'gasolina',
      'gas',
      'uber',
      'didi',
      'taxi',
      'transporte',
      'camión',
      'camion',
      'metro',
      'pasaje',
      'estacionamiento',
    ],
  },
  {
    label: 'Servicios',
    icon: 'zap',
    color: 'oklch(0.74 0.15 235)',
    keywords: [
      'internet',
      'luz',
      'cfe',
      'agua',
      'teléfono',
      'telefono',
      'renta',
      'servicio',
      'gas natural',
      'predial',
    ],
  },
  {
    label: 'Compras',
    icon: 'shopping-cart',
    color: 'oklch(0.78 0.16 120)',
    keywords: [
      'super',
      'supermercado',
      'mercado',
      'compras',
      'ropa',
      'tienda',
      'amazon',
      'mandado',
    ],
  },
  {
    label: 'Entretenimiento',
    icon: 'tv',
    color: 'oklch(0.68 0.18 295)',
    keywords: [
      'netflix',
      'spotify',
      'cine',
      'juego',
      'videojuego',
      'entretenimiento',
      'disney',
      'hbo',
      'concierto',
    ],
  },
  {
    label: 'Salud',
    icon: 'stethoscope',
    color: 'oklch(0.74 0.15 175)',
    keywords: ['doctor', 'medicina', 'farmacia', 'salud', 'consulta', 'dentista'],
  },
  {
    label: 'Educación',
    icon: 'graduation-cap',
    color: 'oklch(0.72 0.15 255)',
    keywords: ['escuela', 'colegiatura', 'curso', 'libro', 'educación', 'educacion'],
  },
  {
    label: 'Ingreso',
    icon: 'arrow-down-left',
    color: 'oklch(0.72 0.16 150)',
    keywords: ['sueldo', 'salario', 'pago', 'nómina', 'nomina', 'ingreso'],
  },
  {
    label: 'General',
    icon: 'wallet',
    color: 'oklch(0.72 0.15 235)',
    keywords: [],
  },
]

export function getCategoryMeta(label: string): CategoryMeta {
  return (
    categories.find((c) => c.label.toLowerCase() === label.toLowerCase()) ??
    categories[categories.length - 1]
  )
}

// ---- Methods --------------------------------------------------------------

export const methods: Method[] = [
  'Efectivo',
  'Débito',
  'Crédito',
  'Ahorro',
  'Inversión',
  'Otro',
]

/** Map a payment method to the matching account type (best-effort). */
export const methodToAccountType: Record<string, AccountType> = {
  Efectivo: 'efectivo',
  Débito: 'debito',
  Crédito: 'credito',
  Ahorro: 'ahorro',
  Inversión: 'inversion',
}

// ---- Goal & reminder presets ---------------------------------------------

export const goalIconOptions = [
  { icon: 'piggy-bank', color: 'oklch(0.72 0.16 235)', label: 'Fondo' },
  { icon: 'plane', color: 'oklch(0.78 0.14 200)', label: 'Viaje' },
  { icon: 'car', color: 'oklch(0.68 0.18 25)', label: 'Auto' },
  { icon: 'home', color: 'oklch(0.78 0.16 120)', label: 'Casa' },
  { icon: 'smartphone', color: 'oklch(0.7 0.18 295)', label: 'Gadget' },
  { icon: 'gift', color: 'oklch(0.78 0.16 70)', label: 'Regalo' },
  { icon: 'graduation-cap', color: 'oklch(0.72 0.15 255)', label: 'Educación' },
  { icon: 'heart', color: 'oklch(0.7 0.19 18)', label: 'Salud' },
]

export const reminderIconOptions = [
  { icon: 'zap', color: 'oklch(0.78 0.16 70)', label: 'Luz' },
  { icon: 'droplets', color: 'oklch(0.78 0.14 200)', label: 'Agua' },
  { icon: 'wifi', color: 'oklch(0.72 0.15 235)', label: 'Internet' },
  { icon: 'phone', color: 'oklch(0.74 0.15 175)', label: 'Teléfono' },
  { icon: 'credit-card', color: 'oklch(0.68 0.18 295)', label: 'Tarjeta' },
  { icon: 'home', color: 'oklch(0.78 0.16 120)', label: 'Renta' },
  { icon: 'receipt', color: 'oklch(0.72 0.16 150)', label: 'Otro' },
]

export const movementTypeLabels: Record<MovementType, string> = {
  gasto: 'Gasto',
  ingreso: 'Ingreso',
  transferencia: 'Transferencia',
  deuda: 'Deuda',
  prestamo: 'Préstamo',
}
