# PLAN_THEMING_V2 — Sistema de Tema Claro / Oscuro

> Basado en el estado actual del código POST rediseño Home/Movimientos/Cuentas.

---

## 1. Arquitectura (ya existe, no cambia)

El mecanismo base ya está operativo y no se modifica:

| Capa | Archivo | Propósito |
|------|---------|-----------|
| Estado + persistencia | `lib/ui-context.tsx` | `theme` state, `setTheme()`, guarda en localStorage `nova-finanzas:theme` |
| Aplicación al DOM | `lib/ui-context.tsx` `applyTheme()` | Setea `data-theme="light"`\|`"dark"` en `<html>` |
| Montaje inicial | `app-shell.tsx:37-44` | Lee localStorage y aplica tema al cargar |
| CSS variables light | `globals.css:49-114` bajo `:root, html[data-theme="light"]` | Paleta completa del tema claro |
| CSS variables dark | `globals.css:116-176` bajo `html[data-theme="dark"]` | Paleta completa del tema oscuro |
| Selector UI | `settings-modal.tsx:23-48` | Botones "Claro" / "Oscuro Espacial" |

**Único cambio arquitectónico requerido:**  
Agregar detección de `prefers-color-scheme: dark` en `getInitialTheme()` para que usuarios con sistema en oscuro vean el tema oscuro por defecto (solo si no hay preferencia guardada).

---

## 2. Variables CSS — Estado actual vs. necesario

### 2.1 Fondo de body (🚨 CRÍTICO)

```css
/* globals.css : Línea 208 — necesita cambio */
body { background: white; }
/* DEBE SER: */
body { background: var(--background); }
```

`--background` ya existe en ambos temas (blanco en light, gris oscuro en dark).

### 2.2 Hero images (🚨 CRÍTICO)

Actualmente ambos temas usan `/montanav2.webp` en `--bg-image`.  
Se necesita una variable separada por tema:

```css
--bg-image: url('/montanav2.webp');           /* light */
--bg-image: url('/montanaobs.webp');          /* dark */

--bg-image-horizontal: url('/montanav2-horizontal.webp');  /* light */
--bg-image-horizontal: url('/montanaobs-horizontal.webp');  /* dark */
```

Esto permite que los componentes que usan `<Image src=...>` obtengan la imagen
correcta según el tema sin lógica JS condicional.

### 2.3 Gradientes de transición (🚨 CRÍTICO)

Los componentes `home-hero.tsx`, `accounts-module.tsx` y `movements-module.tsx`
tienen un degradado fijo `linear-gradient(to bottom, transparent 0%, white 100%)`
para fundir el hero con el fondo. En oscuro debe fundir a `#030712` (gray-950).

Se agregarán variables:

```css
--hero-fade: linear-gradient(to bottom, transparent 0%, white 100%);           /* light */
--hero-fade: linear-gradient(to bottom, transparent 0%, #030712 100%);         /* dark */
```

---

## 3. Imágenes del Hero

| Tema | Home | Cuentas / Movimientos |
|------|------|-----------------------|
| Claro | `/montanav2.webp` | `/montanav2-horizontal.webp` |
| Oscuro | `/montanaobs.webp` | `/montanaobs-horizontal.webp` |

Ambos pares ya existen en `/public/`.  
Se usarán CSS variables (`--bg-image`, `--bg-image-horizontal`) para que
`<Image src=...>` pueda leer la ruta correcta sin condicionales JS.  
Para los componentes que usan `<Image>` directamente (no CSS background), se
inyectará la URL vía `style={{ '--bg-image-horizontal': ... }}` o mediante
una prop derivada del tema.

---

## 4. Componentes a modificar

### 4.1 `app/globals.css`
- [ ] Línea 208: `body { background: white; }` → `body { background: var(--background); }`
- [ ] Agregar `--bg-image-horizontal` en light y dark blocks
- [ ] Cambiar `--bg-image` en dark block a `url('/montanaobs.webp')`
- [ ] Agregar `--hero-fade` en ambos temas (light `white`, dark `#030712`)
- [ ] Revisar variable `--bg-overlay` — en light `oklch(0.35 0.12 260 / 25%)`, en dark `rgba(0,0,0,0.55)` — ya está correcta

