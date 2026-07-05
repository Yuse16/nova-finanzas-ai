import type { AppData } from '@/lib/types'
import type { NovaCoreResult } from './types'
import { parse } from './parser'
import { queryKnowledge } from './knowledge'
import { fmt } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'

export async function processOffline(
  userMessage: string,
  data: AppData,
): Promise<NovaCoreResult> {
  const match = parse(userMessage)

  if (!match.matched) {
    const knowledge = await queryKnowledge(userMessage)
    if (knowledge) {
      return {
        text: `${knowledge.answer}\n\n— ${knowledge.source}`,
        intent: 'knowledgeQuestion',
        data: null,
        source: 'nova-core',
      }
    }
    return {
      text: 'No entendí tu mensaje. Puedes intentar:\n\n• "Registra un gasto de 500 en comida"\n• "Ingreso de 3000 por sueldo"\n• "Transfiere 200 de débito a ahorro"\n• "Crea una meta de 10000 para viaje"\n• "Cuánto tengo en mis cuentas"\n• "Qué gastos he tenido este mes"\n• "Dame un consejo financiero"',
      intent: 'unknown',
      data: null,
      source: 'nova-core',
    }
  }

  switch (match.intent) {
    case 'addExpense': {
      const category = match.entities.category || 'General'
      const title = match.entities.title || `Gasto en ${category}`
      const account = match.entities.account as string | undefined
      return {
        text: `✅ He detectado un gasto:\n• **${title}**\n• Categoría: ${category}\n• Monto: $${fmt(match.entities.amount || 0)}\n\n¿Confirmo?`,
        intent: 'addExpense',
        data: { categoria: category, monto: match.entities.amount, titulo: title, cuenta_hint: account ?? null } as Record<string, unknown>,
        source: 'nova-core',
      }
    }

    case 'addIncome': {
      const title = match.entities.title || 'Ingreso'
      return {
        text: `✅ He detectado un ingreso:\n• **${title}**\n• Monto: $${fmt(match.entities.amount || 0)}\n\n¿Confirmo?`,
        intent: 'addIncome',
        data: { monto: match.entities.amount, titulo: title } as Record<string, unknown>,
        source: 'nova-core',
      }
    }

    case 'addTransfer': {
      const from = match.entities.accountFrom || 'origen'
      const to = match.entities.accountTo || 'destino'
      const amount = match.entities.amount
      if (!amount) {
        return {
          text: 'Necesito saber el monto a transferir. Ejemplo: "Transfiere 500 de débito a ahorro"',
          intent: 'unknown',
          data: null,
          source: 'nova-core',
        }
      }
      return {
        text: `🔄 Transferencia detectada:\n• **$${fmt(amount)}**\n• De: **${from}**\n• A: **${to}**\n\n¿Confirmo?`,
        intent: 'unknown',
        data: null,
        source: 'nova-core',
      }
    }

    case 'createGoal': {
      const name = match.entities.goalName || 'Meta'
      const amount = match.entities.goalAmount || match.entities.amount
      return {
        text: `🎯 He detectado una meta:\n• **${name}**\n• Monto objetivo: $${fmt(amount || 0)}\n\n¿Creo esta meta?`,
        intent: 'createGoal',
        data: { titulo: name, monto: amount } as Record<string, unknown>,
        source: 'nova-core',
      }
    }

    case 'queryBalance': {
      const accountName = match.entities.accountName
      let accounts = data.accounts
      if (accountName) {
        accounts = accounts.filter((a) => a.name.toLowerCase().includes(accountName) || a.type.toLowerCase().includes(accountName))
      }

      if (accounts.length === 0) {
        return {
          text: accountName
            ? `No encontré una cuenta llamada "${accountName}"`
            : 'No tienes cuentas registradas.',
          intent: 'unknown',
          data: null,
          source: 'nova-core',
        }
      }

      const lines = accounts.map((a) => {
        const isLiability = isAccountLiability(a)
        return `• **${a.name}** (${a.type}): $${fmt(a.balance)}${isLiability ? ' (deuda)' : ''}`
      })
      const total = accounts.filter((a) => !isAccountLiability(a)).reduce((s, a) => s + a.balance, 0)
      lines.push(`\n**Total disponible:** $${fmt(total)}`)

      return {
        text: lines.join('\n'),
        intent: 'unknown',
        data: null,
        source: 'nova-core',
      }
    }

    case 'queryAccounts': {
      if (data.accounts.length === 0) {
        return {
          text: 'No tienes cuentas registradas. Ve a Cuentas para agregar una.',
          intent: 'unknown',
          data: null,
          source: 'nova-core',
        }
      }
      const lines = data.accounts.map((a) => {
        const isLiability = isAccountLiability(a)
        return `• **${a.name}** — $${fmt(a.balance)}${isLiability ? ' 💳' : ''}`
      })
      return {
        text: `Tus cuentas:\n${lines.join('\n')}`,
        intent: 'unknown',
        data: null,
        source: 'nova-core',
      }
    }

    case 'queryMovements': {
      const period = match.entities.period || 'month'
      const now = new Date()
      let filtered = data.movements

      if (period === 'day') {
        const today = now.toISOString().split('T')[0]
        filtered = filtered.filter((m) => m.date === today)
      } else {
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        filtered = filtered.filter((m) => m.date?.startsWith(yearMonth))
      }

      if (filtered.length === 0) {
        return {
          text: 'No hay movimientos en este período.',
          intent: 'unknown',
          data: null,
          source: 'nova-core',
        }
      }

      const totalIncome = filtered.filter((m) => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
      const totalExpense = filtered.filter((m) => m.type === 'gasto').reduce((s, m) => s + m.amount, 0)
      const top5 = filtered.slice(-5).reverse()

      return {
        text: `📊 Resumen ${period === 'day' ? 'de hoy' : 'del mes'}:\n\n**Ingresos:** +$${fmt(totalIncome)}\n**Gastos:** -$${fmt(totalExpense)}\n**Balance:** $${fmt(totalIncome - totalExpense)}\n\nÚltimos movimientos:\n${top5.map((m) => `• ${m.title}: $${fmt(m.amount)} (${m.type})`).join('\n')}`,
        intent: 'monthlySummary',
        data: { ingresos: totalIncome, gastos: totalExpense, ahorro: totalIncome - totalExpense, periodo: period } as Record<string, unknown>,
        source: 'nova-core',
      }
    }

    default: {
      const knowledge = await queryKnowledge(userMessage)
      if (knowledge) {
        return {
          text: `${knowledge.answer}\n\n— ${knowledge.source}`,
          intent: 'knowledgeQuestion',
          data: null,
          source: 'nova-core',
        }
      }
      return {
        text: 'No entendí tu mensaje. Intenta con un comando como:\n• "Registra un gasto de 500 en comida"\n• "Cuánto tengo en mis cuentas"\n• "Dame un consejo financiero"',
        intent: 'unknown',
        data: null,
        source: 'nova-core',
      }
    }
  }
}
