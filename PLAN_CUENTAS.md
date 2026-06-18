# PLAN_CUENTAS.md — Cuentas Personalizables

## Diagnóstico previo

Hay una inconsistencia actual en cómo se determina si una cuenta es deuda:

| Componente | Método | Correcto para personalizadas? |
|---|---|---|
| `dashboard-header.tsx` | `!getAccountTypeMeta(a.type).liability` | **No** — no usa `isLiability` del Account |
| `balance-detail-modal.tsx` | `getAccountTypeMeta(a.type).liability` | **No** — igual |
| `account-modal.tsx` (save) | `meta.liability ? -balanceNum : balanceNum` | **No** — igual |
| `insights-health.tsx` (SmartInsights) | `a.type !== 'credito' && a.type !== 'deudas'` | **No** — hardcoded strings, no usa ni el meta |
| `insights-health.tsx` (HealthScore) | `a.type !== 'credito' && a.type !== 'deudas'` | **No** — igual |

Ningún componente actual soportaría una cuenta personalizada marcada como deuda.

---

## Cambios en types.ts

### 1. Agregar `'personalizada'` a AccountType

```ts
export type AccountType =
  | 'efectivo'
  | 'debito'
  | 'credito'
  | 'ahorro'
  | 'inversion'
  | 'deudas'
  | 'personalizada'
```

### 2. Agregar campo `isLiability` opcional en Account

```ts
export type Account = {
  id: string
  name: string
  type: AccountType
  balance: number
  icon: string
  color: string
  isLiability?: boolean   // ← NUEVO: obligatorio para type='personalizada'
  createdAt: number
  updatedAt: number
}
```

Es `isLiability?: boolean` (opcional) para compatibilidad con cuentas existentes guardadas en IndexedDB sin este campo. Para los 6 tipos fijos, `isLiability` es undefined y se resuelve desde el catálogo. Para `personalizada`, la UI lo exige y siempre está presente.

---

## Cambios en catalog.ts

Agregar entrada para `personalizada` en `accountTypes`:

```ts
{
  type: 'personalizada',
  label: 'Personalizada',
  caption: 'Cuenta personalizada',
  icon: 'wallet',
  color: 'oklch(0.7 0.16 255)',  // primary blue
  liability: false,               // default; override via isLiability
  method: 'Otro',
}
```

Esto permite que `getAccountTypeMeta('personalizada')` no falle (antes caía al fallback `accountTypes[0]` = efectivo).

---

## Nueva función helper: `isAccountLiability`

Crear en `lib/catalog.ts`:

```ts
export function isAccountLiability(account: Account): boolean {
  return account.isLiability ?? getAccountTypeMeta(account.type).liability
}
```

Usar esta función en TODOS los componentes que clasifican cuentas, en lugar de:
- `getAccountTypeMeta(a.type).liability` (no ve el isLiability de personalizada)
- `a.type === 'credito' || a.type === 'deudas'` (hardcoded, no escala)

---

## Archivos de cálculo que se actualizan

### 1. `components/dashboard-header.tsx` — Línea 17-19

```ts
// ANTES:
.filter((a) => !getAccountTypeMeta(a.type).liability)

// DESPUÉS:
.filter((a) => !isAccountLiability(a))
```

### 2. `components/balance-detail-modal.tsx` — Líneas 10-14

```ts
// ANTES:
.filter((a) => !getAccountTypeMeta(a.type).liability)
.filter((a) => getAccountTypeMeta(a.type).liability)

// DESPUÉS:
.filter((a) => !isAccountLiability(a))
.filter((a) => isAccountLiability(a))
```

### 3. `components/insights-health.tsx` — 2 componentes, 4 filtros

**SmartInsights** (líneas 43-51):
```ts
// ANTES:
.filter((a) => a.type !== 'credito' && a.type !== 'deudas')
.filter((a) => a.type === 'credito' || a.type === 'deudas')

// DESPUÉS:
.filter((a) => !isAccountLiability(a))
.filter((a) => isAccountLiability(a))
```

**HealthScore** (líneas 138-146) — mismo cambio exacto.

### 4. `components/account-modal.tsx` — save() línea 53

```ts
// ANTES:
const meta = getAccountTypeMeta(type)
const storedBalance = meta.liability ? -balanceNum : balanceNum

// DESPUÉS:
const isLiability = type === 'personalizada'
  ? localIsLiability    // ← del toggle en UI
  : getAccountTypeMeta(type).liability
const storedBalance = isLiability ? -balanceNum : balanceNum
```

---

## Cambios en AccountModal

### Estructura actual del modal

```
┌─ GlassSheet ──────────────────────────┐
│  Nombre de la Cuenta [input]          │
│  Tipo de Cuenta [ChipSelect: 6 tipos] │
│  Saldo [input]                        │
│  [Crear Cuenta]                       │
└───────────────────────────────────────┘
```

### Estructura modificada

Cuando el tipo seleccionado NO es `personalizada` → exactamente igual que hoy (sin cambios).

Cuando el tipo seleccionado es `personalizada` → se expanden controles adicionales:

