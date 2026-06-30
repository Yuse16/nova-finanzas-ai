import type { AppData } from '@/lib/types'
import type { NovaIntent, DetectedData } from './openrouter'
import { sendChatMessage } from './openrouter'
import { processOffline } from '@/lib/nova-core/engine'
import type { NovaCoreResult } from '@/lib/nova-core/types'

export type HybridResult = {
  text: string
  intent: NovaIntent
  data: DetectedData | null
  source: 'nova-core' | 'openrouter'
}

let isOnline = true

export function getConnectionStatus(): boolean {
  return isOnline
}

export function setConnectionStatus(online: boolean) {
  isOnline = online
}

// Check if browser is online
function checkConnectivity(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return true
}

// Map NovaCore intent to NovaIntent (for the modal UI)
function mapIntent(coreIntent: string): NovaIntent {
  switch (coreIntent) {
    case 'addExpense':
    case 'addIncome':
    case 'createGoal':
      return coreIntent as NovaIntent
    case 'queryMovements':
      return 'monthlySummary'
    case 'knowledgeQuestion':
    case 'financialAdvice':
      return 'financialAdvice'
    default:
      return 'unknown'
  }
}

function mapData(data: Record<string, unknown> | null): DetectedData | null {
  if (!data) return null
  return {
    concepto: (data.concepto as string) ?? (data.titulo as string) ?? undefined,
    monto: data.monto as number | undefined,
    tipo: data.tipo as DetectedData['tipo'],
    categoria: data.categoria as string | undefined,
    cuenta_hint: data.cuenta_hint as string | null | undefined,
    titulo: data.titulo as string | undefined,
    ingresos: data.ingresos as number | undefined,
    gastos: data.gastos as number | undefined,
    ahorro: data.ahorro as number | undefined,
    periodo: data.periodo as string | undefined,
    escenario: data.escenario as string | undefined,
    resultado: data.resultado as string | undefined,
  }
}

export async function sendHybridMessage(
  messages: { role: string; content: string }[],
  data: AppData,
): Promise<HybridResult> {
  const userMessage = messages.filter((m) => m.role === 'user').pop()?.content || ''
  const online = checkConnectivity()

  // Always try Nova Core first for local processing
  const coreResult: NovaCoreResult = await processOffline(userMessage, data)

  // If Nova Core successfully matched an action intent, use it directly
  const actionIntents = ['addExpense', 'addIncome', 'createGoal']
  if (actionIntents.includes(coreResult.intent) && coreResult.data) {
    return {
      text: coreResult.text,
      intent: mapIntent(coreResult.intent),
      data: mapData(coreResult.data),
      source: 'nova-core',
    }
  }

  // For transfers or queries, use Nova Core response
  if (coreResult.intent === 'addTransfer' || coreResult.intent === 'queryBalance' || coreResult.intent === 'queryAccounts') {
    return {
      text: coreResult.text,
      intent: 'unknown',
      data: null,
      source: 'nova-core',
    }
  }

  // For knowledge/financial advice: try OpenRouter, fall back to Nova Core
  const usesOpenRouter = coreResult.intent === 'unknown' || coreResult.intent === 'knowledgeQuestion' || coreResult.intent === 'financialAdvice'

  if (usesOpenRouter && online) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const result = await sendChatMessage(messages, data.accounts)
      clearTimeout(timeoutId)

      isOnline = true
      return {
        ...result,
        source: 'openrouter',
      }
    } catch {
      // OpenRouter failed — fall back to Nova Core
      isOnline = false
    }
  } else if (!online) {
    isOnline = false
  }

  // Fallback to Nova Core
  if (coreResult.intent !== 'unknown') {
    return {
      text: coreResult.text,
      intent: mapIntent(coreResult.intent),
      data: mapData(coreResult.data),
      source: 'nova-core',
    }
  }

  // Last resort: Nova Core help message
  const fallback = await processOffline('', data)
  return {
    text: fallback.text,
    intent: 'unknown',
    data: null,
    source: 'nova-core',
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline = true })
  window.addEventListener('offline', () => { isOnline = false })
}