### 4.2 `components/home-hero.tsx`
- [ ] Agregar `useUI()` para leer `theme`
- [ ] `<Image src="/montanav2.webp">` → src condicional según theme
- [ ] Gradiente `transparent 0%, white 100%` → usar `var(--hero-fade)` o condicional
- [ ] `text-gray-800` → `text-gray-800 dark:text-gray-100`
- [ ] `text-gray-500` → `text-gray-500 dark:text-gray-400`
- [ ] `text-gray-900` → `text-gray-900 dark:text-white`
- [ ] `text-green-600`/`text-red-500` → NO CAMBIAN (colores semánticos)
- [ ] `text-gray-400` → `text-gray-400 dark:text-gray-500`

### 4.3 `components/home-account-card.tsx`
- [ ] `bg-white` → `bg-white dark:bg-gray-900`
- [ ] `text-gray-900` → `text-gray-900 dark:text-white` (x3)
- [ ] `text-gray-400` → `text-gray-400 dark:text-gray-400` (ya gris, OK)
- [ ] `border-gray-50` → `border-gray-50 dark:border-gray-800`
- [ ] `text-gray-300` (chevron) → `text-gray-300 dark:text-gray-600`

### 4.4 `components/home-goal-card.tsx`
- [ ] `bg-white` → `bg-white dark:bg-gray-900` (x2)
- [ ] `text-gray-900` → `text-gray-900 dark:text-white` (x5)
- [ ] `border-gray-50` → `border-gray-50 dark:border-gray-800` (x2)
- [ ] `text-gray-400` → `text-gray-400 dark:text-gray-400` (x4, ya gris)
- [ ] `text-gray-300` → `text-gray-300 dark:text-gray-600`
- [ ] `bg-gray-100` (barra progreso) → `bg-gray-100 dark:bg-gray-800`
- [ ] `text-blue-400` → `text-blue-400 dark:text-blue-400` (color semántico, no cambia)
- [ ] `text-blue-500` → `text-blue-500 dark:text-blue-400`

### 4.5 `components/home-quick-stats.tsx`
- [ ] `text-gray-900` → `text-gray-900 dark:text-white` (x2)
- [ ] `text-gray-500` → `text-gray-500 dark:text-gray-400`
- [ ] `bg-white` → `bg-white dark:bg-gray-900`
- [ ] `border-gray-100` → `border-gray-100 dark:border-gray-800`

### 4.6 `app/page.tsx` (Home)
- [ ] `bg-gray-50` → `bg-gray-50 dark:bg-gray-950`

### 4.7 `components/accounts-module.tsx`
- [ ] `<Image src="/montanav2-horizontal.webp">` → src condicional según theme
- [ ] Gradiente `transparent 0%, white 100%` → `var(--hero-fade)`
- [ ] `text-gray-900` → `text-gray-900 dark:text-white` (x2)
- [ ] `bg-white` (fila de cuenta) → `bg-white dark:bg-gray-900`
- [ ] `border-gray-50` → `border-gray-50 dark:border-gray-800`
- [ ] `text-gray-400` → `text-gray-400 dark:text-gray-400`
- [ ] `text-gray-300` (chevron) → `text-gray-300 dark:text-gray-600`
- [ ] `active:bg-gray-50` → `active:bg-gray-50 dark:active:bg-gray-800`

### 4.8 `components/movements-module.tsx`
- [ ] `<Image src="/montanav2-horizontal.webp">` → src condicional según theme
- [ ] Gradiente `transparent 0%, white 100%` → `var(--hero-fade)`
- [ ] `text-gray-900` → `text-gray-900 dark:text-white` (x3)
- [ ] `bg-white` (fila de movimiento) → `bg-white dark:bg-gray-900`
- [ ] `border-gray-50` → `border-gray-50 dark:border-gray-800`
- [ ] `text-gray-400` → `text-gray-400 dark:text-gray-400`
- [ ] `text-gray-500` → `text-gray-500 dark:text-gray-400`
- [ ] `text-gray-600` → `text-gray-600 dark:text-gray-300`
- [ ] `text-gray-300` → `text-gray-300 dark:text-gray-600`
- [ ] `bg-gray-100` (filtro activo) → `bg-gray-100 dark:bg-gray-800`
- [ ] `active:bg-gray-50` → `active:bg-gray-50 dark:active:bg-gray-800`

### 4.9 `app/cuentas/page.tsx`
- [ ] `bg-gray-50` → `bg-gray-50 dark:bg-gray-950`

### 4.10 `app/movimientos/page.tsx`
- [ ] `bg-gray-50` → `bg-gray-50 dark:bg-gray-950`