```
┌─ GlassSheet ──────────────────────────────────────┐
│  Nombre de la Cuenta [input]                       │
│  Tipo de Cuenta [ChipSelect: 6 tipos + "Otro ⚡"] │
│                                                     │
│  ══ cuando type === 'personalizada' ══              │
│  Icono [grid 4×N de íconos seleccionables]         │
│  Color [grid de 10 círculos de color]              │
│  ¿Es deuda o disponible?                           │
│  [ Dinero disponible ] [ Deuda ]  ← toggle sí/no   │
│  ═══════════════════════════════════════            │
│                                                     │
│  Saldo Inicial [input]                              │
│  [Crear Cuenta]                                     │
└─────────────────────────────────────────────────────┘
```

### Detalle del selector de íconos

Usar los siguientes íconos del registry existente en `lib/icons.ts` (34 disponibles). Propongo estos 18 como set fijo:

| Icon key | Componente lucide |
|---|---|
| `wallet` | Wallet |
| `banknote` | Banknote |
| `piggy-bank` | PiggyBank |
| `landmark` | Landmark |
| `building` | Building2 |
| `briefcase` | Briefcase |
| `home` | Home |
| `car` | Car |
| `plane` | Plane |
| `heart` | Heart |
| `gift` | Gift |
| `coffee` | Coffee |
| `target` | Target |
| `smartphone` | Smartphone |
| `credit-card` | CreditCard |
| `trending-up` | TrendingUp |
| `hand-coins` | HandCoins |
| `dollar` | CircleDollarSign |

Se renderizan como grid de botones `glass-subtle` con el icono dentro. El seleccionado se marca con un ring/borde.

### Detalle del selector de color

10 colores OKLCH del ecosistema existente:

```
1.  oklch(0.72 0.16 150)   # verde (positive)
2.  oklch(0.72 0.15 235)   # azul (debito)
3.  oklch(0.68 0.18 295)   # morado (credito)
4.  oklch(0.78 0.16 70)    # ámbar (ahorro)
5.  oklch(0.74 0.15 175)   # teal (inversion)
6.  oklch(0.68 0.19 25)    # rojo (deudas)
7.  oklch(0.82 0.16 90)    # lima (asistente IA)
8.  oklch(0.7 0.18 290)    # chart-3
9.  oklch(0.7 0.16 255)    # primary blue
10. oklch(0.82 0.17 155)   # positive green (más brillante)
```

Se renderizan como círculos de 32×32px. El seleccionado muestra un borde blanco + check.

### Detalle del toggle deuda/disponible

Dos botones lado a lado, ocupando el ancho completo:

```
┌─────────────────────┐ ┌─────────────────────┐
│  Dinero disponible  │ │       Deuda         │
│   (isLiability: f)  │ │   (isLiability: t)  │
└─────────────────────┘ └─────────────────────┘
   verde/activo             rojo/activo
```

- Siempre uno seleccionado (por defecto: disponible)
- No se puede guardar sin que esté definido (validación en save)
- El estilo visual cambia según activo: fondo sólido (verde/rojo) vs glass-subtle

### Estado local adicional

```ts
const [selectedIcon, setSelectedIcon] = useState('wallet')
const [selectedColor, setSelectedColor] = useState('oklch(0.7 0.16 255)')
const [localIsLiability, setLocalIsLiability] = useState(false)
```

### guardar para personalizada

```ts
if (type === 'personalizada') {
  baseData = {
    ...baseData,
    icon: selectedIcon,
    color: selectedColor,
    isLiability: localIsLiability,
  }
}
```

### Reset en useEffect

Al abrir el modal en modo creación con type='personalizada':
- `selectedIcon` → 'wallet'
- `selectedColor` → primer color de la paleta
- `localIsLiability` → false

Al editar una cuenta personalizada existente, se cargan sus valores.

---

## Archivos modificados (resumen)

| Archivo | Cambio |
|---------|--------|
| `lib/types.ts` | +`'personalizada'` en AccountType, +`isLiability?: boolean` en Account |
| `lib/catalog.ts` | +`personalizada` en accountTypes, +`isAccountLiability()` helper |
| `components/account-modal.tsx` | +selector icono, +selector color, +toggle liability, save actualizado |
| `components/dashboard-header.tsx` | Usar `isAccountLiability()` en vez de `getAccountTypeMeta().liability` |
| `components/balance-detail-modal.tsx` | Usar `isAccountLiability()` |
| `components/insights-health.tsx` | SmartInsights y HealthScore: reemplazar string comparisons por `isAccountLiability()` |

**Archivos no modificados:** todos los demás (store, storage, app-shell, types de snapshot, etc.)

---

## Compatibilidad hacia atrás

- Cuentas existentes sin `isLiability` → `undefined` → fallback a `getAccountTypeMeta(type).liability` → comportamiento idéntico al actual
- `accountTypes` existentes no se tocan, solo se agrega `personalizada`
- Los 6 tipos fijos actuales se renderizan y guardan exactamente igual
- `isAccountLiability()` para los 6 tipos fijos devuelve lo mismo que antes devolvía `getAccountTypeMeta().liability`
- Ninguna cuenta existente en IndexedDB se daña
