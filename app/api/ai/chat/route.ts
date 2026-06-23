import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'qwen/qwen3-next-80b-a3b-instruct:free'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }

  const systemPrompt = {
    role: 'system',
    content: `Eres Nova AI, un asesor financiero integrado dentro de una aplicación llamada Nova CRM.

Debes ayudar al usuario a:
- Registrar gastos
- Registrar ingresos
- Analizar cuentas
- Analizar deudas
- Recomendar pagos
- Recomendar ahorro
- Detectar gastos innecesarios

Responde siempre en español.
Sé breve.
Usa viñetas cuando sea útil.
Nunca inventes movimientos.
Si falta información pide aclaración.

Cuando detectes que el usuario quiere REGISTRAR UN GASTO, responde con esta estructura exacta al final de tu mensaje:
[DETECTED:addExpense]
Categoría: <categoría>
Monto: <monto>
Título: <título>

Cuando detectes que el usuario quiere REGISTRAR UN INGRESO:
[DETECTED:addIncome]
Monto: <monto>
Título: <título>

Cuando detectes que el usuario quiere ANALIZAR DEUDAS:
[DETECTED:analyzeDebt]

Cuando detectes que el usuario quiere CREAR UNA META:
[DETECTED:createGoal]
Título: <título>
Monto: <monto>

Si no detectas ninguna intención clara solo responde el mensaje sin bloques DETECTED.`
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nova-finanzas.vercel.app',
        'X-Title': 'Nova Finanzas AI',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      return NextResponse.json({ error: 'AI service error' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ text: data.choices[0].message.content })
  } catch (error) {
    console.error('OpenRouter request failed:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
