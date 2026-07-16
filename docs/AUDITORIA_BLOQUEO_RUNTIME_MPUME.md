# Auditoría: Bloqueo Crítico de Runtime en MPUME Finanzas

## Causa Raíz

Bucle recursivo infinito entre `useStore.subscribe()` y `generateRecoveryPlan`:

```
subscribe (detecta trigger)
  → shouldRecalculate() = true
    → generateRecoveryPlan()
      → useStore.setState({ data: { ...recoveryPlans: nuevosPlanes } })
        → subscribe se dispara de nuevo (mismo snapshot, pero _prevSnapshot no se actualizó)
          → shouldRecalculate() = true (porque _prevSnapshot aún es viejo)
            → bucle infinito
```

### Consecuencias

1. **Generación masiva de planes**: cientos/miles de `RecoveryPlan` creados por milisegundo
2. **Saturación de persistencia**: IndexedDB, localStorage y Supabase reciben escrituras en cadena sin límite
3. **Crecimiento de memoria**: `assistantHistory` y `recoveryPlans` crecen sin control
4. **Runtime freeze**: El hilo principal se bloquea; Android mata el proceso en segundo plano
5. **Pérdida de cuota Supabase**: Múltiples requests simultáneas saturan el plan gratuito

## Correcciones Aplicadas

### 1. Protección contra Reentrancia (`lib/store.tsx`)
- **`_isPersisting` flag**: Previene que `subscribe` procese cambios mientras ya está escribiendo
- **`_cachedSnapshot`**: Se actualiza ANTES de llamar `generateRecoveryPlan`, no después
- **`computeFingerprint()`**: Huella SHA-256 del snapshot; si el fingerprint no cambió, no se recalcula
- **`_processedFingerprints` (Set)**: Cada fingerprint solo genera un plan una vez por sesión

### 2. Debounce en Persistencia (`lib/store.tsx`)
- **`schedulePersist(debouncedMs)`**: Agrupa cambios rápidos (750ms de espera)
- Evita que una cascada de `setState` genere N escrituras simultáneas

### 3. Límites de Crecimiento (`lib/store.tsx`)
- **`MAX_ASSISTANT_HISTORY = 100`**: Trunca el historial del asistente
- **`limitRecoveryPlans()`**: Máximo 20 planes totales, solo 1 activo (`status: 'active'`)
- Se ejecuta en cada `setState` del store

### 4. Entity-Specific Saves (`lib/supabase/storage.ts`)
- `saveMovement`, `saveAccount`, `saveGoal`, `saveRecoveryPlan`, etc.
- Evitan re-subir toda la base de datos por un solo cambio
- **Persistence mutex**: Operaciones se serializan para evitar race conditions

### 5. Selectores Zustand en AppShell (`components/app-shell.tsx`)
- `useStore((s) => s.data.accounts)` en vez de `const { data } = useStore()`
- Notificaciones regeneradas con debounce de 1s
- Elimina renders innecesarios y cortocircuitos de subscribe

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `lib/store.tsx` | Reentrancy, fingerprint, debounce, límites |
| `lib/supabase/storage.ts` | Entity-specific saves + mutex |
| `components/app-shell.tsx` | Selectores Zustand + debounce notifs |

## Pruebas de Verificación

1. Abrir app en Android/iPhone/navegador
2. Navegar entre todas las pantallas (home, movimientos, cuentas, metas, insights)
3. Agregar/editar/eliminar movimientos, cuentas, metas
4. Verificar que no hay congelamiento ni cierre inesperado
5. Abrir DevTools → Performance → grabar interacción; no debe haber long tasks (>50ms)
6. Verificar que `recoveryPlans` en localStorage no exceda 20 entradas
7. Verificar que `assistantHistory` en localStorage no exceda 100 entradas
