import { NextRequest, NextResponse } from 'next/server'
import type { Account } from '@/lib/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
]

function buildAccountsContext(accounts: Account[]): string {
  if (!accounts || accounts.length === 0) return 'El usuario no tiene cuentas registradas.'
  return accounts
    .map((a) => `${a.name} (tipo: ${a.type}${a.bank ? `, banco: ${a.bank}` : ''})`)
    .join(', ')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada. Agrega OPENROUTER_API_KEY en .env.local' }, { status: 500 })
  }

  const { messages, accounts } = await req.json() as { messages: { role: string; content: string }[]; accounts: Account[] }

  const accountsContext = buildAccountsContext(accounts)

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
- **Personalización**: El usuario puede cambiar colores, tipografía, tamaño de fuente, bordes de tarjetas y visibilidad de secciones del dashboard.
- **Exportar datos**: Puede hacer respaldos (snapshots) de su información financiera.

## TU ROL
Debes ayudar al usuario CON CUALQUIER DUDA sobre la aplicación. Además eres un **MAESTRO FINANCIERO**.

## REGLAS GENERALES
- Responde siempre en español
- Sé breve y directo
- Usa viñetas cuando sea útil
- Nunca inventes movimientos ni datos financieros del usuario
- Si falta información, pide aclaración

## CUENTAS DEL USUARIO
${accountsContext}

## CATEGORÍAS DISPONIBLES
Usa EXACTAMENTE estas categorías para clasificar gastos e ingresos. No uses categorías que no estén en esta lista.

1. **Comida** — hamburguesa, tacos, restaurante, cocina, lonche, antojo, tortillas, pan, mercado de comida
2. **Café** — Starbucks, café de olla, americano, capuccino (solo si es bebida exclusivamente)
3. **Transporte** — gasolina, uber, taxi, camión, autopista, estacionamiento, llanta, pasaje
4. **Servicios** — internet, luz, agua, gas, teléfono, renta, predial, seguro, mantenimiento
5. **Compras** — ropa, zapatos, electrónico, mueble, herramienta, supermercado general, mandado
6. **Entretenimiento** — Netflix, Spotify, cine, videojuego, concierto, salida nocturna, streaming
7. **Salud** — médico, farmacia, pastillas, consulta, dentista, lentes, gym, seguro médico
8. **Educación** — curso, libro, colegiatura, escuela, taller, material didáctico
9. **Ingreso** — sueldo, nómina, pago recibido, transferencia recibida, venta, freelance, devolución
10. **General** — todo lo que no encaje claramente en las anteriores. Incluye: pagos a personas (Pago a Violeta), préstamos, cigarros, alcohol, consumibles, regalos, donaciones, multas

## FORMATO DE RESPUESTA
Cuando el usuario QUIERA EJECUTAR UNA ACCIÓN (registrar gasto, ingreso, crear meta, etc.):
Responde con un mensaje conversacional breve y natural, y al final del mensaje incluye UN BLOQUE JSON en una línea separada con esta estructura EXACTA (sin texto adicional después del JSON):

\`\`\`json
{
  "concepto": "nombre limpio del concepto — solo el QUÉ, sin montos, cuentas ni palabras como 'gasto' o 'compra'",
  "monto": número sin signo, 0 si no se menciona,
  "tipo": "gasto" | "ingreso" | "prestamo" | "me_prestaron",
  "categoria": "una de las 10 categorías exactas de la lista de arriba",
  "cuenta_hint": "texto que mencionó el usuario sobre la cuenta, exactamente como lo dijo, o null si no mencionó ninguna",
  "mensaje": "mensaje conversacional corto para el usuario confirmando la acción detectada"
}
\`\`\`

REGLAS DE EXTRACCIÓN:
- **concepto**: extrae SOLO el objeto/acción principal. Ej: "Cigarros", "Hamburguesa", "Gasolina", "Pago a Violeta", "Nómina". NUNCA incluyas montos, nombres de cuentas, ni palabras como "gasto" o "compra".
- **monto**: extrae el número. Si dice "150 pesos", monto es 150. Si no hay monto, devuelve 0.
- **tipo**: "gasto" para compras/gastos, "ingreso" para dinero que recibe, "prestamo" para dinero que prestó a alguien, "me_prestaron" para dinero que le prestaron.
- **categoria**: usa las 10 categorías exactas de arriba. Si no estás seguro, usa "General".
- **cuenta_hint**: si el usuario dice "débito", "crédito", "efectivo", "ahorro", o el nombre de un banco/cuenta (BBVA, Scotiabank, etc.), ponlo exactamente como lo dijo. Si no menciona ninguna cuenta, null.
- **mensaje**: respuesta breve y amigable confirmando lo que detectaste.

Si NO detectas una acción clara, responde SOLO con texto conversacional, sin bloque JSON.`
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
