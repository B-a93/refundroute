create extension if not exists pgcrypto;

create type public.case_status as enum ('draft','assessed','evidence_needed','ready','submitted','awaiting_response','follow_up_due','approved','rejected','escalation_ready','escalated','completed','closed');
create type public.problem_type as enum ('unexpected_renewal','charged_after_cancellation','free_trial_converted','duplicate_charge','unrecognized_purchase','service_not_provided','refund_rejected','refund_ignored');
create type public.purchase_route as enum ('direct','apple','google_play','paypal','bank_card','mobile_carrier','reseller','unknown');
create type public.confidence_label as enum ('verified','community_informed','needs_review','unsupported');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  official_website text,
  support_url text,
  logo_path text,
  active boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_descriptors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  descriptor text not null,
  route public.purchase_route not null default 'unknown',
  country_code text,
  created_at timestamptz not null default now(),
  unique (company_id, descriptor, route)
);

create table public.country_rules (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  language_code text not null default 'en',
  authority_name text,
  authority_url text,
  guidance jsonb not null default '{}'::jsonb,
  confidence public.confidence_label not null default 'needs_review',
  source_url text,
  last_verified_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (country_code, language_code, version)
);

create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  problem public.problem_type not null,
  route public.purchase_route not null,
  country_code text,
  title text not null,
  summary text not null,
  refund_window_hours integer check (refund_window_hours is null or refund_window_hours >= 0),
  expected_response_hours integer check (expected_response_hours is null or expected_response_hours >= 0),
  official_policy_url text,
  official_action_url text,
  confidence public.confidence_label not null default 'needs_review',
  version integer not null default 1,
  is_current boolean not null default true,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, problem, route, country_code, version)
);

