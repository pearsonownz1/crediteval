create table if not exists public.funnel_opportunities (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  contact text,
  contact_email text,
  owner text,
  temperature text not null check (temperature in ('cold', 'warm', 'hot')),
  probability integer not null default 15 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  created_date date not null default current_date,
  last_activity_date date not null default current_date,
  notes text not null default '',
  phase text not null check (phase in ('New Lead', 'Proposal', 'Negotiation', 'Verbal Commit', 'Closed Won', 'Closed Lost')),
  source text not null,
  monthly_revenue_potential numeric(12,2) not null default 0,
  tags text[] not null default '{}',
  competitor text not null default '',
  closed_lost_reason text not null default '',
  closed_won_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funnel_opportunities_phase_idx on public.funnel_opportunities (phase);
create index if not exists funnel_opportunities_owner_idx on public.funnel_opportunities (owner);
create index if not exists funnel_opportunities_last_activity_idx on public.funnel_opportunities (last_activity_date);

create or replace function public.set_funnel_opportunities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists funnel_opportunities_set_updated_at on public.funnel_opportunities;
create trigger funnel_opportunities_set_updated_at
before update on public.funnel_opportunities
for each row
execute function public.set_funnel_opportunities_updated_at();

alter table public.funnel_opportunities enable row level security;

create policy "authenticated can read funnel opportunities"
on public.funnel_opportunities
for select
using (auth.role() = 'authenticated');

create policy "authenticated can insert funnel opportunities"
on public.funnel_opportunities
for insert
with check (auth.role() = 'authenticated');

create policy "authenticated can update funnel opportunities"
on public.funnel_opportunities
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "authenticated can delete funnel opportunities"
on public.funnel_opportunities
for delete
using (auth.role() = 'authenticated');
