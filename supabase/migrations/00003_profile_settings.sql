alter table public.profiles
  add column if not exists reserved_money double precision not null default 0,
  add column if not exists emergency_margin double precision not null default 0;
