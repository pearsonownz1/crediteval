create extension if not exists pgcrypto;

create table if not exists public.pdf_collab_annotations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.pdf_collab_sessions(session_id) on delete cascade,
  author_id text not null,
  author_name text not null,
  color text not null,
  body text,
  x_percent numeric(6, 3) not null check (x_percent >= 0 and x_percent <= 100),
  y_percent numeric(6, 3) not null check (y_percent >= 0 and y_percent <= 100),
  created_at timestamptz not null default now()
);

alter table public.pdf_collab_annotations enable row level security;

create policy "public can read pdf collab annotations"
on public.pdf_collab_annotations
for select
using (true);

create policy "public can insert pdf collab annotations"
on public.pdf_collab_annotations
for insert
with check (true);

create policy "public can update pdf collab annotations"
on public.pdf_collab_annotations
for update
using (true)
with check (true);

create policy "public can delete pdf collab annotations"
on public.pdf_collab_annotations
for delete
using (true);

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_annotations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
