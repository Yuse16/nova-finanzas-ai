export type NovaIntent = 'addExpense' | 'addIncome' | 'analyzeDebt' | 'createGoal' | 'financialAdvice' | 'appQuestion' | 'monthlySummary' | 'subscriptions' | 'simulation' | 'unknown'

export type DetectedData = {
  concepto?: string
  monto?: number
  tipo?: 'gasto' | 'ingreso' | 'prestamo' | 'me_prestaron'
  categoria?: string
  cuenta_hint?: string | null
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

  // Try to find a JSON block between ```json and ```
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  let jsonStr: string | null = null

  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1].trim()
  } else {
    // Fallback: try to find a standalone JSON object at the end of the text
    const jsonObjMatch = text.match(/\{[\s\S]*"mensaje"[\s\S]*\}/)
    if (jsonObjMatch) {
      jsonStr = jsonObjMatch[0]
    }
  }

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr)
      data = {}

      if (parsed.concepto) data.concepto = parsed.concepto
      if (parsed.monto !== undefined) data.monto = parsed.monto
      if (parsed.tipo) data.tipo = parsed.tipo
      if (parsed.categoria) data.categoria = parsed.categoria
      if (parsed.cuenta_hint !== undefined) data.cuenta_hint = parsed.cuenta_hint

      // Determine intent based on tipo
      if (parsed.tipo === 'gasto' || parsed.tipo === 'prestamo') {
        intent = 'addExpense'
      } else if (parsed.tipo === 'ingreso' || parsed.tipo === 'me_prestaron') {
        intent = 'addIncome'
      }

      // Use mensaje as the display text, strip the JSON block
      if (parsed.mensaje) {
        text = parsed.mensaje
      } else {
        text = text.replace(/```json[\s\S]*?```/g, '').trim()
      }
    } catch {
      // JSON parse failed, fall through to clean up
    }
  }

  // Fallback: strip any remaining JSON blocks from display text
  text = text.replace(/```json[\s\S]*?```/g, '').trim()

  return { text, intent, data }
}

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  accounts?: { id: string; name: string; type: string; bank?: string | null }[],
): Promise<AiResponse> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, accounts }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Error al contactar con Nova AI')
  }

  const json = await res.json()
  return parseIntent(json.text)
}
