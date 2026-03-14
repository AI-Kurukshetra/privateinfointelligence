create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'investment_manager', 'operations', 'investor');
create type public.company_stage as enum ('pipeline', 'active', 'exited');
create type public.valuation_status as enum ('draft', 'approved', 'published');
create type public.capital_call_status as enum (
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);
create type public.document_visibility as enum ('internal', 'investor_shared', 'restricted');
create type public.report_status as enum ('queued', 'running', 'completed', 'failed');
create type public.notification_channel as enum ('in_app', 'email');
create type public.notification_status as enum ('queued', 'sent', 'failed');

create table public.funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null,
  base_currency char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id uuid not null references public.funds (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, fund_id, role)
);

create table public.investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fund_investors (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  investor_id uuid not null references public.investors (id) on delete cascade,
  commitment_amount numeric(20, 6) not null check (commitment_amount >= 0),
  paid_in_amount numeric(20, 6) not null default 0 check (paid_in_amount >= 0),
  currency_code char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fund_id, investor_id)
);

create table public.portfolio_companies (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  name text not null,
  sector text not null,
  stage public.company_stage not null default 'pipeline',
  country char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fund_id, name)
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  portfolio_company_id uuid not null references public.portfolio_companies (id) on delete restrict,
  invested_amount numeric(20, 6) not null check (invested_amount > 0),
  ownership_percentage numeric(7, 4) not null check (ownership_percentage >= 0 and ownership_percentage <= 100),
  currency_code char(3) not null default 'USD',
  investment_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  investment_id uuid not null references public.investments (id) on delete cascade,
  as_of_date date not null,
  fair_value numeric(20, 6) not null check (fair_value >= 0),
  method text not null,
  status public.valuation_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investment_id, as_of_date)
);

create table public.capital_calls (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  title text not null,
  due_date date not null,
  total_amount numeric(20, 6) not null check (total_amount > 0),
  currency_code char(3) not null default 'USD',
  status public.capital_call_status not null default 'draft',
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capital_call_allocations (
  id uuid primary key default gen_random_uuid(),
  capital_call_id uuid not null references public.capital_calls (id) on delete cascade,
  fund_investor_id uuid not null references public.fund_investors (id) on delete cascade,
  amount_due numeric(20, 6) not null check (amount_due > 0),
  amount_paid numeric(20, 6) not null default 0 check (amount_paid >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capital_call_id, fund_investor_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  title text not null,
  storage_path text not null,
  mime_type text not null,
  visibility public.document_visibility not null default 'internal',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  report_type text not null,
  period_start date not null,
  period_end date not null,
  status public.report_status not null default 'queued',
  output_path text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  channel public.notification_channel not null,
  event_type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  as_of_date date not null,
  irr numeric(12, 6),
  moic numeric(12, 6),
  dpi numeric(12, 6),
  rvpi numeric(12, 6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fund_id, as_of_date)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid,
  actor_user_id uuid references auth.users (id),
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.current_user_has_role(target_fund_id uuid, allowed_roles public.app_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.fund_id = target_fund_id
      and (
        allowed_roles is null
        or ur.role = any (allowed_roles)
      )
  );
$$;

create or replace function public.current_user_can_access_investor(target_investor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fund_investors fi
    join public.user_roles ur
      on ur.fund_id = fi.fund_id
    where fi.investor_id = target_investor_id
      and ur.user_id = auth.uid()
  );
$$;

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_fund_id uuid;
  target_row_id uuid;
begin
  if tg_op = 'DELETE' then
    target_fund_id := old.fund_id;
    target_row_id := old.id;
  else
    target_fund_id := new.fund_id;
    target_row_id := new.id;
  end if;

  insert into public.audit_logs (
    fund_id,
    actor_user_id,
    table_name,
    operation,
    row_id,
    old_data,
    new_data
  )
  values (
    target_fund_id,
    auth.uid(),
    tg_table_name,
    tg_op,
    target_row_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create index idx_user_roles_user_id on public.user_roles (user_id);
create index idx_user_roles_fund_id on public.user_roles (fund_id);
create index idx_fund_investors_fund_id on public.fund_investors (fund_id);
create index idx_companies_fund_id on public.portfolio_companies (fund_id);
create index idx_investments_fund_id on public.investments (fund_id);
create index idx_valuations_fund_id on public.valuations (fund_id);
create index idx_capital_calls_fund_id on public.capital_calls (fund_id);
create index idx_documents_fund_id on public.documents (fund_id);
create index idx_reports_fund_id on public.reports (fund_id);
create index idx_notifications_fund_id on public.notifications (fund_id);
create index idx_audit_logs_fund_id_created_at on public.audit_logs (fund_id, created_at desc);

create trigger set_updated_at_funds
before update on public.funds
for each row execute function public.set_updated_at();

create trigger set_updated_at_users
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_updated_at_investors
before update on public.investors
for each row execute function public.set_updated_at();

create trigger set_updated_at_fund_investors
before update on public.fund_investors
for each row execute function public.set_updated_at();

create trigger set_updated_at_portfolio_companies
before update on public.portfolio_companies
for each row execute function public.set_updated_at();

create trigger set_updated_at_investments
before update on public.investments
for each row execute function public.set_updated_at();

create trigger set_updated_at_valuations
before update on public.valuations
for each row execute function public.set_updated_at();

create trigger set_updated_at_capital_calls
before update on public.capital_calls
for each row execute function public.set_updated_at();

create trigger set_updated_at_capital_call_allocations
before update on public.capital_call_allocations
for each row execute function public.set_updated_at();

create trigger set_updated_at_documents
before update on public.documents
for each row execute function public.set_updated_at();

create trigger set_updated_at_reports
before update on public.reports
for each row execute function public.set_updated_at();

create trigger set_updated_at_notifications
before update on public.notifications
for each row execute function public.set_updated_at();

create trigger set_updated_at_performance_metrics
before update on public.performance_metrics
for each row execute function public.set_updated_at();

create trigger audit_investments
after insert or update or delete on public.investments
for each row execute function public.log_audit_event();

create trigger audit_valuations
after insert or update or delete on public.valuations
for each row execute function public.log_audit_event();

create trigger audit_capital_calls
after insert or update or delete on public.capital_calls
for each row execute function public.log_audit_event();

create trigger audit_user_roles
after insert or update or delete on public.user_roles
for each row execute function public.log_audit_event();

alter table public.funds enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.investors enable row level security;
alter table public.fund_investors enable row level security;
alter table public.portfolio_companies enable row level security;
alter table public.investments enable row level security;
alter table public.valuations enable row level security;
alter table public.capital_calls enable row level security;
alter table public.capital_call_allocations enable row level security;
alter table public.documents enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.audit_logs enable row level security;

create policy "funds_read_by_member"
on public.funds for select
using (public.current_user_has_role(id, null));

create policy "funds_create_authenticated"
on public.funds for insert
to authenticated
with check (true);

create policy "funds_update_by_admin"
on public.funds for update
using (public.current_user_has_role(id, array['admin']::public.app_role[]))
with check (public.current_user_has_role(id, array['admin']::public.app_role[]));

create policy "users_self_read"
on public.users for select
using (id = auth.uid());

create policy "users_self_update"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "user_roles_read_by_member"
on public.user_roles for select
using (public.current_user_has_role(fund_id, null));

create policy "user_roles_manage_by_admin"
on public.user_roles for all
using (public.current_user_has_role(fund_id, array['admin']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin']::public.app_role[]));

create policy "investors_read_if_related_fund_access"
on public.investors for select
using (public.current_user_can_access_investor(id));

create policy "investors_manage_by_ops_or_admin"
on public.investors for all
using (
  exists (
    select 1
    from public.fund_investors fi
    where fi.investor_id = investors.id
      and public.current_user_has_role(fi.fund_id, array['admin', 'operations']::public.app_role[])
  )
)
with check (true);

create policy "fund_investors_select_by_member"
on public.fund_investors for select
using (public.current_user_has_role(fund_id, null));

create policy "fund_investors_manage_by_ops_or_admin"
on public.fund_investors for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "companies_select_by_member"
on public.portfolio_companies for select
using (public.current_user_has_role(fund_id, null));

create policy "companies_manage_by_mgr_or_admin"
on public.portfolio_companies for all
using (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]));

create policy "investments_select_by_member"
on public.investments for select
using (public.current_user_has_role(fund_id, null));

create policy "investments_manage_by_mgr_or_admin"
on public.investments for all
using (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]));

create policy "valuations_select_by_member"
on public.valuations for select
using (public.current_user_has_role(fund_id, null));

create policy "valuations_manage_by_mgr_or_admin"
on public.valuations for all
using (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]));

