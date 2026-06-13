import type { AppData } from '../types'
import { fmt, fmtShort } from '../format'

/**
 * AI assistant service.
 *
 * Architecture is prepared for a future OpenAI (or Vercel AI Gateway)
 * integration. For now it returns deterministic, locally-computed answers so
 * the assistant UI is fully functional offline. When AI is connected, only
 * `askAssistant` needs to call the model instead of `localAnswer`.
 */

export const OPENAI_READY = false

export type AssistantAnswer = {
  text: string
  breakdown?: { label: string; amount: number; percent: number; color: string }[]
}

export interface AiService {
  ask(question: string, data: AppData): Promise<AssistantAnswer>
}

/** Local, rule-based assistant used until a real model is connected. */
export function localAnswer(question: string, data: AppData): AssistantAnswer {
  const q = question.toLowerCase()
  const now = new Date()
  const monthExpenses = data.movements.filter(
    (m) =>
      m.type === 'gasto' &&
      new Date(m.date).getMonth() === now.getMonth() &&
      new Date(m.date).getFullYear() === now.getFullYear(),
  )

  const byCategory = new Map<string, number>()
  for (const m of monthExpenses) {
    byCategory.set(m.category, (byCategory.get(m.category) ?? 0) + m.amount)
  }
  const total = [...byCategory.values()].reduce((a, b) => a + b, 0)
  const breakdown = [...byCategory.entries()]
    .map(([label, amount]) => ({
      label,
      amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
      color: 'oklch(0.72 0.16 255)',
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  if (total === 0) {
    return {
      text: 'Aún no tienes gastos registrados este mes. Registra tu primer movimiento por voz o texto para empezar a recibir análisis.',
    }
  }

  if (q.includes('gast') && (q.includes('más') || q.includes('mas') || q.includes('dónde') || q.includes('donde'))) {
    const top = breakdown[0]
    return {
      text: `Este mes has gastado ${fmt(total)} en total. Tu categoría más alta es ${top.label} con ${fmt(top.amount)} (${top.percent}%).`,
      breakdown,
    }
  }

  if (q.includes('queda') || q.includes('terminar el mes')) {
    const balance = data.accounts
      .filter((a) => !['credito', 'deudas'].includes(a.type))
      .reduce((s, a) => s + a.balance, 0)
    return {
      text: `Tienes ${fmt(balance)} disponibles en tus cuentas líquidas. Llevas ${fmt(total)} gastados este mes.`,
    }
  }

  if (q.includes('ahorr')) {
    const income = data.movements
      .filter((m) => m.type === 'ingreso')
      .reduce((s, m) => s + m.amount, 0)
    const rate = income ? Math.round(((income - total) / income) * 100) : 0
    return {
      text: `Tu tasa de ahorro estimada este mes es ${rate}%. Revisa tus categorías más altas para encontrar oportunidades de recorte.`,
      breakdown,
    }
  }

  if (q.includes('hormiga')) {
    const small = monthExpenses.filter((m) => m.amount <= 150)
    const sum = small.reduce((s, m) => s + m.amount, 0)
    return {
      text: `Detecté ${small.length} gastos hormiga (≤ ${fmtShort(150)}) que suman ${fmt(sum)} este mes.`,
    }
  }

  return {
    text: `Este mes llevas ${fmt(total)} en gastos distribuidos en ${byCategory.size} categorías.`,
    breakdown,
  }
}

export const aiService: AiService = {
  async ask(question, data) {
    // When OPENAI_READY is true, call the model here instead.
    return localAnswer(question, data)
  },
}
