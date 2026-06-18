# Plan: Recordatorios Recurrentes + Avisos Predictivos

## Estado Actual

| Aspecto | Detalle |
|---------|---------|
| `Reminder` type | Ya tiene `recurring: 'none' \| 'weekly' \| 'monthly' \| 'yearly'` + `dueDate` |
| Modal (`reminder-modal.tsx`) | Ya permite elegir recurrencia vía `ChipSelect` |
| `RemindersModule` (`insights-health.tsx`) | Muestra lista pero **ignora** `recurring` — usa `relativeDue(dueDate)` siempre contra la fecha fija |
| `relativeDue()` (`lib/format.ts`) | Solo calcula distancia contra una fecha ISO, sin lógica de recurrencia |
| Home (`app/page.tsx`) | No muestra ningún bloque de recordatorios |
| Ingreso recurrente | **No existe** en el modelo — no hay campo `type`, ni cuenta de ingresos, ni concepto de nómina recurrente |

## Cambios Propuestos

### 1. `lib/types.ts` — Sin cambios

El modelo actual **ya es suficiente**. No se necesitan campos nuevos:

```
Reminder {
  dueDate: string    // Fijo para 'none'; es la fecha ancla para recurrentes
  recurring: 'none' | 'weekly' | 'monthly' | 'yearly'
  ...
}
```

Para monthly se usa `dueDate.getDate()` como "día del mes" (ej. día 5).
Para yearly se usa `dueDate.getMonth() + dueDate.getDate()` como "día del año".
Para weekly se usa `dueDate.getDay()` como "día de la semana".
Para `'none'`, `dueDate` se usa tal cual.

### 2. `lib/calendar.ts` (nuevo) — Cálculo de próximo vencimiento

Función principal:

```
nextDueDate(reminder: Reminder): Date
```

- Si `recurring === 'none'` → devuelve `new Date(dueDate)` (comportamiento actual).
- Si `recurring === 'monthly'` → extrae el día del mes desde `dueDate`. Compara con hoy. Si el día ya pasó este mes, devuelve el mismo día del mes siguiente. Si no, devuelve el día de este mes. Maneja bordes (31 → 30/28).
- Si `recurring === 'yearly'` → extrae mes+día. Si ya pasó este año, mismo mes+día del año siguiente.
- Si `recurring === 'weekly'` → extrae día de la semana. Busca el próximo día igual a partir de mañana.

Función auxiliar:

```
daysUntil(date: Date): number
```

Días enteros desde hoy hasta `date` (negativo si ya pasó).

### 3. `lib/calendar.ts` — Generación de mensajes predictivos

```
predictiveMessages(reminders: Reminder[]): string[]
```

Para cada reminder, calcula `nextDueDate`, obtiene `daysUntil`:
- `daysUntil === 0` → `"Hoy vence [title] ($[amount])"`
- `1 <= daysUntil <= 5` → `"[name], en X días vence [title] ($[amount])"`
- Se ignora el `[name]` si no hay un nombre de usuario disponible (se puede omitir el prefijo).
- Los mensajes se ordenan por urgencia (menos días primero).

### 4. `lib/calendar.ts` — Avisos urgentes para Home

```
urgentReminders(reminders: Reminder[]): Reminder[]
```

Filtra reminders donde `nextDueDate` está entre hoy y los próximos 5 días inclusive.

### 5. `components/reminder-modal.tsx` — Ajuste mínimo

Sin cambios estructurales. El `ChipSelect` de recurrencia y `dueDate` nativo de HTML (`type="date"`) ya generan los datos correctos. Solo se podría considerar:
- Al cambiar a `'monthly'` o `'yearly'`, autocompletar el `dueDate` a algún día razonable (ej. hoy) y ocultar el año si es yearly al mostrar.

**No reescribir, solo ajustar UI mínimamente.**

### 6. `components/insights-health.tsx` — RemindersModule extendido

Donde hoy usa `relativeDue(r.dueDate)`:

```diff
- const dueStr = relativeDue(r.dueDate)
+ const dueStr = displayDue(r)
```

`displayDue()` usa `nextDueDate` + `daysUntil` para mostrar:
- "Vence en 3 días"
- "Vence mañana"
- "Vence hoy"
- "Venció hace 2 días" (para `'none'`)
- Y agrega el patrón: "Cada día 5 · Vence en 3 días" para recurrentes

