-- Nova Finanzas AI — Supabase Migration 00001
-- Creates all business tables with RLS policies.
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- 1. Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  onboarded boolean not null default false,
  created_at bigint not null,
  selected_font text not null default 'system',
  accounts_skipped boolean default false
);
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- 2. Accounts
create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  balance double precision not null default 0,
  icon text not null default 'wallet',
  color text not null default 'oklch(0.72 0.16 150)',
  is_liability boolean default false,
  bank text,
  identifier text,
  limite_credito double precision,
  fecha_corte integer,
  fecha_pago integer,
  activa boolean default true,
  created_at bigint not null,
  updated_at bigint not null
);
alter table public.accounts enable row level security;

create policy "Users can read own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- 3. Movements
create table if not exists public.movements (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  amount double precision not null,
  type text not null,
  account_id text references public.accounts(id) on delete set null,
  to_account_id text references public.accounts(id) on delete set null,
  method text not null default 'Otro',
  date text not null,
  person text,
  note text,
  icon text not null default 'receipt',
  color text not null default 'oklch(0.72 0.16 150)',
  created_at bigint not null
);
alter table public.movements enable row level security;

create policy "Users can read own movements"
  on public.movements for select
  using (auth.uid() = user_id);

create policy "Users can insert own movements"
  on public.movements for insert
  with check (auth.uid() = user_id);

create policy "Users can update own movements"
  on public.movements for update
  using (auth.uid() = user_id);

create policy "Users can delete own movements"
  on public.movements for delete
  using (auth.uid() = user_id);

-- 4. Goals
create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  saved double precision not null default 0,
  target double precision not null,
  date text not null,
  icon text not null default 'piggy-bank',
  color text not null default 'oklch(0.72 0.16 235)',
  image text,
  created_at bigint not null
);
alter table public.goals enable row level security;

create policy "Users can read own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- 5. Reminders
create table if not exists public.reminders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount double precision not null default 0,
  due_date text not null,
  recurring text not null default 'none',
  completed boolean not null default false,
  icon text not null default 'bell',
  color text not null default 'oklch(0.78 0.16 70)',
  notified_at bigint,
  snooze_until bigint,
  created_at bigint not null
);
alter table public.reminders enable row level security;

create policy "Users can read own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- 6. Assistant Messages
create table if not exists public.assistant_messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  breakdown jsonb,
  created_at bigint not null
);
alter table public.assistant_messages enable row level security;

create policy "Users can read own assistant messages"
  on public.assistant_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own assistant messages"
  on public.assistant_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own assistant messages"
  on public.assistant_messages for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_movements_user_id on public.movements(user_id);
create index if not exists idx_movements_account_id on public.movements(account_id);
create index if not exists idx_movements_date on public.movements(date);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_assistant_messages_user_id on public.assistant_messages(user_id);
