import { CATEGORIES, ACCOUNT_SYNONYMS, MONTH_NAMES } from './dictionary'
import type { ParsedEntities, MatchResult, NovaCoreIntent } from './types'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!,.;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(\d+[\d,.]*)\s*(?:pesos|dolares|dólares|\$|usd)?/i,
    /(?:de|por)\s*\$?\s*(\d+[\d,.]*)/i,
    /\$?\s*(\d+[\d,.]*)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      return parseInt(m[1].replace(/[,.]/g, ''), 10)
    }
  }
  return null
}

function findCategory(text: string): string | null {
  const n = normalize(text)
  for (const [cat, synonyms] of Object.entries(CATEGORIES)) {
    if (cat === 'ingreso' || cat === 'transferencia') continue
    for (const word of synonyms) {
      if (n.includes(word)) return cat
    }
  }
  return null
}

function findAccount(text: string): string | null {
  const n = normalize(text)
  for (const [acct, synonyms] of Object.entries(ACCOUNT_SYNONYMS)) {
    for (const word of synonyms) {
      if (n.includes(word)) return acct
    }
  }
  return null
}

function findPeriod(text: string): string | null {
  const n = normalize(text)
  if (/\b(este|actual)\s*mes\b/.test(n)) return 'month'
  if (/\b(este|actual)\s*(año|anio|year)\b/.test(n)) return 'year'
  if (/\bhoy\b/.test(n) || /\bdia\b/.test(n) && /\bhoy\b/.test(n)) return 'day'
  if (/\bsemana\b/.test(n) && /\besta\b/.test(n)) return 'week'
  if (/\b(ultimos|últimos|pasados|ultimos)\s*(\d+)\s*(mes|mese)/.test(n)) return 'last-months'
  for (const [name] of Object.entries(MONTH_NAMES)) {
    if (n.includes(name)) return name
  }
  return null
}

const GASTO_PATTERNS = [
  /(?:registra|agrega|añade|nuev[oa]|captur[ae]|pon|anot[ae])\s*(?:un|el)\s*(?:gasto|egreso|compra|pago)/i,
  /(?:gast[ée]|pagu[eé]|compr[eé]|pag[uú]e|gasto)\s+(?:de|un|en)?\s*/i,
  /(?:gas|compr)\w+\s+(?:de|por)\s+/i,
]

const INGRESO_PATTERNS = [
  /(?:registra|agrega|añade|nuev[oa]|captur[ae])\s*(?:un|el)\s*(?:ingreso|deposito|depósito|abono)/i,
  /(?:ingres[oó]|recib[ií]|gan[ée]|cobr[ée])\s+(?:de|un|por)?\s*/i,
  /(?:recib[ií])\s+(?:un|el)?\s*(?:pago|ingreso)/i,
]

const TRANSFER_PATTERNS = [
  /(?:transf[ií]ere|transf[ií]e[ri]|mueve|mover|pasa|pasar|transferir)\s+(?:de|desde)\s+/i,
  /(?:transf[ií]ere|transf[ií]e[ri]|mueve|mover|pasa|pasar|transferir)\s+/i,
]

const GOAL_PATTERNS = [
  /(?:crea|nuev[oa]|establece|inicia|empieza|registra|agrega)\s*(?:una|la)?\s*(?:meta|ahorro|objetivo)/i,
  /(?:quiero|deseo|vamos? a)\s*(?:crear|hacer|empezar|iniciar|ahorrar)\s*(?:una|la)?\s*(?:meta|ahorro)/i,
]

const QUERY_BALANCE_PATTERNS = [
  /(?:cu[aá]nt[oa]\s*(?:dinero|tengo|saldo)|saldo\s*(?:disponible|actual)?|qu[eé]\s*(?:saldo|tengo))\s*(?:\w+\s*)?$/i,
  /(?:cu[aá]nt[oa]\s*(?:dinero|tengo)\s*(?:en|disponible)\s+(?:mi\s+)?(?:cuenta\s+)?)/i,
]

const QUERY_ACCOUNTS_PATTERNS = [
  /(?:(?:qu[eé]|cu[aá]les)\s*(?:cuentas|tengo|tengo registradas)|mu[eé]strame\s*(?:las|mis)?\s*cuentas|lista\s*de\s*cuentas|qu[eé]\s*cuentas\s*(?:tengo|hay))/i,
]

const QUERY_MOVEMENTS_PATTERNS = [
  /(?:mu[eé]strame|ver|lista|qu[eé]\s*hay|ense[ñn]ame|dime)\s*(?:mis|los|todos)?\s*(?:movimientos|gastos|ingresos|transacciones|operaciones)/i,
  /(?:qu[eé]\s*(?:gas|[tT]é|he|he tenido))\s+(?:este|en|durante|del)\s+/i,
]

function matchPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

