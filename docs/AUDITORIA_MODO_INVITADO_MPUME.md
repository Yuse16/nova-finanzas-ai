# Auditoría: Modo Invitado MPUME Finanzas

## 1. Flujo actual de autenticación

```
middleware.ts (Edge)
  ├─ ¿Ruta pública? → /auth/login, /auth/signup, /auth/callback, /auth/confirm → NextResponse.next()
  ├─ ¿Asset estático? → NextResponse.next()
  └─ updateSession() → ¿usuario existe?
       ├─ Sí → NextResponse.next()
       └─ No → redirect → /auth/login?redirect=<path>

layout.tsx (Server)
  └─ AuthProvider (Context, Client)
       ├─ init: getSession() → setUser, setSession
       ├─ onAuthStateChange → setUserData(userId) en store
       └─ signOut() → supabase.auth.signOut()

AppShell (Client)
  ├─ pathname.startsWith('/auth') → render children sin shell
  ├─ !store.ready → loading spinner
  ├─ !profile || !profile.onboarded → Onboarding
  └─ else → app completa con header, bottom nav, modals
```

## 2. Guards encontrados

| Archivo | Guard | Comportamiento actual |
|---------|-------|----------------------|
| `middleware.ts` | `if (!user) redirect /auth/login` | Bloquea todo sin sesión Supabase |
| `app-shell.tsx` | `pathname.startsWith('/auth')` | Muestra páginas de auth sin shell |
| `app-shell.tsx` | `!ready` | Loading mientras hidrata store |
| `app-shell.tsx` | `needsOnboarding` | Muestra onboarding si perfil incompleto |
| `store.tsx` | `setUserData(userId)` | userId null → no carga remote, no setea ready |
| `store.tsx` | `schedulePersist` | Solo envía a Supabase si `userId` existe |
| `store.tsx` | subscribe snapshot | Solo computa si `state.userId` existe |

## 3. Persistencia local actual

- **IndexedDB** (preferido): DB `nova-finanzas`, store `app`, key `data`
- **localStorage** (fallback + mirror): key `nova-finanzas:data`
- **storage.ts**: API async (`load`, `save`, `clear`) con auto-migración entre ambos
- **No existe un almacén separado para metadata de auth/guest**

## 4. Riesgos de pérdida de datos

- Si `setUserData(null)` no marca `ready: true`, AppShell se queda en loading infinito
- El middleware redirige a login sin sesión Supabase → no se puede acceder ni como guest
- No hay ID de invitado persistente → los datos locales no se asocian a ninguna sesión
- No hay migration path de datos locales → al crear cuenta, los datos existentes se ignoran
- `localStorage.removeItem` o `storage.clear()` borraría todo sin recuperación

## 5. Arquitectura elegida

```
[Guest Session Cookie]    ← middleware.ts lo reconoce
        │
[guest-storage.ts]        ← persistencia del estado guest (authMode, guestId, onboardingCompleted)
        │
[AuthContext]             ← expone isGuest, enableGuestMode, exitGuestMode
        │
[store.tsx]               ← setUserData(null) setea ready=true, skip remote ops
        │
[AppShell]                ← canAccessApp = session || isGuest
        │
[Login Page]              ← botón "Usar sin cuenta"
        │
[Migration Modal]         ← al crear cuenta desde guest: importar datos locales
```

### Guest State Shape

```ts
type GuestState = {
  mode: 'guest' | 'none'
  guestId: string
  createdAt: number
  onboardingCompleted: boolean
}
```

Persistido en localStorage key `mpume:guest` + cookie `mpume_guest`.

### Middleware Strategy

```ts
const isGuest = request.cookies.has('mpume_guest')
if (!user && !isGuest) redirect /auth/login
```

El middleware **nunca redirige a guests**. En el cliente, AppShell maneja el guard completo.

### Store Strategy for Guest

```ts
setUserData(null) → set { userId: null, ready: true }
```

Todo el flujo de remote (Supabase load/save) está protegido por `if (userId)`.

## 6. Estrategia de migración

Cuando un guest se registra o inicia sesión:

1. AuthContext detecta `onAuthStateChange` con session real
2. Si había guest state + datos locales → mostrar `MigrationModal`
3. Opciones:
   - "Conservar y sincronizar" → `supabaseStorage.save(userId, data)` + `setUserData(userId)` + limpiar guest
   - "Entrar sin importar" → solo `setUserData(userId)`, datos locales quedan
   - "Cancelar" → no hace nada
4. Cada entidad usa su `id` existente (idempotente por `onConflict: 'id'`)
5. Si falla → mensaje de error, datos locales intactos

## 7. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/guest-storage.ts` | **NUEVO** — persistencia del estado guest |
| `context/auth-context.tsx` | Agregar `isGuest`, `enableGuestMode`, `exitGuestMode`, `guestState` |
| `middleware.ts` | Permitir acceso con cookie `mpume_guest` |
| `app/auth/login/page.tsx` | Agregar botón "Usar sin cuenta" |
| `app/auth/signup/page.tsx` | Agregar botón "Usar sin cuenta" |
| `components/app-shell.tsx` | Guard de autenticación + guest |
| `lib/store.tsx` | `setUserData(null)` marca ready, guest skip remote |
| `components/settings-modal.tsx` | Opciones de guest (crear cuenta, salir) |
| `components/page-header.tsx` | Menú guest (salir modo invitado) |
| `components/guest-migration-modal.tsx` | **NUEVO** — migración de datos al registrarse |

## 8. Pruebas realizadas

- [ ] 1. Primera apertura → login → "Usar sin cuenta" → onboarding → Home
- [ ] 2. Cerrar PWA → reabrir → Home directo, datos intactos
- [ ] 3. Crear movimientos, cuentas, metas offline
- [ ] 4. Guest → "Crear cuenta" → migration modal → datos en Supabase
- [ ] 5. Cancelar migración → datos locales no se borran
- [ ] 6. Guest → "Salir modo invitado" → vuelve a login
- [ ] 7. Login con Google desde guest → migración
- [ ] 8. No hay errores de Supabase en modo guest
- [ ] 9. No hay bucles de redirección
- [ ] 10. Build exitoso sin `ignoreBuildErrors`
