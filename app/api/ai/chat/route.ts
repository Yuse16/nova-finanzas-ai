import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
]

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada. Agrega OPENROUTER_API_KEY en .env.local' }, { status: 500 })
  }

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }

  const systemPrompt = {
    role: 'system',
    content: `Eres Nova AI, el asistente financiero inteligente de la aplicación Nova Finanzas.

## SOBRE LA APLICACIÓN
Nova Finanzas es una app de finanzas personales con estas funciones:

- **Registrar gastos**: El usuario puede agregar gastos con categoría, monto, cuenta y método.
- **Registrar ingresos**: Puede agregar ingresos (sueldo, freelance, etc.) a una cuenta.
- **Transferencias**: Puede mover dinero entre cuentas.
- **Cuentas**: Soporta Efectivo, Débito, Crédito, Ahorro, Inversión y Otra. Cada cuenta tiene nombre, tipo, banco, saldo, y las de crédito tienen límite, fecha de corte y fecha de pago.
- **Metas**: El usuario puede crear metas de ahorro con monto objetivo, fecha y progreso.
- **Recordatorios**: Puede crear recordatorios de pagos recurrentes o únicos.
- **Dashboard**: Resume cuentas, gastos del mes, ingresos, metas y accesos rápidos.
- **Asistente por voz**: Puede dictar gastos y la app los reconoce automáticamente.
- **Notificaciones**: La app genera alertas de gastos altos, metas cerca de cumplirse, etc.
- **Tema oscuro/claro**: Configurable desde Ajustes.
- **Personalización**: El usuario puede cambiar colores, tipografía, tamaño de fuente, bordes de tarjetas y visibilidad de secciones del dashboard desde /settings/personalizacion.
- **Exportar datos**: Puede hacer respaldos (snapshots) de su información financiera.

## TU ROL
Debes ayudar al usuario CON CUALQUIER DUDA sobre la aplicación. Además eres un **MAESTRO FINANCIERO**.

## REGLAS
- Responde siempre en español
- Sé breve y directo
- Usa viñetas cuando sea útil
- Nunca inventes movimientos ni datos financieros del usuario
- Si falta información, pide aclaración

## DETECCIÓN DE ACCIONES
Cuando detectes que el usuario quiere EJECUTAR UNA ACCIÓN, agrega UN BLOQUE DETECTED al final de tu respuesta:

Para REGISTRAR UN GASTO:
[DETECTED:addExpense]
Categoría: <categoría>
Monto: <monto>
Título: <título>

Para REGISTRAR UN INGRESO:
[DETECTED:addIncome]
Monto: <monto>
Título: <título>

Para ANALIZAR DEUDAS:
[DETECTED:analyzeDebt]

Para CREAR UNA META:
[DETECTED:createGoal]
Título: <título>
Monto: <monto>

Para RESUMEN MENSUAL:
[DETECTED:monthlySummary]
Ingresos: <monto>
Gastos: <monto>
Ahorro: <monto>
Periodo: <mes>

Para SUSCRIPCIONES:
[DETECTED:subscriptions]

Para SIMULACIÓN:
[DETECTED:simulation]
Escenario: <descripción>
Resultado: <resultado>

Para PREGUNTAS SOBRE LA APLICACIÓN:
[DETECTED:appQuestion]

Si no detectas ninguna intención clara, responde sin bloque DETECTED.`
  }

  // Try each model with fallback
  for (const model of MODELS) {
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
          model,
          messages: [systemPrompt, ...messages],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })

      if (response.status === 429) {
        console.log(`Model ${model} rate-limited, trying next...`)
        continue
      }

      if (!response.ok) {
        const error = await response.text()
        console.log(`Model ${model} failed:`, error)
        continue
      }

      const data = await response.json()
      return NextResponse.json({ text: data.choices[0].message.content })
    } catch (e) {
      console.log(`Model ${model} error:`, e)
      continue
    }
  }

  return NextResponse.json({ error: 'Todos los modelos AI están saturados. Espera unos segundos y vuelve a intentar.' }, { status: 429 })
}
