# Auditoría: Inconsistencias de Guest Mode y AuthMode

## Problemas encontrados

### 1. Race condition en auth guard (CRÍTICO — redirect loop)

**Archivo:** `components/app-shell.tsx:70-76`

AppShell ejecuta `router.replace('/auth/login')` cuando `ready=true` pero `authMode` aún es `'loading'`. Esto ocurre porque:
- El store (Zustand) hace auto-hydrate desde IndexedDB y marca `ready: true` independientemente de AuthContext
- AuthContext inicializa `isGuest: false` y tarda en resolver el estado real (async `getSession()` + `loadGuestState()`)

**Solución:** Reemplazar los 3 estados booleanos separados (`user`, `loading`, `isGuest`) por un estado unificado `AuthMode = 'loading' | 'anonymous' | 'guest' | 'authenticated'`. AppShell no redirige mientras `authMode === 'loading'`.

### 2. Tres estados separados vs. AuthMode unificado

**Archivo:** `context/auth-context.tsx`

Antes: `user`, `session`, `loading`, `isGuest` como estados separados que podían contradecirse (ej. `user=null` && `isGuest=false` durante loading).

Después: `authMode` como única fuente de verdad. `user` y `isGuest` son valores derivados:
- `user = session?.user ?? null`
- `isGuest = authMode === 'guest'`
- `loading = authMode === 'loading'`

### 3. `enableGuestMode()` generaba nuevo `guestId` cada vez

**Archivo:** `lib/guest-storage.ts:55-67`

Cada llamada a `enableGuestMode()` generaba un `guestId` nuevo con `generateId()`, rompiendo la persistencia entre recargas.

**Solución:** Reutilizar el guest state existente si `mode === 'guest'` y `guestId` es válido.

### 4. Nombre hardcodeado "Jorge"

**Archivo:** `components/nova-ai-modal.tsx:539`

Saludo "Hola Jorge 👋" hardcodeado. Se reemplazó por `Hola {data.profile?.name ?? 'Usuario'} 👋`.

### 5. Fallbacks de nombre ya eran "Usuario"

**Archivos:** `page-header.tsx:40`, `home-hero.tsx:37`, `dashboard-header.tsx:25`

Todos usaban `data.profile?.name ?? 'Usuario'`. No se requirió cambio.

### 6. `setUserData(null)` usado para guest y logout indistintamente

**Archivo:** `lib/store.tsx:148-170`

`setUserData(null)` solo asigna `userId: null` y `ready: true`. No distingue entre "iniciar sesión como invitado" y "cerrar sesión". Esto es correcto para el caso de uso actual porque guest y anonymous usan el mismo storage local, pero impide tener namespaces separados.

### 7. Storage keys sin namespace (riesgo bajo)

**Archivo:** `lib/storage.ts`

Todos los datos (guest y autenticado) se guardan bajo la misma clave: `nova-finanzas:data` en IndexedDB y `nova-finanzas:data` en localStorage. Si dos personas usan el mismo navegador, la segunda ve los datos de la primera. Separar por namespace requiere cambios en `storage.ts` + `store.tsx` y no se abordó en esta ronda para evitar pérdida de datos.

### 8. Guest exit sin confirmación

**Archivo:** `components/page-header.tsx:97-104`

El botón "Salir del modo invitado" disparaba `exitGuestMode()` sin confirmación, arriesgando pérdida de datos no sincronizados.

**Solución:** Agregar `window.confirm()` antes de ejecutar.

## Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `context/auth-context.tsx` | AuthMode unificado + valores derivados |
| `lib/guest-storage.ts` | Reutilizar guestId existente |
| `components/app-shell.tsx` | No redirigir durante `authLoading` |
| `components/nova-ai-modal.tsx` | Reemplazar "Jorge" hardcodeado |
| `components/page-header.tsx` | Confirmación al salir de guest |

## No se abordó

- Namespaces de storage (`mpume:guest:<guestId>` vs `mpume:user:<userId>`) — requiere migración segura
- Separación `initializeGuestData()` vs `initializeAuthenticatedData()` en store — depende de namespaces
