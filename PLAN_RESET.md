# PLAN RESET.md — Reset Financiero Inteligente

## Archivos a crear (3)

| Archivo | Propósito |
|---------|-----------|
| `lib/storage-snapshots.ts` | Capa de persistencia para snapshots (IndexedDB + localStorage mirror, mismo patrón que `storage.ts`) |
| `components/reset-financial-modal.tsx` | Modal de confirmación con resumen previo al reseteo |
| `components/snapshot-history-view.tsx` | Vista completa de historial + detalle de snapshot individual (read-only) |

## Archivos a modificar (4)

| Archivo | Cambio |
|---------|--------|
| `lib/store.tsx` | Agregar acción `resetWithSnapshot(snapshotData)` que: (1) guarda el snapshot en storage, (2) llama `storage.clear()`, (3) resetea el state a `emptyAppData()` |
| `lib/storage.ts` | Agregar `export async function getSnapshots(): Promise<FinancialSnapshot[]>` y `export async function saveSnapshot(snapshot: FinancialSnapshot): Promise<void>` |
| `components/settings-modal.tsx` | Agregar opción "Reiniciar finanzas" al final del modal, separada visualmente, con estilo de advertencia sutil |
| `app/page.tsx` o `app/layout.tsx` | Si se elige ruta `/historial`, registrar el modal o ruta; si se elige modal, agregar `SnapshotHistoryModal` en AppShell |

## Flujo completo

### 1. Entrada en SettingsModal
- Se agrega una sección "Peligro" al final del modal de configuración
- Un botón/opción "Reiniciar finanzas" con color de advertencia (`oklch(0.7 0.2 25)`)
- Al presionar → abre `ResetFinancialModal`

### 2. ResetFinancialModal (nuevo componente)
- Abre como un `GlassSheet` (mismo patrón que los demás modales)
- Calcula en tiempo real:
  - `availableBalance` (de `dashboard-header.tsx`, mismo cálculo)
  - `debts` (de `insights-health.tsx`, mismo cálculo)
  - `data.movements.length` (total de movimientos)
  - `data.goals.length` (total de metas)
- Muestra un **resumen tipo "Cierre Financiero"** con esos 4 números + fecha actual
- Debajo, un botón "Sí, reiniciar" (rojo/advertencia) y uno "Cancelar" (glass)
- Al confirmar:
  1. Arma un `FinancialSnapshot` con:
     ```ts
     type FinancialSnapshot = {
       id: string
       createdAt: number        // timestamp del reset
       label: string            // "Cierre financiero - 17 jun 2026"
       summary: {
         availableBalance: number
         totalDebt: number
         movementsCount: number
         goalsCount: number
       }
       fullData: {              // COPIA COMPLETA de todo
         accounts: Account[]
         movements: Movement[]
         goals: Goal[]
         reminders: Reminder[]
         assistantHistory: AssistantMessage[]
         profile: UserProfile | null
       }
     }
     ```
  2. Guarda el snapshot en storage (nueva clave `nova-finanzas:snapshots`)
  3. Llama `storage.clear()` + `useStore.setState({ data: emptyAppData(), ready: true })`
  4. Como el `AppShell` ya tiene el guard `if (!data.profile?.onboarded) return <Onboarding />`, el usuario verá automáticamente el Onboarding

### 3. Storage de snapshots (`lib/storage-snapshots.ts`)
- Misma estrategia que `storage.ts`: IndexedDB + localStorage mirror
- Nueva clave en IndexedDB: `snapshots` (dentro del mismo `nova-finanzas` DB)
- Nueva clave en localStorage: `nova-finanzas:snapshots`
- Funciones: `loadSnapshots(): Promise<FinancialSnapshot[]>`, `saveSnapshot(snapshot)`, `clearSnapshots()`
- Los snapshots se almacenan como un array plano; cada reset hace push

### 4. Historial de snapshots — recomendación de ruta

**Opción recomendada: nueva ruta `/historial`**

Razones:
- Es una pantalla con entidad propia (lista + detalle), no un sidebar de insights
- El detalle de un snapshot puede ser extenso (movimientos completos, cuentas, metas)
- No mezcla conceptos: insights es análisis, historial es archivo
- Fácil de agregar sin modificar BottomNav (se accede desde "Más" → MoreOptionsModal)

Acceso:
- Desde `MoreOptionsModal` se agrega una opción "Historial de cierres"
- Desde `ResetFinancialModal` (después del reset no aplica, pero antes sí)

**Alternativa descartada:** dentro de `/insights` — mezcla análisis con archivo muerto

### 5. SnapshotHistoryView — dos estados

**Estado lista** (`/historial`):
- Muestra todos los snapshots ordenados por fecha descendente
- Cada item: fecha, resumen de 4 números (availableBalance, totalDebt, movementsCount, goalsCount)
- Al tocar uno → pasa a estado detalle

**Estado detalle** (`/historial` — el detalle se maneja con estado local en la misma ruta, sin sub-ruta dinámica):
- Muestra encabezado con fecha del cierre y los 4 números del resumen
- Debajo, tabs o secciones colapsables:
  - **Cuentas** — lista de cuentas que existían en ese momento (solo lectura)
  - **Movimientos** — lista de movimientos tal como estaban (solo lectura)
  - **Metas** — metas de ese momento (solo lectura)
  - **Deudas** — calculado de las cuentas del snapshot
- **Read-only:** sin botones de editar, eliminar, ni reactivar

### 6. Diagrama de navegación

```
SettingsModal
  └─ "Reiniciar finanzas" → ResetFinancialModal
                              ├─ "Cancelar" → cierra
                              └─ "Sí, reiniciar" → guarda snapshot + borra datos + Onboarding

MoreOptionsModal
  └─ "Historial de cierres" → /historial (ruta nueva)
                                └─ [click en snapshot] → detalle read-only
```

## Restricciones verificadas

| Restricción | Cómo se cumple |
|-------------|----------------|
| No modificar availableBalance/totalBalance | Se leen desde el store, no se tocan |
| Onboarding existente | AppShell ya tiene el guard `if (!data.profile?.onboarded) return <Onboarding />` |
| Snapshots read-only | Sin handlers de edición, sin botones de restaurar |
| Irreversible | Confirmación con resumen visible antes del botón "Sí, reiniciar" |
| No mezclar lógica de rutas | BottomNav no se modifica; /historial se accede desde "Más" |