create policy "capital_calls_select_by_member"
on public.capital_calls for select
using (public.current_user_has_role(fund_id, null));

create policy "capital_calls_manage_by_ops_or_admin"
on public.capital_calls for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "allocations_select_by_member"
on public.capital_call_allocations for select
using (
  exists (
    select 1
    from public.capital_calls cc
    where cc.id = capital_call_allocations.capital_call_id
      and public.current_user_has_role(cc.fund_id, null)
  )
);

create policy "allocations_manage_by_ops_or_admin"
on public.capital_call_allocations for all
using (
  exists (
    select 1
    from public.capital_calls cc
    where cc.id = capital_call_allocations.capital_call_id
      and public.current_user_has_role(cc.fund_id, array['admin', 'operations']::public.app_role[])
  )
)
with check (
  exists (
    select 1
    from public.capital_calls cc
    where cc.id = capital_call_allocations.capital_call_id
      and public.current_user_has_role(cc.fund_id, array['admin', 'operations']::public.app_role[])
  )
);

create policy "documents_select_by_visibility"
on public.documents for select
using (
  public.current_user_has_role(fund_id, null)
  and (
    visibility <> 'restricted'
    or public.current_user_has_role(fund_id, array['admin', 'operations', 'investment_manager']::public.app_role[])
  )
);

create policy "documents_manage_by_ops_or_admin"
on public.documents for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "reports_select_by_member"
on public.reports for select
using (public.current_user_has_role(fund_id, null));

create policy "reports_manage_by_ops_or_admin"
on public.reports for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "notifications_select_by_member"
on public.notifications for select
using (public.current_user_has_role(fund_id, null));

create policy "notifications_manage_by_ops_or_admin"
on public.notifications for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "performance_select_by_member"
on public.performance_metrics for select
using (public.current_user_has_role(fund_id, null));

create policy "performance_manage_by_ops_or_admin"
on public.performance_metrics for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "audit_read_by_ops_or_admin"
on public.audit_logs for select
using (
  fund_id is null
  or public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[])
);