### 4.11 `components/bottom-nav.tsx`
- [ ] REMOVER `style={{ background: 'rgba(255,255,255,0.85)' }}` — ya hereda `.glass-strong` que usa `var(--glass-strong-bg)`, la cual ya está definida para ambos temas
- [ ] `text-gray-400` (inactive) → `text-gray-400 dark:text-gray-500`
- [ ] El botón Nova (diamante) usa `linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)` — color semántico, no cambia entre temas

### 4.12 `components/app-shell.tsx`
- [ ] No requiere cambios — ya aplica `data-theme` vía `setTheme` y usa `var(--bg-image)`/`var(--bg-overlay)` para el fondo condicional

### 4.13 `components/settings-modal.tsx`
- [ ] Botones ya funcionan con el estado de `theme` y `setTheme`
- [ ] NO requiere cambios

### 4.14 `lib/ui-context.tsx`
- [ ] Agregar detección de `prefers-color-scheme: dark` en `getInitialTheme()`:
  ```
  1. Leer localStorage
  2. Si existe, usar ese valor
  3. Si no existe, checar matchMedia('(prefers-color-scheme: dark)')
  4. Si dark, devolver 'dark'
  5. Sino, devolver 'light'
  ```

---

## 5. Colores semánticos que NO cambian entre temas

| Color | Propósito | Valor ambos temas |
|-------|-----------|-------------------|
| `var(--positive)` / `oklch(0.82 0.17 155)` | Verde de ingresos, disponible | ✅ igual |
| `var(--negative)` / `oklch(0.72 0.19 18)` | Rojo de gastos, deuda | ✅ igual |
| `var(--primary)` | Azul del Nova crystal | ✅ similar (ligera diferencia de tono) |
| Colores de categoría (catalog.ts) | Comida, Café, Transporte, etc. | ✅ igual |
| Colores de íconos de cuenta | efectivo verde, débito azul, etc. | ✅ igual |

---

## 6. Archivos que NO se modifican

- `lib/store.tsx` — sin cambios de theming
- `lib/types.ts` — sin cambios
- `lib/catalog.ts` — colores semánticos ya iguales
- `lib/format.ts` — sin cambios
- `lib/icons.ts` — sin cambios
- `lib/notifications.ts` — sin cambios
- `lib/selectors.ts` — sin cambios
- `lib/storage.ts` — sin cambios
- `lib/services/ai.ts` — sin cambios
- `lib/ui-context.tsx` — solo se toca `getInitialTheme()` para `prefers-color-scheme`
- `components/transaction-modal.tsx` — ya tiene dark mode
- `components/account-modal.tsx` — ya tiene dark mode
- `components/notifications-modal.tsx` — ya tiene dark mode
- `components/onboarding.tsx` — ya tiene dark mode
- `components/account-detail-modal.tsx` — ya tiene dark mode
- `components/glass-sheet.tsx` — ya tiene dark mode
- `components/form-controls.tsx` — ya tiene dark mode
- `components/button.tsx` — ya tiene dark mode

---

## 7. Orden de implementación sugerido

```
1. globals.css       → body background, variables hero, hero-fade
2. home-hero.tsx     → hero image + fade + texto
3. home-account-card → dark: bg/text/border
4. home-goal-card    → dark: bg/text/border
5. home-quick-stats  → dark: bg/text/border
6. page.tsx (Home)   → dark: bg-gray-950
7. accounts-module   → hero image + fade + dark: rows
8. movements-module  → hero image + fade + dark: rows
9. cuentas/page.tsx  → dark: bg-gray-950
10. movimientos/page.tsx → dark: bg-gray-950
11. bottom-nav       → quitar hardcoded background, dark: text
12. ui-context       → prefers-color-scheme detection
13. settings-modal   → verificar (no tocar a menos que sea necesario)
14. build + tsc + commit + push
```

---

## 8. Verificación post-implementación

- [ ] `npx tsc --noEmit` — 0 errores
- [ ] `npm run build` — build exitoso
- [ ] Tema Claro se ve idéntico a antes (comparar visualmente)
- [ ] Tema Oscuro: Hero muestra montaña oscura
- [ ] Tema Oscuro: Tarjetas tienen fondo gris, texto claro
- [ ] Tema Oscuro: Gradientes funden a gray-950, no a blanco
- [ ] Bottom nav no tiene fondo blanco duro en oscuro
- [ ] Selector en Settings persiste al recargar
- [ ] `prefers-color-scheme: dark` detectado si no hay preferencia guardada
