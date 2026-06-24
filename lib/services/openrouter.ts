export type NovaIntent = 'addExpense' | 'addIncome' | 'analyzeDebt' | 'createGoal' | 'financialAdvice' | 'appQuestion' | 'monthlySummary' | 'subscriptions' | 'simulation' | 'unknown'

export type DetectedData = {
  categoria?: string
  monto?: number
  titulo?: string
  ingresos?: number
  gastos?: number
  ahorro?: number
  periodo?: string
  items?: { nombre: string; monto: number; periodicidad?: string }[]
  escenario?: string
  resultado?: string
}

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AiResponse = {
  text: string
  intent: NovaIntent
  data: DetectedData | null
}

function parseIntent(text: string): { text: string; intent: NovaIntent; data: DetectedData | null } {
  let data: DetectedData | null = null
  let intent: NovaIntent = 'unknown'

  const intentMatch = text.match(/\[DETECTED:(\w+)\]/)
  if (intentMatch) {
    intent = intentMatch[1] as NovaIntent
    const lines = text.split('\n')
    for (const line of lines) {
      const catMatch = line.match(/^Categoría:\s*(.+)$/i)
      const montoMatch = line.match(/^Monto:\s*\$?([\d,]+)/i)
      const tituloMatch = line.match(/^Título:\s*(.+)$/i)
      const ingresosMatch = line.match(/^Ingresos:\s*\$?([\d,]+)/i)
      const gastosMatch = line.match(/^Gastos:\s*\$?([\d,]+)/i)
      const ahorroMatch = line.match(/^Ahorro:\s*\$?([\d,]+)/i)
      const periodoMatch = line.match(/^Periodo:\s*(.+)$/i)
      const escenarioMatch = line.match(/^Escenario:\s*(.+)$/i)
      const resultadoMatch = line.match(/^Resultado:\s*(.+)$/i)

      if (!data) data = {}
      if (catMatch) data.categoria = catMatch[1].trim()
      if (montoMatch) data.monto = parseInt(montoMatch[1].replace(/,/g, ''), 10)
      if (tituloMatch) data.titulo = tituloMatch[1].trim()
      if (ingresosMatch) data.ingresos = parseInt(ingresosMatch[1].replace(/,/g, ''), 10)
      if (gastosMatch) data.gastos = parseInt(gastosMatch[1].replace(/,/g, ''), 10)
      if (ahorroMatch) data.ahorro = parseInt(ahorroMatch[1].replace(/,/g, ''), 10)
      if (periodoMatch) data.periodo = periodoMatch[1].trim()
      if (escenarioMatch) data.escenario = escenarioMatch[1].trim()
      if (resultadoMatch) data.resultado = resultadoMatch[1].trim()
    }
    // Strip DETECTED blocks from displayed text
    text = text.replace(/\[DETECTED:\w+\]\n?/g, '').replace(/^(?:Categoría|Monto|Título|Ingresos|Gastos|Ahorro|Periodo|Escenario|Resultado):.*$/gm, '').trim()
  }

  return { text, intent, data }
}

export async function sendChatMessage(messages: { role: string; content: string }[]): Promise<AiResponse> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Error al contactar con Nova AI')
  }

  const json = await res.json()
  return parseIntent(json.text)
}
