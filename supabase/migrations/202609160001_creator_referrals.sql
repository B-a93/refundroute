create table public.creator_partners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text,
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  status text not null default 'active' check (status in ('invited','active','paused','closed')),
  commission_rate numeric(12,2) not null default 2.00 check (commission_rate >= 0),
  payout_method text,
  payout_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.creator_partners(id) on delete restrict,
  case_id uuid not null references public.cases(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_order_id text not null unique,
  referral_code text not null,
  sale_amount numeric(12,2) not null check (sale_amount >= 0),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  currency text not null default 'USD',
  status text not null default 'created' check (status in ('created','earned','approved','paid','reversed')),
  completed_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index creator_referrals_partner_status_idx on public.creator_referrals(partner_id, status, created_at desc);
create index creator_referrals_case_idx on public.creator_referrals(case_id);
alter table public.creator_partners enable row level security;
alter table public.creator_referrals enable row level security;
create trigger creator_partners_set_updated_at before update on public.creator_partners for each row execute function public.set_updated_at();
