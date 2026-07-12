-- Nova Finanzas AI — Supabase Migration 00002
-- Motor de Estabilidad Financiera tables with RLS policies.
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- 1. Stability Snapshots (cache del motor determinista)
create table if not exists public.stability_snapshots (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  computed_at bigint not null,
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
  deficit_risk text,
  payment_capacity double precision,
  savings_capacity double precision,
  recovery_progress double precision,
  status text not null
);
alter table public.stability_snapshots enable row level security;

create policy "Users can read own snapshots"
  on public.stability_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own snapshots"
  on public.stability_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own snapshots"
  on public.stability_snapshots for update
  using (auth.uid() = user_id);

create policy "Users can delete own snapshots"
  on public.stability_snapshots for delete
  using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists idx_snapshots_user_id on public.stability_snapshots(user_id);
create index if not exists idx_snapshots_computed_at on public.stability_snapshots(computed_at);
