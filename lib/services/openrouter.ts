export type NovaIntent = 'addExpense' | 'addIncome' | 'analyzeDebt' | 'createGoal' | 'financialAdvice' | 'unknown'

export type DetectedData = {
  categoria?: string
  monto?: number
  titulo?: string
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

      if (!data) data = {}
      if (catMatch) data.categoria = catMatch[1].trim()
      if (montoMatch) data.monto = parseInt(montoMatch[1].replace(/,/g, ''), 10)
      if (tituloMatch) data.titulo = tituloMatch[1].trim()
    }
    // Strip DETECTED blocks from displayed text
    text = text.replace(/\[DETECTED:\w+\]\n?/g, '').replace(/^(?:Categoría|Monto|Título):.*$/gm, '').trim()
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
    throw new Error('Error al contactar con Nova AI')
  }

  const json = await res.json()
  return parseIntent(json.text)
}
