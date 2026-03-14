create type public.deal_stage as enum ('sourced', 'screening', 'diligence', 'ic_review', 'approved', 'closed', 'rejected');
create type public.compliance_status as enum ('open', 'in_review', 'resolved', 'overdue');
create type public.distribution_status as enum ('draft', 'approved', 'paid', 'cancelled');
create type public.cashflow_type as enum ('capital_call', 'distribution', 'investment', 'expense', 'income', 'fee');
create type public.workflow_status as enum ('queued', 'running', 'completed', 'failed');
create type public.communication_channel as enum ('in_app', 'email', 'note');
create type public.tax_report_status as enum ('draft', 'generated', 'delivered');

create table public.distributions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  title text not null,
  payment_date date not null,
  total_amount numeric(20, 6) not null check (total_amount > 0),
  currency_code char(3) not null default 'USD',
  status public.distribution_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.distribution_allocations (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references public.distributions (id) on delete cascade,
  fund_investor_id uuid not null references public.fund_investors (id) on delete cascade,
  amount numeric(20, 6) not null check (amount > 0),
  amount_paid numeric(20, 6) not null default 0 check (amount_paid >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (distribution_id, fund_investor_id)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  company_name text not null,
  sector text,
  stage public.deal_stage not null default 'sourced',
  target_amount numeric(20, 6),
  probability_pct numeric(5, 2) check (probability_pct >= 0 and probability_pct <= 100),
  expected_close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  title text not null,
  requirement_type text not null,
  due_date date not null,
  status public.compliance_status not null default 'open',
  owner_user_id uuid references auth.users (id),
  notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cashflows (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  flow_type public.cashflow_type not null,
  occurred_on date not null,
  amount numeric(20, 6) not null check (amount > 0),
  currency_code char(3) not null default 'USD',
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  name text not null,
  status public.workflow_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  triggered_by uuid references auth.users (id),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  channel public.communication_channel not null default 'note',
  title text not null,
  body text not null,
  audience_type text not null default 'internal',
  audience_ref_id uuid,
  sent_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tax_reports (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds (id) on delete cascade,
  fund_investor_id uuid not null references public.fund_investors (id) on delete cascade,
  tax_year integer not null check (tax_year >= 2000 and tax_year <= 2100),
  status public.tax_report_status not null default 'draft',
  output_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fund_id, fund_investor_id, tax_year)
);

create index idx_distributions_fund_id on public.distributions (fund_id);
create index idx_deals_fund_id on public.deals (fund_id);
create index idx_compliance_fund_id_due_date on public.compliance_records (fund_id, due_date);
create index idx_cashflows_fund_id_occurred_on on public.cashflows (fund_id, occurred_on);
create index idx_workflow_runs_fund_id on public.workflow_runs (fund_id);
create index idx_communications_fund_id on public.communications (fund_id);
create index idx_tax_reports_fund_id on public.tax_reports (fund_id);

create trigger set_updated_at_distributions
before update on public.distributions
for each row execute function public.set_updated_at();

create trigger set_updated_at_distribution_allocations
before update on public.distribution_allocations
for each row execute function public.set_updated_at();

create trigger set_updated_at_deals
before update on public.deals
for each row execute function public.set_updated_at();

create trigger set_updated_at_compliance_records
before update on public.compliance_records
for each row execute function public.set_updated_at();

create trigger set_updated_at_cashflows
before update on public.cashflows
for each row execute function public.set_updated_at();

create trigger set_updated_at_workflow_runs
before update on public.workflow_runs
for each row execute function public.set_updated_at();

create trigger set_updated_at_communications
before update on public.communications
for each row execute function public.set_updated_at();

create trigger set_updated_at_tax_reports
before update on public.tax_reports
for each row execute function public.set_updated_at();

create trigger audit_distributions
after insert or update or delete on public.distributions
for each row execute function public.log_audit_event();

create trigger audit_deals
after insert or update or delete on public.deals
for each row execute function public.log_audit_event();

create trigger audit_compliance_records
after insert or update or delete on public.compliance_records
for each row execute function public.log_audit_event();

create trigger audit_cashflows
after insert or update or delete on public.cashflows
for each row execute function public.log_audit_event();

alter table public.distributions enable row level security;
alter table public.distribution_allocations enable row level security;
alter table public.deals enable row level security;
alter table public.compliance_records enable row level security;
alter table public.cashflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.communications enable row level security;
alter table public.tax_reports enable row level security;

create policy "distributions_select_by_member"
on public.distributions for select
using (public.current_user_has_role(fund_id, null));

create policy "distributions_manage_by_ops_or_admin"
on public.distributions for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "distribution_allocations_select_by_member"
on public.distribution_allocations for select
using (
  exists (
    select 1
    from public.distributions d
    where d.id = distribution_allocations.distribution_id
      and public.current_user_has_role(d.fund_id, null)
  )
);

create policy "distribution_allocations_manage_by_ops_or_admin"
on public.distribution_allocations for all
using (
  exists (
    select 1
    from public.distributions d
    where d.id = distribution_allocations.distribution_id
      and public.current_user_has_role(d.fund_id, array['admin', 'operations']::public.app_role[])
  )
)
with check (
  exists (
    select 1
    from public.distributions d
    where d.id = distribution_allocations.distribution_id
      and public.current_user_has_role(d.fund_id, array['admin', 'operations']::public.app_role[])
  )
);

create policy "deals_select_by_member"
on public.deals for select
using (public.current_user_has_role(fund_id, null));

create policy "deals_manage_by_mgr_or_admin"
on public.deals for all
using (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'investment_manager']::public.app_role[]));

create policy "compliance_select_by_member"
on public.compliance_records for select
using (public.current_user_has_role(fund_id, null));

create policy "compliance_manage_by_ops_or_admin"
on public.compliance_records for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "cashflows_select_by_member"
on public.cashflows for select
using (public.current_user_has_role(fund_id, null));

create policy "cashflows_manage_by_ops_or_admin"
on public.cashflows for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "workflow_runs_select_by_member"
on public.workflow_runs for select
using (public.current_user_has_role(fund_id, null));

create policy "workflow_runs_manage_by_ops_or_admin"
on public.workflow_runs for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "communications_select_by_member"
on public.communications for select
using (public.current_user_has_role(fund_id, null));

create policy "communications_manage_by_ops_or_admin"
on public.communications for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));

create policy "tax_reports_select_by_member"
on public.tax_reports for select
using (public.current_user_has_role(fund_id, null));

create policy "tax_reports_manage_by_ops_or_admin"
on public.tax_reports for all
using (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]))
with check (public.current_user_has_role(fund_id, array['admin', 'operations']::public.app_role[]));
