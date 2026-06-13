import { categories, getCategoryMeta } from './catalog'
import type { MovementType, Method } from './types'

export type ParsedMovement = {
  type: MovementType
  amount: number
  category: string
  person?: string
  title: string
  icon: string
  color: string
  /** Best-guess payment method, if the phrase mentioned one. */
  method?: Method
}

const incomeWords = [
  'pagaron',
  'cobré',
  'cobre',
  'ingreso',
  'sueldo',
  'salario',
  'deposit',
  'me dieron',
  'recibí',
  'recibi',
]
const loanWords = ['presté', 'preste', 'le di', 'prestamo', 'préstamo']
const debtWords = ['me prestaron', 'pedí prestado', 'debo', 'me prestó']

const methodWords: { keys: string[]; method: Method }[] = [
  { keys: ['efectivo', 'cash'], method: 'Efectivo' },
  { keys: ['débito', 'debito', 'tarjeta de débito'], method: 'Débito' },
  { keys: ['crédito', 'credito', 'tarjeta de crédito'], method: 'Crédito' },
  { keys: ['ahorro', 'ahorros'], method: 'Ahorro' },
  { keys: ['inversión', 'inversion'], method: 'Inversión' },
]

export function parseVoice(text: string): ParsedMovement {
  const lower = text.toLowerCase()

  // amount: first number group (handles "3,500", "1.500", "150")
  const numMatch = lower.replace(/,/g, '').match(/\d+(\.\d+)?/)
  const amount = numMatch ? Number.parseFloat(numMatch[0]) : 0

  // type detection
  let type: MovementType = 'gasto'
  if (incomeWords.some((w) => lower.includes(w))) type = 'ingreso'
  if (loanWords.some((w) => lower.includes(w))) type = 'prestamo'
  if (debtWords.some((w) => lower.includes(w))) type = 'deuda'

  // person after "a " / "le presté a"
  const personMatch = text.match(/\ba\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/)
  const person = personMatch?.[1]

  // method
  let method: Method | undefined
  for (const m of methodWords) {
    if (m.keys.some((k) => lower.includes(k))) {
      method = m.method
      break
    }
  }

  // category
  let categoryLabel = type === 'ingreso' ? 'Ingreso' : 'General'
  for (const c of categories) {
    if (c.keywords.some((k) => lower.includes(k))) {
      categoryLabel = c.label
      break
    }
  }
  const cat = getCategoryMeta(categoryLabel)

  // title
  let title = categoryLabel
  if (type === 'prestamo' && person) title = `Préstamo a ${person}`
  else if (type === 'deuda') title = 'Préstamo recibido'
  else if (type === 'ingreso') {
    const sueldo = /sueldo|salario|n[oó]mina/.test(lower)
    title = sueldo ? 'Sueldo' : 'Ingreso'
  } else {
    const m = lower.match(/en\s+([a-záéíóúñ ]+?)(?:\s+con|\s+por|$)/)
    if (m) title = m[1].trim().replace(/^./, (s) => s.toUpperCase())
  }

  return {
    type,
    amount,
    category: categoryLabel,
    person,
    title,
    icon: cat.icon,
    color: cat.color,
    method,
  }
}
