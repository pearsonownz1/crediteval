create table if not exists public.pdf_signature_flags (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.pdf_collab_sessions(session_id) on delete cascade,
  document_storage_path text,
  created_by_id text not null,
  created_by_name text not null,
  flag_type text not null default 'sign' check (flag_type in ('sign', 'initial', 'date')),
  label text,
  x_percent numeric(6, 3) not null check (x_percent >= 0 and x_percent <= 100),
  y_percent numeric(6, 3) not null check (y_percent >= 0 and y_percent <= 100),
  signed_by_name text,
  signed_by_text text,
  signed_at timestamptz,
  signer_profile_id text,
  signer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pdf_signature_flags_session_created_idx
on public.pdf_signature_flags (session_id, created_at asc);

create or replace function public.set_pdf_signature_flags_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pdf_signature_flags_set_updated_at on public.pdf_signature_flags;
create trigger pdf_signature_flags_set_updated_at
before update on public.pdf_signature_flags
for each row
execute function public.set_pdf_signature_flags_updated_at();

alter table public.pdf_signature_flags enable row level security;

create policy "public can read pdf signature flags"
on public.pdf_signature_flags
for select
using (true);

create policy "public can insert pdf signature flags"
on public.pdf_signature_flags
for insert
with check (true);

create policy "public can update pdf signature flags"
on public.pdf_signature_flags
for update
using (true)
with check (true);

create policy "public can delete pdf signature flags"
on public.pdf_signature_flags
for delete
using (true);

do $$
begin
  alter publication supabase_realtime add table public.pdf_signature_flags;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

alter table public.pdf_signature_flags replica identity full;
