-- Nova Finanzas AI — Supabase Migration 00004
-- Recovery Plans table con RLS y versioning.
-- Nunca se borra, siempre se versiona (superseded_by).

create table if not exists public.recovery_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'active',              -- 'active' | 'superseded' | 'completed'
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
  superseded_by text references public.recovery_plans(id)
);
alter table public.recovery_plans enable row level security;

create policy "Users can read own recovery plans"
  on public.recovery_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own recovery plans"
  on public.recovery_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recovery plans"
  on public.recovery_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own recovery plans"
  on public.recovery_plans for delete
  using (auth.uid() = user_id);

create index if not exists idx_recovery_plans_user_id on public.recovery_plans(user_id);
create index if not exists idx_recovery_plans_status on public.recovery_plans(status);