Además:
- Se agrega una sección de **alertas predictivas** al inicio del módulo: los mensajes generados por `predictiveMessages()` se muestran como tarjetas destacadas antes de la lista.
- El `recurring` aparece visible (ej. "Mensual · Cada día 15").

No se toca la lógica de clic ni los estilos existentes — solo se extiende el render.

### 7. `app/page.tsx` — Nuevo bloque de avisos urgentes

Entre `SpendingChart` y `QuickActions`, se inserta un bloque condicional:

```tsx
{urgent.length > 0 && (
  <section className="...">
    <SectionHeader title="Avisos" />
    {urgent.map((r) => (
      <div>... formato "[name], en X días vence [title] ($amount)"</div>
    ))}
  </section>
)}
```

- Usa `nextDueDate` + `daysUntil` desde `lib/calendar.ts`.
- Si no hay ningún reminder con vencimiento ≤ 5 días, **no se renderiza nada** (ni contenedor, ni texto).
- Los avisos se muestran en orden ascendente de días restantes.
- Al hacer clic en un aviso, abre el modal `kind: 'reminder'` en modo edición igual que en Insights.
- Si el usuario no ha registrado su nombre aún, se omite el prefijo "[Nombre], ".

### 8. Ingreso recurrente (opcional, fase 2)

Actualmente no existe el concepto en el modelo. Para soportar "El sábado recibes nómina" se necesitaría:

| Opción | Cambio |
|--------|--------|
| Campo `type: 'income' \| 'expense'` en `Reminder` | +1 campo, migración simple |
| O `amount` puede ser positivo (ingreso) o negativo (gasto) | Ya se puede, pero no hay validación ni display distinto |

**Propuesta:** Agregar `type: 'payment' | 'income'` como default `'payment'`. El modal gana un toggle "Es ingreso". Los mensajes predictivos cambian a "El sábado 20 recibes nómina ($X)" cuando `type === 'income'` y faltan 1-5 días.

Esto queda para una segunda iteración si se desea. No se incluye en esta implementación inicial.

## Archivos a Modificar/Crear

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `lib/calendar.ts` | **Crear** | `nextDueDate()`, `daysUntil()`, `predictiveMessages()`, `urgentReminders()` |
| `components/insights-health.tsx` | Modificar | Extender `RemindersModule`: mostrar recurrencia, usar `nextDueDate`, agregar alertas predictivas |
| `app/page.tsx` | Modificar | Insertar bloque condicional de avisos urgentes |
| `components/reminder-modal.tsx` | Modificar leve | UI tweak menor (mostrar/ocultar fecha según recurrencia) |
| `lib/types.ts` | **Sin cambios** | El modelo actual ya soporta la funcionalidad |
| `lib/format.ts` | Opcional | `relativeDue()` puede quedar como helper legacy; no se modifica |

## Backward Compatibility

- Los reminders existentes con `recurring: 'none'` siguen funcionando exactamente igual: `nextDueDate` devuelve `dueDate` literal.
- Los que tengan `recurring: 'monthly'` (que antes se mostraban como fecha fija y confundían) ahora calcularán correctamente el próximo vencimiento.
- No se eliminan ni modifican campos del tipo `Reminder`.
- No se toca ningún cálculo financiero existente.

## Lo que NO se toca

- Reset Financiero (storage-snapshots, reset-financial-modal, historial)
- Cuentas personalizables (account-modal, catalog.ts, balance-detail-modal, dashboard-header, insights-health)
- Asistente IA (ai-assistant, voice commands)
- Cálculos financieros (availableBalance, totalBalance, isAccountLiability)
- Store salvo añadir import de calendar.ts si es necesario

## Flujo de Datos

```
reminder-modal.tsx           lib/calendar.ts              RemindersModule / Home
     │                            │                             │
     │  guarda dueDate +          │                             │
     │  recurring en store        │                             │
     ▼                            ▼                             ▼
  Store ──→ data.reminders ──→ nextDueDate(r) ──→ daysUntil() ──→ display
                                          │
                                          ├── predictiveMessages() → Insights
                                          └── urgentReminders() → Home
```
