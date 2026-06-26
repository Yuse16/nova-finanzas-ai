import type { KnowledgeEntry } from './knowledge'

export const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    title: 'Finanzas Personales',
    slug: 'finanzas-personales',
    keywords: ['finanzas', 'personales', 'basico', 'fundamentos', 'educacion'],
    category: 'finanzas',
    content: `# Finanzas Personales

## ¿Qué son las finanzas personales?
Son la gestión de tus ingresos, gastos, ahorros e inversiones. El objetivo es tomar control de tu dinero para lograr tus metas.

## Principios básicos
1. **Gasta menos de lo que ganas** — La regla más importante.
2. **Ahorra primero** — Antes de gastar, separa una parte para ahorro.
3. **Ten un fondo de emergencia** — 3 a 6 meses de gastos.
4. **Evita deudas innecesarias** — Especialmente las de alto interés.
5. **Invierte para el largo plazo** — El interés compuesto es tu mejor aliado.

## El ciclo del dinero
Ingreso → Presupuesto → Gastos → Ahorro → Inversión`,
  },
  {
    title: 'Presupuestos',
    slug: 'presupuestos',
    keywords: ['presupuesto', '50/30/20', 'gastos', 'ahorro', 'plan', 'mensual'],
    category: 'presupuesto',
    content: `# Presupuestos

## ¿Qué es un presupuesto?
Un plan que te dice a dónde va tu dinero cada mes.

## Regla 50/30/20
La forma más sencilla de presupuestar:

- **50% — Necesidades**: Renta, comida, transporte, servicios, salud.
- **30% — Deseos**: Entretenimiento, restaurantes, viajes, compras.
- **20% — Ahorro e inversión**: Fondo de emergencia, metas, inversiones.

## Cómo crear un presupuesto en Nova Finanzas
1. Revisa tus gastos del mes pasado en la sección "Movimientos".
2. Clasifica cada gasto en Necesidad, Deseo o Ahorro.
3. Ajusta según la regla 50/30/20.
4. Establece metas de ahorro y dales seguimiento.

## Consejos
- Sé realista con tus cifras.
- Revisa tu presupuesto cada semana.
- Ajusta cuando sea necesario.`,
  },
  {
    title: 'Ahorro',
    slug: 'ahorro',
    keywords: ['ahorro', 'ahorrar', 'fondo', 'emergencia', 'meta', 'estrategia'],
    category: 'ahorro',
    content: `# Ahorro

## ¿Por qué ahorrar?
El ahorro es la base de la salud financiera. Te da seguridad, libertad y la capacidad de aprovechar oportunidades.

## Fondo de emergencia
Tu primera meta de ahorro: **3 a 6 meses de tus gastos mensuales**.

1. Calcula tus gastos mensuales.
2. Multiplica por 3 o 6.
3. Ahorra esa cantidad antes de invertir o hacer grandes gastos.

## Estrategias de ahorro

### Págate a ti mismo primero
Apenas recibes tu ingreso, separa automáticamente un porcentaje para ahorro. Así no "gastas lo que sobra".

### Ahorro automatizado
Configura transferencias automáticas el día que recibes tu ingreso.

### La regla del café
Pequeños gastos diarios suman mucho al mes. Reduce 2-3 gastos hormiga y ahorra esa diferencia.

## Metas SMART para ahorro
- **S** específica (sé claro en qué ahorras)
- **M** medible (define una cantidad exacta)
- **A** alcanzable (realista según tus ingresos)
- **R** relevante (que realmente importe para ti)
- **T** con plazo (fija una fecha límite)`,
  },
  {
    title: 'Deudas',
    slug: 'deudas',
    keywords: ['deuda', 'deudas', 'credito', 'creditos', 'prestamo', 'interes', 'pagar'],
    category: 'deudas',
    content: `# Deudas

## Tipos de deuda

### Deuda buena
- Crédito hipotecario (inviertes en un activo).
- Crédito educativo (inviertes en tu futuro).
- Préstamo para negocio (genera ingresos).

### Deuda mala
- Tarjetas de crédito en pagos mínimos.
- Préstamos personales con intereses altos.
- Compras a plazos de cosas que se deprecian.

## Estrategias para pagar deudas

### Método avalancha (recomendado)
Paga primero la deuda con el interés más alto. Ahorras más dinero a largo plazo.

1. Ordena tus deudas de mayor a menor interés.
2. Haz el pago mínimo en todas, excepto la primera.
3. Destina todo lo extra a la primera deuda.
4. Cuando termines, pasa a la siguiente.

### Método bola de nieve
Paga primero la deuda más pequeña. Te motiva ver resultados rápido.

1. Ordena tus deudas de menor a mayor saldo.
2. Haz pagos mínimos en todas menos la primera.
3. Liquida la más pequeña y pasa a la siguiente.

## Consejos
- No hagas solo el pago mínimo de tus tarjetas.
- Si puedes, consolida deudas a una tasa menor.
- Evita nuevas deudas mientras pagas las actuales.`,
  },
  {
    title: 'Crédito',
    slug: 'credito',
    keywords: ['credito', 'credito', 'tarjeta', 'buro', 'historial', 'score', 'buró'],
    category: 'credito',
    content: `# Crédito

## ¿Qué es el crédito?
Es la capacidad de pedir dinero prestado con el compromiso de devolverlo, generalmente con intereses.

## Tipos de crédito
- **Tarjeta de crédito**: Línea revolvente. Pagas según uses.
- **Crédito hipotecario**: Para comprar casa. Plazo largo (15-30 años).
- **Crédito automotriz**: Para comprar auto.
- **Préstamo personal**: Sin destino específico.
- **Crédito de nómina**: Descontado directo de tu salario.

## Buró de crédito
Es un registro de tu historial crediticio en México. Un buen historial te da acceso a mejores tasas.

### Cómo mantener buen historial
- Paga a tiempo siempre.
- Usa máximo 30% de tu línea de crédito.
- No abras muchas tarjetas en poco tiempo.
- Revisa tu reporte al menos una vez al año.

### Tu puntaje
- 680+ Bueno
- 720+ Excelente
- Mantener tu historial es clave.`,
  },
  {
    title: 'Categorías de Gastos',
    slug: 'categorias',
    keywords: ['categoria', 'categorias', 'clasificacion', 'tipo', 'gasto', 'ingreso'],
    category: 'categorias',
    content: `# Categorías

## Categorías de gasto disponibles en Nova Finanzas
- **Comida**: Supermercado, restaurantes, café, bebidas.
- **Transporte**: Uber, gasolina, metro, estacionamiento.
- **Entretenimiento**: Cine, Netflix, Spotify, juegos.
- **Servicios**: Luz, agua, internet, teléfono, renta.
- **Salud**: Médico, farmacia, seguro, dentista.
- **Educación**: Cursos, libros, colegiaturas.
- **Ropa**: Vestimenta, zapatos, accesorios.
- **Hogar**: Muebles, reparaciones, mantenimiento.
- **Otros**: Lo que no encaje arriba.

## Consejo
Clasifica bien tus gastos para que el dashboard te muestre estadísticas precisas. Puedes filtrar por categoría en la sección de Movimientos.`,
  },
  {
    title: 'Preguntas Frecuentes',
    slug: 'preguntas-frecuentes',
    keywords: ['pregunta', 'frecuente', 'faq', 'duda', 'ayuda', 'como', 'funciona'],
    category: 'faq',
    content: `# Preguntas Frecuentes

## ¿Cómo registro un gasto?
En la pantalla principal, toca el botón "+" y selecciona "Gasto". Llena el monto, categoría y cuenta.

## ¿Cómo registro un ingreso?
Toca el botón "+" y selecciona "Ingreso". Pon el monto y la cuenta donde llega el dinero.

## ¿Cómo creo una meta de ahorro?
Ve a la sección Metas desde el menú inferior, toca "Nueva meta" y pon el nombre, monto objetivo y fecha.

## ¿Para qué sirve Nova AI?
Nova AI es tu asistente financiero. Puedes hablarle para:
- Registrar gastos e ingresos por voz
- Recibir consejos financieros
- Analizar tus finanzas
- Responder preguntas sobre la app

## ¿Cómo activo el modo oscuro?
Ve a Ajustes > Personalización > Apariencia y selecciona "Oscuro" o "Sistema".

## ¿Mis datos están seguros?
Sí, tus datos se guardan localmente en tu navegador y en Supabase (nube). No compartimos tu información.`,
  },
  {
    title: 'Consejos Financieros',
    slug: 'consejos',
    keywords: ['consejo', 'tip', 'recomendacion', 'estrategia', 'mejorar', 'financiero'],
    category: 'consejos',
    content: `# Consejos Financieros

## 1. Conoce tus gastos
Usa Nova Finanzas para registrar cada gasto por una semana. Te sorprenderá ver a dónde se va tu dinero.

## 2. Aplica la regla de los 3 días
Antes de comprar algo caro, espera 3 días. Si sigues queriéndolo después de 3 días, considéralo.

## 3. Automatiza tu ahorro
Configura una transferencia automática el día que recibes tu ingreso. Ahorrar se vuelve un hábito sin esfuerzo.

## 4. Revisa suscripciones
Cada mes revisa qué servicios ya no usas. Una suscripción de $10/mes que no usas son $120 al año perdidos.

## 5. Fondo de emergencia primero
No empieces a invertir hasta tener 3-6 meses de gastos ahorrados. Esto te protege de imprevistos.

## 6. Invierte desde joven
El interés compuesto es poderoso. $100/mes invertidos a 8% anual durante 30 años son más de $140,000.

## 7. No uses la tarjeta para financiar tu estilo de vida
Si no puedes pagarlo este mes, probablemente no deberías comprarlo.

## 8. Compara antes de comprar
Seguros, créditos, servicios. Siempre compara al menos 3 opciones.`,
  },
  {
    title: 'Metas Financieras',
    slug: 'metas',
    keywords: ['meta', 'objetivo', 'ahorro', 'smart', 'plan', 'cumplir'],
    category: 'metas',
    content: `# Metas Financieras

## ¿Qué es una meta financiera?
Es un objetivo económico que quieres lograr en un plazo específico.

## Tipos de metas

### Corto plazo (menos de 1 año)
- Fondo de emergencia.
- Viaje.
- Curso o certificación.
- Pago de deuda pequeña.

### Mediano plazo (1 a 5 años)
- Enganche de casa.
- Auto.
- Iniciar un negocio.
- Maestría.

### Largo plazo (más de 5 años)
- Jubilación.
- Casa propia (liquidada).
- Libertad financiera.

## Cómo definir metas SMART en Nova Finanzas
1. Abre la sección Metas.
2. Toca "Nueva meta".
3. Define: nombre, monto objetivo, fecha límite.
4. Dale seguimiento semanal.
5. Ajusta si es necesario.

## Consejos
- Empieza con metas pequeñas que puedas cumplir en 1-3 meses.
- Cuando cumplas una meta, celebra tu logro.
- Revisa tu progreso cada semana en el dashboard.`,
  },
]