function extractTransferEntities(text: string): { from?: string; to?: string; amount?: number } {
  const n = normalize(text)
  const parts = n.split(/(?:de|desde|a|hacia|para|por)/).map((s) => s.trim()).filter(Boolean)

  const amount = extractAmount(text)
  let from: string | undefined
  let to: string | undefined

  if (parts.length >= 2) {
    const first = findAccount(parts[1])
    const second = parts.length >= 3 ? findAccount(parts[2]) : undefined
    if (first && second) {
      from = first
      to = second
    } else if (first) {
      from = first
      // Try to find to account in remainder
      to = findAccount(text.split(/a|hacia|para/).pop() || '') ?? undefined
    }
  }

  if (!from || !to) {
    const allAccounts = findAccount(text)
    if (allAccounts) {
      const accts = text.match(/\b(débito|debito|credito|crédito|ahorro|efectivo|inversión|inversion)\b/gi)
      if (accts && accts.length >= 2) {
        from = normalize(accts[0])
        to = normalize(accts[1])
        for (const [key, syns] of Object.entries(ACCOUNT_SYNONYMS)) {
          if (syns.includes(from)) from = key
          if (syns.includes(to)) to = key
        }
      }
    }
  }

  return { from, to, amount: amount ?? undefined }
}

function extractGoalEntities(text: string): { name?: string; amount?: number } {
  const amount = extractAmount(text)
  let name: string | undefined

  const nameMatch = text.match(/(?:para|de|llamad[ao]|nombre)\s+(.+?)(?:$|de\s+\$|\d)/i)
  if (nameMatch) {
    name = nameMatch[1].trim()
  }
  if (!name) {
    const afterMeta = text.split(/meta|objetivo|ahorro/i).pop()
    if (afterMeta) {
      const cleaned = afterMeta.replace(/de\s+\$?[\d,]+.*$/, '').replace(/para\s+/, '').trim()
      if (cleaned && cleaned.length > 2) name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
  }

  return { name, amount: amount ?? undefined }
}

export function parse(text: string): MatchResult {
  const normalized = normalize(text)

  if (!normalized || normalized.length < 2) {
    return { matched: false, intent: 'unknown', entities: {}, confidence: 0 }
  }

  const amount = extractAmount(text)
  const category = findCategory(text)
  const account = findAccount(text)
  const period = findPeriod(text)
  const lower = text.toLowerCase()

  // Detect transfer
  if (matchPatterns(lower, TRANSFER_PATTERNS)) {
    const { from, to, amount: ta } = extractTransferEntities(text)
    return {
      matched: true,
      intent: 'addTransfer',
      entities: { accountFrom: from, accountTo: to, amount: ta ?? amount ?? undefined },
      confidence: ta || from ? 0.85 : 0.6,
    }
  }

  // Detect expense
  if (matchPatterns(lower, GASTO_PATTERNS) || (amount && category && lower.includes('gasto'))) {
    // Extract account from the full text
    const accountType = findAccount(text)
    // Cleaner title: remove amount, account hints, "con", "de", "por" prefixes
    const title = (() => {
      let t = text
        .replace(/registra|agrega|añade|nuev[oa]/gi, '')
        .replace(/gasto|compra|pago/gi, '')
        .replace(/\b\d+\s*(?:pesos|dolares|dólares|\$)?\b/gi, '')
        .replace(/con\s+\w+/gi, '')
        .replace(/\b(de|por|un)\b/gi, '')
        .replace(/\b(débito|debito|credito|crédito|efectivo|ahorro|inversion|inversión)\b/gi, '')
        .trim()
      // Remove leading/trailing connectors
      t = t.replace(/^(de|por|un|con)\s+/i, '').replace(/\s+(de|por|un|con)$/i, '').trim()
      return t.length > 1 ? t.charAt(0).toUpperCase() + t.slice(1) : undefined
    })()
    return {
      matched: true,
      intent: 'addExpense',
      entities: { amount: amount ?? undefined, category: category ?? undefined, title: title ?? (category ? `Gasto en ${category}` : undefined), account: accountType ?? undefined },
      confidence: amount ? 0.9 : 0.6,
    }
  }

  // Detect income
  if (matchPatterns(lower, INGRESO_PATTERNS)) {
    return {
      matched: true,
      intent: 'addIncome',
      entities: { amount: amount ?? undefined },
      confidence: amount ? 0.85 : 0.5,
    }
  }

  // Detect goal
  if (matchPatterns(lower, GOAL_PATTERNS)) {
    const { name, amount: ga } = extractGoalEntities(text)
    return {
      matched: true,
      intent: 'createGoal',
      entities: { goalName: name, goalAmount: ga ?? amount ?? undefined },
      confidence: ga || name ? 0.85 : 0.5,
    }
  }

  // Detect balance query
  if (matchPatterns(lower, QUERY_BALANCE_PATTERNS)) {
    return {
      matched: true,
      intent: 'queryBalance',
      entities: { accountName: account ?? undefined },
      confidence: 0.8,
    }
  }

  // Detect accounts query
  if (matchPatterns(lower, QUERY_ACCOUNTS_PATTERNS)) {
    return {
      matched: true,
      intent: 'queryAccounts',
      entities: {},
      confidence: 0.8,
    }
  }

  // Detect movements query
  if (matchPatterns(lower, QUERY_MOVEMENTS_PATTERNS)) {
    return {
      matched: true,
      intent: 'queryMovements',
      entities: { period: period ?? undefined },
      confidence: 0.75,
    }
  }

  return { matched: false, intent: 'unknown', entities: {}, confidence: 0 }
}