create table public.playbook_steps (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  instructions text not null,
  action_url text,
  wait_hours integer check (wait_hours is null or wait_hours >= 0),
  created_at timestamptz not null default now(),
  unique (playbook_id, position)
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  playbook_id uuid references public.playbooks(id) on delete set null,
  playbook_version integer,
  problem public.problem_type not null,
  route public.purchase_route not null default 'unknown',
  merchant_name text,
  billing_descriptor text,
  product_name text,
  amount numeric(12,2) check (amount is null or amount >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  charge_date date,
  cancellation_date date,
  residence_country text,
  purchase_country text,
  strength_score integer check (strength_score is null or strength_score between 0 and 100),
  strength_label text,
  urgency_label text,
  status public.case_status not null default 'draft',
  paid_tier text not null default 'free' check (paid_tier in ('free','guided','escalation')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  title text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_name text not null check (bucket_name in ('case-evidence','merchant-responses','generated-packs','redacted-previews')),
  object_path text not null,
  original_filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  category text not null,
  processing_status text not null default 'pending',
  redaction_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table public.extracted_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field_name text not null,
  field_value text,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  confirmed_value text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null,
  label text not null,
  status text not null default 'missing' check (status in ('missing','available','required','not_applicable')),
  document_id uuid references public.documents(id) on delete set null,
  importance integer not null default 1 check (importance between 1 and 3),
  created_at timestamptz not null default now(),
  unique (case_id, evidence_type)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('outbound','inbound')),
  message_type text not null,
  subject text,
  body text not null,
  classification text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  deadline_type text not null,
  due_at timestamptz not null,
  reminder_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.case_outcomes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('full_refund','partial_refund','credit','replacement','rejected','abandoned','unresolved')),
  amount_recovered numeric(12,2) check (amount_recovered is null or amount_recovered >= 0),
  currency text,
  resolution_days integer check (resolution_days is null or resolution_days >= 0),
  successful_step text,
  anonymous_learning_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paypal',
  provider_order_id text not null unique,
  package text not null check (package in ('guided','escalation')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null,
  status text not null default 'created' check (status in ('created','approved','completed','failed','refunded')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index cases_user_status_idx on public.cases(user_id, status);
create index cases_company_idx on public.cases(company_id);
create index case_events_case_time_idx on public.case_events(case_id, occurred_at desc);
create index documents_case_idx on public.documents(case_id);
create index messages_case_time_idx on public.messages(case_id, created_at desc);
create index deadlines_user_due_idx on public.deadlines(user_id, due_at) where completed_at is null;
create index playbooks_lookup_idx on public.playbooks(company_id, problem, route, country_code) where is_current;

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger cases_set_updated_at before update on public.cases for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', '')); return new; end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_refundroute_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.companies enable row level security;
alter table public.billing_descriptors enable row level security;
alter table public.country_rules enable row level security;
alter table public.playbooks enable row level security;
alter table public.playbook_steps enable row level security;
alter table public.cases enable row level security;
alter table public.case_events enable row level security;
alter table public.documents enable row level security;
alter table public.extracted_fields enable row level security;
alter table public.evidence_items enable row level security;
alter table public.messages enable row level security;
alter table public.deadlines enable row level security;
alter table public.case_outcomes enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admins_select_self" on public.admin_users for select using (user_id = auth.uid());

create policy "companies_read_active" on public.companies for select using (active or public.is_refundroute_admin());
create policy "companies_admin_all" on public.companies for all using (public.is_refundroute_admin()) with check (public.is_refundroute_admin());
create policy "descriptors_read" on public.billing_descriptors for select using (true);
create policy "descriptors_admin_all" on public.billing_descriptors for all using (public.is_refundroute_admin()) with check (public.is_refundroute_admin());
create policy "country_rules_read" on public.country_rules for select using (confidence <> 'unsupported' or public.is_refundroute_admin());
create policy "country_rules_admin_all" on public.country_rules for all using (public.is_refundroute_admin()) with check (public.is_refundroute_admin());
create policy "playbooks_read_current" on public.playbooks for select using (is_current or public.is_refundroute_admin());
create policy "playbooks_admin_all" on public.playbooks for all using (public.is_refundroute_admin()) with check (public.is_refundroute_admin());
create policy "playbook_steps_read" on public.playbook_steps for select using (exists(select 1 from public.playbooks p where p.id = playbook_id and p.is_current) or public.is_refundroute_admin());
create policy "playbook_steps_admin_all" on public.playbook_steps for all using (public.is_refundroute_admin()) with check (public.is_refundroute_admin());

create policy "cases_own_all" on public.cases for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "case_events_own_all" on public.case_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents_own_all" on public.documents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "extracted_fields_own_all" on public.extracted_fields for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "evidence_items_own_all" on public.evidence_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages_own_all" on public.messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "deadlines_own_all" on public.deadlines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "outcomes_own_all" on public.case_outcomes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "payments_select_own" on public.payments for select using (user_id = auth.uid());
create policy "audit_admin_read" on public.audit_logs for select using (public.is_refundroute_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('case-evidence','case-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
  ('merchant-responses','merchant-responses',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain']),
  ('generated-packs','generated-packs',false,10485760,array['application/pdf']),
  ('redacted-previews','redacted-previews',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "storage_read_own_folder" on storage.objects for select to authenticated using (bucket_id in ('case-evidence','merchant-responses','generated-packs','redacted-previews') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_insert_own_folder" on storage.objects for insert to authenticated with check (bucket_id in ('case-evidence','merchant-responses','redacted-previews') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_update_own_folder" on storage.objects for update to authenticated using (bucket_id in ('case-evidence','merchant-responses','redacted-previews') and (storage.foldername(name))[1] = auth.uid()::text) with check ((storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_delete_own_folder" on storage.objects for delete to authenticated using (bucket_id in ('case-evidence','merchant-responses','redacted-previews') and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.companies (slug,name,official_website,support_url,last_verified_at) values
  ('apple','Apple App Store','https://www.apple.com/','https://reportaproblem.apple.com/',now()),
  ('google-play','Google Play','https://play.google.com/','https://support.google.com/googleplay/',now()),
  ('adobe','Adobe','https://www.adobe.com/','https://helpx.adobe.com/contact.html',now()),
  ('canva','Canva','https://www.canva.com/','https://www.canva.com/help/contact-us/',now()),
  ('microsoft','Microsoft','https://www.microsoft.com/','https://support.microsoft.com/contactus',now())
on conflict (slug) do nothing;

insert into public.billing_descriptors (company_id, descriptor, route)
select id, 'APPLE.COM/BILL', 'apple' from public.companies where slug = 'apple'
union all select id, 'GOOGLE*', 'google_play' from public.companies where slug = 'google-play'
union all select id, 'ADOBE', 'direct' from public.companies where slug = 'adobe'
union all select id, 'CANVA', 'direct' from public.companies where slug = 'canva'
union all select id, 'MICROSOFT*', 'direct' from public.companies where slug = 'microsoft'
on conflict do nothing;
