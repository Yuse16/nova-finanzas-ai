# FASE 5 — Motor de Estabilidad Financiera (MPUME AI como agente)

Este documento traduce la "Misión Central de MPUME Finanzas" a algo construible,
usando el modelo de datos que ya existe (Fase 1). Se divide en 6 sub-fases
independientes — cada una es su propio commit/prompt de OpenCode, igual que
hicimos con Fase 1-4.

## Principio de diseño (importante)

Todo lo que hace `stability-engine` es **determinista** (funciones puras de
TypeScript sobre datos reales de Supabase), NO llamadas a IA. La IA
(`app/api/ai/chat/route.ts`) solo **explica en palabras** los resultados que ya
calculó el motor — nunca inventa números. Esto es exactamente lo que pide el
brief: *"La IA puede explicar los resultados, pero no debe inventarlos."*

## Modelo de datos existente que se reutiliza

- `accounts` (balance, is_liability, limite_credito) → base de liquidez y deuda
- `movements` (amount, type, date, category) → base de flujo e ingresos/gastos
- `reminders` (amount, due_date, recurring, completed) → compromisos próximos
- `goals` → ya existen, se conectan a "capacidad de ahorro"

## Tablas nuevas necesarias

```sql
-- Snapshot calculado (cache del motor, se recalcula, no se pierde historial)
create table stability_snapshots (
  id text primary key,
  user_id uuid references auth.users not null,
  computed_at bigint not null,
  -- todos los campos del "motor determinista" del brief:
  avg_income double precision,
  confirmed_income double precision,
  essential_expenses double precision,
  variable_expenses double precision,
  upcoming_commitments double precision,
  overdue_payments double precision,
  total_debt double precision,
  min_debt_payment double precision,
  weekly_flow double precision,
  monthly_flow double precision,
  real_available_money double precision,
  reserved_money double precision,
  emergency_margin double precision,
  coverage_days double precision,
  deficit_risk text, -- 'low' | 'medium' | 'high'
  payment_capacity double precision,
  savings_capacity double precision,
  recovery_progress double precision,
  status text not null -- 'critical' | 'unstable' | 'recovering' | 'stable' | 'growing'
);

-- Plan de recuperación versionado (nunca se borra, se crean versiones nuevas)
create table recovery_plans (
  id text primary key,
  user_id uuid references auth.users not null,
  version integer not null,
  status text not null,
  diagnosis text not null,
  weekly_income double precision,
  essential_expenses double precision,
  debt_payment_target double precision,
  emergency_margin double precision,
  discretionary_limit double precision,
  weekly_actions jsonb not null default '[]',
  start_date text not null,
  target_date text,
  progress_percentage double precision default 0,
  last_recalculated_at bigint not null,
  superseded_by text references recovery_plans(id)
);

-- Alertas proactivas
create table financial_alerts (
  id text primary key,
  user_id uuid references auth.users not null,
  type text not null, -- 'deficit_risk' | 'budget_deviation' | 'debt_opportunity' | etc.
  cause text not null,
  impact text not null,
  recommended_action text not null,
  status text not null default 'pending', -- 'pending' | 'executed' | 'ignored' | 'adjusted'
  created_at bigint not null
);

-- Cierres semanales (histórico, para "¿estoy mejorando o empeorando?")
create table weekly_reviews (
  id text primary key,
  user_id uuid references auth.users not null,
  week_start text not null,
  week_end text not null,
  income_received double precision,
  total_expense double precision,
  essential_expense double precision,
  variable_expense double precision,
  payments_made double precision,
  savings_made double precision,
  deviations jsonb,
  debt_progress double precision,
  stability_status text not null,
  score integer,
  score_explanation text,
  next_week_actions jsonb
);
```

(Los simuladores del brief NO necesitan tabla — corren en memoria contra los
mismos cálculos del motor y solo muestran resultado, nunca escriben a menos
que el usuario confirme aplicar el cambio real.)

## Sub-fases (orden recomendado)

### Fase 5.1 — Motor de Estabilidad (el corazón, todo lo demás depende de esto)
Crear `lib/stability-engine.ts`: funciones puras que reciben
`accounts + movements + reminders` y devuelven el snapshot completo (los ~18
campos del brief) + el estado (`critical/unstable/recovering/stable/growing`)
con las reglas exactas ya documentadas en el brief. Guardar snapshot en
`stability_snapshots` cada vez que cambian los datos relevantes (o on-demand
al abrir la pantalla de inicio).

### Fase 5.2 — Dinero realmente disponible
UI en Home: reemplazar "Dinero disponible: $534" por el desglose de 4 líneas
(saldo total / reservado / compromisos próximos / libre para gastar), usando
el snapshot de 5.1. Requiere que el usuario pueda marcar dinero como
"reservado" y configurar su margen de emergencia (nuevo campo en `profiles`
o `user_settings`).

### Fase 5.3 — Plan de recuperación
CRUD de `recovery_plans` + lógica de recálculo automático en los 6 triggers
del brief (cambia ingreso, gasto importante, pago de deuda, pago omitido,
nuevo compromiso, usuario cambia meta). Nunca borra, siempre versiona.

### Fase 5.4 — Alertas proactivas + Presupuesto adaptativo + Modo crisis
Motor de reglas que genera `financial_alerts` a partir del snapshot (los 8
ejemplos del brief). Presupuesto adaptativo: detectar desviación por
categoría y ofrecer redistribución (nunca aplicar sin confirmación). Modo
crisis: activa cuando `deficit_risk = 'high'`, genera plan de 7/14/30 días
priorizado (vivienda > comida > salud > transporte > servicios > deudas > no
esencial).

### Fase 5.5 — Seguimiento semanal
Cron/edge function que corre cada fin de semana, genera `weekly_reviews`
usando el motor + comparación contra el `recovery_plan` activo. Card en la UI
con la calificación explicada (ejemplo del brief: "Cumpliste 82%...").

### Fase 5.6 — Simulador financiero
UI de "¿qué pasaría si...?" (comprar algo, subir un pago, perder ingreso,
etc.) que corre el motor de 5.1 con datos hipotéticos (sin guardar) y muestra
antes/después + impacto en deuda + riesgo + recomendación.

### Fase 5.7 — IA como capa de explicación
Una vez que 5.1-5.6 existen, actualizar `app/api/ai/chat/route.ts` para que
las preguntas de consulta ("¿cuánto gasté esta semana?", "¿cuál es mi cuenta
con más dinero?", "¿cuánto debo?") lean el snapshot/plan real y la IA solo
redacte la respuesta en lenguaje natural — nunca calcule ni invente el número.

## Por qué este orden

5.1 es la base matemática de todo — sin eso, nada más se puede probar con
datos reales. 5.2 es el primer resultado visible para ti (útil de inmediato).
5.3-5.6 dependen de 5.1. 5.7 (la IA hablando de esto) va al final a propósito:
así te aseguras de que la IA solo "lee y explica" un motor ya probado, en vez
de que las alucinaciones de un modelo gratuito lleguen antes que los números
reales — que es justo el tipo de bug que ya vimos con "hielera → Transporte".

## Siguiente paso

¿Empezamos con el prompt de Fase 5.1 (el motor determinista), o quieres que
ajuste algo de este plan primero (los campos, las tablas, el orden de las
sub-fases)?
