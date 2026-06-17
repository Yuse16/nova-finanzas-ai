# Nova Finanzas AI - Design System

## Estilo visual
- Estilo: Apple iOS Liquid Glass, premium, minimalista
- Fondo: gradiente azul profundo (de azul oscuro arriba a azul medio/morado abajo)
- Glassmorphism: tarjetas con fondo semi-transparente, blur fuerte (backdrop-blur-xl), 
  bordes sutiles blancos translúcidos (border border-white/10)
- Texto principal: blanco (#FFFFFF) y blanco con opacidad (text-white/70 para secundario)
- Acentos de color por categoría: verde (ingresos/positivo), rojo (gastos/negativo), 
  naranja, morado, azul claro (iconos de categorías)

## Componentes base
- GlassCard: tarjeta base reutilizable - bg-white/10, backdrop-blur-xl, rounded-3xl, 
  border border-white/15, padding consistente
- Iconos circulares de categoría: fondo de color sólido suave, ícono blanco centrado, 
  tamaño ~40x40px, rounded-full
- Indicadores de cambio porcentual: flecha + porcentaje, verde si sube ingreso o 
  baja gasto, rojo si sube gasto

## Animaciones (Framer Motion)
- Transiciones tipo "spring" (físicas de resorte), no easing lineal
- Entrada de tarjetas: fade + slight slide up, stagger entre elementos
- Tap/press en botones: scale down sutil (0.97)

## Tipografía
- Números grandes (balances): font-bold, tamaño grande (text-3xl o text-4xl)
- Labels: text-sm, text-white/60
- Jerarquía clara entre título de sección y contenido

## Navegación
- Bottom nav fijo, 5 elementos: Inicio, Movimientos, [botón central "+" elevado], Cuentas, Más
- Botón central: circular, elevado sobre la barra, color de acento sólido (morado/azul), 
  ícono "+" blanco
- Barra con el mismo efecto glass que las tarjetas

## Estructura de 8 pantallas (navegación independiente, sin mezclar lógica entre ellas)
1. Home (Dashboard) - en construcción ahora
2. Movimientos
3. Cuentas
4. Metas
5-8. (pendiente de definir conforme avancemos)
